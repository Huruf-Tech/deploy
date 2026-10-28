// Package agent runs the poll loop (PLAN §3.2–3.3). Every interval comes from
// the control plane's config; the only built-in value is the retry cap used
// before the control plane has ever answered.
package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"math/rand/v2"
	"net/http"
	"slices"
	"sync"
	"sync/atomic"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/commands"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/state"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/transport"
)

const (
	unreachableRetryCap = 60 * time.Second
	// Bounded event queue (PLAN §20.4); events are batched up to 64 per request.
	maxPendingEvents = 10_000
	eventBatch       = 64
	sendEvery        = 500 * time.Millisecond
	// On shutdown (an update, systemd stopping the agent), running commands
	// get this long to finish, then they're canceled: a long build or move
	// fails and is reported, and what they undo on failure (a partition send
	// starts the partition again) gets cancelGrace. systemd's own stop
	// timeout (90 s by default) can cut both shorter.
	shutdownGrace = 2 * time.Minute
	cancelGrace   = time.Minute
)

type Agent struct {
	Tenant string
	// One-time token from the SSH wizard; ignored by the control plane once used.
	JoinToken string
	Version   string
	Identity  *identity.Identity
	Client    *transport.Client
	Store     *state.Store
	Commands  commands.Registry
	// Stops streams the control plane reports as unwatched; may be nil.
	Streams Streams
	// Applies the desired state; may be nil (tests).
	Reconciler *reconcile.Reconciler
	// Sets up the private network and registry before workloads; may be nil.
	Network interface {
		Apply(ctx context.Context, spec protocol.DesiredSpec) error
	}
	// Evaluates alert rules and autoscaling from the spec; may be nil.
	Monitor interface {
		SetSpec(spec protocol.DesiredSpec)
	}
	// A machine's partitions, sent with the summary (PLAN §27); may be nil.
	Partitions func(ctx context.Context) []protocol.PartitionUsage
	// Whether this server is a machine set up for partitions; may be nil.
	IsMachine func() bool
	// A machine's latest benchmark (PLAN §29); may be nil, or return nil.
	Benchmark func() *protocol.ResourceSummaryBenchmark
	// Applies a machine's forwards into its partitions (PLAN §27.3); may be nil.
	Forwards func(ctx context.Context, forwards []protocol.PortForward) error
	Log      *slog.Logger

	config        *protocol.AgentConfig
	configVersion string
	registered    bool
	lastStatus    string
	lastSummary   time.Time
	// The size sent with the last hello: a partition resized live (PLAN §27.2)
	// says hello again, so the control plane sees its new size.
	size        [3]float64
	sampler     host.Sampler
	reconcileMs atomic.Int64 // read by the reconciler's goroutine
	monitorMs   atomic.Int64
	capacity    atomic.Pointer[protocol.AgentConfigCapacity]
	// Recent polls' round trips without the control plane's own time (PLAN §29).
	rtts []time.Duration
	// A machine's CPU used outside its partitions (PLAN §29): the partitions'
	// CPU counters at the last summary, and the smoothed share.
	partCPU map[string]int64
	partAt  time.Time
	hostCPU *float64
	mu      sync.Mutex // guards events: commands finish on their own goroutines
	wake    chan struct{}
	events  []any
	// Commands run on their own goroutines, in commandCtx: it outlives Run's
	// ctx, so a shutdown can let them finish.
	commandCtx context.Context
	running    sync.WaitGroup
}

// rttKept is how many recent polls the round trip is the median of.
const rttKept = 30

// addRTT keeps a poll's network round trip (PLAN §29).
func (a *Agent) addRTT(rtt time.Duration) {
	if rtt <= 0 {
		return
	}
	a.rtts = append(a.rtts, rtt)
	if len(a.rtts) > rttKept {
		a.rtts = a.rtts[len(a.rtts)-rttKept:]
	}
}

func median(values []time.Duration) time.Duration {
	if len(values) == 0 {
		return 0
	}
	sorted := slices.Clone(values)
	slices.Sort(sorted)
	return sorted[len(sorted)/2]
}

// hostCPUWindow is how long the CPU used outside partitions is averaged over.
const hostCPUWindow = time.Hour

// outsidePartitions is the share of the machine's CPU used by everything but
// its partitions since the last summary (the owner's own programs, other
// tools), smoothed over about an hour: a machine with nothing else running
// can be rented as a whole, dedicated (PLAN §29).
func (a *Agent) outsidePartitions(cpu float64, parts []protocol.PartitionUsage, now time.Time) *float64 {
	counters := make(map[string]int64, len(parts))
	for _, p := range parts {
		counters[p.Name] = p.CpuMicros
	}
	elapsed := now.Sub(a.partAt)
	prev := a.partCPU
	a.partCPU, a.partAt = counters, now
	if prev == nil || elapsed <= 0 {
		return a.hostCPU
	}
	var used int64
	for name, micros := range counters {
		if before, ok := prev[name]; ok && micros >= before {
			used += micros - before
		}
	}
	share := float64(used) / (float64(elapsed.Microseconds()) * host.Cores())
	outside := min(1, max(0, cpu-share))
	if a.hostCPU == nil {
		a.hostCPU = &outside
	} else {
		weight := 1 - math.Exp(-elapsed.Seconds()/hostCPUWindow.Seconds())
		smoothed := *a.hostCPU + weight*(outside-*a.hostCPU)
		a.hostCPU = &smoothed
	}
	value := *a.hostCPU
	return &value
}

// Run polls until ctx is cancelled or the tenant rejects this server. Events
// are sent by a separate loop every 500 ms, so stream output never waits for
// the next poll (5 s when idle).
func (a *Agent) Run(ctx context.Context) error {
	commands, cancelCommands := context.WithCancel(context.WithoutCancel(ctx))
	defer cancelCommands()
	a.commandCtx = commands
	sending, stopSending := context.WithCancel(context.Background())
	sent := make(chan struct{})
	go func() { a.sendLoop(sending); close(sent) }()
	if a.Reconciler != nil {
		// Workloads come back after a restart without waiting for the control plane.
		if version, sealed := a.Store.Spec(); version > 0 {
			if err := a.applyDesired(ctx, version, sealed); err != nil {
				a.Log.Warn("stored desired state is unreadable; waiting for a new one", "error", err)
			}
		}
		go a.Reconciler.Run(ctx, a.ReconcileInterval)
	}
	defer func() {
		// Their results are sent before the agent exits.
		if !a.waitCommands(shutdownGrace) {
			a.Log.Warn("commands still running; canceling them", "after", shutdownGrace)
			cancelCommands()
			a.waitCommands(cancelGrace)
		}
		stopSending()
		<-sent
		// Last results (e.g. of the command that preceded a rejection).
		_ = a.flushEvents(context.Background())
	}()

	failures := 0
	for ctx.Err() == nil {
		wait, stop, err := a.step(ctx)
		if stop {
			return nil
		}
		if err != nil {
			failures++
			wait = a.backoff(failures)
			a.Log.Warn("control plane request failed", "error", err, "retryIn", wait.Round(time.Millisecond))
		} else {
			failures = 0
		}

		select {
		case <-ctx.Done():
		case <-time.After(wait):
		}
	}
	return nil
}

func (a *Agent) step(ctx context.Context) (wait time.Duration, stop bool, err error) {
	if !a.registered {
		if err := a.hello(ctx); err != nil {
			return 0, false, err
		}
	}

	applied, _ := a.Store.Spec()
	request := protocol.PollRequest{CommandCursor: a.Store.Cursor(), AppliedVersion: &applied}
	// Long polling (PLAN Phase 13): the control plane holds the poll until
	// there's something for us, when it says it can.
	waiting := a.config != nil && a.config.Poll.WaitMs != nil && *a.config.Poll.WaitMs > 0
	if waiting {
		request.Wait = &waiting
	}
	if a.Streams != nil {
		request.Streams = a.Streams.InputCursors() // nil (omitted) unless a terminal is open
	}
	summaryDue := time.Since(a.lastSummary) >= time.Duration(a.config.SummaryIntervalMs)*time.Millisecond
	if summaryDue && currentSize() != a.size {
		a.registered = false // resized: the next step says hello with the new size
	}
	if summaryDue {
		summary := a.sampler.Summary()
		if a.Partitions != nil {
			summary.Partitions = a.Partitions(ctx)
		}
		if rtt := median(a.rtts); rtt > 0 {
			ms := float64(rtt.Microseconds()) / 1000
			summary.RttMs = &ms
		}
		if a.IsMachine != nil && a.IsMachine() {
			summary.HostCpu = a.outsidePartitions(summary.Cpu, summary.Partitions, time.Now())
			if a.Benchmark != nil {
				summary.Benchmark = a.Benchmark()
			}
		}
		request.Summary = &summary
	}

	var raw json.RawMessage
	sentAt := time.Now()
	status, server, err := a.Client.PostTimed(ctx, "/agents/api/poll", request, &raw)
	if err != nil {
		return 0, false, err
	}
	if status == http.StatusOK {
		a.addRTT(time.Since(sentAt) - server)
	}
	var response protocol.PollResponse
	var refusal protocol.PollRefusal
	if len(raw) > 0 {
		into := any(&response)
		if status == http.StatusForbidden {
			into = &refusal
		}
		if err := json.Unmarshal(raw, into); err != nil {
			return 0, false, fmt.Errorf("/agents/api/poll: invalid response: %w", err)
		}
	}
	if status == http.StatusForbidden {
		response.NextPollMs, response.ConfigVersion = refusal.NextPollMs, refusal.ConfigVersion
	}
	if response.ConfigVersion != "" && response.ConfigVersion != a.configVersion {
		if err := a.refreshConfig(ctx); err != nil {
			a.Log.Warn("config refresh failed", "error", err)
		}
	}

	switch status {
	case http.StatusOK:
		if summaryDue {
			a.lastSummary = time.Now()
		}
		a.setStatus("active", "online")
		if response.ResetCommands != nil && *response.ResetCommands {
			a.Log.Info("command state is from an earlier registration; starting over")
			if err := a.Store.Reset(); err != nil {
				return 0, false, err
			}
			return 0, false, nil // the next poll starts from the beginning
		}
		if d := response.Desired; d != nil && d.Version > applied {
			if err := a.applyDesired(ctx, d.Version, d.Sealed); err != nil {
				a.Log.Error("cannot apply the desired state", "version", d.Version, "error", err)
			}
		}
		if a.Streams != nil {
			for session, items := range response.StreamInput {
				a.Streams.Input(session, items)
			}
		}
		if err := a.runCommands(response.Commands); err != nil {
			return 0, false, err
		}
	case http.StatusForbidden:
		switch refusal.Status {
		case "rejected":
			a.Log.Error("this server was rejected by the tenant; stopping")
			return 0, true, nil
		case "unknown":
			a.registered = false // removed from the dashboard: register again
		default:
			a.setStatus(refusal.Status, "waiting for approval", "pairingCode", a.Identity.PairingCode())
		}
	}

	if waiting && status == http.StatusOK && response.NextPollMs == 0 {
		return 0, false, nil // an empty hold: wait again right away
	}
	return a.jitter(time.Duration(response.NextPollMs) * time.Millisecond), false, nil
}

// applyDesired opens a sealed spec, persists it, and hands it to the reconciler.
// It is stored only once readable, so a bad one is fetched again.
func (a *Agent) applyDesired(ctx context.Context, version int64, sealed string) error {
	plain, err := a.Identity.Open(sealed)
	if err != nil {
		return err
	}
	var spec protocol.DesiredSpec
	if err := json.Unmarshal(plain, &spec); err != nil {
		return err
	}
	if err := a.Store.SaveSpec(version, sealed); err != nil {
		return err
	}
	a.Log.Info("applying desired state", "version", version, "workloads", len(spec.Workloads))
	if a.Network != nil {
		// Errors are reported in mesh.status; workloads still run locally.
		_ = a.Network.Apply(ctx, spec)
	}
	if a.Forwards != nil {
		if err := a.Forwards(ctx, spec.Forwards); err != nil {
			a.Log.Warn("forwarding ports into partitions", "error", err)
		}
	}
	if a.Monitor != nil {
		a.Monitor.SetSpec(spec)
	}
	if a.Reconciler != nil {
		a.Reconciler.Apply(ctx, spec)
	}
	return nil
}

// MonitorInterval and CapacityConfig come from the control plane's config,
// with the same fallback as ReconcileInterval before the first hello.
func (a *Agent) MonitorInterval() time.Duration {
	if ms := a.monitorMs.Load(); ms > 0 {
		return time.Duration(ms) * time.Millisecond
	}
	return unreachableRetryCap
}

func (a *Agent) CapacityConfig() protocol.AgentConfigCapacity {
	if c := a.capacity.Load(); c != nil {
		return *c
	}
	return protocol.AgentConfigCapacity{HeadroomPercent: 15, RetentionDays: 90}
}

func (a *Agent) setConfig(config protocol.AgentConfig, version string) {
	a.config, a.configVersion = &config, version
	a.reconcileMs.Store(config.ReconcileIntervalMs)
	a.monitorMs.Store(config.MonitorIntervalMs)
	a.capacity.Store(&config.Capacity)
}

// ReconcileInterval comes from the control plane's config; until the first
// hello answers, the stored spec is re-checked at the agent's retry cap.
func (a *Agent) ReconcileInterval() time.Duration {
	if ms := a.reconcileMs.Load(); ms > 0 {
		return time.Duration(ms) * time.Millisecond
	}
	return unreachableRetryCap
}

func currentSize() [3]float64 {
	disk, _ := host.DataDisk()
	return [3]float64{host.Cores(), float64(host.Memory()), float64(disk)}
}

func (a *Agent) hello(ctx context.Context) error {
	var response protocol.HelloResponse
	_, err := a.Client.Post(ctx, "/agents/api/hello", protocol.HelloRequest{
		Tenant:        a.Tenant,
		JoinToken:     a.JoinToken,
		SignPublicKey: a.Identity.SignPublicKey(),
		BoxPublicKey:  a.Identity.BoxPublicKey(),
		Inventory:     host.Inventory(a.Version),
	}, &response)
	if err != nil {
		return err
	}
	a.size = currentSize()

	// Registered as a new server (removed and added again): start over.
	if changed, err := a.Store.RegisteredAs(response.Server); err != nil {
		return err
	} else if changed {
		a.Log.Info("registered as a new server; starting over", "server", response.Server)
	}
	a.setConfig(response.Config, response.Version)
	a.registered = true
	if response.Status == "pending" {
		// The locally computed code, never the one from the network (PLAN §4.2).
		a.Log.Info("waiting for approval: enter this pairing code in the dashboard",
			"pairingCode", a.Identity.PairingCode(), "server", response.Server)
	}
	return nil
}

func (a *Agent) refreshConfig(ctx context.Context) error {
	var response protocol.AgentConfigResponse
	if _, err := a.Client.Post(ctx, "/agents/api/config", struct{}{}, &response); err != nil {
		return err
	}
	a.setConfig(response.Config, response.Version)
	a.Log.Info("config updated", "version", response.Version, "idlePollMs", response.Config.Poll.IdleMs)
	return nil
}

// runCommands records each new command as received and done before running
// it (at-most-once: a restart never re-runs it; the control plane re-issues
// idempotent work such as docker.ensure), then runs it in the background so
// long commands never stop the poll loop and the lease stays alive.
func (a *Agent) runCommands(list []protocol.Command) error {
	for _, command := range list {
		if a.Store.IsDone(command.Seq) {
			if err := a.Store.Received(command.Seq); err != nil {
				return err
			}
			continue
		}
		if err := a.Store.Received(command.Seq, command.Seq); err != nil {
			return err
		}
		a.running.Add(1)
		go func() {
			defer a.running.Done()
			a.execute(a.commandCtx, command)
		}()
	}
	return nil
}

// waitCommands waits up to `limit` for running commands; false if some still run.
func (a *Agent) waitCommands(limit time.Duration) bool {
	done := make(chan struct{})
	go func() { a.running.Wait(); close(done) }()
	select {
	case <-done:
		return true
	case <-time.After(limit):
		return false
	}
}

func (a *Agent) execute(ctx context.Context, command protocol.Command) {
	result, runErr := a.Commands.Run(ctx, command.Type, command.Payload)
	data := protocol.CommandResultEventData{Seq: command.Seq, Ok: runErr == nil, Result: result}
	if runErr != nil {
		data.Error = sh.Cap(runErr.Error(), maxError)
	}
	a.Log.Info("ran command", "seq", command.Seq, "type", command.Type, "ok", data.Ok, "error", data.Error)

	// ponytail: results queue in memory; a crash before they are sent leaves the command "delivered". Persist the queue once commands have side effects worth re-reporting.
	a.Enqueue(protocol.CommandResultEvent{
		Id: fmt.Sprintf("cmd-%d", command.Seq), Type: "command.result", Data: data,
	})
}

// maxError is the protocol's limit on a result's error: the control plane
// refuses a longer one, and a refused event would hold back every later one.
const maxError = 500

// Enqueue adds an event for the next send; safe from any goroutine. The queue
// is bounded: when full, the oldest events are dropped.
func (a *Agent) Enqueue(event any) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.events = append(a.events, event)
	if len(a.events) > maxPendingEvents {
		a.events = a.events[len(a.events)-maxPendingEvents:]
	}
}

func (a *Agent) sendLoop(ctx context.Context) {
	ticker := time.NewTicker(sendEvery)
	defer ticker.Stop()
	for {
		// Every tick, or right away when woken (terminal output). Go's select
		// cases don't fall through, so the flush must sit after the select.
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-a.wakeup():
		}
		if err := a.flushEvents(ctx); err != nil && ctx.Err() == nil {
			a.Log.Warn("sending events failed; will retry", "error", err)
		}
	}
}

func (a *Agent) flushEvents(ctx context.Context) error {
	for {
		a.mu.Lock()
		batch := append([]any(nil), a.events[:min(eventBatch, len(a.events))]...)
		a.mu.Unlock()
		if len(batch) == 0 {
			return nil
		}

		var response protocol.EventsResponse
		if _, err := a.Client.Post(ctx, "/agents/api/events", protocol.EventsRequest{Events: batch}, &response); err != nil {
			return err
		}
		a.mu.Lock()
		a.events = a.events[len(batch):]
		a.mu.Unlock()

		// Streams nobody is watching any more.
		if a.Streams != nil {
			for _, session := range response.Close {
				a.Streams.Close(session)
			}
		}
	}
}

func (a *Agent) setStatus(status, message string, attrs ...any) {
	if status != a.lastStatus {
		a.Log.Info(message, attrs...)
		a.lastStatus = status
	}
}

func (a *Agent) jitter(d time.Duration) time.Duration {
	if d <= 0 {
		d = time.Duration(a.config.Poll.IdleMs) * time.Millisecond
	}
	spread := a.config.JitterPercent / 100
	return time.Duration(float64(d) * (1 - spread + rand.Float64()*2*spread))
}

// backoff is exponential with full jitter, capped by the control plane's config.
func (a *Agent) backoff(failures int) time.Duration {
	limit := unreachableRetryCap
	if a.config != nil {
		limit = time.Duration(a.config.MaxBackoffMs) * time.Millisecond
	}
	ceiling := min(limit, time.Second<<min(failures, 16))
	return time.Duration(rand.Int64N(int64(ceiling) + 1))
}

// Streams is what the poll loop needs from the stream manager.
type Streams interface {
	Close(session string)
	InputCursors() map[string]int64
	Input(session string, items []protocol.TerminalInput)
}

func (a *Agent) wakeup() chan struct{} {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.wake == nil {
		a.wake = make(chan struct{}, 1)
	}
	return a.wake
}

// Wake makes the sender flush now instead of on its next tick (terminal echo).
func (a *Agent) Wake() {
	select {
	case a.wakeup() <- struct{}{}:
	default: // a flush is already pending
	}
}
