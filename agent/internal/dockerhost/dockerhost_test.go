package dockerhost

import (
	"encoding/json"
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
