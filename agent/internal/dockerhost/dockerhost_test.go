package dockerhost

import (
	"encoding/json"
	"strings"
	"testing"
)

var payload = Payload{LogMaxSize: "10m", LogMaxFile: 5}

func TestMergeDaemonConfigKeepsUserKeys(t *testing.T) {
	merged, changed, err := MergeDaemonConfig([]byte(`{"registry-mirrors":["https://m.example"],"log-driver":"json-file"}`), payload)
	if err != nil || !changed {
		t.Fatalf("changed=%v err=%v", changed, err)
	}

	var config map[string]any
	_ = json.Unmarshal(merged, &config)
	if config["log-driver"] != "local" || config["live-restore"] != true {
		t.Errorf("managed keys not set: %v", config)
	}
	if opts := config["log-opts"].(map[string]any); opts["max-size"] != "10m" || opts["max-file"] != "5" {
		t.Errorf("log-opts = %v", opts)
	}
	if mirrors, ok := config["registry-mirrors"].([]any); !ok || len(mirrors) != 1 {
		t.Errorf("user key lost: %v", config)
	}
}

func TestMergeDaemonConfigIsIdempotent(t *testing.T) {
	first, _, _ := MergeDaemonConfig(nil, payload)
	second, changed, err := MergeDaemonConfig(first, payload)
	if err != nil || changed || string(second) != string(first) {
		t.Fatalf("second merge changed the file: changed=%v err=%v", changed, err)
	}
}

func TestMergeDaemonConfigRejectsInvalidJSON(t *testing.T) {
	if _, _, err := MergeDaemonConfig([]byte("{not json"), payload); err == nil {
		t.Fatal("want an error for invalid JSON")
	}
}

func TestMeshRegistryIsTrustedOnce(t *testing.T) {
	p := Payload{LogMaxSize: "10m", LogMaxFile: 5, MeshCidr: "10.209.0.0/16"}
	merged, changed, err := MergeDaemonConfig([]byte(`{"insecure-registries":["registry.local:5000"]}`), p)
	if err != nil || !changed {
		t.Fatalf("changed=%v err=%v", changed, err)
	}
	if !strings.Contains(string(merged), `"registry.local:5000"`) || !strings.Contains(string(merged), `"10.209.0.0/16"`) {
		t.Fatalf("merged = %s", merged)
	}
	if _, again, _ := MergeDaemonConfig(merged, p); again {
		t.Fatal("a second merge changed the config")
	}
}

// Docker won't start in swarm mode with live-restore (Dokploy hosts are swarm nodes).
func TestMergeDaemonConfigDropsLiveRestoreOnSwarm(t *testing.T) {
	p := payload
	p.Swarm = true
	merged, changed, err := MergeDaemonConfig([]byte(`{"live-restore": true}`), p)
	if err != nil || !changed {
		t.Fatalf("changed=%v err=%v", changed, err)
	}
	if strings.Contains(string(merged), "live-restore") {
		t.Fatalf("live-restore kept on a swarm node: %s", merged)
	}
}
