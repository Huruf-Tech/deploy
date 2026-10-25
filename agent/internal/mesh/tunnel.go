package mesh

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/edge"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

const tunnelPrefix = "huruf-tunnel-"

// applyTunnels keeps one frpc container per control plane instance (PLAN
// §14): an outbound tunnel from the instance's tunnel port to the edge
// proxy's ingress listener, so no port is opened on this server. frps'
// certificate is checked against the CA from the spec.
func (m *Mesh) applyTunnels(ctx context.Context, spec *protocol.DesiredSpecIngress) error {
	wanted := map[string]bool{}
	var errs []string
	if spec != nil {
		for i, addr := range spec.Servers {
			name := tunnelPrefix + strconv.Itoa(i)
			wanted[name] = true
			if err := m.applyTunnel(ctx, name, addr, spec); err != nil {
				errs = append(errs, err.Error())
			}
		}
	}

	out, _ := run(ctx, "docker", "ps", "-a", "--filter", "label=deploy.huruf.role=tunnel", "--format", "{{.Names}}")
	for _, name := range strings.Fields(out) {
		if !wanted[name] {
			_, _ = run(ctx, "docker", "rm", "-f", name)
			_ = os.RemoveAll(filepath.Join(m.Dir, "tunnel", name))
		}
	}
	if len(errs) > 0 {
		return fmt.Errorf("tunnels: %s", strings.Join(errs, "; "))
	}
	return nil
}

func (m *Mesh) applyTunnel(ctx context.Context, name, addr string, spec *protocol.DesiredSpecIngress) error {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return fmt.Errorf("tunnel address %q: %w", addr, err)
	}
	config := FrpcConfig(host, port, spec)
	sum := sha256.Sum256([]byte(config + "\x00" + spec.Ca + "\x00" + spec.Image))
	fingerprint := hex.EncodeToString(sum[:8])
	state, err := run(ctx, "docker", "inspect", "-f", `{{index .Config.Labels "deploy.huruf.tunnel"}}`, name)
	if err == nil && strings.TrimSpace(state) == fingerprint {
		_, _ = run(ctx, "docker", "start", name) // no-op when running
		return nil
	}

	dir := filepath.Join(m.Dir, "tunnel", name)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "frpc.toml"), []byte(config), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "ca.pem"), []byte(spec.Ca), 0o644); err != nil {
		return err
	}
	_, _ = run(ctx, "docker", "rm", "-f", name)
	_, err = run(ctx, "docker", "run", "-d", "--name", name,
		"--restart", "unless-stopped",
		"--network", "host",
		"--label", "deploy.huruf.managed=true",
		"--label", "deploy.huruf.role=tunnel",
		"--label", "deploy.huruf.tunnel="+fingerprint,
		"-v", dir+":/etc/frp:ro",
		spec.Image, "-c", "/etc/frp/frpc.toml")
	if err != nil {
		return fmt.Errorf("starting tunnel to %s: %w", addr, err)
	}
	return nil
}

// FrpcConfig is the frpc.toml for one control plane instance. Logins retry
// forever: an instance that's down or restarting is reconnected to later.
func FrpcConfig(host, port string, spec *protocol.DesiredSpecIngress) string {
	_, local, _ := net.SplitHostPort(edge.IngressListen)
	return fmt.Sprintf(`serverAddr = %q
serverPort = %s
user = %q
metadatas.token = %q
loginFailExit = false
transport.tls.enable = true
transport.tls.trustedCaFile = "/etc/frp/ca.pem"
transport.tls.serverName = %q

[[proxies]]
name = "ingress"
type = "tcp"
localIP = "127.0.0.1"
localPort = %s
remotePort = %d
`, host, port, spec.User, spec.Token, spec.ServerName, local, spec.TunnelPort)
}
