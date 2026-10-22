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
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/metrics"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/pty"
)

const (
	flushEvery         = 500 * time.Millisecond
	terminalFlushEvery = 30 * time.Millisecond
	maxChunk           = 32 << 10
	maxSessions        = 16
	liveInterval       = 2 * time.Second
	keepalive          = 15 * time.Second
)

// Manager owns the running sessions; Emit queues chunk events for sending.
type Manager struct {
	// Emit queues a chunk event; urgent ones (terminal output) are sent right away.
	Emit    func(event protocol.StreamChunkEvent, urgent bool)
	History *metrics.Recorder
	// Builds locates build logs for `build` streams; may be nil.
	Builds interface {
		LogPath(deployment string) string
		Running(deployment string) bool
	}

	mu        sync.Mutex
	sessions  map[string]context.CancelFunc
	terminals map[string]*terminal
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

	every, urgent := flushEvery, false
	if p.Kind == "terminal" {
		every, urgent = terminalFlushEvery, true // keystroke echo must feel live
	}
	out := newChunker(p.Session, int(p.MaxBytesPerSec), every, urgent, m.Emit)
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
	case "terminal":
		return m.terminal(ctx, p, out)
	case "metrics":
		return m.metrics(ctx, out)
	case "build":
		return m.followBuild(ctx, text("deployment"), out)
	default:
		return fmt.Errorf("unsupported stream kind %q", p.Kind)
	}
}

const buildLogGrace = 30 * time.Second

// followBuild sends a build log from the start, then what is appended, and
// ends once the build has finished and everything is sent.
func (m *Manager) followBuild(ctx context.Context, deployment string, out *chunker) error {
	if m.Builds == nil {
		return errors.New("builds are not available")
	}
	path := m.Builds.LogPath(deployment)
	var offset int64
	buf := make([]byte, 32*1024)
	// The build command may arrive after the stream, in the same poll: wait for it.
	missingSince := time.Now()
	for {
		running := m.Builds.Running(deployment)
		f, err := os.Open(path)
		if err == nil || running {
			missingSince = time.Now()
		} else if time.Since(missingSince) > buildLogGrace {
			return errors.New("this server has no build log for that deployment")
		}
		read := 0
		if err == nil {
			for {
				n, err := f.ReadAt(buf, offset)
				if n > 0 {
					out.write(buf[:n])
					offset += int64(n)
					read += n
				}
				if err != nil {
					break
				}
			}
			f.Close()
		}
		if err == nil && !running && read == 0 {
			return nil // finished, and everything is sent
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(500 * time.Millisecond):
		}
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
	// A first host sample right away (CPU needs two readings, so ~300 ms apart);
	// per-container stats take ~2 s (`docker stats`) and follow on the tick.
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(300 * time.Millisecond):
		out.json([]protocol.MetricsSample{sampler.Sample()})
	}
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
	emit    func(protocol.StreamChunkEvent, bool)
	every   time.Duration
	urgent  bool

	mu        sync.Mutex
	buf       []byte
	seq       int64
	window    time.Time
	sent      int
	truncated bool
	flushedAt time.Time
}

func newChunker(session string, limit int, every time.Duration, urgent bool, emit func(protocol.StreamChunkEvent, bool)) *chunker {
	c := &chunker{session: session, limit: limit, every: every, urgent: urgent, emit: emit, flushedAt: time.Now()}
	go c.tick()
	return c
}

func (c *chunker) tick() {
	for range time.Tick(c.every) {
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
	c.emit(event, c.urgent)
	if done && len(c.buf) > 0 {
		c.flushLocked(true, message)
	}
}

// terminal is one interactive shell: its pty and the last input applied.
type terminal struct {
	master  *os.File
	lastSeq int64
}

// terminal runs a shell on a pty: a container shell through `docker exec -it`,
// or a root shell on the host. Output is streamed; input arrives with polls.
func (m *Manager) terminal(ctx context.Context, p protocol.StreamOpenPayload, out *chunker) error {
	container, _ := p.Params["container"].(string)
	cols, rows := int(number(p.Params["cols"], 80)), int(number(p.Params["rows"], 24))

	var cmd *exec.Cmd
	if container != "" {
		cmd = exec.CommandContext(ctx, "docker", "exec", "-it",
			"-e", "TERM=xterm-256color", "-e", terminalTag+"="+p.Session, container,
			"sh", "-c", "command -v bash >/dev/null && exec bash || exec sh")
		// Killing the docker exec client leaves the shell running in the container.
		defer func() {
			if ctx.Err() != nil {
				hangUpContainerShell(container, p.Session)
			}
		}()
	} else {
		shell := "/bin/sh"
		if _, err := os.Stat("/bin/bash"); err == nil {
			shell = "/bin/bash"
		}
		cmd = exec.CommandContext(ctx, shell, "-l")
		cmd.Dir = "/root"
		cmd.Env = append(os.Environ(), "TERM=xterm-256color", "HOME=/root")
	}

	master, err := pty.Start(cmd, cols, rows)
	if err != nil {
		return err
	}
	defer master.Close()

	m.mu.Lock()
	if m.terminals == nil {
		m.terminals = map[string]*terminal{}
	}
	m.terminals[p.Session] = &terminal{master: master}
	m.mu.Unlock()
	defer func() {
		m.mu.Lock()
		delete(m.terminals, p.Session)
		m.mu.Unlock()
	}()

	buf := make([]byte, 8<<10)
	for {
		n, err := master.Read(buf)
		out.write(buf[:n])
		if err != nil {
			break // EIO when the shell exits and the pty closes
		}
	}
	if err := cmd.Wait(); err != nil && ctx.Err() == nil {
		var exit *exec.ExitError
		if errors.As(err, &exit) {
			return fmt.Errorf("shell exited with code %d", exit.ExitCode())
		}
		return err
	}
	return nil
}

// InputCursors reports, per open terminal, the last input applied; the agent
// sends it with each poll. Empty when no terminal is open.
func (m *Manager) InputCursors() map[string]int64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.terminals) == 0 {
		return nil
	}
	cursors := make(map[string]int64, len(m.terminals))
	for session, t := range m.terminals {
		cursors[session] = t.lastSeq
	}
	return cursors
}

// Input applies keystrokes and resizes in order, once each.
func (m *Manager) Input(session string, items []protocol.TerminalInput) {
	m.mu.Lock()
	t, ok := m.terminals[session]
	m.mu.Unlock()
	if !ok {
		return
	}
	for _, item := range items {
		if item.Seq <= t.lastSeq {
			continue // re-delivered after a lost poll response
		}
		t.lastSeq = item.Seq
		if item.Data != "" {
			_, _ = t.master.Write([]byte(item.Data))
		}
		if item.Cols != nil && item.Rows != nil {
			_ = pty.Resize(t.master, int(*item.Cols), int(*item.Rows))
		}
	}
}

// terminalTag marks every process of a container shell (the shell and what it
// starts), so a closed session can hang them all up.
const terminalTag = "HURUF_TERMINAL"

// hangUpContainerShell sends SIGHUP to the container's processes carrying this
// session's tag. Needs only /proc, tr and grep, which busybox images have too.
func hangUpContainerShell(container, session string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	script := fmt.Sprintf(`for p in /proc/[0-9]*; do
  tr '\0' '\n' < "$p/environ" 2>/dev/null | grep -qx '%s=%s' && kill -HUP "${p#/proc/}" 2>/dev/null
done; true`, terminalTag, session)
	_ = exec.CommandContext(ctx, "docker", "exec", container, "sh", "-c", script).Run()
}
