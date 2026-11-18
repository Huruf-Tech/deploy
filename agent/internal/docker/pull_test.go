package docker

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"
)

// A pull cut mid-way is retried, and the image is there afterwards.
func TestEnsureImageRetriesAFailedPull(t *testing.T) {
	saved, savedBackoff := run, pullBackoff
	defer func() { run, pullBackoff = saved, savedBackoff }()
	pullBackoff = []time.Duration{time.Millisecond, time.Millisecond}

	pulls, present := 0, false
	run = func(_ context.Context, _ []string, _ string, args ...string) (string, error) {
		switch args[0] {
		case "image":
			if present {
				return "[]", nil
			}
			return "", errors.New("No such image")
		case "pull":
			pulls++
			if pulls == 1 {
				return "", errors.New("exit status 1: unexpected EOF")
			}
			present = true
		}
		return "", nil
	}

	d := &Docker{Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	if err := d.EnsureImage(context.Background(), "10.209.0.5:5000/shop-1c4f2a:1", nil); err != nil {
		t.Fatalf("EnsureImage: %v", err)
	}
	if pulls != 2 {
		t.Fatalf("pulls = %d, want 2", pulls)
	}
}

// Every attempt failing returns the error after the last retry.
func TestEnsureImageGivesUp(t *testing.T) {
	saved, savedBackoff := run, pullBackoff
	defer func() { run, pullBackoff = saved, savedBackoff }()
	pullBackoff = []time.Duration{time.Millisecond, time.Millisecond}

	pulls := 0
	run = func(_ context.Context, _ []string, _ string, args ...string) (string, error) {
		if args[0] == "pull" {
			pulls++
		}
		return "", errors.New("fails")
	}
	d := &Docker{Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	if err := d.EnsureImage(context.Background(), "x:1", nil); err == nil {
		t.Fatal("want an error")
	}
	if pulls != 3 {
		t.Fatalf("pulls = %d, want 3", pulls)
	}
}

// 2026-11-18: release 10 was built (a cached rebuild of release 9), then a
// cleanup on the previous kept list removed its tag before its rollout came.
func TestCleanupSparesAnImageJustBuilt(t *testing.T) {
	saved := run
	defer func() { run = saved }()
	var removed []string
	run = func(_ context.Context, _ []string, _ string, args ...string) (string, error) {
		switch args[0] {
		case "images":
			return "app:8 app:9 app:10", nil
		case "rmi":
			removed = append(removed, args[1])
		}
		return "", nil
	}

	Built("app:10")
	defer built.Delete("app:10")
	d := &Docker{Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	if err := d.RemoveUnusedImages(context.Background(), []string{"app:9"}); err != nil {
		t.Fatal(err)
	}
	if len(removed) != 1 || removed[0] != "app:8" {
		t.Fatalf("removed %v, want only app:8", removed)
	}

	// After the grace, it's an image like any other.
	built.Store("app:10", time.Now().Add(-builtGrace))
	if JustBuilt("app:10") {
		t.Fatal("still protected after the grace")
	}
}
