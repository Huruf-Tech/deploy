package pool

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// A move between machines that can't reach each other directly (a NAT, no
// open port) goes through the control plane's tunnel server (frps, PLAN
// §14), as the ingress tunnels do: both machines connect out. The source
// serves a private (STCP) tunnel to its move port, which only a visitor with
// the move's token reaches; the target runs that visitor on a local port.
// The data stays encrypted with the move's key (seal.go), so frps only
// relays bytes it can't read.

// startRelay runs a frpc container for the move: the source's tunnel when
// visitorPort is 0, else the target's visitor on 127.0.0.1:visitorPort.
// stop removes it.
func startRelay(ctx context.Context, r *protocol.MoveRelay, secret string, visitorPort int) (stop func(), err error) {
	if r.Image == "" || !strings.HasPrefix(r.Proxy, "move-") {
		return nil, fmt.Errorf("invalid relay for the move")
	}
	if err := checkName(strings.TrimPrefix(r.Proxy, "move-")); err != nil {
		return nil, err
	}
	host, port, err := net.SplitHostPort(r.Server)
	if err != nil {
		return nil, fmt.Errorf("relay address %q: %w", r.Server, err)
	}
	name := "huruf-" + r.Proxy
	if visitorPort > 0 {
		name += "-visitor"
	}
	dir, err := os.MkdirTemp("", "huruf-relay-")
	if err != nil {
		return nil, err
	}
	stop = func() {
		_, _ = sh.Run(context.WithoutCancel(ctx), "docker", "rm", "-f", name)
		_ = os.RemoveAll(dir)
	}
	config := relayConfig(host, port, r, secret, visitorPort)
	if err := os.WriteFile(filepath.Join(dir, "frpc.toml"), []byte(config), 0o600); err != nil {
		stop()
		return nil, err
	}
	if err := os.WriteFile(filepath.Join(dir, "ca.pem"), []byte(r.Ca), 0o644); err != nil {
		stop()
		return nil, err
	}
	_, _ = sh.Run(ctx, "docker", "rm", "-f", name)
	if _, err := sh.Run(ctx, "docker", "run", "-d", "--name", name,
		"--network", "host",
		"--label", "deploy.huruf.managed=true",
		"-v", dir+":/etc/frp:ro",
		r.Image, "-c", "/etc/frp/frpc.toml"); err != nil {
		stop()
		return nil, fmt.Errorf("starting the move's tunnel: %w", err)
	}
	return stop, nil
}

func relayConfig(host, port string, r *protocol.MoveRelay, secret string, visitorPort int) string {
	config := fmt.Sprintf(`serverAddr = %q
serverPort = %s
user = %q
metadatas.token = %q
loginFailExit = false
transport.tls.enable = true
transport.tls.trustedCaFile = "/etc/frp/ca.pem"
transport.tls.serverName = %q
`, host, port, r.User, r.Token, r.ServerName)
	if visitorPort == 0 {
		return config + fmt.Sprintf(`
[[proxies]]
name = %q
type = "stcp"
secretKey = %q
localIP = "127.0.0.1"
localPort = %d
allowUsers = [%q]
`, r.Proxy, secret, MovePort, r.Peer)
	}
	return config + fmt.Sprintf(`
[[visitors]]
name = %q
type = "stcp"
serverUser = %q
serverName = %q
secretKey = %q
bindAddr = "127.0.0.1"
bindPort = %d
`, r.Proxy+"-visitor", r.Peer, r.Proxy, secret, visitorPort)
}

// MovePort is where a source serves a moving partition (`MOVE_PORT`).
const MovePort = 51830

// freePort is a local TCP port nothing listens on right now.
func freePort() (int, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer ln.Close()
	_, port, _ := net.SplitHostPort(ln.Addr().String())
	return strconv.Atoi(port)
}
