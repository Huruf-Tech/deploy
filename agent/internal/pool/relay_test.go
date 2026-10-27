package pool

import (
	"context"
	"strings"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// The target tries the source's address, then its tunnel; the one that
// answered is kept for the next parts.
func TestFetchFallsBackToAPathThatAnswers(t *testing.T) {
	addr, token := freeAddr(t), strings.Repeat("t", 32)
	dead := freeAddr(t) // nothing listens there
	ctx := context.Background()
	done := make(chan error, 1)
	go func() {
		done <- serve(ctx, addr, token, testKey, map[string][]string{
			"/data":  {"echo", "data"},
			"/image": {"echo", "image"},
		})
	}()
	src := &source{addrs: []string{dead, addr}}
	if out, err := fetch(ctx, src, token, testKey, "/data", "cat"); err != nil || out != "data\n" {
		t.Fatalf("data: %q, %v", out, err)
	}
	if src.chosen != addr {
		t.Fatalf("chosen = %q", src.chosen)
	}
	if out, err := fetch(ctx, src, token, testKey, "/image", "cat"); err != nil || out != "image\n" {
		t.Fatalf("image: %q, %v", out, err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

func TestRelayConfigs(t *testing.T) {
	r := &protocol.MoveRelay{
		Server: "cp.example:7000", User: "aaaaaaaaaaaaaaaaaaaaaaaa", Token: "tok",
		ServerName: "huruf-tunnel", Proxy: "move-pabc", Peer: "bbbbbbbbbbbbbbbbbbbbbbbb",
	}
	source := relayConfig("cp.example", "7000", r, "secret", 0)
	for _, want := range []string{`type = "stcp"`, `name = "move-pabc"`, `secretKey = "secret"`, "localPort = 51830", `user = "aaaaaaaaaaaaaaaaaaaaaaaa"`, `allowUsers = ["bbbbbbbbbbbbbbbbbbbbbbbb"]`} {
		if !strings.Contains(source, want) {
			t.Fatalf("source config lacks %s:\n%s", want, source)
		}
	}
	visitor := relayConfig("cp.example", "7000", r, "secret", 41234)
	for _, want := range []string{"[[visitors]]", `serverUser = "bbbbbbbbbbbbbbbbbbbbbbbb"`, `serverName = "move-pabc"`, "bindPort = 41234", `bindAddr = "127.0.0.1"`} {
		if !strings.Contains(visitor, want) {
			t.Fatalf("visitor config lacks %s:\n%s", want, visitor)
		}
	}
	if strings.Contains(visitor, "[[proxies]]") {
		t.Fatal("a visitor serves nothing")
	}
}
