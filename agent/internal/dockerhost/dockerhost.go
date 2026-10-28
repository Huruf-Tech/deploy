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
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/cgroup"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/daemonjson"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

const (
	edgeContainer = "huruf-edge"
	labelPrefix   = "deploy.huruf."
)

// Payload is decided by the control plane, so changing a limit never needs an agent release.
type Payload struct {
	LogMaxSize string `json:"logMaxSize"`
	LogMaxFile int    `json:"logMaxFile"`
	EdgeImage  string `json:"edgeImage"`
	Network    string `json:"network"`
	Subnet     string `json:"subnet,omitempty"`
	MeshCidr   string `json:"meshCidr,omitempty"`
	// Set by Ensure, not the control plane: the host is a Docker Swarm node.
	Swarm bool `json:"-"`
}

// swarmState exists while the node is in a swarm, even when Docker is down.
const swarmState = "/var/lib/docker/swarm/state.json"

// The mesh interface; traffic from it may reach containers directly (Docker 28+
// otherwise drops routed traffic to unpublished container ports).
const meshInterface = "wg0"

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
	// A step that hangs (a stuck docker call) must end as a failure the
	// dashboard shows, not "Preparing…" forever; installing Docker takes ≤15 min.
	ctx, cancel := context.WithTimeout(ctx, 20*time.Minute)
	defer cancel()

	checks := Preflight()
	notes := []string{}
	result := func() map[string]any {
		return map[string]any{"dockerVersion": dockerVersion(ctx), "checks": checks, "notes": notes}
	}

	if installed, err := InstallDocker(ctx); err != nil {
		return result(), err
	} else if installed {
		notes = append(notes, "Docker installed")
	}

	if p.MeshCidr != "" {
		if note := ensureWireGuardTools(ctx); note != "" {
			notes = append(notes, note)
		}
	}

	existing, err := os.ReadFile(daemonjson.Path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return result(), err
	}
	// Docker refuses to start in swarm mode with live-restore on (e.g. Dokploy hosts).
	_, statErr := os.Stat(swarmState)
	p.Swarm = statErr == nil
	// With live-restore already on, restarting Docker keeps containers running.
	liveRestore := !p.Swarm && bytes.Contains(existing, []byte(`"live-restore": true`))
	merged, changed, err := MergeDaemonConfig(existing, p)
	if err != nil {
		return result(), err
	}
	if changed {
		if err := os.MkdirAll("/etc/docker", 0o755); err != nil {
			return result(), err
		}
		if err := os.WriteFile(daemonjson.Path, merged, 0o644); err != nil {
			return result(), err
		}
	}

	if _, err := sh.Run(ctx, "systemctl", "enable", "--now", "docker"); err != nil {
		return result(), fmt.Errorf("starting Docker: %w", err)
	}
	// The file can be right while the running Docker still predates it (an
	// older agent wrote it but skipped the restart on a busy host): apply it then too.
	stale := !changed && p.MeshCidr != "" && !trustsRegistry(ctx, p.MeshCidr)
	if changed || stale {
		// Restarting Docker stops containers that were started without
		// live-restore. On such a busy host, a reload (SIGHUP) applies what can
		// change live: live-restore and the mesh's insecure registry, which the
		// built-in registry needs. Log limits wait for the next restart.
		if out, _ := sh.Run(ctx, "docker", "ps", "-q"); liveRestore || strings.TrimSpace(out) == "" {
			if _, err := sh.Run(ctx, "systemctl", "restart", "docker"); err != nil {
				// Never leave Docker down over our settings: put the old file back.
				if changed {
					if existing == nil {
						_ = os.Remove(daemonjson.Path)
					} else {
						_ = os.WriteFile(daemonjson.Path, existing, 0o644)
					}
					if _, again := sh.Run(ctx, "systemctl", "restart", "docker"); again == nil {
						return result(), fmt.Errorf("docker didn't start with the new settings, so %s was restored: %w", daemonjson.Path, err)
					}
				}
				return result(), fmt.Errorf("restarting Docker: %w", err)
			}
		} else if _, err := sh.Run(ctx, "systemctl", "reload", "docker"); err == nil {
			notes = append(notes, "Docker settings reloaded; log limits apply on the next Docker restart")
		} else {
			notes = append(notes, "Docker settings apply on the next Docker restart")
		}
	}
	if err := waitForDocker(ctx); err != nil {
		return result(), err
	}

	// The built-in registry is plain HTTP over the (encrypted) mesh: Docker
	// must trust the mesh range, or every pull from it fails.
	if p.MeshCidr != "" && !trustsRegistry(ctx, p.MeshCidr) {
		notes = append(notes, fmt.Sprintf(
			"Docker doesn't trust %s yet, so pulls from the built-in registry fail. Is Docker installed as a snap? It ignores %s; use Docker from get.docker.com.",
			p.MeshCidr, daemonjson.Path))
	}

	if note, err := ensureNetwork(ctx, p); err != nil {
		return result(), err
	} else if note != "" {
		notes = append(notes, note)
	}

	if err := ensureEdge(ctx, p.EdgeImage); err != nil {
		return result(), err
	}
	return result(), nil
}

// MergeDaemonConfig sets the keys we manage and keeps every other key the user has.
func MergeDaemonConfig(existing []byte, p Payload) (merged []byte, changed bool, err error) {
	config, err := daemonjson.Parse(existing)
	if err != nil {
		return nil, false, err
	}
	before, _ := json.Marshal(config)

	config["log-driver"] = "local"
	config["log-opts"] = map[string]any{"max-size": p.LogMaxSize, "max-file": strconv.Itoa(p.LogMaxFile)}
	// Containers keep running while the Docker daemon restarts or upgrades;
	// swarm mode refuses it, so Docker wouldn't start at all.
	if p.Swarm {
		delete(config, "live-restore")
	} else {
		config["live-restore"] = true
	}
	// The built-in registry speaks plain HTTP over the WireGuard-encrypted mesh.
	if p.MeshCidr != "" {
		registries, _ := config["insecure-registries"].([]any)
		if !slices.Contains(registries, any(p.MeshCidr)) {
			config["insecure-registries"] = append(registries, p.MeshCidr)
		}
	}

	after, _ := json.Marshal(config)
	if bytes.Equal(before, after) {
		return existing, false, nil
	}
	return daemonjson.Encode(config), true, nil
}

// InstallDocker installs Docker from get.docker.com when the machine has
// none; it reports whether it did.
func InstallDocker(ctx context.Context) (bool, error) {
	if _, err := exec.LookPath("docker"); err == nil {
		return false, nil
	}
	install, cancel := context.WithTimeout(ctx, 15*time.Minute)
	defer cancel()
	if _, err := sh.Run(install, "sh", "-c", "curl -fsSL https://get.docker.com | sh"); err != nil {
		return false, fmt.Errorf("installing Docker: %w", err)
	}
	return true, nil
}

// ensureNetwork creates the project network with the tenant-unique subnet.
// One with another subnet is recreated while empty; otherwise it's reported,
// since moving running containers would interrupt them.
func ensureNetwork(ctx context.Context, p Payload) (note string, err error) {
	out, inspectErr := sh.Run(ctx, "docker", "network", "inspect", "-f",
		`{{range .IPAM.Config}}{{.Subnet}}{{end}} {{len .Containers}}`, p.Network)
	if inspectErr == nil {
		fields := strings.Fields(out)
		if p.Subnet == "" || (len(fields) == 2 && fields[0] == p.Subnet) {
			return "", nil
		}
		if len(fields) == 2 && fields[1] != "0" {
			return fmt.Sprintf("The project network uses %s, not %s; it moves once its containers are gone", fields[0], p.Subnet), nil
		}
		if _, err := sh.Run(ctx, "docker", "network", "rm", p.Network); err != nil {
			return "", fmt.Errorf("replacing network %s: %w", p.Network, err)
		}
	}

	args := []string{"network", "create", "--label", labelPrefix + "managed=true"}
	if p.Subnet != "" {
		args = append(args, "--subnet", p.Subnet)
	}
	withMesh := append(slices.Clone(args), "-o", "com.docker.network.bridge.trusted_host_interfaces="+meshInterface, p.Network)
	if _, err := sh.Run(ctx, "docker", withMesh...); err == nil {
		return "", nil
	}
	// Docker before 28 has no such option, and no filter for it to lift.
	if _, err := sh.Run(ctx, "docker", append(args, p.Network)...); err != nil {
		return "", fmt.Errorf("creating network %s: %w", p.Network, err)
	}
	return "", nil
}

// ensureWireGuardTools installs `wg` and `ip` (the kernel module ships with Linux 5.6+).
func ensureWireGuardTools(ctx context.Context) string {
	_, wgErr := exec.LookPath("wg")
	_, ipErr := exec.LookPath("ip")
	if wgErr == nil && ipErr == nil {
		return ""
	}
	if _, err := exec.LookPath("apt-get"); err != nil {
		return "Install wireguard-tools to join the private network"
	}
	install, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	if _, err := sh.Run(install, "sh", "-c", "DEBIAN_FRONTEND=noninteractive apt-get install -y wireguard-tools iproute2 || (apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y wireguard-tools iproute2)"); err != nil {
		return "Installing wireguard-tools failed: " + err.Error()
	}
	return "wireguard-tools installed"
}

// ensureEdge keeps the Caddy edge proxy running. It starts with no sites; the
// agent configures routes through Caddy's admin API on 127.0.0.1:2019.
func ensureEdge(ctx context.Context, image string) error {
	state, err := sh.Run(ctx, "docker", "inspect", "-f", "{{.State.Running}}", edgeContainer)
	switch {
	case err == nil && strings.TrimSpace(state) == "true":
		return nil
	case err == nil:
		_, err = sh.Run(ctx, "docker", "start", edgeContainer)
	default:
		_, err = sh.Run(ctx, "docker", "run", "-d",
			"--name", edgeContainer,
			"--restart", "unless-stopped",
			"--init", // reaps orphans, e.g. processes left by closed shells
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

// trustsRegistry reports whether the running Docker treats cidr as an
// insecure (HTTP) registry range.
func trustsRegistry(ctx context.Context, cidr string) bool {
	out, err := sh.Run(ctx, "docker", "info", "--format", "{{json .RegistryConfig.InsecureRegistryCIDRs}}")
	return err == nil && strings.Contains(out, `"`+cidr+`"`)
}

func waitForDocker(ctx context.Context) error {
	deadline := time.Now().Add(60 * time.Second)
	for {
		if _, err := sh.Run(ctx, "docker", "info", "--format", "{{.ServerVersion}}"); err == nil {
			return nil
		}
		if time.Now().After(deadline) {
			return errors.New("docker did not become ready within 60s")
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
}

func dockerVersion(ctx context.Context) string {
	out, err := sh.Run(ctx, "docker", "version", "--format", "{{.Server.Version}}")
	if err != nil {
		return ""
	}
	return strings.TrimSpace(out)
}

// Preflight reports host properties that affect workloads. They are warnings
// shown in the dashboard; none of them blocks setup.
func Preflight() []Check {
	release := osRelease()
	// VERSION_ID is "YY.MM", so string order is version order.
	supported := release["ID"] == "ubuntu" && release["VERSION_ID"] >= "22.04"
	checks := []Check{{
		Name:   "os",
		Ok:     supported,
		Detail: strings.TrimSpace(release["PRETTY_NAME"] + " (supported: Ubuntu 22.04 or newer)"),
	}}

	// In a partition (PLAN §27, §28) these are its own limits, never the
	// machine's: a renter sees what they rented, and its size is no fault.
	partition := cgroup.MemoryMax() > 0 || cgroup.CPUs() > 0
	memory := host.Memory()
	checks = append(checks, Check{
		Name: "memory", Ok: partition || memory >= 1<<30,
		Detail: map[bool]string{
			true:  fmt.Sprintf("%.1f GiB", float64(memory)/(1<<30)),
			false: fmt.Sprintf("%.1f GiB (at least 1 GiB)", float64(memory)/(1<<30)),
		}[partition],
	})

	_, free := host.DataDisk()
	checks = append(checks, Check{
		Name: "disk", Ok: partition || free >= 10<<30,
		Detail: map[bool]string{
			true:  fmt.Sprintf("%.1f GiB free", float64(free)/(1<<30)),
			false: fmt.Sprintf("%.1f GiB free (at least 10 GiB)", float64(free)/(1<<30)),
		}[partition],
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

