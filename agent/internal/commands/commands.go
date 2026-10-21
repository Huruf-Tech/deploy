// Package commands is the command registry (PLAN §23.4): each command type
// registers a handler; dispatch, idempotency and result reporting live in the
// agent loop, written once.
package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/dockerhost"
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

func Default() Registry {
	return Registry{
		"ping": func(context.Context, map[string]any) (map[string]any, error) {
			return map[string]any{"pong": time.Now().UnixMilli()}, nil
		},
		"docker.ensure": func(ctx context.Context, payload map[string]any) (map[string]any, error) {
			p, err := decode[dockerhost.Payload](payload)
			if err != nil {
				return nil, fmt.Errorf("invalid payload: %w", err)
			}
			return dockerhost.Ensure(ctx, p)
		},
	}
}
