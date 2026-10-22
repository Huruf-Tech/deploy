package update

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestApplyVerifiesAndReplaces(t *testing.T) {
	binary := []byte("new agent binary")
	sum := sha256.Sum256(binary)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.Write(binary) }))
	defer server.Close()

	target := filepath.Join(t.TempDir(), "huruf-deploy-agent")
	os.WriteFile(target, []byte("old"), 0o755)
	executable = func() (string, error) { return target, nil }

	if _, err := Apply(context.Background(), protocol.AgentUpdatePayload{Url: server.URL, Sha256: hex.EncodeToString(make([]byte, 32))}); err == nil {
		t.Fatal("a wrong checksum must be refused")
	}
	if got, _ := os.ReadFile(target); string(got) != "old" {
		t.Fatal("a refused download must leave the binary alone")
	}

	result, err := Apply(context.Background(), protocol.AgentUpdatePayload{Url: server.URL, Sha256: hex.EncodeToString(sum[:])})
	if err != nil || result["restarting"] != true {
		t.Fatalf("apply: %v %v", result, err)
	}
	if got, _ := os.ReadFile(target); string(got) != string(binary) {
		t.Fatal("binary not replaced")
	}
	if info, _ := os.Stat(target); info.Mode().Perm()&0o100 == 0 {
		t.Fatal("binary not executable")
	}
}
