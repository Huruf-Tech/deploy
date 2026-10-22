// Package commands is the command registry (PLAN §23.4): each command type
// registers a handler; dispatch, idempotency and result reporting live in the
// agent loop, written once.
package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/build"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/dockerhost"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/streams"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/update"
)

type Handler func(ctx context.Context, payload map[string]any) (map[string]any, error)

type Registry map[string]Handler

func (r Registry) Run(ctx context.Context, kind string, payload map[string]any) (map[string]any, error) {
	handler, ok := r[kind]
	if !ok {
		return nil, fmt.Errorf("unsupported command %q", kind)
	}
	return handler(ctx, payload)
}

// decode converts a command payload into the handler's typed struct.
func decode[T any](payload map[string]any) (T, error) {
	var value T
	raw, err := json.Marshal(payload)
	if err == nil {
		err = json.Unmarshal(raw, &value)
	}
	return value, err
}

// handle wraps a typed handler so each command declares its payload once.
func handle[T any](fn func(context.Context, T) (map[string]any, error)) Handler {
	return func(ctx context.Context, payload map[string]any) (map[string]any, error) {
		p, err := decode[T](payload)
		if err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		return fn(ctx, p)
	}
}

// sealed wraps a handler whose payload arrives sealed to this agent (PLAN §4.2).
func sealed[T any](open func(string) ([]byte, error), fn func(context.Context, T) (map[string]any, error)) Handler {
	return handle(func(ctx context.Context, p protocol.SealedPayload) (map[string]any, error) {
		plain, err := open(p.Sealed)
		if err != nil {
			return nil, fmt.Errorf("cannot open the payload: %w", err)
		}
		var value T
		if err := json.Unmarshal(plain, &value); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		return fn(ctx, value)
	})
}

// Default is the agent's command set. `ctx` outlives single commands, so
// streams keep running after their `stream.open` command has finished.
// `restart` stops the agent after an update; systemd starts the new binary.
func Default(ctx context.Context, s *streams.Manager, builder *build.Builder, open func(string) ([]byte, error), restart func()) Registry {
	return Registry{
		"ping": func(context.Context, map[string]any) (map[string]any, error) {
			return map[string]any{"pong": time.Now().UnixMilli()}, nil
		},
		"docker.ensure": handle(func(ctx context.Context, p dockerhost.Payload) (map[string]any, error) {
			return dockerhost.Ensure(ctx, p)
		}),
		"stream.open": handle(func(_ context.Context, p protocol.StreamOpenPayload) (map[string]any, error) {
			return map[string]any{"started": true}, s.Open(ctx, p)
		}),
		"stream.close": handle(func(_ context.Context, p protocol.StreamClosePayload) (map[string]any, error) {
			s.Close(p.Session)
			return map[string]any{"closed": true}, nil
		}),
		"build.run": sealed(open, builder.Run),
		"agent.update": handle(func(ctx context.Context, p protocol.AgentUpdatePayload) (map[string]any, error) {
			result, err := update.Apply(ctx, p)
			if err == nil && result["restarting"] == true {
				// Long enough for the result to be sent (events flush every 500 ms).
				time.AfterFunc(3*time.Second, restart)
			}
			return result, err
		}),
		// Build cache older than 3 days and dangling images; release images
		// are kept by the reconciler's own cleanup (PLAN §9.2).
		"server.prune": func(ctx context.Context, _ map[string]any) (map[string]any, error) {
			result := map[string]any{}
			for name, args := range map[string][]string{
				"buildCache": {"builder", "prune", "-f", "--filter", "until=72h"},
				"images":     {"image", "prune", "-f"},
			} {
				out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
				if err != nil {
					return result, fmt.Errorf("docker %s: %w: %s", args[0], err, strings.TrimSpace(string(out)))
				}
				lines := strings.Split(strings.TrimSpace(string(out)), "\n")
				result[name] = lines[len(lines)-1] // "Total reclaimed space: …"
			}
			return result, nil
		},
	}
}
