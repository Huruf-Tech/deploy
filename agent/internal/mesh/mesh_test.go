package mesh

import (
	"os"
	"path/filepath"
	"testing"
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
