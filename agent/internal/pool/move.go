package pool

import (
	"bytes"
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// Moving a partition (PLAN §26.10): the source stops it and serves its
// directory on its address for the move only: its system files (PLAN §28),
// Docker's, containerd's and our agent's state, so the agent keeps its
// identity. An older partition, whose system files are in its container, also
// serves them committed to an image, and the target copies them into its own
// root. The target starts it. The move's one-time key, sealed to both machines
// with its token, encrypts the transfer (seal.go); the token guards it.

// movedLabel marks images a move committed, so Remove deletes them.
const movedLabel = "huruf.moved"

// moveWait is how long either side waits on the other: for the next part to
// be fetched (the source may still be stopping the partition, the target may
// poll later) or for the next bytes of one.
var moveWait = 15 * time.Minute

// tarArgs keeps owners, xattrs (overlay whiteouts and opaque dirs in the
// partition's own Docker) and sparse files; the archive is stdin or stdout.
func tarArgs(name string, create bool) []string {
	args := []string{"tar", "-C", dir(name), "--xattrs", "--xattrs-include=*", "--numeric-owner", "--sparse"}
	if create {
		return append(args, "-cpf", "-", ".")
	}
	return append(args, "-xpf", "-")
}

func (d *Sysbox) Send(ctx context.Context, name, listen, token, key string, relay *protocol.MoveRelay) (err error) {
	if err := d.Stop(ctx, name); err != nil {
		return err
	}
	// Reached through the tunnel server too (relay.go), for a target that
	// can't connect to this machine.
	if relay != nil {
		stop, err := startRelay(ctx, relay, token, 0)
		if err != nil {
			_ = d.Start(context.WithoutCancel(ctx), name)
			return err
		}
		defer stop()
	}
	defer func() {
		if err != nil {
			_ = d.Start(context.WithoutCancel(ctx), name)
		}
	}()
	if ownRoot(name) {
		return serve(ctx, listen, token, key, map[string][]string{"/data": tarArgs(name, true)})
	}
	tag := "huruf-move-" + name + ":" + strconv.FormatInt(time.Now().Unix(), 10)
	if _, err := sh.Run(ctx, "docker", "commit", "--change", "LABEL "+movedLabel+"="+name, container(name), tag); err != nil {
		return err
	}
	defer sh.Run(context.WithoutCancel(ctx), "docker", "rmi", tag)
	return serve(ctx, listen, token, key, map[string][]string{
		"/image": {"docker", "save", tag},
		"/data":  tarArgs(name, true),
	})
}

// counted counts the bytes written through it.
type counted struct {
	io.Writer
	n *atomic.Int64
}

func (c counted) Write(p []byte) (int, error) {
	n, err := c.Writer.Write(p)
	c.n.Add(int64(n))
	return n, err
}

// idle calls fn once `progress` stops moving for `after`; stop ends the watch.
func idle(progress *atomic.Int64, after time.Duration, fn func()) (stop func()) {
	done := make(chan struct{})
	go func() {
		tick := time.NewTicker(after / 4)
		defer tick.Stop()
		last, since := progress.Load(), time.Now()
		for {
			select {
			case <-done:
				return
			case <-tick.C:
				if n := progress.Load(); n != last {
					last, since = n, time.Now()
				} else if time.Since(since) >= after {
					fn()
					return
				}
			}
		}
	}()
	return func() { close(done) }
}

// serve sends each part once, to requests bearing the token. It returns when
// all were sent, on the first failure, or when nothing moves for moveWait:
// no request for the next part, or no bytes of the current one.
func serve(ctx context.Context, listen, token, key string, parts map[string][]string) error {
	// A bad key fails before anything is served.
	if _, _, err := moveCipher(key, ""); err != nil {
		return err
	}
	ln, err := net.Listen("tcp", listen)
	if err != nil {
		return err
	}
	var progress atomic.Int64
	results := make(chan error, len(parts))
	var mu sync.Mutex
	sent := map[string]bool{}
	mux := http.NewServeMux()
	for path, argv := range parts {
		mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			if subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+token)) != 1 {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			mu.Lock()
			again := sent[path]
			sent[path] = true
			mu.Unlock()
			if again {
				http.Error(w, "already sent", http.StatusGone)
				return
			}
			progress.Add(1)
			w.Header().Set("Content-Type", "application/octet-stream")
			var stderr bytes.Buffer
			sealed, _ := newSealWriter(key, path, counted{w, &progress})
			cmd := exec.CommandContext(r.Context(), argv[0], argv[1:]...)
			cmd.Stdout, cmd.Stderr = sealed, &stderr
			if err := cmd.Run(); err != nil {
				results <- fmt.Errorf("sending %s: %w: %s", path, err, sh.Tail(strings.TrimSpace(stderr.String()), 400))
				return
			}
			results <- sealed.Close()
		})
	}
	srv := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go srv.Serve(ln)
	// Closing drops a stalled receiver's connection, which ends its part.
	defer srv.Close()

	stalled := make(chan struct{})
	defer idle(&progress, moveWait, func() { close(stalled) })()
	for pending := len(parts); pending > 0; {
		select {
		case err := <-results:
			if err != nil {
				return err
			}
			pending--
			progress.Add(1)
		case <-stalled:
			return errors.New("the receiving machine didn't fetch the partition in time")
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}

func (d *Sysbox) Receive(ctx context.Context, name string, size protocol.PartitionSize, weight int, from, token, key string, relay *protocol.MoveRelay) error {
	if err := ensureImage(ctx); err != nil {
		return err
	}
	// The source's address, and its tunnel through the tunnel server: the
	// first that answers is used for the whole move.
	src := &source{}
	if from != "" {
		src.addrs = append(src.addrs, from)
	}
	if relay != nil {
		port, err := freePort()
		if err != nil {
			return err
		}
		stop, err := startRelay(ctx, relay, token, port)
		if err != nil {
			return err
		}
		defer stop()
		src.addrs = append(src.addrs, net.JoinHostPort("127.0.0.1", strconv.Itoa(port)))
	}
	if len(src.addrs) == 0 {
		return errors.New("no way to reach the source machine")
	}
	if err := prepareDir(ctx, name, size); err != nil {
		return err
	}
	if _, err := fetch(ctx, src, token, key, "/data", tarArgs(name, false)...); err != nil {
		return err
	}
	// Its system files came with its directory.
	if _, err := os.Stat(filepath.Join(rootDir(name), "usr")); err == nil {
		return runPartition(ctx, name, size, weight, image)
	}
	out, err := fetch(ctx, src, token, key, "/image", "docker", "load")
	if err != nil {
		return err
	}
	img := ""
	for _, line := range strings.Split(out, "\n") {
		if v, ok := strings.CutPrefix(strings.TrimSpace(line), "Loaded image: "); ok {
			img = v
		}
	}
	if img == "" {
		return fmt.Errorf("docker load named no image: %s", sh.Tail(out, 200))
	}
	defer sh.Run(context.WithoutCancel(ctx), "docker", "rmi", img)
	if err := extractRoot(ctx, name, img); err != nil {
		return err
	}
	return runPartition(ctx, name, size, weight, image)
}

// fetch pipes one part into a command. Connecting is retried for moveWait:
// the source may still be stopping the partition. A part that stops
// arriving for moveWait fails.
// source is where a move's parts come from: the addresses to try, and the
// one that answered first, kept for the following parts.
type source struct {
	addrs  []string
	chosen string
}

func (s *source) candidates() []string {
	if s.chosen != "" {
		return []string{s.chosen}
	}
	return s.addrs
}

func fetch(ctx context.Context, src *source, token, key, path string, argv ...string) (string, error) {
	ctx, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	var resp *http.Response
	var err error
	until := time.Now().Add(moveWait)
	for {
		for _, addr := range src.candidates() {
			req, rerr := http.NewRequestWithContext(ctx, http.MethodGet, "http://"+addr+path, nil)
			if rerr != nil {
				return "", rerr
			}
			req.Header.Set("Authorization", "Bearer "+token)
			// A dead path fails fast, so the other one gets its turn.
			client := &http.Client{Transport: &http.Transport{
				DialContext:           (&net.Dialer{Timeout: 10 * time.Second}).DialContext,
				ResponseHeaderTimeout: 2 * time.Minute,
			}}
			if resp, err = client.Do(req); err == nil {
				src.chosen = addr
				break
			}
		}
		if resp != nil {
			break
		}
		if time.Now().After(until) {
			return "", fmt.Errorf("reaching the source machine: %w", err)
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 400))
		return "", fmt.Errorf("%s%s: %s: %s", src.chosen, path, resp.Status, strings.TrimSpace(string(body)))
	}
	var progress atomic.Int64
	stalled := errors.New("the sending machine stopped sending " + path)
	defer idle(&progress, moveWait, func() { cancel(stalled) })()
	opened, err := newOpenReader(key, path, io.TeeReader(resp.Body, counted{io.Discard, &progress}))
	if err != nil {
		return "", err
	}
	cmd := exec.CommandContext(ctx, argv[0], argv[1:]...)
	cmd.Stdin = opened
	out, err := cmd.CombinedOutput()
	if errors.Is(context.Cause(ctx), stalled) {
		return string(out), stalled
	}
	// A wrong key or tampered data: that's why, not what the command made of it.
	if opened.err != nil {
		return string(out), fmt.Errorf("receiving %s: %w", path, opened.err)
	}
	if err != nil {
		return string(out), fmt.Errorf("receiving %s: %w: %s", path, err, sh.Tail(strings.TrimSpace(string(out)), 400))
	}
	return string(out), nil
}
