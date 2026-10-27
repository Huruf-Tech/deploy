// Package build runs `build.run` (PLAN §9.3): clone the commit, build the
// image with BuildKit, optionally push it. The log stays on this server in a
// file the dashboard streams while it is open (PLAN §3.5, data minimization).
package build

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/docker"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// Older logs are deleted (PLAN §20.4).
const keepLogs = 50

type Builder struct {
	Dir string // <state dir>/builds

	mu      sync.Mutex // one build at a time: builds are CPU and disk heavy
	running sync.Map   // deployment → struct{}
}

// LogPath is where a deployment's build log lives on this server.
func (b *Builder) LogPath(deployment string) string {
	return filepath.Join(b.Dir, safe(deployment)+".log")
}

// Running reports whether the deployment's build is still writing its log.
func (b *Builder) Running(deployment string) bool {
	_, ok := b.running.Load(deployment)
	return ok
}

func (b *Builder) Run(ctx context.Context, p protocol.BuildRunPayload) (map[string]any, error) {
	b.running.Store(p.Deployment, struct{}{})
	defer b.running.Delete(p.Deployment)

	if err := os.MkdirAll(b.Dir, 0o700); err != nil {
		return nil, err
	}
	logFile, err := os.OpenFile(b.LogPath(p.Deployment), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return nil, err
	}
	defer logFile.Close()
	logf := func(format string, args ...any) {
		fmt.Fprintf(logFile, "==> "+format+"\n", args...)
	}

	if !b.mu.TryLock() {
		logf("Waiting for another build on this server to finish")
		b.mu.Lock()
	}
	defer b.mu.Unlock()
	defer b.pruneLogs()

	ctx, cancel := context.WithTimeout(ctx, time.Duration(p.TimeoutSec)*time.Second)
	defer cancel()
	started := time.Now()

	result, err := b.run(ctx, p, logFile, logf)
	if err != nil {
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			err = fmt.Errorf("build timed out after %ds", p.TimeoutSec)
		}
		logf("Failed: %v", err)
		return nil, err
	}
	result["durationMs"] = time.Since(started).Milliseconds()
	logf("Done in %s", time.Since(started).Round(time.Second))
	return result, nil
}

func (b *Builder) run(ctx context.Context, p protocol.BuildRunPayload, log io.Writer, logf func(string, ...any)) (map[string]any, error) {
	work, err := os.MkdirTemp(b.Dir, "work-")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(work)
	src := filepath.Join(work, "src")
	if err := os.Mkdir(src, 0o700); err != nil {
		return nil, err
	}

	logf("Cloning %s at %s", redact(p.Repo.Url), p.Repo.Ref)
	commit, err := clone(ctx, p, work, src, log)
	if err != nil {
		return nil, fmt.Errorf("clone: %w", err)
	}
	logf("Commit %s", commit.sha)

	contextDir := filepath.Join(src, filepath.Clean("/"+p.RootDir))
	dockerfile := filepath.Join(contextDir, filepath.Clean("/"+orDefault(p.DockerfilePath, "Dockerfile")))
	if p.Dockerfile != "" {
		dockerfile = filepath.Join(work, "Dockerfile")
		if err := os.WriteFile(dockerfile, []byte(p.Dockerfile), 0o600); err != nil {
			return nil, err
		}
	}

	// Build-stage variables reach RUN steps only through this secret, never as
	// build args, so they are not stored in the image history.
	envFile := filepath.Join(work, "huruf-env")
	if err := os.WriteFile(envFile, []byte(exports(p.BuildEnv)), 0o600); err != nil {
		return nil, err
	}

	args := []string{"build", "--progress=plain", "-f", dockerfile, "-t", p.Image,
		"--secret", "id=huruf-env,src=" + envFile}
	for _, key := range sortedKeys(p.Labels) {
		args = append(args, "--label", key+"="+p.Labels[key])
	}
	if p.NoCache {
		args = append(args, "--no-cache")
		logf("Building without cache")
	}
	args = append(args, contextDir)
	logf("Building %s", p.Image)
	if err := stream(ctx, log, []string{"DOCKER_BUILDKIT=1"}, "docker", args...); err != nil {
		return nil, errors.New("docker build failed; see the build log")
	}

	imageID, err := sh.Run(ctx, "docker", "image", "inspect", "-f", "{{.Id}}", p.Image)
	if err != nil {
		return nil, err
	}
	result := map[string]any{
		"image":   p.Image,
		"imageId": strings.TrimSpace(imageID),
		"commit":  commit.sha,
		"author":  commit.author,
		"message": commit.message,
	}

	if p.Push != nil {
		logf("Pushing %s", p.Push.Image)
		auth := protocol.RegistryAuth{Registry: p.Push.Registry, Username: p.Push.Username, Password: p.Push.Password}
		err := docker.WithLogin(ctx, auth, func(config string) error {
			if _, err := sh.Run(ctx, "docker", "tag", p.Image, p.Push.Image); err != nil {
				return err
			}
			return stream(ctx, log, nil, "docker", "--config", config, "push", p.Push.Image)
		})
		if err != nil {
			return nil, fmt.Errorf("push: %w", err)
		}
		result["pushed"] = p.Push.Image
	}
	return result, nil
}

type commitInfo struct{ sha, author, message string }

// clone fetches one commit in a throwaway git container, so hosts need no git
// and the token stays out of the host's process list and disk.
func clone(ctx context.Context, p protocol.BuildRunPayload, work, src string, log io.Writer) (commitInfo, error) {
	script := `set -e
git init -q
git remote add origin "$GIT_URL"
if [ -n "$GIT_TOKEN" ]; then
  AUTH="Authorization: Basic $(printf 'x-access-token:%s' "$GIT_TOKEN" | base64 | tr -d '\n')"
  git -c http.extraHeader="$AUTH" fetch -q --depth 1 origin "$GIT_REF"
else
  git fetch -q --depth 1 origin "$GIT_REF"
fi
git -c advice.detachedHead=false checkout -q FETCH_HEAD
git log -1 --format='%H%n%an%n%s' > /meta/commit`
	args := []string{"run", "--rm", "--network", "host",
		"-v", src + ":/src", "-v", work + ":/meta", "-w", "/src",
		"-e", "GIT_URL", "-e", "GIT_REF", "-e", "GIT_TOKEN", "-e", "GIT_TERMINAL_PROMPT=0"}
	env := []string{"GIT_URL=" + p.Repo.Url, "GIT_REF=" + p.Repo.Ref, "GIT_TOKEN=" + p.Repo.Token}
	if p.Repo.SshKey != "" {
		key := filepath.Join(work, "deploy-key")
		if err := os.WriteFile(key, []byte(strings.TrimSpace(p.Repo.SshKey)+"\n"), 0o600); err != nil {
			return commitInfo{}, err
		}
		args = append(args, "-v", key+":/deploy-key:ro",
			"-e", "GIT_SSH_COMMAND=ssh -i /deploy-key -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null")
	}
	args = append(args, "--entrypoint", "sh", p.GitImage, "-c", script)
	if err := stream(ctx, log, env, "docker", args...); err != nil {
		return commitInfo{}, err
	}
	raw, err := os.ReadFile(filepath.Join(work, "commit"))
	if err != nil {
		return commitInfo{}, err
	}
	lines := strings.SplitN(strings.TrimSpace(string(raw)), "\n", 3)
	for len(lines) < 3 {
		lines = append(lines, "")
	}
	return commitInfo{sha: lines[0], author: lines[1], message: lines[2]}, nil
}

// exports renders variables as shell `export` lines, single-quoted, so RUN
// steps can `. /run/secrets/huruf-env` whatever the values contain.
func exports(env map[string]string) string {
	var b strings.Builder
	for _, key := range sortedKeys(env) {
		fmt.Fprintf(&b, "export %s='%s'\n", key, strings.ReplaceAll(env[key], "'", `'\''`))
	}
	return b.String()
}

// ClearCache drops a project's BuildKit cache mounts (`cache.clear`, PLAN
// §9.2): templates name them `<project>-<epoch>`, and BuildKit records that id
// in each mount's description. Its layer cache ages out by BuildKit's GC.
// With `all`, the whole build cache goes, and dangling images (untagged
// build leftovers); tagged images stay, as rollbacks may need them.
func (b *Builder) ClearCache(ctx context.Context, p protocol.CacheClearPayload) (map[string]any, error) {
	if p.All {
		// Not while a build runs: it would lose its cache midway.
		b.mu.Lock()
		defer b.mu.Unlock()
		cache, err := sh.Run(ctx, "docker", "builder", "prune", "-af")
		if err != nil {
			return nil, err
		}
		images, err := sh.Run(ctx, "docker", "image", "prune", "-f")
		if err != nil {
			return nil, err
		}
		return map[string]any{
			"cache":  sh.Tail(strings.TrimSpace(cache), 200),
			"images": sh.Tail(strings.TrimSpace(images), 200),
		}, nil
	}
	if !isProjectID(p.Project) {
		return nil, errors.New("invalid project id")
	}
	out, err := sh.Run(ctx, "docker", "builder", "prune", "-f",
		"--filter", "type=exec.cachemount", "--filter", "description~="+p.Project+"-")
	if err != nil {
		return nil, err
	}
	return map[string]any{"pruned": sh.Tail(strings.TrimSpace(out), 200)}, nil
}

func isProjectID(s string) bool {
	if len(s) != 24 {
		return false
	}
	for _, c := range s {
		if !strings.ContainsRune("0123456789abcdef", c) {
			return false
		}
	}
	return true
}

func (b *Builder) pruneLogs() {
	matches, _ := filepath.Glob(filepath.Join(b.Dir, "*.log"))
	if len(matches) <= keepLogs {
		return
	}
	sort.Slice(matches, func(i, j int) bool {
		a, _ := os.Stat(matches[i])
		c, _ := os.Stat(matches[j])
		return a != nil && c != nil && a.ModTime().Before(c.ModTime())
	})
	for _, path := range matches[:len(matches)-keepLogs] {
		_ = os.Remove(path)
	}
}

func stream(ctx context.Context, log io.Writer, env []string, name string, args ...string) error {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Env = append(os.Environ(), env...)
	cmd.Stdout, cmd.Stderr = log, log
	return cmd.Run()
}

// redact hides credentials in a URL before it is logged.
func redact(url string) string {
	if at := strings.Index(url, "@"); at > 0 {
		if scheme := strings.Index(url, "://"); scheme > 0 && scheme < at {
			return url[:scheme+3] + "***" + url[at:]
		}
	}
	return url
}

func safe(s string) string {
	return strings.Map(func(r rune) rune {
		if r == '-' || r == '_' || ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') || ('0' <= r && r <= '9') {
			return r
		}
		return '_'
	}, s)
}

func orDefault(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}

func sortedKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for key := range m {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}
