package streams

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestTerminalSessionEndToEnd(t *testing.T) {
	var out collector
	m := &Manager{Emit: out.emit}
	err := m.Open(context.Background(), protocol.StreamOpenPayload{
		Session: "t1", Kind: "terminal", MaxBytesPerSec: 1 << 20,
		Params: map[string]any{"cols": float64(100), "rows": float64(30)},
	})
	if err != nil {
		t.Fatal(err)
	}

	waitFor := func(what string, ok func() bool) {
		t.Helper()
		deadline := time.Now().Add(5 * time.Second)
		for !ok() {
			if time.Now().After(deadline) {
				t.Fatalf("timed out waiting for %s; output: %q", what, out.text())
			}
			time.Sleep(20 * time.Millisecond)
		}
	}
	waitFor("the terminal to register", func() bool { return m.InputCursors()["t1"] == 0 && len(m.InputCursors()) == 1 })

	m.Input("t1", []protocol.TerminalInput{{Seq: 1, Data: "echo MARK-$((20+22))\r"}})
	// A re-delivered batch (lost poll response) must not run twice.
	m.Input("t1", []protocol.TerminalInput{{Seq: 1, Data: "echo MARK-$((20+22))\r"}})
	waitFor("the command output", func() bool { return strings.Count(out.text(), "MARK-42") >= 1 })

	if m.InputCursors()["t1"] != 1 {
		t.Fatalf("cursor = %d, want 1", m.InputCursors()["t1"])
	}

	m.Input("t1", []protocol.TerminalInput{{Seq: 2, Data: "exit\r"}})
	waitFor("the session to end", func() bool {
		out.mu.Lock()
		defer out.mu.Unlock()
		last := out.events[len(out.events)-1]
		return last.Data.Done != nil && *last.Data.Done
	})
	if got := strings.Count(out.text(), "MARK-42"); got != 1 {
		t.Fatalf("command ran %d times, want once", got)
	}
}
