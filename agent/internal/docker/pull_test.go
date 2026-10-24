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
