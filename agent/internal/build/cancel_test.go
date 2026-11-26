package build

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestCancelBuild(t *testing.T) {
	b := &Builder{Dir: t.TempDir()}
	run := func(id string) error {
		_, err := b.Run(context.Background(), protocol.BuildRunPayload{Deployment: id, TimeoutSec: 60})
		return err
	}

	// Cancelled before it arrived: it never starts.
	if res, _ := b.Cancel(context.Background(), protocol.BuildCancelPayload{Deployment: "aaa"}); res["cancelled"] != false {
		t.Fatalf("cancel = %v", res)
	}
	if err := run("aaa"); !errors.Is(err, errCancelled) {
		t.Fatalf("err = %v", err)
	}

	// Cancelled while waiting for another build: it gives up once it gets the lock.
	b.mu.Lock()
	done := make(chan error)
	go func() { done <- run("bbb") }()
	for !b.Running("bbb") {
		time.Sleep(time.Millisecond)
	}
	if res, _ := b.Cancel(context.Background(), protocol.BuildCancelPayload{Deployment: "bbb"}); res["cancelled"] != true {
		t.Fatalf("cancel = %v", res)
	}
	b.mu.Unlock()
	if err := <-done; !errors.Is(err, errCancelled) {
		t.Fatalf("err = %v", err)
	}
}
