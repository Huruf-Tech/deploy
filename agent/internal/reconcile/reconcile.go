// Package reconcile makes the server match its desired state (PLAN §4.4, §10):
// it starts, health-checks, routes, drains and removes containers, replacing
// releases with the workload's strategy, and reports each release's outcome.
// Docker, the edge proxy and DNS sit behind small interfaces so the strategies
// are tested with fakes.
package reconcile

import (
	"context"
	"fmt"
	"log/slog"
	"slices"
	"sort"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

const (
	LabelWorkload = "deploy.huruf.workload"
	LabelProject  = "deploy.huruf.project"
	LabelRelease  = "deploy.huruf.release"
	LabelReplica  = "deploy.huruf.replica"
)

// Container is a managed container as the runtime reports it.
type Container struct {
	ID       string
	Name     string
	Workload string
	Release  int64
	Replica  int
	Running  bool
	IP       string
}

// Runtime is what the reconciler needs from Docker.
type Runtime interface {
	List(ctx context.Context) ([]Container, error)
	// Start creates and starts a container and returns it with its IP.
	Start(ctx context.Context, spec ContainerSpec) (Container, error)
	Remove(ctx context.Context, c Container) error
	EnsureImage(ctx context.Context, image string, pull *protocol.RegistryAuth) error
	// WaitHealthy returns nil once the container serves, or why it never did.
	WaitHealthy(ctx context.Context, c Container, release protocol.WorkloadRelease) error
	RemoveUnusedImages(ctx context.Context, keep []string) error
}

type ContainerSpec struct {
	Name     string
	Network  string
	Project  string
	Workload string
	Replica  int
	Release  protocol.WorkloadRelease
}

// Route sends a public port to the routed replicas of one workload.
type Route struct {
	Port       int64
	Upstreams  []string // ip:port
	HealthPath string
}

// Router configures the edge proxy; Apply replaces the whole route table.
type Router interface {
	Apply(ctx context.Context, routes []Route) error
}

// Names serves <project>.internal; Set replaces every record.
type Names interface {
	Set(records map[string][]string)
}

type Reconciler struct {
	Runtime Runtime
	Router  Router
	Names   Names
	Emit    func(protocol.WorkloadStatusEvent)
	Log     *slog.Logger

	mu       sync.Mutex
	spec     *protocol.DesiredSpec
	cancel   context.CancelFunc
	running  chan struct{}
	routing  map[string]routing // workload name → what it serves now
	reported map[string]string  // workload/release → last reported state
	lastGC   time.Time
}

type routing struct {
	publicPort *int64
	port       *int64
	healthPath string
	dnsNames   []string
	ips        []string
}

// Apply makes `spec` the target and restarts the pass, so a newer spec never
// waits behind an older rollout. Passes are idempotent: a cancelled one resumes
// from whatever it already did.
func (r *Reconciler) Apply(ctx context.Context, spec protocol.DesiredSpec) {
	r.mu.Lock()
	r.spec = &spec
	r.mu.Unlock()
	r.start(ctx, true)
}

// Run re-applies the current spec every interval, recreating anything that
// disappeared (self-healing, PLAN §8.5). A pass already running is left alone.
func (r *Reconciler) Run(ctx context.Context, interval func() time.Duration) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(interval()):
			r.start(ctx, false)
		}
	}
}

func (r *Reconciler) start(ctx context.Context, restart bool) {
	r.mu.Lock()
	if r.running != nil {
		if !restart {
			r.mu.Unlock()
			return
		}
		r.cancel()
		done := r.running
		r.mu.Unlock()
		<-done
		r.mu.Lock()
	}
	spec := r.spec
	if spec == nil {
		r.mu.Unlock()
		return
	}
	passCtx, cancel := context.WithCancel(ctx)
	done := make(chan struct{})
	r.cancel, r.running = cancel, done
	r.mu.Unlock()

	go func() {
		defer func() {
			cancel()
			r.mu.Lock()
			if r.running == done {
				r.running = nil
			}
			r.mu.Unlock()
			close(done)
		}()
		if err := r.pass(passCtx, *spec); err != nil && passCtx.Err() == nil {
			r.Log.Warn("reconcile failed; retrying on the next pass", "error", err)
		}
	}()
}

// Wait blocks until the current pass ends (tests).
func (r *Reconciler) Wait() {
	r.mu.Lock()
	done := r.running
	r.mu.Unlock()
	if done != nil {
		<-done
	}
}

func (r *Reconciler) pass(ctx context.Context, spec protocol.DesiredSpec) error {
	containers, err := r.Runtime.List(ctx)
	if err != nil {
		return err
	}
	byWorkload := map[string][]Container{}
	for _, c := range containers {
		byWorkload[c.Workload] = append(byWorkload[c.Workload], c)
	}

	// Workloads converge in parallel: one slow health check never holds up another.
	var wg sync.WaitGroup
	for _, w := range spec.Workloads {
		wg.Add(1)
		go func() {
			defer wg.Done()
			r.workload(ctx, spec, w, byWorkload[w.Name])
		}()
	}
	wg.Wait()
	if ctx.Err() != nil {
		return ctx.Err()
	}

	// Workloads that left the spec: stop routing to them, drain, remove.
	desired := map[string]bool{}
	for _, w := range spec.Workloads {
		desired[w.Name] = true
	}
	var gone []Container
	for name, list := range byWorkload {
		if !desired[name] {
			r.setRouting(name, nil)
			gone = append(gone, list...)
		}
	}
	if len(gone) > 0 {
		if err := r.publish(ctx); err != nil {
			return err
		}
		sleep(ctx, time.Duration(spec.DrainMs)*time.Millisecond)
		for _, c := range gone {
			if err := r.Runtime.Remove(ctx, c); err != nil {
				r.Log.Warn("removing container failed", "container", c.Name, "error", err)
			}
		}
	}

	if time.Since(r.lastGC) > time.Hour {
		r.lastGC = time.Now()
		if err := r.Runtime.RemoveUnusedImages(ctx, spec.KeepImages); err != nil {
			r.Log.Warn("image cleanup failed", "error", err)
		}
	}
	return nil
}

// workload converges one workload. With a single routed release and older
// containers running, it replaces them with the workload's strategy;
// otherwise (first deploy, all-at-once phases, scaling) it converges directly.
func (r *Reconciler) workload(ctx context.Context, spec protocol.DesiredSpec, w protocol.Workload, existing []Container) {
	wanted := map[int64]protocol.WorkloadRelease{}
	for _, rel := range w.Releases {
		wanted[rel.Release] = rel
	}
	var old []Container
	for _, c := range existing {
		if _, ok := wanted[c.Release]; !ok {
			old = append(old, c)
		}
	}

	if len(w.Releases) == 1 && w.Releases[0].Routed && len(old) > 0 && w.Strategy != "allAtOnce" {
		r.replace(ctx, spec, w, w.Releases[0], existing, old)
		return
	}
	r.converge(ctx, spec, w, existing, old)
}

func (r *Reconciler) converge(ctx context.Context, spec protocol.DesiredSpec, w protocol.Workload, existing, old []Container) {
	var routed, extra []Container
	ready := true // every routed release is up (vacuously, when there is none)
	for _, rel := range w.Releases {
		healthy, surplus, err := r.ensure(ctx, spec, w, rel, existing)
		extra = append(extra, surplus...)
		if ctx.Err() != nil {
			return
		}
		if err != nil {
			ready = ready && !rel.Routed
			r.report(spec, w, rel, "failed", err)
			continue
		}
		r.report(spec, w, rel, "healthy", nil)
		if rel.Routed {
			routed = append(routed, healthy...)
		}
	}

	// Until the routed releases are up, the old containers keep serving.
	serving, retire := routed, extra
	if ready {
		retire = append(retire, old...)
	} else {
		serving = old
	}
	r.setRouting(w.Name, &routing{
		publicPort: w.PublicPort,
		port:       routedPort(w),
		healthPath: routedHealthPath(w),
		dnsNames:   w.DnsNames,
		ips:        ips(serving),
	})
	if err := r.publish(ctx); err != nil {
		r.Log.Warn("routing failed", "workload", w.Name, "error", err)
		return
	}

	if len(retire) > 0 {
		sleep(ctx, time.Duration(spec.DrainMs)*time.Millisecond)
		for _, c := range retire {
			if err := r.Runtime.Remove(ctx, c); err != nil {
				r.Log.Warn("removing container failed", "container", c.Name, "error", err)
			}
		}
	}
}

// ensure makes `rel` have its replicas running and healthy, starting the
// missing ones. Replicas above the count are returned for removal.
func (r *Reconciler) ensure(ctx context.Context, spec protocol.DesiredSpec, w protocol.Workload, rel protocol.WorkloadRelease, existing []Container) (healthy, surplus []Container, err error) {
	current := map[int]Container{}
	for _, c := range existing {
		if c.Release != rel.Release {
			continue
		}
		if c.Replica >= int(rel.Replicas) {
			surplus = append(surplus, c)
			continue
		}
		current[c.Replica] = c
	}
	if err := r.Runtime.EnsureImage(ctx, rel.Image, rel.Pull); err != nil {
		return nil, surplus, err
	}

	type result struct {
		c   Container
		err error
	}
	results := make([]result, rel.Replicas)
	var wg sync.WaitGroup
	for i := range int(rel.Replicas) {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c, ok := current[i]
			if !ok || !c.Running {
				if ok {
					_ = r.Runtime.Remove(ctx, c) // exited for good: replace it
				}
				var err error
				c, err = r.Runtime.Start(ctx, r.containerSpec(spec, w, rel, i))
				if err != nil {
					results[i] = result{err: err}
					return
				}
			}
			results[i] = result{c: c, err: r.Runtime.WaitHealthy(ctx, c, rel)}
		}()
	}
	wg.Wait()

	for _, res := range results {
		if res.err != nil {
			return healthy, surplus, res.err
		}
		healthy = append(healthy, res.c)
	}
	return healthy, surplus, nil
}

// replace swaps the old containers for `rel` one replica at a time (PLAN §10).
// Rolling starts the new replica before retiring an old one, so capacity never
// drops below N−1; stop-first retires first (volumes can't be shared). A
// replica that never becomes healthy stops the swap: old replicas keep serving.
func (r *Reconciler) replace(ctx context.Context, spec protocol.DesiredSpec, w protocol.Workload, rel protocol.WorkloadRelease, existing, old []Container) {
	sort.Slice(old, func(i, j int) bool { return old[i].Replica < old[j].Replica })
	drain := time.Duration(spec.DrainMs) * time.Millisecond
	if err := r.Runtime.EnsureImage(ctx, rel.Image, rel.Pull); err != nil {
		r.report(spec, w, rel, "failed", err)
		return
	}

	serving := slices.Clone(old)
	var fresh []Container
	for _, c := range existing {
		if c.Release == rel.Release && c.Running && c.Replica < int(rel.Replicas) {
			fresh = append(fresh, c) // finished by a pass that was interrupted
		}
	}
	route := func() error {
		r.setRouting(w.Name, &routing{
			publicPort: w.PublicPort, port: rel.Port, healthPath: rel.Healthcheck.Path,
			dnsNames: w.DnsNames, ips: ips(append(slices.Clone(fresh), serving...)),
		})
		return r.publish(ctx)
	}
	retire := func(c Container) {
		serving = slices.DeleteFunc(serving, func(s Container) bool { return s.ID == c.ID })
		if err := route(); err != nil {
			r.Log.Warn("routing failed", "workload", w.Name, "error", err)
		}
		sleep(ctx, drain)
		if err := r.Runtime.Remove(ctx, c); err != nil {
			r.Log.Warn("removing container failed", "container", c.Name, "error", err)
		}
	}

	r.report(spec, w, rel, "starting", nil)
	for i := range int(rel.Replicas) {
		if ctx.Err() != nil {
			return
		}
		if slices.ContainsFunc(fresh, func(c Container) bool { return c.Replica == i }) {
			continue
		}
		if w.Strategy == "stopFirst" && len(serving) > 0 {
			retire(serving[0])
		}
		c, err := r.Runtime.Start(ctx, r.containerSpec(spec, w, rel, i))
		if err == nil {
			err = r.Runtime.WaitHealthy(ctx, c, rel)
			if err != nil {
				_ = r.Runtime.Remove(ctx, c)
			}
		}
		if ctx.Err() != nil {
			return
		}
		if err != nil {
			r.report(spec, w, rel, "failed", err)
			return
		}
		fresh = append(fresh, c)
		if err := route(); err != nil {
			r.Log.Warn("routing failed", "workload", w.Name, "error", err)
		}
		if w.Strategy != "stopFirst" && len(serving) > 0 {
			retire(serving[0])
		}
	}
	for len(serving) > 0 && ctx.Err() == nil {
		retire(serving[0])
	}
	if ctx.Err() == nil {
		r.report(spec, w, rel, "healthy", nil)
	}
}

func (r *Reconciler) containerSpec(spec protocol.DesiredSpec, w protocol.Workload, rel protocol.WorkloadRelease, replica int) ContainerSpec {
	return ContainerSpec{
		Name:     fmt.Sprintf("huruf-%s-%d-%d", w.Name, rel.Release, replica),
		Network:  spec.Network,
		Project:  w.Project,
		Workload: w.Name,
		Replica:  replica,
		Release:  rel,
	}
}

func (r *Reconciler) setRouting(workload string, route *routing) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.routing == nil {
		r.routing = map[string]routing{}
	}
	if route == nil {
		delete(r.routing, workload)
		return
	}
	r.routing[workload] = *route
}

// publish pushes the whole route table and DNS records from the current routing.
func (r *Reconciler) publish(ctx context.Context) error {
	r.mu.Lock()
	var routes []Route
	records := map[string][]string{}
	for _, rt := range r.routing {
		for _, name := range rt.dnsNames {
			records[name] = append(records[name], rt.ips...)
		}
		if rt.publicPort == nil || rt.port == nil {
			continue
		}
		route := Route{Port: *rt.publicPort, HealthPath: rt.healthPath}
		for _, ip := range rt.ips {
			route.Upstreams = append(route.Upstreams, fmt.Sprintf("%s:%d", ip, *rt.port))
		}
		routes = append(routes, route)
	}
	r.mu.Unlock()

	sort.Slice(routes, func(i, j int) bool { return routes[i].Port < routes[j].Port })
	if r.Names != nil {
		r.Names.Set(records)
	}
	return r.Router.Apply(ctx, routes)
}

// report emits a status once per (version, workload, release, state).
func (r *Reconciler) report(spec protocol.DesiredSpec, w protocol.Workload, rel protocol.WorkloadRelease, state string, err error) {
	key := fmt.Sprintf("%d/%s/%d", spec.Version, w.Name, rel.Release)
	r.mu.Lock()
	if r.reported == nil {
		r.reported = map[string]string{}
	}
	if r.reported[key] == state {
		r.mu.Unlock()
		return
	}
	r.reported[key] = state
	if len(r.reported) > 10_000 { // bounded (PLAN §20.4)
		r.reported = map[string]string{key: state}
	}
	r.mu.Unlock()

	event := protocol.WorkloadStatusEvent{
		Id:   fmt.Sprintf("ws-%d-%s-%d-%s", spec.Version, w.Name, rel.Release, state),
		Type: "workload.status",
		Data: protocol.WorkloadStatusEventData{
			Version: spec.Version, Project: w.Project, Workload: w.Name,
			Release: rel.Release, State: state,
		},
	}
	if err != nil {
		msg := err.Error()
		if len(msg) > 500 {
			msg = msg[:497] + "…"
		}
		event.Data.Error = msg
		r.Log.Warn("workload failed", "workload", w.Name, "release", rel.Release, "error", msg)
	}
	if r.Emit != nil {
		r.Emit(event)
	}
}

func routedRelease(w protocol.Workload) *protocol.WorkloadRelease {
	for i := range w.Releases {
		if w.Releases[i].Routed {
			return &w.Releases[i]
		}
	}
	if len(w.Releases) > 0 {
		return &w.Releases[0]
	}
	return nil
}

func routedPort(w protocol.Workload) *int64 {
	if rel := routedRelease(w); rel != nil {
		return rel.Port
	}
	return nil
}

func routedHealthPath(w protocol.Workload) string {
	if rel := routedRelease(w); rel != nil {
		return rel.Healthcheck.Path
	}
	return ""
}

func ips(list []Container) []string {
	out := make([]string, 0, len(list))
	for _, c := range list {
		if c.IP != "" {
			out = append(out, c.IP)
		}
	}
	return out
}

func sleep(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}
