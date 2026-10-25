package mesh

import (
	"strings"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestFrpcConfigTunnelsTheIngressListener(t *testing.T) {
	config := FrpcConfig("203.0.113.10", "7000", &protocol.DesiredSpecIngress{
		User: "srv1", Token: "tok", TunnelPort: 20001, ServerName: "huruf-tunnel",
	})
	for _, want := range []string{
		`serverAddr = "203.0.113.10"`, "serverPort = 7000", `user = "srv1"`,
		`metadatas.token = "tok"`, "transport.tls.enable = true",
		`transport.tls.trustedCaFile = "/etc/frp/ca.pem"`, `transport.tls.serverName = "huruf-tunnel"`,
		`localIP = "127.0.0.1"`, "localPort = 7480", "remotePort = 20001",
	} {
		if !strings.Contains(config, want) {
			t.Fatalf("frpc.toml lacks %q:\n%s", want, config)
		}
	}
}
