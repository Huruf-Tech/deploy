package mesh

import (
	"context"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestKeyMovesToKeyDirAndKeepsItsPublicKey(t *testing.T) {
	state, keys := t.TempDir(), filepath.Join(t.TempDir(), "wireguard")

	// A key written by an older agent, in the state directory.
	old := &Mesh{Dir: state, KeyDir: filepath.Join(state, "old-layout")}
	before, err := old.PublicKey()
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := os.ReadFile(old.keyPath())
	os.WriteFile(filepath.Join(state, "wireguard.key"), raw, 0o600)

	m := &Mesh{Dir: state, KeyDir: keys}
	after, err := m.PublicKey()
	if err != nil {
		t.Fatal(err)
	}
	if after != before {
		t.Fatalf("public key changed: %s → %s", before, after)
	}
	info, err := os.Stat(filepath.Join(keys, "huruf-deploy.key"))
	if err != nil {
		t.Fatalf("key not in KeyDir: %v", err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("key mode %v, want 0600", info.Mode().Perm())
	}
}

func TestFreshServerGetsAKeyInKeyDir(t *testing.T) {
	m := &Mesh{Dir: t.TempDir(), KeyDir: filepath.Join(t.TempDir(), "wireguard")}
	first, err := m.PublicKey()
	if err != nil {
		t.Fatal(err)
	}
	second, _ := m.PublicKey()
	if first == "" || first != second {
		t.Fatalf("key not stable: %q %q", first, second)
	}
}

// A retry of a spec that failed never undoes a newer one applied meanwhile.
func TestRetryYieldsToANewerSpec(t *testing.T) {
	m := &Mesh{Dir: t.TempDir(), KeyDir: t.TempDir(), Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	old, newer := &protocol.DesiredSpec{Version: 1}, &protocol.DesiredSpec{Version: 2}
	m.last, m.lastErr = newer, "wg missing"
	m.recheck(context.Background(), old, true)
	if m.lastErr != "wg missing" || m.last != newer {
		t.Fatalf("the older spec was applied: lastErr %q", m.lastErr)
	}
}
