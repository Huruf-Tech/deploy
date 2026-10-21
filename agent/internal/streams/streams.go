// Package streams runs live views for the dashboard (PLAN §3.6): container
// logs, metrics and exec output. Output is batched into chunks (every 500 ms
// or 32 KB) and capped at the control plane's byte rate.
package streams

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/metrics"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

const (
	flushEvery   = 500 * time.Millisecond
	maxChunk     = 32 << 10
	maxSessions  = 16
	liveInterval = 2 * time.Second
	keepalive    = 15 * time.Second
)

// Manager owns the running sessions; Emit queues chunk events for sending.
type Manager struct {
	Emit    func(protocol.StreamChunkEvent)
	History *metrics.Recorder

	mu       sync.Mutex
	sessions map[string]context.CancelFunc
}

func (m *Manager) Open(ctx context.Context, p protocol.StreamOpenPayload) error {
	m.mu.Lock()
	if m.sessions == nil {
		m.sessions = map[string]context.CancelFunc{}
	}
	if _, running := m.sessions[p.Session]; running {
		m.mu.Unlock()
		return nil // a re-delivered open
	}
	if len(m.sessions) >= maxSessions {
		m.mu.Unlock()
		return fmt.Errorf("too many open streams (max %d)", maxSessions)
	}
	ctx, cancel := context.WithCancel(ctx)
	m.sessions[p.Session] = cancel
	m.mu.Unlock()

	out := newChunker(p.Session, int(p.MaxBytesPerSec), m.Emit)
	go func() {
		defer m.Close(p.Session)
		err := m.run(ctx, p, out)
		if errors.Is(ctx.Err(), context.Canceled) {
			err = nil // closed on purpose
		}
		out.finish(err)
	}()
	return nil
}

func (m *Manager) Close(session string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if cancel, ok := m.sessions[session]; ok {
		cancel()
		delete(m.sessions, session)
	}
}

func (m *Manager) run(ctx context.Context, p protocol.StreamOpenPayload, out *chunker) error {
	text := func(key string) string { s, _ := p.Params[key].(string); return s }

	switch p.Kind {
	case "logs":
		args := []string{"logs", "--follow", "--timestamps", "--tail", fmt.Sprint(int(number(p.Params["tail"], 200)))}
		if since := text("since"); since != "" {
			args = append(args, "--since", since)
		}
		return pipe(ctx, out, "docker", append(args, text("container"))...)
	case "exec":
		command, _ := p.Params["command"].([]any)
		args := []string{"exec", text("container")}
		for _, part := range command {
			args = append(args, fmt.Sprint(part))
		}
		return pipe(ctx, out, "docker", args...)
	case "metrics":
		return m.metrics(ctx, out)
	default:
		return fmt.Errorf("unsupported stream kind %q", p.Kind)
	}
}

// metrics sends the recorded history once, then a live sample every 2 s.
func (m *Manager) metrics(ctx context.Context, out *chunker) error {
	if m.History != nil {
		if history := m.History.History(); len(history) > 0 {
			out.json(history)
		}
	}
	var sampler metrics.Sampler
	sampler.Sample()
	ticker := time.NewTicker(liveInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			sample := sampler.Sample()
			sample.Containers = metrics.Containers(ctx)
			out.json([]protocol.MetricsSample{sample})
		}
	}
}

// pipe streams a process's combined output until it exits or ctx is cancelled.
func pipe(ctx context.Context, out *chunker, name string, args ...string) error {
	cmd := exec.CommandContext(ctx, name, args...)
	reader, writer := io.Pipe()
	cmd.Stdout, cmd.Stderr = writer, writer
	if err := cmd.Start(); err != nil {
		return err
	}
	go func() { writer.CloseWithError(cmd.Wait()) }()

	buf := make([]byte, 8<<10)
	for {
		n, err := reader.Read(buf)
		out.write(buf[:n])
		if err != nil {
			if errors.Is(err, io.EOF) {
				return nil
			}
			var exit *exec.ExitError
			if errors.As(err, &exit) {
				return fmt.Errorf("exited with code %d", exit.ExitCode())
			}
			return err
		}
	}
}

func number(value any, fallback float64) float64 {
	if n, ok := value.(float64); ok {
		return n
	}
	return fallback
}

// chunker batches output into numbered chunks and enforces the byte rate.
type chunker struct {
	session string
	limit   int
	emit    func(protocol.StreamChunkEvent)

	mu        sync.Mutex
	buf       []byte
	seq       int64
	window    time.Time
	sent      int
	truncated bool
	flushedAt time.Time
}

func newChunker(session string, limit int, emit func(protocol.StreamChunkEvent)) *chunker {
	c := &chunker{session: session, limit: limit, emit: emit, flushedAt: time.Now()}
	go c.tick()
	return c
}

func (c *chunker) tick() {
	for range time.Tick(flushEvery) {
		c.mu.Lock()
		done := c.seq < 0
		// A silent stream still checks in, so the control plane can stop an unwatched one.
		if !done && (len(c.buf) > 0 || time.Since(c.flushedAt) >= keepalive) {
			c.flushLocked(false, "")
		}

		c.mu.Unlock()
		if done {
			return
		}
	}
}

func (c *chunker) write(data []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.seq < 0 {
		return
	}
	if now := time.Now(); now.Sub(c.window) >= time.Second {
		c.window, c.sent, c.truncated = now, 0, false
	}
	allowed := min(len(data), c.limit-c.sent)
	if allowed < len(data) && !c.truncated {
		c.truncated = true
		data = append(append([]byte{}, data[:max(allowed, 0)]...), "\n[output truncated: rate limit]\n"...)
		allowed = len(data)
	}
	if allowed <= 0 {
		return
	}
	c.sent += allowed
	c.buf = append(c.buf, data[:allowed]...)
	for len(c.buf) >= maxChunk {
		c.flushLocked(false, "")
	}
}

func (c *chunker) json(value any) {
	data, _ := json.Marshal(value)
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.buf) > 0 {
		c.flushLocked(false, "")
	}
	c.buf = data
	c.flushLocked(false, "")
}

// finish flushes what is left and marks the stream done.
func (c *chunker) finish(err error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	message := ""
	if err != nil {
		message = err.Error()
	}
	c.flushLocked(true, message)
	c.seq = -1
}

func (c *chunker) flushLocked(done bool, message string) {
	if c.seq < 0 {
		return
	}
	size := min(len(c.buf), maxChunk)
	c.seq++
	event := protocol.StreamChunkEvent{
		Id:   fmt.Sprintf("s-%s-%d", c.session, c.seq),
		Type: "stream.chunk",
		Data: protocol.StreamChunkEventData{Session: c.session, Seq: c.seq, Data: string(c.buf[:size])},
	}
	if done && size == len(c.buf) {
		event.Data.Done = &done
		event.Data.Error = message
	}
	c.buf = c.buf[size:]
	c.flushedAt = time.Now()
	c.emit(event)
	if done && len(c.buf) > 0 {
		c.flushLocked(true, message)
	}
}
