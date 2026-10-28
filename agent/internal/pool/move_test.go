package pool

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
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
		done <- serve(ctx, addr, token, testKey, map[string][]string{
			"/image": {"echo", "image bytes"},
			"/data":  {"echo", "data bytes"},
		})
	}()

	// The target retries until the source listens; a wrong token is refused.
	if _, err := fetch(ctx, &source{addrs: []string{addr}}, "wrong", testKey, "/image", "cat"); err == nil || !strings.Contains(err.Error(), "403") {
		t.Fatalf("wrong token: %v", err)
	}
	out, err := fetch(ctx, &source{addrs: []string{addr}}, token, testKey, "/image", "cat")
	if err != nil || out != "image bytes\n" {
		t.Fatalf("image = %q, %v", out, err)
	}
	if _, err := fetch(ctx, &source{addrs: []string{addr}}, token, testKey, "/image", "cat"); err == nil || !strings.Contains(err.Error(), "410") {
		t.Fatalf("a part is sent once: %v", err)
	}
	if out, err := fetch(ctx, &source{addrs: []string{addr}}, token, testKey, "/data", "cat"); err != nil || out != "data bytes\n" {
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
		done <- serve(ctx, addr, token, testKey, map[string][]string{"/data": {"sh", "-c", "echo broken >&2; exit 3"}})
	}()
	// The target hears why, not only that its data ended early.
	_, ferr := fetch(ctx, &source{addrs: []string{addr}}, token, testKey, "/data", "cat")
	if ferr == nil || !strings.Contains(ferr.Error(), "the source machine failed") || !strings.Contains(ferr.Error(), "broken") {
		t.Fatalf("fetch = %v, want the source's error", ferr)
	}
	if err := <-done; err == nil || !strings.Contains(err.Error(), "broken") {
		t.Fatalf("serve = %v, want the part's error", err)
	}
}

func TestServeGivesUpWhenNobodyComes(t *testing.T) {
	defer func(w time.Duration) { moveWait = w }(moveWait)
	moveWait = 50 * time.Millisecond
	err := serve(context.Background(), freeAddr(t), strings.Repeat("t", 32), testKey, map[string][]string{"/data": {"true"}})
	if err == nil || !strings.Contains(err.Error(), "in time") {
		t.Fatalf("serve = %v", err)
	}
}

// A receiver that stops reading fails the send, so the source starts the
// partition again instead of waiting forever.
func TestServeGivesUpOnAStalledReceiver(t *testing.T) {
	defer func(w time.Duration) { moveWait = w }(moveWait)
	moveWait = 300 * time.Millisecond
	addr, token := freeAddr(t), strings.Repeat("t", 32)
	done := make(chan error, 1)
	go func() {
		done <- serve(context.Background(), addr, token, testKey, map[string][]string{"/data": {"yes"}})
	}()
	var conn net.Conn
	for i := 0; i < 50; i++ {
		var err error
		if conn, err = net.Dial("tcp", addr); err == nil {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if conn == nil {
		t.Fatal("serve didn't listen")
	}
	defer conn.Close()
	// Asks for the part, then never reads it.
	fmt.Fprintf(conn, "GET /data HTTP/1.1\r\nHost: x\r\nAuthorization: Bearer %s\r\n\r\n", token)
	select {
	case err := <-done:
		if err == nil || !strings.Contains(err.Error(), "in time") {
			t.Fatalf("serve = %v", err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("serve kept waiting on a stalled receiver")
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
	go func() { done <- serve(ctx, addr, token, testKey, map[string][]string{"/data": create}) }()
	if _, err := fetch(ctx, &source{addrs: []string{addr}}, token, testKey, "/data", extract...); err != nil {
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

// Forwards apply to traffic for the machine only, and skip partitions that
// aren't running (no address yet).
func TestForwardRulesMatchTheMachineOnly(t *testing.T) {
	rules := forwardRules([]protocol.PortForward{
		{Protocol: "udp", Port: 51821, Partition: "p1", To: 51820},
		{Protocol: "tcp", Port: 8080, Partition: "p2", To: 8080},
	}, map[string]string{"p1": "172.19.0.2"})
	if !strings.Contains(rules, "fib daddr type local udp dport 51821 dnat to 172.19.0.2:51820") {
		t.Fatalf("rules:\n%s", rules)
	}
	if strings.Contains(rules, "8080") {
		t.Fatal("a stopped partition's forward was written")
	}
}

func TestIsolateRulesNameTheRentals(t *testing.T) {
	rules := isolateRules([]string{"hp-pa", "hp-pb"})
	for _, want := range []string{
		`elements = { "hp-pa", "hp-pb" }`,
		"ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } ct state new drop",
		`iifname @rented oifname "hp-*" drop`,
		`iifname "hp-*" oifname @rented drop`,
		"iifname @rented drop",
	} {
		if !strings.Contains(rules, want) {
			t.Fatalf("missing %q in\n%s", want, rules)
		}
	}
	if strings.Contains(isolateRules(nil), "elements") {
		t.Fatal("an empty set has no elements line")
	}
}

// A reader that fails stops the writer (no hang), and both errors are kept.
func TestPipeStopsTheWriterWhenTheReaderFails(t *testing.T) {
	done := make(chan error, 1)
	go func() {
		done <- pipe(context.Background(), []string{"yes"}, []string{"sh", "-c", "head -c 10 >/dev/null; echo full >&2; exit 3"})
	}()
	select {
	case err := <-done:
		if err == nil || !strings.Contains(err.Error(), "full") {
			t.Fatalf("pipe = %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("the writer kept running")
	}
	if err := pipe(context.Background(), []string{"echo", "hi"}, []string{"cat"}); err != nil {
		t.Fatal(err)
	}
}
