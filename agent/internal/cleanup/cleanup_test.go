package cleanup

import (
	"encoding/json"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/ledger"
)

func parse(t *testing.T, raw []byte) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

// A tracked server gets back exactly what it had: the user's own keys and
// registries stay, keys the agent added go, changed ones are restored.
func TestRestoreTracked(t *testing.T) {
	current := []byte(`{"log-driver":"local","live-restore":true,"debug":true,
		"insecure-registries":["registry.local:5000","10.209.0.0/16"]}`)
	entries := []ledger.Entry{
		{Kind: "installed"},
		{Kind: "daemon-key", Name: "log-driver", Prev: json.RawMessage(`"json-file"`)},
		{Kind: "daemon-key", Name: "live-restore", Absent: true},
		{Kind: "insecure-registry", Name: "10.209.0.0/16"},
	}
	out, changes, err := RestoreDaemonConfig(current, entries, true, false)
	if err != nil || len(changes) != 3 {
		t.Fatalf("changes=%v err=%v", changes, err)
	}
	got := parse(t, out)
	if got["log-driver"] != "json-file" || got["debug"] != true || got["live-restore"] != nil {
		t.Fatalf("restored %v", got)
	}
	if r := got["insecure-registries"].([]any); len(r) != 1 || r[0] != "registry.local:5000" {
		t.Fatalf("registries %v", r)
	}
}

// Before the ledger: only live-restore and the mesh range go; log settings
// may have been the user's, so they stay.
func TestRestoreUntracked(t *testing.T) {
	current := []byte(`{"log-driver":"local","live-restore":true,"insecure-registries":["10.209.0.0/16"]}`)
	out, _, err := RestoreDaemonConfig(current, nil, false, false)
	if err != nil {
		t.Fatal(err)
	}
	got := parse(t, out)
	if got["log-driver"] != "local" || got["live-restore"] != nil || got["insecure-registries"] != nil {
		t.Fatalf("restored %v", got)
	}
}

// Restoring live-restore on a swarm node would stop Docker from starting.
func TestRestoreSkipsLiveRestoreOnSwarm(t *testing.T) {
	entries := []ledger.Entry{{Kind: "installed"}, {Kind: "daemon-key", Name: "live-restore", Prev: json.RawMessage(`true`)}}
	out, _, _ := RestoreDaemonConfig([]byte(`{}`), entries, true, true)
	if parse(t, out)["live-restore"] != nil {
		t.Fatalf("live-restore restored on swarm: %s", out)
	}
}

// Project volumes match by id pattern; another tool's huruf-tech-* names don't.
func TestProjectVolumePattern(t *testing.T) {
	if !projectVolume.MatchString("huruf-6adb97c6e67447ba4bf232fc-data") {
		t.Fatal("project volume not matched")
	}
	for _, name := range []string{"huruf-tech-redistriggers-c9a23p_redis-data", "huruf-registry-data", "dokploy-postgres"} {
		if projectVolume.MatchString(name) {
			t.Fatalf("%s matched", name)
		}
	}
}
