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
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// Moving a partition (PLAN §26.10): the source stops it and serves two parts
// over the mesh, its system files (the container committed to an image) and
// its data directory (Docker's, containerd's and our agent's state, so the
// agent keeps its identity). The target pulls both and starts it. WireGuard
// encrypts the transfer; a one-time token, sealed to both machines, guards it.

// movedLabel marks images a move committed, so Remove deletes them.
const movedLabel = "huruf.moved"

// moveWait is how long either side waits for the other between parts: the
// source may still be stopping the partition, the target may poll later.
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

func (d Sysbox) Send(ctx context.Context, name, listen, token string) (err error) {
	if err := d.Stop(ctx, name); err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = d.Start(context.WithoutCancel(ctx), name)
		}
	}()
	tag := "huruf-move-" + name + ":" + strconv.FormatInt(time.Now().Unix(), 10)
	if _, err := run(ctx, "docker", "commit", "--change", "LABEL "+movedLabel+"="+name, container(name), tag); err != nil {
		return err
	}
	defer run(context.WithoutCancel(ctx), "docker", "rmi", tag)
	return serve(ctx, listen, token, map[string][]string{
		"/image": {"docker", "save", tag},
		"/data":  tarArgs(name, true),
	})
}

// serve sends each part once, to requests bearing the token. It returns when
// all were sent, on the first failure, or when nobody asks for moveWait.
func serve(ctx context.Context, listen, token string, parts map[string][]string) error {
	ln, err := net.Listen("tcp", listen)
	if err != nil {
		return err
	}
	starts := make(chan struct{}, len(parts))
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
			starts <- struct{}{}
			w.Header().Set("Content-Type", "application/octet-stream")
			var stderr bytes.Buffer
			cmd := exec.CommandContext(r.Context(), argv[0], argv[1:]...)
			cmd.Stdout, cmd.Stderr = w, &stderr
			if err := cmd.Run(); err != nil {
				results <- fmt.Errorf("sending %s: %w: %s", path, err, strings.TrimSpace(tail(stderr.String(), 400)))
				return
			}
			results <- nil
		})
	}
	srv := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go srv.Serve(ln)
	defer srv.Close()

	deadline := time.After(moveWait)
	for pending := len(parts); pending > 0; {
		select {
		case <-starts:
			deadline = nil // a part is on its way: no limit on how long it takes
		case err := <-results:
			if err != nil {
				return err
			}
			pending--
			deadline = time.After(moveWait)
		case <-deadline:
			return errors.New("the receiving machine didn't fetch the partition in time")
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}

func (Sysbox) Receive(ctx context.Context, name string, size protocol.PartitionSize, weight int, from, token string) error {
	if err := prepareDir(ctx, name, size); err != nil {
		return err
	}
	out, err := fetch(ctx, from, token, "/image", "docker", "load")
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
		return fmt.Errorf("docker load named no image: %s", tail(out, 200))
	}
	if _, err := fetch(ctx, from, token, "/data", tarArgs(name, false)...); err != nil {
		return err
	}
	return runPartition(ctx, name, size, weight, img)
}

// fetch pipes one part into a command. Connecting is retried for moveWait:
// the source may still be stopping the partition.
func fetch(ctx context.Context, from, token, path string, argv ...string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://"+from+path, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	var resp *http.Response
	until := time.Now().Add(moveWait)
	for {
		if resp, err = http.DefaultClient.Do(req); err == nil {
			break
		}
		if time.Now().After(until) {
			return "", fmt.Errorf("reaching %s: %w", from, err)
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
		return "", fmt.Errorf("%s%s: %s: %s", from, path, resp.Status, strings.TrimSpace(string(body)))
	}
	cmd := exec.CommandContext(ctx, argv[0], argv[1:]...)
	cmd.Stdin = resp.Body
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("receiving %s: %w: %s", path, err, strings.TrimSpace(tail(string(out), 400)))
	}
	return string(out), nil
}
