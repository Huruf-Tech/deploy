// Package dockerhost prepares a server for workloads (PLAN §16 Phase 2):
// Docker installed and configured, the project network, and the edge proxy.
// Every step checks before it acts, so Ensure is safe to run any number of times.
package dockerhost

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

const (
	daemonConfigPath = "/etc/docker/daemon.json"
	edgeContainer    = "huruf-edge"
	labelPrefix      = "deploy.huruf."
)

// Payload is decided by the control plane, so changing a limit never needs an agent release.
type Payload struct {
	LogMaxSize string `json:"logMaxSize"`
	LogMaxFile int    `json:"logMaxFile"`
	EdgeImage  string `json:"edgeImage"`
	Network    string `json:"network"`
}

type Check struct {
	Name   string `json:"name"`
	Ok     bool   `json:"ok"`
	Detail string `json:"detail"`
}

// One setup at a time: a re-issued command waits for the running one.
var mu sync.Mutex

// Ensure runs every step and reports the Docker version and the preflight checks.
func Ensure(ctx context.Context, p Payload) (map[string]any, error) {
	mu.Lock()
	defer mu.Unlock()

	checks := Preflight()
	notes := []string{}
	result := func() map[string]any {
		return map[string]any{"dockerVersion": dockerVersion(ctx), "checks": checks, "notes": notes}
	}

	if _, err := exec.LookPath("docker"); err != nil {
		install, cancel := context.WithTimeout(ctx, 15*time.Minute)
		defer cancel()
		if _, err := run(install, "sh", "-c", "curl -fsSL https://get.docker.com | sh"); err != nil {
			return result(), fmt.Errorf("installing Docker: %w", err)
		}
		notes = append(notes, "Docker installed")
	}

	existing, err := os.ReadFile(daemonConfigPath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return result(), err
	}
	merged, changed, err := MergeDaemonConfig(existing, p)
	if err != nil {
		return result(), fmt.Errorf("%s is not valid JSON: %w", daemonConfigPath, err)
	}
	if changed {
		if err := os.MkdirAll("/etc/docker", 0o755); err != nil {
			return result(), err
		}
		if err := os.WriteFile(daemonConfigPath, merged, 0o644); err != nil {
			return result(), err
		}
	}

	if _, err := run(ctx, "systemctl", "enable", "--now", "docker"); err != nil {
		return result(), fmt.Errorf("starting Docker: %w", err)
	}
	if changed {
		// Restarting Docker stops containers that were started without live-restore,
		// so a busy host gets the new settings on its next Docker restart instead.
		if out, _ := run(ctx, "docker", "ps", "-q"); strings.TrimSpace(out) == "" {
			if _, err := run(ctx, "systemctl", "restart", "docker"); err != nil {
				return result(), fmt.Errorf("restarting Docker: %w", err)
			}
		} else {
			notes = append(notes, "Docker settings apply on the next Docker restart")
		}
	}
	if err := waitForDocker(ctx); err != nil {
		return result(), err
	}

	if _, err := run(ctx, "docker", "network", "inspect", p.Network); err != nil {
		if _, err := run(ctx, "docker", "network", "create", "--label", labelPrefix+"managed=true", p.Network); err != nil {
			return result(), fmt.Errorf("creating network %s: %w", p.Network, err)
		}
	}

	if err := ensureEdge(ctx, p.EdgeImage); err != nil {
		return result(), err
	}
	return result(), nil
}

// MergeDaemonConfig sets the keys we manage and keeps every other key the user has.
func MergeDaemonConfig(existing []byte, p Payload) (merged []byte, changed bool, err error) {
	config := map[string]any{}
	if len(bytes.TrimSpace(existing)) > 0 {
		if err := json.Unmarshal(existing, &config); err != nil {
			return nil, false, err
		}
	}
	before, _ := json.Marshal(config)

	config["log-driver"] = "local"
	config["log-opts"] = map[string]any{"max-size": p.LogMaxSize, "max-file": strconv.Itoa(p.LogMaxFile)}
	// Containers keep running while the Docker daemon restarts or upgrades.
	config["live-restore"] = true

	after, _ := json.Marshal(config)
	if bytes.Equal(before, after) {
		return existing, false, nil
	}
	merged, err = json.MarshalIndent(config, "", "  ")
	return append(merged, '\n'), true, err
}

// ensureEdge keeps the Caddy edge proxy running. It starts with no sites; the
// agent configures routes through Caddy's admin API on 127.0.0.1:2019.
func ensureEdge(ctx context.Context, image string) error {
	state, err := run(ctx, "docker", "inspect", "-f", "{{.State.Running}}", edgeContainer)
	switch {
	case err == nil && strings.TrimSpace(state) == "true":
		return nil
	case err == nil:
		_, err = run(ctx, "docker", "start", edgeContainer)
	default:
		_, err = run(ctx, "docker", "run", "-d",
			"--name", edgeContainer,
			"--restart", "unless-stopped",
			"--network", "host",
			"--label", labelPrefix+"managed=true",
			"--label", labelPrefix+"role=edge",
			"-v", "huruf-edge-data:/data",
			"-v", "huruf-edge-config:/config",
			image, "caddy", "run", "--resume")
	}
	if err != nil {
		return fmt.Errorf("starting the edge proxy: %w", err)
	}
	return nil
}

func waitForDocker(ctx context.Context) error {
	deadline := time.Now().Add(60 * time.Second)
	for {
		if _, err := run(ctx, "docker", "info", "--format", "{{.ServerVersion}}"); err == nil {
			return nil
		}
		if time.Now().After(deadline) {
			return errors.New("Docker did not become ready within 60s")
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
}

func dockerVersion(ctx context.Context) string {
	out, err := run(ctx, "docker", "version", "--format", "{{.Server.Version}}")
	if err != nil {
		return ""
	}
	return strings.TrimSpace(out)
}

func run(ctx context.Context, name string, args ...string) (string, error) {
	out, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		tail := strings.TrimSpace(string(out))
		if len(tail) > 300 {
			tail = "…" + tail[len(tail)-300:]
		}
		return string(out), fmt.Errorf("%s: %w: %s", name, err, tail)
	}
	return string(out), nil
}

// Preflight reports host properties that affect workloads. They are warnings
// shown in the dashboard; none of them blocks setup.
func Preflight() []Check {
	release := osRelease()
	supported := release["ID"] == "ubuntu" &&
		(release["VERSION_ID"] == "22.04" || release["VERSION_ID"] == "24.04")
	checks := []Check{{
		Name:   "os",
		Ok:     supported,
		Detail: strings.TrimSpace(release["PRETTY_NAME"] + " (supported: Ubuntu 22.04, 24.04)"),
	}}

	memory := memTotal()
	checks = append(checks, Check{
		Name: "memory", Ok: memory >= 1<<30,
		Detail: fmt.Sprintf("%.1f GiB (at least 1 GiB)", float64(memory)/(1<<30)),
	})

	var st syscall.Statfs_t
	free := uint64(0)
	if syscall.Statfs("/", &st) == nil {
		free = st.Bavail * uint64(st.Bsize)
	}
	checks = append(checks, Check{
		Name: "disk", Ok: free >= 10<<30,
		Detail: fmt.Sprintf("%.1f GiB free (at least 10 GiB)", float64(free)/(1<<30)),
	})

	_, cgroupErr := os.Stat("/sys/fs/cgroup/cgroup.controllers")
	checks = append(checks, Check{
		Name: "cgroup v2", Ok: cgroupErr == nil,
		Detail: map[bool]string{true: "available", false: "not found (resource limits may not apply)"}[cgroupErr == nil],
	})
	return checks
}

func osRelease() map[string]string {
	values := map[string]string{}
	f, err := os.Open("/etc/os-release")
	if err != nil {
		return values
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		if key, value, ok := strings.Cut(scanner.Text(), "="); ok {
			values[key] = strings.Trim(value, `"`)
		}
	}
	return values
}

func memTotal() uint64 {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(data), "\n") {
		if fields := strings.Fields(line); len(fields) >= 2 && fields[0] == "MemTotal:" {
			kb, _ := strconv.ParseUint(fields[1], 10, 64)
			return kb * 1024
		}
	}
	return 0
}
