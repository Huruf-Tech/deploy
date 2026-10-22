package reconcile

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"slices"
	"strings"
	"sync"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type fakeRuntime struct {
	mu         sync.Mutex
	containers map[string]Container
	broken     map[string]bool // images that never become healthy
	nextIP     int
	log        []string // start/remove order
}

func newFake() *fakeRuntime {
	return &fakeRuntime{containers: map[string]Container{}, broken: map[string]bool{}}
}

func (f *fakeRuntime) List(context.Context) ([]Container, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []Container
	for _, c := range f.containers {
		out = append(out, c)
	}
	return out, nil
}

func (f *fakeRuntime) Start(_ context.Context, spec ContainerSpec) (Container, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.nextIP++
	c := Container{
		ID: spec.Name, Name: spec.Name, Workload: spec.Workload,
		Release: spec.Release.Release, Replica: spec.Replica, Running: true,
		IP: fmt.Sprintf("10.0.0.%d", f.nextIP),
	}
	f.containers[c.ID] = c
	f.log = append(f.log, "start "+c.Name)
	return c, nil
}

func (f *fakeRuntime) Remove(_ context.Context, c Container) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.containers, c.ID)
	f.log = append(f.log, "remove "+c.Name)
	return nil
}

func (f *fakeRuntime) EnsureImage(context.Context, string, *protocol.RegistryAuth) error { return nil }

func (f *fakeRuntime) WaitHealthy(_ context.Context, _ Container, rel protocol.WorkloadRelease) error {
	if f.broken[rel.Image] {
		return errors.New("health check timed out")
	}
	return nil
}

func (f *fakeRuntime) RemoveUnusedImages(context.Context, []string) error { return nil }

func (f *fakeRuntime) running(workload string) (releases []int64) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, c := range f.containers {
		if c.Workload == workload {
			releases = append(releases, c.Release)
		}
	}
	slices.Sort(releases)
	return releases
}

type fakeRouter struct {
	mu      sync.Mutex
	history [][]Route
}

func (f *fakeRouter) Apply(_ context.Context, routes []Route) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.history = append(f.history, routes)
	return nil
}

func (f *fakeRouter) last() []Route {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.history[len(f.history)-1]
}

type harness struct {
	runtime *fakeRuntime
	router  *fakeRouter
	r       *Reconciler
	mu      sync.Mutex
	events  []protocol.WorkloadStatusEvent
}

func newHarness() *harness {
	h := &harness{runtime: newFake(), router: &fakeRouter{}}
	h.r = &Reconciler{
		Runtime: h.runtime,
		Router:  h.router,
		Log:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		Emit: func(e protocol.WorkloadStatusEvent) {
			h.mu.Lock()
			h.events = append(h.events, e)
			h.mu.Unlock()
		},
	}
	return h
}

func (h *harness) apply(version int64, releases []protocol.WorkloadRelease, strategy string) {
	port := int64(80)
	h.r.Apply(context.Background(), protocol.DesiredSpec{
		Version: version, Network: "huruf-internal",
		Workloads: []protocol.Workload{{
			Project: "p1", Name: "shop", Strategy: strategy, PublicPort: &port,
			DnsNames: []string{"shop.internal"}, Releases: releases,
		}},
	})
	h.r.Wait()
}

func (h *harness) state(version, release int64) string {
	h.mu.Lock()
	defer h.mu.Unlock()
	state := ""
	for _, e := range h.events {
		if e.Data.Version == version && e.Data.Release == release {
			state = e.Data.State
		}
	}
	return state
}

func release(n int64, routed bool, image string) protocol.WorkloadRelease {
	port := int64(3000)
	return protocol.WorkloadRelease{
		Release: n, Image: image, Routed: routed, Replicas: 2, Port: &port,
		Healthcheck: protocol.Healthcheck{Path: "/", TimeoutSec: 30},
	}
}

func upstreams(routes []Route) string {
	if len(routes) == 0 {
		return ""
	}
	return strings.Join(routes[0].Upstreams, ",")
}

func TestFirstDeployRoutesHealthyReplicas(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "rolling")

	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{1, 1}) {
		t.Fatalf("running = %v", got)
	}
	if got := h.router.last(); len(got) != 1 || got[0].Port != 80 || len(got[0].Upstreams) != 2 {
		t.Fatalf("routes = %+v", got)
	}
	if h.state(1, 1) != "healthy" {
		t.Fatalf("state = %q", h.state(1, 1))
	}
}

func TestRollingNeverLeavesTheRouteEmpty(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "rolling")
	h.router.history = nil

	h.apply(2, []protocol.WorkloadRelease{release(2, true, "app:2")}, "rolling")

	for i, routes := range h.router.history {
		if len(routes) != 1 || len(routes[0].Upstreams) == 0 {
			t.Fatalf("step %d: route table %+v has no upstream", i, routes)
		}
	}
	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{2, 2}) {
		t.Fatalf("running = %v", got)
	}
	if h.state(2, 2) != "healthy" {
		t.Fatalf("state = %q", h.state(2, 2))
	}
}

func TestBrokenReleaseKeepsTheOldOneServing(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "rolling")
	before := upstreams(h.router.last())
	h.runtime.broken["app:2"] = true

	h.apply(2, []protocol.WorkloadRelease{release(2, true, "app:2")}, "rolling")

	if h.state(2, 2) != "failed" {
		t.Fatalf("state = %q", h.state(2, 2))
	}
	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{1, 1}) {
		t.Fatalf("running = %v, want the old release only", got)
	}
	if got := upstreams(h.router.last()); got != before {
		t.Fatalf("upstreams = %s, want %s", got, before)
	}
}

func TestAllAtOnceStartsUnroutedThenSwitches(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "allAtOnce")
	before := upstreams(h.router.last())

	// Phase 1: the new set runs next to the old one, without traffic.
	h.apply(2, []protocol.WorkloadRelease{release(1, true, "app:1"), release(2, false, "app:2")}, "allAtOnce")
	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{1, 1, 2, 2}) {
		t.Fatalf("running = %v", got)
	}
	if upstreams(h.router.last()) != before || h.state(2, 2) != "healthy" {
		t.Fatalf("phase 1: upstreams %s, state %q", upstreams(h.router.last()), h.state(2, 2))
	}

	// Phase 2: traffic moves to the new set in one step, then the old set goes.
	h.apply(3, []protocol.WorkloadRelease{release(2, true, "app:2")}, "allAtOnce")
	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{2, 2}) {
		t.Fatalf("running = %v", got)
	}
	if after := upstreams(h.router.last()); after == before || after == "" {
		t.Fatalf("upstreams did not switch: %s", after)
	}
}

func TestStopFirstRetiresBeforeStarting(t *testing.T) {
	h := newHarness()
	one := release(1, true, "app:1")
	one.Replicas = 1
	h.apply(1, []protocol.WorkloadRelease{one}, "stopFirst")
	h.runtime.log = nil

	two := release(2, true, "app:2")
	two.Replicas = 1
	h.apply(2, []protocol.WorkloadRelease{two}, "stopFirst")

	want := []string{"remove huruf-shop-1-0", "start huruf-shop-2-0"}
	if !slices.Equal(h.runtime.log, want) {
		t.Fatalf("order = %v, want %v", h.runtime.log, want)
	}
}

func TestRemovedWorkloadsAreUnroutedAndRemoved(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "rolling")

	h.r.Apply(context.Background(), protocol.DesiredSpec{Version: 2, Network: "huruf-internal"})
	h.r.Wait()

	if got := h.runtime.running("shop"); len(got) != 0 {
		t.Fatalf("running = %v", got)
	}
	if got := h.router.last(); len(got) != 0 {
		t.Fatalf("routes = %+v", got)
	}
}

func TestSelfHealingRecreatesMissingReplicas(t *testing.T) {
	h := newHarness()
	h.apply(1, []protocol.WorkloadRelease{release(1, true, "app:1")}, "rolling")
	_ = h.runtime.Remove(context.Background(), Container{ID: "huruf-shop-1-0"})

	h.r.start(context.Background(), false)
	h.r.Wait()

	if got := h.runtime.running("shop"); !slices.Equal(got, []int64{1, 1}) {
		t.Fatalf("running = %v", got)
	}
}
