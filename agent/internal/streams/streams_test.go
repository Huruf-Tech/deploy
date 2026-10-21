package streams

import (
	"strings"
	"sync"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type collector struct {
	mu     sync.Mutex
	events []protocol.StreamChunkEvent
}

func (c *collector) emit(e protocol.StreamChunkEvent, _ bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.events = append(c.events, e)
}

func (c *collector) text() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	var b strings.Builder
	for _, e := range c.events {
		b.WriteString(e.Data.Data)
	}
	return b.String()
}

func TestChunkerSplitsLargeOutputAndMarksDone(t *testing.T) {
	var out collector
	c := newChunker("s1", 1<<20, flushEvery, false, out.emit)
	c.write([]byte(strings.Repeat("x", maxChunk*2+10)))
	c.finish(nil)

	if got := len(out.text()); got != maxChunk*2+10 {
		t.Fatalf("lost output: got %d bytes", got)
	}
	for i, e := range out.events {
		if e.Data.Seq != int64(i+1) {
			t.Fatalf("seq %d at index %d", e.Data.Seq, i)
		}
		if len(e.Data.Data) > maxChunk {
			t.Fatalf("chunk %d is %d bytes", i, len(e.Data.Data))
		}
	}
	last := out.events[len(out.events)-1]
	if last.Data.Done == nil || !*last.Data.Done {
		t.Fatal("last chunk is not marked done")
	}
}

func TestChunkerEnforcesTheRateCap(t *testing.T) {
	var out collector
	c := newChunker("s1", 1024, flushEvery, false, out.emit)
	c.write([]byte(strings.Repeat("a", 5000)))
	c.write([]byte(strings.Repeat("b", 5000)))
	c.finish(nil)

	text := out.text()
	if !strings.Contains(text, "[output truncated: rate limit]") {
		t.Fatal("no truncation marker")
	}
	data := strings.Replace(text, "\n[output truncated: rate limit]\n", "", 1)
	if strings.Contains(data, "b") || strings.Count(data, "a") != 1024 {
		t.Fatalf("rate cap not enforced: %d a's", strings.Count(data, "a"))
	}
}

func TestChunkerReportsErrors(t *testing.T) {
	var out collector
	c := newChunker("s1", 1<<20, flushEvery, false, out.emit)
	c.finish(errExit)
	if out.events[0].Data.Error != errExit.Error() {
		t.Fatalf("error = %q", out.events[0].Data.Error)
	}
}

var errExit = &exitError{}

type exitError struct{}

func (*exitError) Error() string { return "exited with code 1" }
