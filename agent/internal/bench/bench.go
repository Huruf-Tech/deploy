// Package bench measures a machine (PLAN §29): short CPU, memory and disk
// tests, run now and then. It reports raw numbers; the control plane turns
// them into the machine's rating and class, so the scoring can change
// without a new agent.
package bench

import (
	"compress/flate"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand/v2"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type Result = protocol.ResourceSummaryBenchmark

// How long each CPU and memory test runs: short, so it barely disturbs
// what runs on the machine.
var testFor = 2 * time.Second

// Every is how often a machine is measured again.
const Every = 7 * 24 * time.Hour

// sample is text-like data: compressible, but not trivially.
func sample() []byte {
	r := rand.New(rand.NewPCG(1, 2))
	words := []string{"server", "deploy", "agent", "partition", "huruf", "machine", "rental", "build", "image", "cache", "tunnel", "quota"}
	b := make([]byte, 0, 4<<20)
	for len(b) < 4<<20 {
		b = append(b, words[r.IntN(len(words))]...)
		b = append(b, ' ')
		if r.IntN(16) == 0 {
			b = append(b, byte('0'+r.IntN(10)))
		}
	}
	return b
}

// compress compresses data over and over until `until`, returning the bytes done.
func compress(ctx context.Context, data []byte, until time.Time) int64 {
	w, _ := flate.NewWriter(discard{}, flate.BestSpeed)
	var done int64
	for time.Now().Before(until) && ctx.Err() == nil {
		w.Reset(discard{})
		_, _ = w.Write(data)
		_ = w.Close()
		done += int64(len(data))
	}
	return done
}

type discard struct{}

func (discard) Write(p []byte) (int, error) { return len(p), nil }

// CPU is MB/s compressing on one core, and on all of them together.
func CPU(ctx context.Context) (single, multi float64, threads int) {
	data := sample()
	start := time.Now()
	single = mbps(compress(ctx, data, start.Add(testFor)), time.Since(start))

	// The cores it may use: a CPU limit, not the cores it can see.
	threads = max(1, int(math.Ceil(host.Cores())))
	var total atomic.Int64
	var wg sync.WaitGroup
	start = time.Now()
	until := start.Add(testFor)
	for range threads {
		wg.Add(1)
		go func() {
			defer wg.Done()
			total.Add(compress(ctx, data, until))
		}()
	}
	wg.Wait()
	return single, mbps(total.Load(), time.Since(start)), threads
}

// Memory is MB/s copying a buffer bigger than the CPU's caches.
func Memory(ctx context.Context) float64 {
	src := make([]byte, 64<<20)
	dst := make([]byte, len(src))
	for i := range src {
		src[i] = byte(i)
	}
	var done int64
	start := time.Now()
	for time.Since(start) < testFor && ctx.Err() == nil {
		copy(dst, src)
		done += int64(len(src))
	}
	return mbps(done, time.Since(start))
}

// Disk is MB/s writing 128 MB to dir and flushing it, and the average time
// a small write takes to be durable (fsync), in milliseconds.
func Disk(ctx context.Context, dir string) (write, sync float64, err error) {
	path := filepath.Join(dir, ".huruf-bench")
	f, err := os.OpenFile(path, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return 0, 0, err
	}
	defer os.Remove(path)
	defer f.Close()

	chunk := make([]byte, 1<<20)
	for i := range chunk {
		chunk[i] = byte(i * 7)
	}
	start := time.Now()
	for range 128 {
		if ctx.Err() != nil {
			return 0, 0, ctx.Err()
		}
		if _, err := f.Write(chunk); err != nil {
			return 0, 0, err
		}
	}
	if err := f.Sync(); err != nil {
		return 0, 0, err
	}
	write = mbps(128<<20, time.Since(start))

	small := make([]byte, 4096)
	const rounds = 64
	start = time.Now()
	for i := range rounds {
		if _, err := f.WriteAt(small, int64(i)*4096); err != nil {
			return 0, 0, err
		}
		if err := f.Sync(); err != nil {
			return 0, 0, err
		}
	}
	sync = float64(time.Since(start).Microseconds()) / rounds / 1000
	return write, sync, nil
}

// Rotational says whether dir is on a spinning disk, when the kernel knows.
func Rotational(dir string) *bool {
	var st syscall.Stat_t
	if syscall.Stat(dir, &st) != nil {
		return nil
	}
	major, minor := (st.Dev>>8)&0xfff, (st.Dev&0xff)|((st.Dev>>12)&0xfff00)
	base := fmt.Sprintf("/sys/dev/block/%d:%d", major, minor)
	// A partition's queue is its disk's: one level up.
	for _, p := range []string{base + "/queue/rotational", base + "/../queue/rotational"} {
		if data, err := os.ReadFile(p); err == nil && len(data) > 0 {
			rotational := data[0] == '1'
			return &rotational
		}
	}
	return nil
}

// Run measures the machine; dir is where the partitions' data lives.
func Run(ctx context.Context, dir string) (Result, error) {
	single, multi, threads := CPU(ctx)
	memory := Memory(ctx)
	write, sync, err := Disk(ctx, dir)
	if err != nil {
		return Result{}, fmt.Errorf("disk test: %w", err)
	}
	if ctx.Err() != nil {
		return Result{}, ctx.Err()
	}
	return Result{
		At:         time.Now().UTC().Format(time.RFC3339),
		CpuSingle:  round(single),
		CpuMulti:   round(multi),
		Threads:    int64(threads),
		Memory:     round(memory),
		DiskWrite:  round(write),
		DiskSync:   round(sync),
		Rotational: Rotational(dir),
	}, nil
}

func mbps(bytes int64, elapsed time.Duration) float64 {
	if elapsed <= 0 {
		return 0
	}
	return float64(bytes) / (1 << 20) / elapsed.Seconds()
}

func round(v float64) float64 { return float64(int64(v*100+0.5)) / 100 }

// Store keeps the latest result in a file, so a restart doesn't measure again.
type Store struct {
	Path string

	mu   sync.Mutex
	last *Result
}

// Latest is the latest result, nil before the first.
func (s *Store) Latest() *Result {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.last == nil {
		data, err := os.ReadFile(s.Path)
		if err != nil {
			return nil
		}
		var r Result
		if json.Unmarshal(data, &r) != nil {
			return nil
		}
		s.last = &r
	}
	copied := *s.last
	return &copied
}

func (s *Store) save(r Result) error {
	data, err := json.Marshal(r)
	if err != nil {
		return err
	}
	tmp := s.Path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	if err := os.Rename(tmp, s.Path); err != nil {
		return err
	}
	s.mu.Lock()
	s.last = &r
	s.mu.Unlock()
	return nil
}

// due says whether it's time to measure again.
func (s *Store) due(now time.Time) bool {
	last := s.Latest()
	if last == nil {
		return true
	}
	at, err := time.Parse(time.RFC3339, last.At)
	return err != nil || now.Sub(at) >= Every
}

// Schedule measures the machine when it's due: once it's set up for
// partitions (ready), a while after the agent starts, then every week.
func (s *Store) Schedule(ctx context.Context, dir string, ready func() bool, log func(string, ...any)) {
	timer := time.NewTimer(10 * time.Minute)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
		}
		if ready() && s.due(time.Now()) {
			r, err := Run(ctx, dir)
			switch {
			case errors.Is(err, context.Canceled):
				return
			case err != nil:
				log("machine benchmark failed", "error", err)
			default:
				if err := s.save(r); err != nil {
					log("saving the machine benchmark", "error", err)
				}
			}
		}
		timer.Reset(time.Hour)
	}
}
