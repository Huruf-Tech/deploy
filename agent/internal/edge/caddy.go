// Package edge configures the Caddy edge proxy (PLAN §14) through its admin
// API: one server per public port, load-balancing over the routed replicas.
// Each update replaces the whole config with /load, which Caddy applies
// gracefully: connections in flight finish on the old config.
package edge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
)

type Caddy struct {
	Admin string // e.g. http://127.0.0.1:2019

	mu   sync.Mutex
	last []byte
}

var _ reconcile.Router = (*Caddy)(nil)

func (c *Caddy) Apply(ctx context.Context, routes []reconcile.Route) error {
	config, err := json.Marshal(Config(routes))
	if err != nil {
		return err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if bytes.Equal(config, c.last) {
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.Admin+"/load", bytes.NewReader(config))
	req.Header.Set("content-type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("edge proxy: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(res.Body, 500))
		return fmt.Errorf("edge proxy rejected the config (%d): %s", res.StatusCode, body)
	}
	c.last = config
	return nil
}

// Config is the full Caddy JSON config for these routes.
func Config(routes []reconcile.Route) map[string]any {
	servers := map[string]any{}
	for _, route := range routes {
		handler := map[string]any{
			"handler":     "static_response",
			"status_code": 503,
			"body":        "No healthy replicas",
		}
		if len(route.Upstreams) > 0 {
			upstreams := make([]map[string]string, len(route.Upstreams))
			for i, dial := range route.Upstreams {
				upstreams[i] = map[string]string{"dial": dial}
			}
			handler = map[string]any{
				"handler":   "reverse_proxy",
				"upstreams": upstreams,
				// A replica that stopped between updates is retried on another one.
				"load_balancing": map[string]any{
					"selection_policy": map[string]string{"policy": "round_robin"},
					"try_duration":     "5s",
					"try_interval":     "250ms",
				},
			}
			if route.HealthPath != "" {
				handler["health_checks"] = map[string]any{
					"active": map[string]any{"uri": route.HealthPath, "interval": "5s", "timeout": "3s"},
				}
			}
		}
		servers[fmt.Sprintf("port-%d", route.Port)] = map[string]any{
			"listen":          []string{fmt.Sprintf(":%d", route.Port)},
			"automatic_https": map[string]any{"disable": true},
			"routes":          []any{map[string]any{"handle": []any{handler}}},
		}
	}
	return map[string]any{"apps": map[string]any{"http": map[string]any{"servers": servers}}}
}
