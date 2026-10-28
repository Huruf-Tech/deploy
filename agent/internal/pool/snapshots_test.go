package pool

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

// A partition's layers in Sysbox's volume are copied into its own directory
// once, never over layers already there.
func TestKeepSnapshots(t *testing.T) {
	ctx := context.Background()
	vol, own := t.TempDir(), filepath.Join(t.TempDir(), "snapshots")
	if err := keepSnapshots(ctx, vol, own); err != nil || !empty(own) {
		t.Fatalf("an empty volume copied something: %v", err)
	}
	_ = os.MkdirAll(filepath.Join(vol, "snapshots", "1", "fs"), 0o755)
	_ = os.WriteFile(filepath.Join(vol, "metadata.db"), []byte("db"), 0o600)
	if err := keepSnapshots(ctx, vol, own); err != nil {
		t.Fatal(err)
	}
	if got, _ := os.ReadFile(filepath.Join(own, "metadata.db")); string(got) != "db" {
		t.Fatalf("metadata.db = %q", got)
	}
	if _, err := os.Stat(filepath.Join(own, "snapshots", "1", "fs")); err != nil {
		t.Fatal(err)
	}
	// Its own layers win: never overwritten by the volume's.
	_ = os.WriteFile(filepath.Join(own, "metadata.db"), []byte("mine"), 0o600)
	_ = os.WriteFile(filepath.Join(vol, "metadata.db"), []byte("theirs"), 0o600)
	if err := keepSnapshots(ctx, vol, own); err != nil {
		t.Fatal(err)
	}
	if got, _ := os.ReadFile(filepath.Join(own, "metadata.db")); string(got) != "mine" {
		t.Fatalf("overwrote its own layers: %q", got)
	}
}
