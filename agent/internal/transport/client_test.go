package transport

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// The control plane's own time comes back with the response, so the agent
// can tell the network's share of a round trip.
func TestPostTimedReadsTheServerTime(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set(protocol.HeaderServerTime, "120.5")
		_, _ = w.Write([]byte(`{}`))
	}))
	defer srv.Close()
	id, err := identity.LoadOrCreate(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	var out map[string]any
	status, server, err := New(srv.URL, id).PostTimed(context.Background(), "/poll", map[string]any{}, &out)
	if err != nil || status != 200 {
		t.Fatal(status, err)
	}
	if server != 120500*time.Microsecond {
		t.Fatalf("server = %v", server)
	}
}
