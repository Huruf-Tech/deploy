// Package metrics samples the host for the metrics stream (PLAN §13): a
// 24-hour history at 1-minute resolution plus the last 15 minutes at 5-second
// resolution, kept in memory on the agent (never sent unless someone is
// watching), and live samples on demand.
package metrics

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// 24 h at 1-minute resolution: a fixed ring (PLAN §20.4).
const historySize = 24 * 60

// The last 15 minutes at 5-second resolution, so a chart opened now shows
// what just happened in detail (180 samples, a few KB).
const (
	recentEvery = 5 * time.Second
	recentSize  = 15 * 60 / 5
)

// Sampler turns cumulative counters (/proc/stat, /proc/net/dev) into rates
// between two calls. Each consumer owns one, so their intervals don't mix.
type Sampler struct {
	cpu    host.Sampler
	rx, tx uint64
	at     time.Time
}

// Sample is the machine's usage, or the partition's within its limits
// (PLAN §27): the host package reads both.
func (s *Sampler) Sample() protocol.MetricsSample {
	now := time.Now()
	rx, tx := netBytes()
	memTotal := host.Memory()
	diskTotal, diskFree := host.DataDisk()

	sample := protocol.MetricsSample{
		T:         now.UnixMilli(),
		Cpu:       s.cpu.CPU(),
		MemUsed:   memTotal - host.MemoryFree(),
		MemTotal:  memTotal,
		DiskUsed:  diskTotal - diskFree,
		DiskTotal: diskTotal,
	}
	if seconds := now.Sub(s.at).Seconds(); !s.at.IsZero() && seconds > 0 && rx >= s.rx && tx >= s.tx {
		sample.NetRx = float64(rx-s.rx) / seconds
		sample.NetTx = float64(tx-s.tx) / seconds
	}
	s.rx, s.tx, s.at = rx, tx, now
	return sample
}

// ring is a fixed-size buffer of samples, oldest overwritten first.
type ring struct {
	samples []protocol.MetricsSample
	next    int
}

func (g *ring) add(sample protocol.MetricsSample, size int) {
	if len(g.samples) < size {
		g.samples = append(g.samples, sample)
		return
	}
	g.samples[g.next] = sample
	g.next = (g.next + 1) % size
}

func (g *ring) list() []protocol.MetricsSample {
	return append(append([]protocol.MetricsSample{}, g.samples[g.next:]...), g.samples[:g.next]...)
}

// Recorder keeps the minute history and the recent 5-second buffer. Each has
// its own sampler, so a minute's CPU is the minute's average.
type Recorder struct {
	mu      sync.Mutex
	minutes ring
	recent  ring
}

func (r *Recorder) Run(ctx context.Context) {
	var perMinute, perTick Sampler
	perMinute.Sample() // prime the counters
	perTick.Sample()
	minute := time.NewTicker(time.Minute)
	defer minute.Stop()
	tick := time.NewTicker(recentEvery)
	defer tick.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-minute.C:
			r.add(perMinute.Sample())
		case <-tick.C:
			r.addRecent(perTick.Sample())
		}
	}
}

func (r *Recorder) add(sample protocol.MetricsSample) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.minutes.add(sample, historySize)
}

func (r *Recorder) addRecent(sample protocol.MetricsSample) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.recent.add(sample, recentSize)
}

// History returns minute samples up to where the recent buffer starts, then
// the recent ones: oldest first, no overlap.
func (r *Recorder) History() []protocol.MetricsSample {
	r.mu.Lock()
	defer r.mu.Unlock()
	recent := r.recent.list()
	minutes := r.minutes.list()
	if len(recent) > 0 {
		cut := len(minutes)
		for cut > 0 && minutes[cut-1].T >= recent[0].T {
			cut--
		}
		minutes = minutes[:cut]
	}
	return append(minutes, recent...)
}

// Usage is one container's current CPU (cores) and memory (bytes).
type Usage struct {
	Cpu float64
	Mem int64
}

// Stats reads every running container's usage by name (`docker stats`, ~2 s);
// nil when Docker is absent.
func Stats(ctx context.Context) map[string]Usage {
	out, err := exec.CommandContext(ctx, "docker", "stats", "--no-stream", "--format", "{{json .}}").Output()
	if err != nil {
		return nil
	}
	usage := map[string]Usage{}
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		var s struct{ Name, CPUPerc, MemUsage string }
		if json.Unmarshal([]byte(line), &s) != nil {
			continue
		}
		percent, _ := strconv.ParseFloat(strings.TrimSuffix(s.CPUPerc, "%"), 64)
		used, _, _ := strings.Cut(s.MemUsage, " / ")
		usage[s.Name] = Usage{Cpu: percent / 100, Mem: ParseBytes(used)}
	}
	return usage
}

// DiskUsage reads image sizes (by repo:tag) and volume sizes (by name) from
// `docker system df -v`; slow on big hosts, so only for capacity reports.
func DiskUsage(ctx context.Context) (images, volumes map[string]int64) {
	out, err := exec.CommandContext(ctx, "docker", "system", "df", "-v", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, nil
	}
	var df struct {
		Images  []struct{ Repository, Tag, Size string }
		Volumes []struct{ Name, Size string }
	}
	if json.Unmarshal(out, &df) != nil {
		return nil, nil
	}
	images, volumes = map[string]int64{}, map[string]int64{}
	for _, i := range df.Images {
		images[i.Repository+":"+i.Tag] = ParseBytes(i.Size)
	}
	for _, v := range df.Volumes {
		volumes[v.Name] = ParseBytes(v.Size)
	}
	return images, volumes
}

// Containers reads per-container usage from Docker; nil when Docker is absent.
func Containers(ctx context.Context) []protocol.MetricsSampleContainersItem {
	ps, err := exec.CommandContext(ctx, "docker", "ps", "-a", "--format", "{{json .}}").Output()
	if err != nil {
		return nil
	}
	usage := Stats(ctx)

	cores := host.Cores()
	var items []protocol.MetricsSampleContainersItem
	for _, line := range strings.Split(strings.TrimSpace(string(ps)), "\n") {
		var c struct{ ID, Names, Image, State string }
		if json.Unmarshal([]byte(line), &c) != nil {
			continue
		}
		u := usage[c.Names]
		items = append(items, protocol.MetricsSampleContainersItem{
			Id:    c.ID,
			Name:  c.Names,
			Image: c.Image,
			State: c.State,
			Cpu:   u.Cpu / cores,
			Mem:   u.Mem,
		})
	}
	return items
}

// ParseBytes reads Docker's human sizes such as "12.5MiB" or "1.2GB".
func ParseBytes(text string) int64 {
	text = strings.TrimSpace(text)
	units := []struct {
		suffix string
		scale  float64
	}{
		{"KiB", 1 << 10}, {"MiB", 1 << 20}, {"GiB", 1 << 30}, {"TiB", 1 << 40},
		{"kB", 1e3}, {"KB", 1e3}, {"MB", 1e6}, {"GB", 1e9}, {"TB", 1e12}, {"B", 1},
	}
	for _, u := range units {
		if number, ok := strings.CutSuffix(text, u.suffix); ok {
			value, err := strconv.ParseFloat(number, 64)
			if err != nil {
				return 0
			}
			return int64(value * u.scale)
		}
	}
	return 0
}

// netBytes sums received and sent bytes over all interfaces except loopback.
func netBytes() (rx, tx uint64) {
	data, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	for _, line := range strings.Split(string(data), "\n")[2:] {
		name, rest, ok := strings.Cut(line, ":")
		if !ok || strings.TrimSpace(name) == "lo" {
			continue
		}
		fields := strings.Fields(rest)
		if len(fields) >= 9 {
			r, _ := strconv.ParseUint(fields[0], 10, 64)
			t, _ := strconv.ParseUint(fields[8], 10, 64)
			rx, tx = rx+r, tx+t
		}
	}
	return rx, tx
}
