// Package docker is the reconciler's container runtime, through the docker CLI
// (the same way host setup talks to Docker, so there is one dependency).
package docker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
)

// Images we build are tagged huruf/<project>:<release>-<sha>; only those are garbage-collected.
const builtImages = "huruf/*"

type Docker struct {
	// SecretsDir holds `file` variables on tmpfs (/run), one directory per container.
	SecretsDir string
	// DNS returns the resolver containers use for .internal names ("" = Docker's default).
	DNS func() string
	Log *slog.Logger
}

var _ reconcile.Runtime = (*Docker)(nil)

type inspected struct {
	ID     string                             `json:"Id"`
	Name   string                             `json:"Name"`
	Config struct{ Labels map[string]string } `json:"Config"`
	State  struct {
		Running   bool
		Status    string
		ExitCode  int
		StartedAt time.Time
		Health    *struct{ Status string }
	} `json:"State"`
	NetworkSettings struct {
		Networks map[string]struct{ IPAddress string }
	} `json:"NetworkSettings"`
}

func (i inspected) container() reconcile.Container {
	release, _ := strconv.ParseInt(i.Config.Labels[reconcile.LabelRelease], 10, 64)
	replica, _ := strconv.Atoi(i.Config.Labels[reconcile.LabelReplica])
	c := reconcile.Container{
		ID:       i.ID,
		Name:     strings.TrimPrefix(i.Name, "/"),
		Workload: i.Config.Labels[reconcile.LabelWorkload],
		Release:  release,
		Replica:  replica,
		Running:  i.State.Running,
	}
	for _, network := range i.NetworkSettings.Networks {
		if network.IPAddress != "" {
			c.IP = network.IPAddress
			break
		}
	}
	return c
}

func (d *Docker) inspect(ctx context.Context, ids ...string) ([]inspected, error) {
	out, err := run(ctx, nil, "docker", append([]string{"inspect"}, ids...)...)
	if err != nil {
		return nil, err
	}
	var list []inspected
	return list, json.Unmarshal([]byte(out), &list)
}

func (d *Docker) List(ctx context.Context) ([]reconcile.Container, error) {
	out, err := run(ctx, nil, "docker", "ps", "-aq", "--filter", "label="+reconcile.LabelWorkload)
	if err != nil {
		return nil, err
	}
	ids := strings.Fields(out)
	if len(ids) == 0 {
		return nil, nil
	}
	list, err := d.inspect(ctx, ids...)
	if err != nil {
		return nil, err
	}
	containers := make([]reconcile.Container, 0, len(list))
	for _, i := range list {
		containers = append(containers, i.container())
	}
	return containers, nil
}

func (d *Docker) Start(ctx context.Context, spec reconcile.ContainerSpec) (reconcile.Container, error) {
	rel := spec.Release
	_, _ = run(ctx, nil, "docker", "rm", "-f", spec.Name) // a leftover with the same name

	args := []string{
		"run", "-d", "--name", spec.Name,
		"--network", spec.Network,
		"--restart", "unless-stopped",
		"--init",
		"--label", "deploy.huruf.managed=true",
		"--label", reconcile.LabelProject + "=" + spec.Project,
		"--label", reconcile.LabelWorkload + "=" + spec.Workload,
		"--label", fmt.Sprintf("%s=%d", reconcile.LabelRelease, rel.Release),
		"--label", fmt.Sprintf("%s=%d", reconcile.LabelReplica, spec.Replica),
	}
	if d.DNS != nil {
		if dns := d.DNS(); dns != "" {
			args = append(args, "--dns", dns)
		}
	}
	if rel.Cpus != nil {
		args = append(args, "--cpus", strconv.FormatFloat(*rel.Cpus, 'f', -1, 64))
	}
	if rel.MemoryMb != nil {
		args = append(args, "--memory", fmt.Sprintf("%dm", *rel.MemoryMb))
	}
	for _, v := range rel.Volumes {
		args = append(args, "-v", v.Name+":"+v.MountPath)
	}
	if hc := rel.Healthcheck.Command; hc != "" {
		args = append(args, "--health-cmd", hc, "--health-interval", "5s",
			"--health-timeout", "5s", "--health-retries", "3", "--health-start-period", "10s")
	}

	// Values travel in the docker CLI's environment (`-e KEY`), so they never
	// appear in the process list. Keys the CLI itself reads go inline instead.
	var env []string
	for key, value := range rel.Env {
		if strings.HasPrefix(key, "DOCKER_") {
			args = append(args, "-e", key+"="+value)
			continue
		}
		args = append(args, "-e", key)
		env = append(env, key+"="+value)
	}

	if len(rel.Files) > 0 {
		dir, err := d.writeFiles(spec.Name, rel.Files)
		if err != nil {
			return reconcile.Container{}, err
		}
		args = append(args, "--mount", "type=bind,src="+dir+",dst=/run/secrets,readonly")
	}

	args = append(args, rel.Image)
	args = append(args, rel.Command...)
	id, err := run(ctx, env, "docker", args...)
	if err != nil {
		return reconcile.Container{}, err
	}
	list, err := d.inspect(ctx, strings.TrimSpace(id))
	if err != nil || len(list) == 0 {
		return reconcile.Container{}, fmt.Errorf("inspecting %s: %w", spec.Name, err)
	}
	return list[0].container(), nil
}

// writeFiles puts `file` variables under /run (tmpfs), so they never touch the
// disk. Readable inside the container by any user; the host directory is root-only.
func (d *Docker) writeFiles(name string, files map[string]string) (string, error) {
	if err := os.MkdirAll(d.SecretsDir, 0o700); err != nil {
		return "", err
	}
	dir := filepath.Join(d.SecretsDir, name)
	_ = os.RemoveAll(dir)
	if err := os.Mkdir(dir, 0o755); err != nil {
		return "", err
	}
	for key, value := range files {
		if err := os.WriteFile(filepath.Join(dir, key), []byte(value), 0o444); err != nil {
			return "", err
		}
	}
	return dir, nil
}

func (d *Docker) Remove(ctx context.Context, c reconcile.Container) error {
	// SIGTERM, then 10 s for in-flight work before SIGKILL.
	_, _ = run(ctx, nil, "docker", "stop", "-t", "10", c.ID)
	_, err := run(ctx, nil, "docker", "rm", "-f", c.ID)
	_ = os.RemoveAll(filepath.Join(d.SecretsDir, c.Name))
	if err != nil && strings.Contains(err.Error(), "No such container") {
		return nil
	}
	return err
}

func (d *Docker) EnsureImage(ctx context.Context, image string, pull *protocol.RegistryAuth) error {
	if _, err := run(ctx, nil, "docker", "image", "inspect", image); err == nil {
		return nil
	}
	if pull == nil {
		_, err := run(ctx, nil, "docker", "pull", image)
		return err
	}
	return WithLogin(ctx, *pull, func(config string) error {
		_, err := run(ctx, nil, "docker", "--config", config, "pull", image)
		return err
	})
}

// WithLogin runs fn with a throwaway Docker config logged in to the registry,
// so credentials never land in the host's ~/.docker.
func WithLogin(ctx context.Context, auth protocol.RegistryAuth, fn func(config string) error) error {
	config, err := os.MkdirTemp("", "huruf-docker-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(config)
	login := exec.CommandContext(ctx, "docker", "--config", config, "login", auth.Registry, "-u", auth.Username, "--password-stdin")
	login.Stdin = strings.NewReader(auth.Password)
	if out, err := login.CombinedOutput(); err != nil {
		return fmt.Errorf("registry login: %w: %s", err, strings.TrimSpace(string(out)))
	}
	return fn(config)
}

// WaitHealthy probes until the container serves (PLAN §10): its health
// command, an HTTP GET (any status below 500), a TCP connect, or, without a
// port, still running after a few seconds.
func (d *Docker) WaitHealthy(ctx context.Context, c reconcile.Container, rel protocol.WorkloadRelease) error {
	deadline := time.Now().Add(time.Duration(rel.Healthcheck.TimeoutSec) * time.Second)
	var last error
	for {
		list, err := d.inspect(ctx, c.ID)
		if err != nil || len(list) == 0 {
			return fmt.Errorf("container %s is gone", c.Name)
		}
		state := list[0].State
		if !state.Running {
			return fmt.Errorf("exited with code %d: %s", state.ExitCode, d.tail(ctx, c.ID))
		}
		last = probe(ctx, list[0], c.IP, rel)
		if last == nil {
			return nil
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("not healthy after %ds (%v): %s", rel.Healthcheck.TimeoutSec, last, d.tail(ctx, c.ID))
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Second):
		}
	}
}

func probe(ctx context.Context, i inspected, ip string, rel protocol.WorkloadRelease) error {
	hc := rel.Healthcheck
	switch {
	case hc.Command != "":
		if i.State.Health != nil && i.State.Health.Status == "healthy" {
			return nil
		}
		return errors.New("health check has not passed yet")
	case rel.Port == nil:
		if time.Since(i.State.StartedAt) >= 3*time.Second {
			return nil
		}
		return errors.New("starting")
	case hc.Path != "":
		ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("http://%s:%d%s", ip, *rel.Port, hc.Path), nil)
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		res.Body.Close()
		if res.StatusCode >= 500 {
			return fmt.Errorf("GET %s returned %d", hc.Path, res.StatusCode)
		}
		return nil
	default:
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, *rel.Port), 2*time.Second)
		if err == nil {
			conn.Close()
		}
		return err
	}
}

// tail is the container's last log lines, so a failed deploy says why.
func (d *Docker) tail(ctx context.Context, id string) string {
	out, _ := run(context.WithoutCancel(ctx), nil, "docker", "logs", "--tail", "15", id)
	out = strings.TrimSpace(out)
	if len(out) > 400 {
		out = "…" + out[len(out)-400:]
	}
	if out == "" {
		return "no output"
	}
	return out
}

func (d *Docker) RemoveUnusedImages(ctx context.Context, keep []string) error {
	out, err := run(ctx, nil, "docker", "images", "--filter", "reference="+builtImages, "--format", "{{.Repository}}:{{.Tag}}")
	if err != nil {
		return err
	}
	for _, image := range strings.Fields(out) {
		if !slices.Contains(keep, image) {
			// Fails harmlessly for images a container still uses.
			_, _ = run(ctx, nil, "docker", "rmi", image)
		}
	}
	return nil
}

// Gateway is the network's gateway address on the host (where the DNS server listens).
func Gateway(ctx context.Context, network string) (string, error) {
	out, err := run(ctx, nil, "docker", "network", "inspect", network, "-f", "{{range .IPAM.Config}}{{.Gateway}}{{end}}")
	return strings.TrimSpace(out), err
}

// run executes a command; `env` is added to the agent's environment.
func run(ctx context.Context, env []string, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	if env != nil {
		cmd.Env = append(os.Environ(), env...)
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		tail := strings.TrimSpace(string(out))
		if len(tail) > 300 {
			tail = "…" + tail[len(tail)-300:]
		}
		return string(out), fmt.Errorf("%s %s: %w: %s", name, firstArg(args), err, tail)
	}
	return string(out), nil
}

func firstArg(args []string) string {
	if len(args) == 0 {
		return ""
	}
	return args[0]
}
