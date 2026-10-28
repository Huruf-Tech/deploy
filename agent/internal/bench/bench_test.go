package bench

import (
	"context"
	"path/filepath"
	"testing"
	"time"
)

func TestRunMeasuresAndStores(t *testing.T) {
	testFor = 50 * time.Millisecond
	defer func() { testFor = 2 * time.Second }()
	dir := t.TempDir()
	r, err := Run(context.Background(), dir)
	if err != nil {
		t.Fatal(err)
	}
	if r.CpuSingle <= 0 || r.CpuMulti < r.CpuSingle/2 || r.Threads < 1 ||
		r.Memory <= 0 || r.DiskWrite <= 0 || r.DiskSync <= 0 {
		t.Fatalf("result = %+v", r)
	}
	if _, err := time.Parse(time.RFC3339, r.At); err != nil {
		t.Fatal(err)
	}

	s := &Store{Path: filepath.Join(dir, "benchmark.json")}
	if s.Latest() != nil || !s.due(time.Now()) {
		t.Fatal("nothing measured yet")
	}
	if err := s.save(r); err != nil {
		t.Fatal(err)
	}
	// A restart reads it back, and it's due again after a week.
	again := &Store{Path: s.Path}
	if got := again.Latest(); got == nil || got.CpuSingle != r.CpuSingle {
		t.Fatalf("read back %+v", got)
	}
	if again.due(time.Now()) || !again.due(time.Now().Add(Every)) {
		t.Fatal("due only after a week")
	}
}
