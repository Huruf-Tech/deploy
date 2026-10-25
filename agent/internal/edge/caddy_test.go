package edge

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
)

func TestIngressListenerRoutesByProjectHeader(t *testing.T) {
	config := Config([]reconcile.Route{
		{Port: 8080, Upstreams: []string{"10.0.0.2:3000"}},
		{Project: "p1", Upstreams: []string{"10.0.0.3:3000"}, HealthPath: "/health"},
		{Project: "p2"},
	})
	servers := config["apps"].(map[string]any)["http"].(map[string]any)["servers"].(map[string]any)
	if _, ok := servers["port-8080"]; !ok {
		t.Fatalf("public port server missing: %v", servers)
	}
	ingress := servers["ingress"].(map[string]any)
	if got := ingress["listen"].([]string); len(got) != 1 || got[0] != "127.0.0.1:7480" {
		t.Fatalf("listen = %v", got)
	}
	raw, _ := json.Marshal(ingress["routes"])
	text := string(raw)
	for _, want := range []string{
		`"X-Huruf-Project":["p1"]`, `"dial":"10.0.0.3:3000"`, `"uri":"/health"`,
		`"X-Huruf-Project":["p2"]`, `"No healthy replicas"`, `"Unknown project"`,
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("ingress routes lack %s: %s", want, text)
		}
	}
	// The fallback comes last, so it never shadows a project.
	if !strings.HasSuffix(text, `"status_code":404}]}]`) {
		t.Fatalf("fallback isn't last: %s", text)
	}
}

func TestNoIngressListenerWithoutIngressRoutes(t *testing.T) {
	servers := Config([]reconcile.Route{{Port: 80}})["apps"].(map[string]any)["http"].(map[string]any)["servers"].(map[string]any)
	if _, ok := servers["ingress"]; ok {
		t.Fatal("ingress listener without ingress routes")
	}
}
