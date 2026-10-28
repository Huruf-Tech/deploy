package pool

import (
	"os"
	"path/filepath"
	"slices"
	"testing"
)

func TestLxcfsArgs(t *testing.T) {
	old := lxcfsRoot
	defer func() { lxcfsRoot = old }()
	lxcfsRoot = t.TempDir()
	if args := lxcfsArgs(); args != nil {
		t.Fatalf("without LXCFS: %v", args)
	}
	_ = os.MkdirAll(filepath.Join(lxcfsRoot, "proc"), 0o755)
	for _, f := range []string{"meminfo", "cpuinfo"} {
		_ = os.WriteFile(filepath.Join(lxcfsRoot, "proc", f), nil, 0o644)
	}
	want := []string{
		"-v", filepath.Join(lxcfsRoot, "proc", "cpuinfo") + ":/proc/cpuinfo:ro",
		"-v", filepath.Join(lxcfsRoot, "proc", "meminfo") + ":/proc/meminfo:ro",
	}
	if got := lxcfsArgs(); !slices.Equal(got, want) {
		t.Fatalf("got %v", got)
	}
}
