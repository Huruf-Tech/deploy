package pool

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func freeAddr(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	return ln.Addr().String()
}

func TestServeSendsEachPartOnceWithTheToken(t *testing.T) {
	addr, token := freeAddr(t), strings.Repeat("t", 32)
	ctx := context.Background()
	done := make(chan error, 1)
	go func() {
		done <- serve(ctx, addr, token, map[string][]string{
			"/image": {"echo", "image bytes"},
			"/data":  {"echo", "data bytes"},
		})
	}()

	// The target retries until the source listens; a wrong token is refused.
	if _, err := fetch(ctx, addr, "wrong", "/image", "cat"); err == nil || !strings.Contains(err.Error(), "403") {
		t.Fatalf("wrong token: %v", err)
	}
	out, err := fetch(ctx, addr, token, "/image", "cat")
	if err != nil || out != "image bytes\n" {
		t.Fatalf("image = %q, %v", out, err)
	}
	if _, err := fetch(ctx, addr, token, "/image", "cat"); err == nil || !strings.Contains(err.Error(), "410") {
		t.Fatalf("a part is sent once: %v", err)
	}
	if out, err := fetch(ctx, addr, token, "/data", "cat"); err != nil || out != "data bytes\n" {
		t.Fatalf("data = %q, %v", out, err)
	}
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("serve should return once every part is sent")
	}
}

func TestServeFailsWhenAPartFails(t *testing.T) {
	addr, token := freeAddr(t), strings.Repeat("t", 32)
	ctx := context.Background()
	done := make(chan error, 1)
	go func() {
		done <- serve(ctx, addr, token, map[string][]string{"/data": {"sh", "-c", "echo broken >&2; exit 3"}})
	}()
	_, _ = fetch(ctx, addr, token, "/data", "cat")
	if err := <-done; err == nil || !strings.Contains(err.Error(), "broken") {
		t.Fatalf("serve = %v, want the part's error", err)
	}
}

func TestServeGivesUpWhenNobodyComes(t *testing.T) {
	defer func(w time.Duration) { moveWait = w }(moveWait)
	moveWait = 50 * time.Millisecond
	err := serve(context.Background(), freeAddr(t), strings.Repeat("t", 32), map[string][]string{"/data": {"true"}})
	if err == nil || !strings.Contains(err.Error(), "in time") {
		t.Fatalf("serve = %v", err)
	}
}

// A real copy through tar: what the partition's data goes through.
func TestTarRoundTrip(t *testing.T) {
	src, dst := t.TempDir(), t.TempDir()
	if err := os.MkdirAll(filepath.Join(src, "docker", "volumes"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(src, "docker", "volumes", "marker"), []byte("data"), 0o600); err != nil {
		t.Fatal(err)
	}
	addr, token := freeAddr(t), strings.Repeat("t", 32)
	create, extract := tarArgs("x", true), tarArgs("x", false)
	create[2], extract[2] = src, dst // -C: the test's directories
	ctx := context.Background()
	done := make(chan error, 1)
	go func() { done <- serve(ctx, addr, token, map[string][]string{"/data": create}) }()
	if _, err := fetch(ctx, addr, token, "/data", extract...); err != nil {
		t.Fatal(err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(filepath.Join(dst, "docker", "volumes", "marker"))
	if err != nil || string(got) != "data" {
		t.Fatalf("copied marker = %q, %v", got, err)
	}
}
