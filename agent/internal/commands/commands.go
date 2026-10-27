// Package commands is the command registry (PLAN §23.4): each command type
// registers a handler; dispatch, idempotency and result reporting live in the
// agent loop, written once.
package commands

import (
	"context"
	"encoding/json"
	"fmt"
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

// Handle wraps a typed handler so each command declares its payload once.
func Handle[T any](fn func(context.Context, T) (map[string]any, error)) Handler {
	return func(ctx context.Context, payload map[string]any) (map[string]any, error) {
		p, err := decode[T](payload)
		if err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		return fn(ctx, p)
	}
}

// Sealed wraps a handler whose payload arrives sealed to this agent (PLAN §4.2).
func Sealed[T any](open func(string) ([]byte, error), fn func(context.Context, T) (map[string]any, error)) Handler {
	return Handle(func(ctx context.Context, p protocol.SealedPayload) (map[string]any, error) {
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
		"docker.ensure": Handle(dockerhost.Ensure),
		"stream.open": Handle(func(_ context.Context, p protocol.StreamOpenPayload) (map[string]any, error) {
			return map[string]any{"started": true}, s.Open(ctx, p)
		}),
		"stream.close": Handle(func(_ context.Context, p protocol.StreamClosePayload) (map[string]any, error) {
			s.Close(p.Session)
			return map[string]any{"closed": true}, nil
		}),
		"build.run":   Sealed(open, builder.Run),
		"cache.clear": Handle(builder.ClearCache),
		"agent.update": Handle(func(ctx context.Context, p protocol.AgentUpdatePayload) (map[string]any, error) {
			result, err := update.Apply(ctx, p)
			if err == nil && result["restarting"] == true {
				// Long enough for the result to be sent (events flush every 500 ms).
				time.AfterFunc(3*time.Second, restart)
			}
			return result, err
		}),
	}
}
