package agent

import (
	"context"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/build"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/commands"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/state"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/streams"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/transport"
)

var config = protocol.AgentConfig{
	Poll:              protocol.AgentConfigPoll{IdleMs: 5, ActiveMs: 5, TerminalMs: 5},
	SummaryIntervalMs: 60_000,
	MaxBackoffMs:      10,
}

// fakeControlPlane verifies every signature and scripts the poll responses.
type fakeControlPlane struct {
	t      *testing.T
	pubKey ed25519.PublicKey
	mu     sync.Mutex
	polls  int
	events []protocol.CommandResultEvent
}

func (f *fakeControlPlane) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	sum := sha256.Sum256(body)
	canonical := strings.Join([]string{r.Method, r.URL.Path, r.Header.Get(protocol.HeaderTimestamp), hex.EncodeToString(sum[:])}, "\n")
	signature, _ := base64.RawURLEncoding.DecodeString(r.Header.Get(protocol.HeaderSignature))
	if !ed25519.Verify(f.pubKey, []byte(canonical), signature) {
		f.t.Errorf("bad signature on %s", r.URL.Path)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	reply := func(status int, v any) {
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(v)
	}

	switch r.URL.Path {
	case "/agents/api/hello":
		reply(200, protocol.HelloResponse{Server: "s1", Status: "pending", Config: config, Version: "v1", NextPollMs: 5})
	case "/agents/api/events":
		var request struct {
			Events []protocol.CommandResultEvent `json:"events"`
		}
		_ = json.Unmarshal(body, &request)
		f.events = append(f.events, request.Events...)
		reply(200, map[string]int{"applied": len(request.Events)})
	case "/agents/api/poll":
		f.polls++
		ping := []protocol.Command{{Seq: 1, Type: "ping"}}
		switch {
		case f.polls == 1: // still pending
			reply(403, protocol.PollRefusal{Status: "pending", NextPollMs: 5, ConfigVersion: "v1"})
		case f.polls <= 3: // accepted; the response with command 1 is "lost" once, so it is re-delivered
			reply(200, protocol.PollResponse{NextPollMs: 5, ConfigVersion: "v1", Commands: ping})
		case f.polls == 4:
			reply(200, protocol.PollResponse{NextPollMs: 5, ConfigVersion: "v1", Commands: []protocol.Command{}})
		default:
			reply(403, protocol.PollRefusal{Status: "rejected", NextPollMs: 5, ConfigVersion: "v1"})
		}
	}
}

func TestAgentLoop(t *testing.T) {
	seed := make([]byte, 32)
	id := identity.FromSeed(seed)
	pub, _ := base64.RawURLEncoding.DecodeString(id.SignPublicKey())
	plane := &fakeControlPlane{t: t, pubKey: pub}
	server := httptest.NewServer(plane)
	defer server.Close()

	store, err := state.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	a := &Agent{
		Tenant:   "t1",
		Version:  "test",
		Identity: id,
		Client:   transport.New(server.URL, id),
		Store:    store,
		Commands: commands.Default(context.Background(), &streams.Manager{}, &build.Builder{Dir: t.TempDir()}, id.Open, func() {}),
		Log:      slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := a.Run(ctx); err != nil {
		t.Fatal(err)
	}
	if ctx.Err() != nil {
		t.Fatal("agent did not stop on rejection")
	}

	if len(plane.events) != 1 || plane.events[0].Data.Seq != 1 || !plane.events[0].Data.Ok {
		t.Fatalf("want exactly one successful result for command 1, got %+v", plane.events)
	}
	if store.Cursor() != 1 {
		t.Fatalf("cursor = %d, want 1", store.Cursor())
	}
}

// Regression: events must be sent on the regular tick while the agent keeps
// running, not only when a terminal wakes the sender or the agent stops.
func TestEventsAreSentWithoutAWakeUp(t *testing.T) {
	id := identity.FromSeed(make([]byte, 32))
	received := make(chan string, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/agents/api/events" {
			body, _ := io.ReadAll(r.Body)
			received <- string(body)
		}
		_, _ = w.Write([]byte(`{"applied":1,"close":[]}`))
	}))
	defer server.Close()

	a := &Agent{
		Identity: id,
		Client:   transport.New(server.URL, id),
		Log:      slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go a.sendLoop(ctx)

	a.Enqueue(protocol.StreamChunkEvent{Id: "s-1", Type: "stream.chunk", Data: protocol.StreamChunkEventData{Session: "m1", Seq: 1, Data: "metrics"}})

	select {
	case body := <-received:
		if !strings.Contains(body, "metrics") {
			t.Fatalf("unexpected body %s", body)
		}
	case <-time.After(3 * sendEvery):
		t.Fatal("event was not sent on the regular tick")
	}
}

// Long polling (PLAN Phase 13): with waitMs advertised, every poll asks to be
// held, and after an empty hold (nextPollMs 0) the next poll comes at once,
// not after the idle interval.
func TestLongPollAsksToWaitAndComesStraightBack(t *testing.T) {
	seed := make([]byte, 32)
	id := identity.FromSeed(seed)
	wait := int64(25_000)
	slow := protocol.AgentConfig{
		Poll:              protocol.AgentConfigPoll{IdleMs: 2_000, ActiveMs: 2_000, TerminalMs: 2_000, WaitMs: &wait},
		SummaryIntervalMs: 60_000,
		MaxBackoffMs:      10,
	}
	var mu sync.Mutex
	var asked []bool
	var at []time.Time
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		reply := func(status int, v any) {
			w.WriteHeader(status)
			_ = json.NewEncoder(w).Encode(v)
		}
		switch r.URL.Path {
		case "/agents/api/hello":
			reply(200, protocol.HelloResponse{Server: "s1", Status: "active", Config: slow, Version: "v1", NextPollMs: 5})
		case "/agents/api/poll":
			var request protocol.PollRequest
			_ = json.Unmarshal(body, &request)
			mu.Lock()
			asked = append(asked, request.Wait != nil && *request.Wait)
			at = append(at, time.Now())
			n := len(asked)
			mu.Unlock()
			if n > 3 {
				reply(403, protocol.PollRefusal{Status: "rejected", NextPollMs: 5, ConfigVersion: "v1"})
				return
			}
			reply(200, protocol.PollResponse{NextPollMs: 0, ConfigVersion: "v1", Commands: []protocol.Command{}})
		default:
			reply(200, map[string]int{"applied": 0})
		}
	}))
	defer server.Close()

	store, err := state.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	a := &Agent{
		Tenant: "t1", Version: "test", Identity: id,
		Client:   transport.New(server.URL, id),
		Store:    store,
		Commands: commands.Default(context.Background(), &streams.Manager{}, &build.Builder{Dir: t.TempDir()}, id.Open, func() {}),
		Log:      slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := a.Run(ctx); err != nil {
		t.Fatal(err)
	}

	mu.Lock()
	defer mu.Unlock()
	if len(asked) != 4 {
		t.Fatalf("polls = %d, want 4", len(asked))
	}
	for i, w := range asked {
		if !w {
			t.Fatalf("poll %d didn't ask to wait", i+1)
		}
	}
	// The idle interval is 2 s: polls 2-4 came back without it.
	if gap := at[3].Sub(at[1]); gap > time.Second {
		t.Fatalf("empty holds were followed by a %v pause", gap)
	}
}
