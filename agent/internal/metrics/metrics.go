// Package metrics samples the host for the metrics stream (PLAN §13): a
// 24-hour history at 1-minute resolution kept in memory on the agent (never
// sent unless someone is watching), and live samples on demand.
package metrics

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// 24 h at 1-minute resolution: a fixed ring (PLAN §20.4).
const historySize = 24 * 60

// Sampler turns cumulative counters (/proc/stat, /proc/net/dev) into rates
// between two calls. Each consumer owns one, so their intervals don't mix.
type Sampler struct {
	idle, total uint64
	rx, tx      uint64
	at          time.Time
}

func (s *Sampler) Sample() protocol.MetricsSample {
	now := time.Now()
	idle, total := cpuTimes()
	rx, tx := netBytes()
	memTotal, memAvailable := memory()
	diskTotal, diskFree := disk("/")

	sample := protocol.MetricsSample{
		T:         now.UnixMilli(),
		MemUsed:   memTotal - memAvailable,
		MemTotal:  memTotal,
		DiskUsed:  diskTotal - diskFree,
		DiskTotal: diskTotal,
	}
	if s.total > 0 && total > s.total {
		sample.Cpu = 1 - float64(idle-s.idle)/float64(total-s.total)
	}
	if seconds := now.Sub(s.at).Seconds(); !s.at.IsZero() && seconds > 0 && rx >= s.rx && tx >= s.tx {
		sample.NetRx = float64(rx-s.rx) / seconds
		sample.NetTx = float64(tx-s.tx) / seconds
	}
	s.idle, s.total, s.rx, s.tx, s.at = idle, total, rx, tx, now
	return sample
}

// Recorder keeps the history ring, sampling once a minute.
type Recorder struct {
	mu      sync.Mutex
	samples []protocol.MetricsSample
	next    int
}

func (r *Recorder) Run(ctx context.Context) {
	var sampler Sampler
	sampler.Sample() // prime the counters
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			r.add(sampler.Sample())
		}
	}
}

func (r *Recorder) add(sample protocol.MetricsSample) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.samples) < historySize {
		r.samples = append(r.samples, sample)
		return
	}
	r.samples[r.next] = sample
	r.next = (r.next + 1) % historySize
}

// History returns the recorded samples, oldest first.
func (r *Recorder) History() []protocol.MetricsSample {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append(append([]protocol.MetricsSample{}, r.samples[r.next:]...), r.samples[:r.next]...)
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

	cores := float64(runtime.NumCPU())
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

func cpuTimes() (idle, total uint64) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0, 0
	}
	line, _, _ := strings.Cut(string(data), "\n")
	for i, field := range strings.Fields(line)[1:] {
		n, _ := strconv.ParseUint(field, 10, 64)
		total += n
		if i == 3 || i == 4 { // idle, iowait
			idle += n
		}
	}
	return idle, total
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

func memory() (total, available int64) {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0, 0
	}
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		kb, _ := strconv.ParseInt(fields[1], 10, 64)
		switch fields[0] {
		case "MemTotal:":
			total = kb * 1024
		case "MemAvailable:":
			available = kb * 1024
		}
	}
	return total, available
}

func disk(path string) (total, free int64) {
	var st syscall.Statfs_t
	if syscall.Statfs(path, &st) != nil {
		return 0, 0
	}
	return int64(st.Blocks) * st.Bsize, int64(st.Bavail) * st.Bsize
}
