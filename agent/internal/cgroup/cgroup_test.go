package cgroup

import (
	"os"
	"path/filepath"
	"testing"
)

func fake(t *testing.T, files map[string]string) {
	t.Helper()
	dir := t.TempDir()
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	old := Root
	Root = dir
	t.Cleanup(func() { Root = old })
}

func TestPartitionLimits(t *testing.T) {
	fake(t, map[string]string{
		"cpu.max":        "150000 100000\n",
		"memory.max":     "2415919104\n",
		"memory.current": "300000000\n",
		"memory.stat":    "anon 100000000\nfile 200000000\ninactive_file 150000000\n",
		"cpu.stat":       "usage_usec 4200\nuser_usec 4000\n",
	})
	if got := CPUs(); got != 1.5 {
		t.Errorf("CPUs = %v, want 1.5", got)
	}
	if got := MemoryMax(); got != 2415919104 {
		t.Errorf("MemoryMax = %v", got)
	}
	if got := MemoryUsed(); got != 150000000 {
		t.Errorf("MemoryUsed = %v, want 150000000", got)
	}
	if got := CPUUsageMicros(); got != 4200 {
		t.Errorf("CPUUsageMicros = %v", got)
	}
}

func TestPlainMachineHasNoLimits(t *testing.T) {
	fake(t, map[string]string{"cpu.max": "max 100000\n", "memory.max": "max\n"})
	if CPUs() != 0 || MemoryMax() != 0 {
		t.Errorf("limits on an unlimited cgroup: %v %v", CPUs(), MemoryMax())
	}
	fake(t, map[string]string{}) // the root cgroup has neither file
	if CPUs() != 0 || MemoryMax() != 0 || MemoryUsed() != 0 {
		t.Error("limits without files")
	}
}
