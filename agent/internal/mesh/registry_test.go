package mesh

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// A registry with shop:1 (d1), shop:2 and shop:3 (both d2); shop:3 is kept.
func fakeRegistry(t *testing.T) (*httptest.Server, *[]string) {
	digests := map[string]string{"1": "sha256:d1", "2": "sha256:d2", "3": "sha256:d2"}
	var mu sync.Mutex
	deleted := []string{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if user, pass, _ := r.BasicAuth(); user != "huruf" || pass != "secret" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/v2/shop/tags/list":
			json.NewEncoder(w).Encode(map[string]any{"name": "shop", "tags": []string{"1", "2", "3"}})
		case r.Method == http.MethodHead && strings.HasPrefix(r.URL.Path, "/v2/shop/manifests/"):
			w.Header().Set("Docker-Content-Digest", digests[strings.TrimPrefix(r.URL.Path, "/v2/shop/manifests/")])
		case r.Method == http.MethodDelete:
			mu.Lock()
			deleted = append(deleted, r.URL.Path)
			mu.Unlock()
			w.WriteHeader(http.StatusAccepted)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(srv.Close)
	return srv, &deleted
}

func TestDeleteTagsKeepsDigestsOfKeptTags(t *testing.T) {
	srv, deleted := fakeRegistry(t)
	collected := 0
	m := &Mesh{collect: func(context.Context) error { collected++; return nil }}
	m.registry = &protocol.DesiredSpecRegistry{
		Listen: strings.TrimPrefix(srv.URL, "http://"), Username: "huruf", Password: "secret",
	}

	result, err := m.DeleteTags(context.Background(), []string{"shop:1", "shop:2", "gone:7"})
	if err != nil {
		t.Fatal(err)
	}
	// shop:2 shares d2 with the kept shop:3, so only d1 goes.
	if len(*deleted) != 1 || (*deleted)[0] != "/v2/shop/manifests/sha256:d1" {
		t.Fatalf("deleted %v", *deleted)
	}
	if result["deleted"] != 1 || collected != 1 {
		t.Fatalf("result %v, garbage collections %d", result, collected)
	}
}

func TestDeleteTagsElsewhereIsANoOp(t *testing.T) {
	m := &Mesh{}
	result, err := m.DeleteTags(context.Background(), []string{"shop:1"})
	if err != nil || result["skipped"] == nil {
		t.Fatalf("%v %v", result, err)
	}
}
