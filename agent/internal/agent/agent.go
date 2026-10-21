// Package agent runs the poll loop (PLAN §3.2–3.3). Every interval comes from
// the control plane's config; the only built-in value is the retry cap used
// before the control plane has ever answered.
package agent

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/commands"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/state"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/transport"
)

const (
	unreachableRetryCap = 60 * time.Second
	// Bounded event queue (PLAN §20.4); events are batched up to 64 per request.
	maxPendingEvents = 10_000
	eventBatch       = 64
	sendEvery        = 500 * time.Millisecond
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
	Log     *slog.Logger

	config        *protocol.AgentConfig
	configVersion string
	registered    bool
	lastStatus    string
	lastSummary   time.Time
	sampler       host.Sampler
	mu            sync.Mutex // guards events: commands finish on their own goroutines
	wake          chan struct{}
	events        []any
}

// Run polls until ctx is cancelled or the tenant rejects this server. Events
// are sent by a separate loop every 500 ms, so stream output never waits for
// the next poll (5 s when idle).
func (a *Agent) Run(ctx context.Context) error {
	sending, stopSending := context.WithCancel(context.Background())
	sent := make(chan struct{})
	go func() { a.sendLoop(sending); close(sent) }()
	defer func() {
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

	request := protocol.PollRequest{CommandCursor: a.Store.Cursor()}
	if a.Streams != nil {
		request.Streams = a.Streams.InputCursors() // nil (omitted) unless a terminal is open
	}
	summaryDue := time.Since(a.lastSummary) >= time.Duration(a.config.SummaryIntervalMs)*time.Millisecond
	if summaryDue {
		summary := a.sampler.Summary()
		request.Summary = &summary
	}

	var response struct {
		protocol.PollResponse
		Status string `json:"status"`
	}
	status, err := a.Client.Post(ctx, "/agents/api/poll", request, &response)
	if err != nil {
		return 0, false, err
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
		if a.Streams != nil {
			for session, items := range response.StreamInput {
				a.Streams.Input(session, items)
			}
		}
		if err := a.runCommands(ctx, response.Commands); err != nil {
			return 0, false, err
		}
	case http.StatusForbidden:
		switch response.Status {
		case "rejected":
			a.Log.Error("this server was rejected by the tenant; stopping")
			return 0, true, nil
		case "unknown":
			a.registered = false // removed from the dashboard: register again
		default:
			a.setStatus(response.Status, "waiting for approval", "pairingCode", a.Identity.PairingCode())
		}
	}

	return a.jitter(time.Duration(response.NextPollMs) * time.Millisecond), false, nil
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

	a.config, a.configVersion, a.registered = &response.Config, response.Version, true
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
	a.config, a.configVersion = &response.Config, response.Version
	a.Log.Info("config updated", "version", response.Version, "idlePollMs", response.Config.Poll.IdleMs)
	return nil
}

// runCommands records each new command as received and done before running
// it (at-most-once: a restart never re-runs it; the control plane re-issues
// idempotent work such as docker.ensure), then runs it in the background so
// long commands never stop the poll loop and the lease stays alive.
func (a *Agent) runCommands(ctx context.Context, list []protocol.Command) error {
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
		go a.execute(ctx, command)
	}
	return nil
}

func (a *Agent) execute(ctx context.Context, command protocol.Command) {
	result, runErr := a.Commands.Run(ctx, command.Type, command.Payload)
	data := protocol.CommandResultEventData{Seq: command.Seq, Ok: runErr == nil, Result: result}
	if runErr != nil {
		data.Error = runErr.Error()
	}
	a.Log.Info("ran command", "seq", command.Seq, "type", command.Type, "ok", data.Ok, "error", data.Error)

	// ponytail: results queue in memory; a crash before they are sent leaves the command "delivered". Persist the queue once commands have side effects worth re-reporting.
	a.Enqueue(protocol.CommandResultEvent{
		Id: fmt.Sprintf("cmd-%d", command.Seq), Type: "command.result", Data: data,
	})
}

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
