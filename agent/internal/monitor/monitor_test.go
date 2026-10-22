package monitor

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"path/filepath"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/metrics"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
)

type fakeScaler struct{ n map[string]int }

func (f *fakeScaler) Replicas(w protocol.Workload) int {
	if n, ok := f.n[w.Name]; ok {
		return n
	}
	return int(w.Releases[0].Replicas)
}

func (f *fakeScaler) Scale(_ context.Context, workload string, n int) { f.n[workload] = n }

type rig struct {
	m      *Monitor
	now    time.Time
	cpu    float64 // cores per container
	mem    int64
	host   protocol.MetricsSample
	events []any
	scaler *fakeScaler
}

func newRig(t *testing.T, spec protocol.DesiredSpec) *rig {
	r := &rig{now: time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC), scaler: &fakeScaler{n: map[string]int{}}}
	r.host = protocol.MetricsSample{Cpu: 0.2, MemUsed: 1 << 30, MemTotal: 4 << 30, DiskUsed: 10 << 30, DiskTotal: 40 << 30}
	r.m = &Monitor{
		List: func(context.Context) ([]reconcile.Container, error) {
			var list []reconcile.Container
			for _, w := range spec.Workloads {
				for i := range r.scaler.Replicas(w) {
					list = append(list, reconcile.Container{Name: fmt.Sprintf("%s-%d", w.Name, i), Workload: w.Name, Running: true})
				}
			}
			return list, nil
		},
		Stats: func(context.Context) map[string]metrics.Usage {
			out := map[string]metrics.Usage{}
			for _, w := range spec.Workloads {
				for i := range r.scaler.Replicas(w) {
					out[fmt.Sprintf("%s-%d", w.Name, i)] = metrics.Usage{Cpu: r.cpu, Mem: r.mem}
				}
			}
			return out
		},
		Host:   func() protocol.MetricsSample { return r.host },
		Cores:  2,
		Scaler: r.scaler,
		Emit:   func(e any) { r.events = append(r.events, e) },
		Path:   filepath.Join(t.TempDir(), "capacity.json"),
		Log:    slog.New(slog.NewTextHandler(io.Discard, nil)),
		Now:    func() time.Time { return r.now },
	}
	r.m.SetSpec(spec)
	return r
}

func (r *rig) tick(step time.Duration) {
	r.now = r.now.Add(step)
	r.m.Tick(context.Background())
}

func ptr[T any](v T) *T { return &v }

func workload(autoscale *protocol.Autoscale) protocol.Workload {
	return protocol.Workload{
		Project: "p1", Name: "shop",
		Releases:  []protocol.WorkloadRelease{{Release: 1, Image: "huruf/shop:1", Routed: true, Replicas: 1}},
		Reserve:   protocol.WorkloadReserve{Cpu: 0.1, MemMb: 256},
		Base:      protocol.WorkloadBase{Cpu: 0.5, MemMb: 512},
		Autoscale: autoscale,
	}
}

func TestAlertFiresAfterForSecAndResolves(t *testing.T) {
	r := newRig(t, protocol.DesiredSpec{
		Workloads: []protocol.Workload{workload(nil)},
		Alerts: []protocol.AlertSpec{
			{Rule: "hostcpu", Metric: "cpu", Threshold: 80, ForSec: 60},
			{Rule: "appmem", Metric: "memory", Project: "p1", Threshold: 50, ForSec: 0},
		},
	})
	r.mem = 100 << 20 // 20% of the 512 MiB base
	r.host.Cpu = 0.9
	r.tick(15 * time.Second)
	r.tick(30 * time.Second)
	if len(r.events) != 0 {
		t.Fatalf("fired before forSec: %+v", r.events)
	}
	r.tick(31 * time.Second)
	if len(r.events) != 1 || r.events[0].(protocol.AlertEvent).Type != "alert.fired" {
		t.Fatalf("want one fired, got %+v", r.events)
	}
	r.tick(15 * time.Second) // still breaching: no repeat
	r.mem = 300 << 20        // 59%
	r.host.Cpu = 0.1
	r.tick(15 * time.Second)
	if len(r.events) != 3 {
		t.Fatalf("want resolved + app fired, got %+v", r.events)
	}
	resolved := r.events[1].(protocol.AlertEvent)
	if resolved.Type != "alert.resolved" || resolved.Data.FiredAt != r.events[0].(protocol.AlertEvent).Data.FiredAt {
		t.Fatalf("resolve must name the episode: %+v", resolved)
	}
	if app := r.events[2].(protocol.AlertEvent); app.Data.Rule != "appmem" || app.Data.Value < 58 {
		t.Fatalf("project memory alert: %+v", app)
	}

	// Firing alerts survive a restart: no second "fired".
	again := newRig(t, protocol.DesiredSpec{Alerts: []protocol.AlertSpec{{Rule: "appmem", Metric: "memory", Project: "p1", Threshold: 50}}})
	again.m.Path = r.m.Path
	again.m.Load()
	if again.m.data.Firing["appmem"] == 0 {
		t.Fatal("firing state wasn't persisted")
	}
}

func TestRoomAlert(t *testing.T) {
	w := workload(nil)
	w.Releases[0].Replicas = 4 // 4 × 256 MiB reserved
	r := newRig(t, protocol.DesiredSpec{
		Workloads: []protocol.Workload{w},
		Alerts:    []protocol.AlertSpec{{Rule: "room", Metric: "room", Threshold: 3000}},
	})
	r.tick(time.Second)
	// 4096 × 0.85 − max(1024 reserved, 1024 used) = 2457.6 MiB < 3000
	if len(r.events) != 1 || r.events[0].(protocol.AlertEvent).Data.Value != 2457.6 {
		t.Fatalf("want room 2457.6, got %+v", r.events)
	}
}

func TestAutoscaleWithinBoundsAndCooldown(t *testing.T) {
	r := newRig(t, protocol.DesiredSpec{Workloads: []protocol.Workload{
		workload(&protocol.Autoscale{Min: 1, Max: 3, CpuPercent: ptr(int64(50)), CooldownSec: 60}),
	}})
	r.cpu = 0.5 // 100% of base: double
	for range 4 {
		r.tick(15 * time.Second)
	}
	if got := r.scaler.n["shop"]; got != 2 {
		t.Fatalf("want 2 replicas, got %d (%+v)", got, r.events)
	}
	ev := r.events[0].(protocol.AutoscaleEvent)
	if ev.Data.From != 1 || ev.Data.To != 2 {
		t.Fatalf("event: %+v", ev)
	}
	for range 4 { // within the cooldown: no change
		r.tick(10 * time.Second)
	}
	if r.scaler.n["shop"] != 2 {
		t.Fatal("scaled during the cooldown")
	}
	r.cpu = 1.0 // 200%: wants 4, capped at 3
	for range 8 {
		r.tick(15 * time.Second)
	}
	if r.scaler.n["shop"] != 3 {
		t.Fatalf("want the max of 3, got %d", r.scaler.n["shop"])
	}
	r.cpu = 0.05 // 10%: down to the min
	for range 8 {
		r.tick(30 * time.Second)
	}
	if r.scaler.n["shop"] != 1 {
		t.Fatalf("want the min of 1, got %d", r.scaler.n["shop"])
	}
}

func TestFootprintsAndDailyPeaks(t *testing.T) {
	r := newRig(t, protocol.DesiredSpec{Workloads: []protocol.Workload{workload(nil)}})
	for i := range 3 * 60 { // three hours, one sample a minute; memory grows
		r.mem = int64(100+i) << 20
		r.cpu = 0.1
		if i%60 == 59 {
			r.cpu = 0.9 // one spike an hour: above p95, below peak
		}
		r.tick(time.Minute)
	}
	report := r.m.Report(context.Background())
	if len(report.Workloads) != 1 || report.Workloads[0].Day == nil {
		t.Fatalf("no footprint: %+v", report)
	}
	day := report.Workloads[0].Day
	if day.CpuP95 != 0.1 || day.CpuPeak != 0.9 {
		t.Fatalf("cpu p95/peak: %+v", day)
	}
	if day.MemPeak < 270<<20 || day.MemP95 > day.MemPeak {
		t.Fatalf("memory: %+v", day)
	}
	if len(report.Daily) != 1 || report.Daily[0].Workloads["shop"] == 0 {
		t.Fatalf("daily row: %+v", report.Daily)
	}
	if report.Host.Day == nil || report.Host.Day.CpuP95 != 0.4 {
		t.Fatalf("host day (0.2 of 2 cores): %+v", report.Host.Day)
	}
}
