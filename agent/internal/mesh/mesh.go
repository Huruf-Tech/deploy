// Package mesh runs the optional private network (PLAN §8.2): a WireGuard
// interface whose peers are the tenant's other servers, with a route to each
// peer's container subnet, so containers reach containers on other servers.
// Reachability comes from WireGuard handshakes: a server behind NAT still
// reaches public peers (it dials out), but two NAT'd servers can't meet.
// It also runs the tenant's built-in registry on the primary server.
package mesh

import (
	"context"
	"crypto/ecdh"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

const (
	Interface = "wg0"
	// A handshake this recent means the pair can talk.
	handshakeFresh = 3 * time.Minute
	keepalive      = "25"
	registryName   = "huruf-registry"
)

type Mesh struct {
	Dir string // state directory: a key from before KeyDir existed is moved from here
	// KeyDir holds the WireGuard key; /etc/wireguard when empty. Ubuntu 25.04+
	// confines `wg` with AppArmor to reading keys under /etc/wireguard only.
	KeyDir string
	Log    *slog.Logger
	Emit   func(protocol.MeshStatusEvent)

	// collect frees deleted images' space; tests replace it.
	collect func(context.Context) error

	mu       sync.Mutex
	last     *protocol.DesiredSpec // retried while it fails
	spec     *protocol.MeshSpec
	registry *protocol.DesiredSpecRegistry
	reported map[string]bool
	sentAt   time.Time
	lastErr  string
}

// PublicKey is this server's WireGuard public key, creating the key pair on first use.
func (m *Mesh) PublicKey() (string, error) {
	private, err := m.privateKey()
	if err != nil {
		return "", err
	}
	key, err := ecdh.X25519().NewPrivateKey(private)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key.PublicKey().Bytes()), nil
}

func (m *Mesh) keyPath() string {
	dir := m.KeyDir
	if dir == "" {
		dir = "/etc/wireguard"
	}
	return filepath.Join(dir, "huruf-deploy.key")
}

func (m *Mesh) privateKey() ([]byte, error) {
	raw, err := os.ReadFile(m.keyPath())
	if errors.Is(err, os.ErrNotExist) {
		// The key used to live in the state directory: keep it, so the public
		// key (and every peer's config) stays the same.
		raw, err = os.ReadFile(filepath.Join(m.Dir, "wireguard.key"))
		if err == nil {
			if err := m.saveKey(raw); err != nil {
				return nil, err
			}
		}
	}
	if err == nil {
		return base64.StdEncoding.DecodeString(strings.TrimSpace(string(raw)))
	}
	if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	key, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	encoded := base64.StdEncoding.EncodeToString(key.Bytes())
	return key.Bytes(), m.saveKey([]byte(encoded + "\n"))
}

func (m *Mesh) saveKey(raw []byte) error {
	if err := os.MkdirAll(filepath.Dir(m.keyPath()), 0o700); err != nil {
		return err
	}
	return os.WriteFile(m.keyPath(), raw, 0o600)
}

// Apply makes the interface, peers, routes and registry match the spec. A nil
// mesh tears the interface down.
func (m *Mesh) Apply(ctx context.Context, spec protocol.DesiredSpec) error {
	m.mu.Lock()
	m.last, m.spec, m.registry = &spec, spec.Mesh, spec.Registry
	m.mu.Unlock()

	err := m.applyMesh(ctx, spec.Mesh)
	if err == nil {
		err = m.applyRegistry(ctx, spec.Registry)
	}
	m.mu.Lock()
	m.lastErr = ""
	if err != nil {
		m.lastErr = err.Error()
	}
	m.mu.Unlock()
	if err != nil {
		m.Log.Warn("private network setup failed", "error", err)
	}
	m.report(true)
	return err
}

func (m *Mesh) applyMesh(ctx context.Context, spec *protocol.MeshSpec) error {
	_, exists := run(ctx, "ip", "link", "show", Interface)
	if spec == nil {
		if exists == nil {
			_, _ = run(ctx, "ip", "link", "del", Interface)
		}
		forwardRules(ctx, "-D")
		return nil
	}
	if _, err := exec.LookPath("wg"); err != nil {
		return errors.New("wireguard-tools isn't installed; run host setup again")
	}
	if exists != nil {
		if _, err := run(ctx, "ip", "link", "add", Interface, "type", "wireguard"); err != nil {
			return fmt.Errorf("creating %s (does the kernel have WireGuard?): %w", Interface, err)
		}
	}
	if _, err := m.privateKey(); err != nil {
		return err
	}
	if _, err := run(ctx, "wg", "set", Interface, "private-key", m.keyPath(), "listen-port", strconv.FormatInt(spec.ListenPort, 10)); err != nil {
		return err
	}

	wanted := map[string]bool{}
	for _, peer := range spec.Peers {
		wanted[peer.PublicKey] = true
		args := []string{"set", Interface, "peer", peer.PublicKey,
			"allowed-ips", peer.MeshIp + "/32," + peer.Subnet,
			"persistent-keepalive", keepalive}
		if peer.Endpoint != "" {
			args = append(args, "endpoint", peer.Endpoint)
		}
		if _, err := run(ctx, "wg", args...); err != nil {
			return fmt.Errorf("peer %s: %w", peer.Server, err)
		}
	}
	current, _ := run(ctx, "wg", "show", Interface, "peers")
	for _, key := range strings.Fields(current) {
		if !wanted[key] {
			_, _ = run(ctx, "wg", "set", Interface, "peer", key, "remove")
		}
	}

	if _, err := run(ctx, "ip", "address", "replace", spec.Address, "dev", Interface); err != nil {
		return err
	}
	if _, err := run(ctx, "ip", "link", "set", Interface, "up"); err != nil {
		return err
	}

	// A route per peer container subnet; stale ones go.
	routes := map[string]bool{}
	for _, peer := range spec.Peers {
		routes[peer.Subnet] = true
		if _, err := run(ctx, "ip", "route", "replace", peer.Subnet, "dev", Interface); err != nil {
			return err
		}
	}
	table, _ := run(ctx, "ip", "route", "show", "dev", Interface)
	for _, line := range strings.Split(table, "\n") {
		fields := strings.Fields(line)
		if len(fields) > 0 && strings.Contains(fields[0], "/") && !routes[fields[0]] && fields[0] != prefixOf(spec.Address) {
			_, _ = run(ctx, "ip", "route", "del", fields[0], "dev", Interface)
		}
	}

	forwardRules(ctx, "-I")
	return nil
}

// forwardRules lets mesh traffic through Docker's forwarding filter (the
// DOCKER-USER chain is where Docker expects such rules). `-D` removes them.
func forwardRules(ctx context.Context, action string) {
	for _, dir := range []string{"-i", "-o"} {
		rule := []string{"DOCKER-USER", dir, Interface, "-j", "ACCEPT"}
		_, missing := run(ctx, "iptables", append([]string{"-C"}, rule...)...)
		switch {
		case action == "-I" && missing != nil:
			_, _ = run(ctx, "iptables", append([]string{"-I"}, rule...)...)
		case action == "-D" && missing == nil:
			_, _ = run(ctx, "iptables", append([]string{"-D"}, rule...)...)
		}
	}
}

// prefixOf turns 10.209.0.3/16 into the connected route 10.209.0.0/16.
func prefixOf(address string) string {
	ip, bits, ok := strings.Cut(address, "/")
	if !ok || bits != "16" {
		return address
	}
	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return address
	}
	return parts[0] + "." + parts[1] + ".0.0/16"
}

// applyRegistry runs the registry on the primary server, bound to its mesh
// address only, with basic auth (PLAN §8.4).
func (m *Mesh) applyRegistry(ctx context.Context, spec *protocol.DesiredSpecRegistry) error {
	state, err := run(ctx, "docker", "inspect", "-f", `{{index .Config.Labels "deploy.huruf.registry"}}`, registryName)
	if spec == nil {
		if err == nil {
			_, _ = run(ctx, "docker", "rm", "-f", registryName)
		}
		return nil
	}

	sum := sha256.Sum256([]byte(spec.Listen + "\x00" + spec.Username + "\x00" + spec.Password + "\x00" + spec.Image))
	fingerprint := hex.EncodeToString(sum[:8])
	if err == nil && strings.TrimSpace(state) == fingerprint {
		_, _ = run(ctx, "docker", "start", registryName) // no-op when running
		return nil
	}

	hash, err := run(ctx, "docker", "exec", "huruf-edge", "caddy", "hash-password", "--plaintext", spec.Password)
	if err != nil {
		return fmt.Errorf("hashing the registry password: %w", err)
	}
	dir := filepath.Join(m.Dir, "registry")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	line := spec.Username + ":" + strings.TrimSpace(hash) + "\n"
	if err := os.WriteFile(filepath.Join(dir, "htpasswd"), []byte(line), 0o644); err != nil {
		return err
	}

	_, _ = run(ctx, "docker", "rm", "-f", registryName)
	_, err = run(ctx, "docker", "run", "-d", "--name", registryName,
		"--restart", "unless-stopped",
		"--label", "deploy.huruf.managed=true",
		"--label", "deploy.huruf.registry="+fingerprint,
		"-p", spec.Listen+":5000",
		"-v", "huruf-registry-data:/var/lib/registry",
		"-v", dir+":/auth:ro",
		"-e", "REGISTRY_AUTH=htpasswd",
		"-e", "REGISTRY_AUTH_HTPASSWD_REALM=huruf",
		"-e", "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd",
		"-e", "REGISTRY_STORAGE_DELETE_ENABLED=true",
		spec.Image)
	if err != nil {
		return fmt.Errorf("starting the registry: %w", err)
	}
	return nil
}

// Run reports reachability every interval, and whenever it changes.
func (m *Mesh) Run(ctx context.Context, interval func() time.Duration) {
	m.report(true) // the control plane learns the public key on start
	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(interval()):
			m.mu.Lock()
			retry := m.lastErr != "" && m.last != nil
			last := m.last
			m.mu.Unlock()
			if retry {
				_ = m.Apply(ctx, *last) // e.g. wireguard-tools arrived with host setup
				continue
			}
			// The registry container can vanish (a prune, a failed Docker
			// restart); applyRegistry is a no-op `docker start` while it exists.
			if last != nil && last.Registry != nil {
				if err := m.applyRegistry(ctx, last.Registry); err != nil {
					m.mu.Lock()
					m.lastErr = err.Error()
					m.mu.Unlock()
				}
			}
			m.report(false)
		}
	}
}

// report emits a status when the reachability changed, or every 10 minutes.
func (m *Mesh) report(force bool) {
	key, err := m.PublicKey()
	if err != nil {
		m.Log.Warn("no WireGuard key", "error", err)
		return
	}
	m.mu.Lock()
	spec, lastErr := m.spec, m.lastErr
	m.mu.Unlock()

	peers := map[string]bool{}
	if spec != nil {
		handshakes := latestHandshakes(context.Background())
		for _, peer := range spec.Peers {
			at, ok := handshakes[peer.PublicKey]
			peers[peer.Server] = ok && time.Since(at) < handshakeFresh
		}
	}

	m.mu.Lock()
	changed := !maps.Equal(peers, m.reported)
	due := force || changed || time.Since(m.sentAt) > 10*time.Minute
	if due {
		m.reported, m.sentAt = peers, time.Now()
	}
	m.mu.Unlock()
	if !due || m.Emit == nil {
		return
	}
	event := protocol.MeshStatusEvent{
		Id:   fmt.Sprintf("mesh-%d", time.Now().UnixNano()),
		Type: "mesh.status",
		Data: protocol.MeshStatusEventData{PublicKey: key, Peers: peers},
	}
	if lastErr != "" {
		event.Data.Error = truncate(lastErr, 500)
	}
	m.Emit(event)
}

// latestHandshakes reads `wg show wg0 latest-handshakes` (public key → time).
func latestHandshakes(ctx context.Context) map[string]time.Time {
	out, err := run(ctx, "wg", "show", Interface, "latest-handshakes")
	result := map[string]time.Time{}
	if err != nil {
		return result
	}
	for _, line := range strings.Split(out, "\n") {
		fields := strings.Fields(line)
		if len(fields) != 2 {
			continue
		}
		if unix, err := strconv.ParseInt(fields[1], 10, 64); err == nil && unix > 0 {
			result[fields[0]] = time.Unix(unix, 0)
		}
	}
	return result
}

// PeerAddresses are the mesh IPs of reachable peers (DNS asks them for
// .internal names). Unreachable ones are skipped, so they cost lookups no
// timeout; until the first report, every peer is tried.
func (m *Mesh) PeerAddresses() []string {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.spec == nil {
		return nil
	}
	ips := make([]string, 0, len(m.spec.Peers))
	for _, peer := range m.spec.Peers {
		if reachable, known := m.reported[peer.Server]; !known || reachable {
			ips = append(ips, peer.MeshIp)
		}
	}
	return ips
}

// Address is this server's mesh IP, or "" outside the mesh.
func (m *Mesh) Address() string {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.spec == nil {
		return ""
	}
	ip, _, _ := strings.Cut(m.spec.Address, "/")
	return ip
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-1] + "…"
}

func run(ctx context.Context, name string, args ...string) (string, error) {
	out, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("%s %s: %w: %s", name, strings.Join(args[:min(2, len(args))], " "), err, truncate(strings.TrimSpace(string(out)), 300))
	}
	return string(out), nil
}
