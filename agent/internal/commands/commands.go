// Package commands is the command registry (PLAN §23.4): each command type
// registers a handler; dispatch, idempotency and result reporting live in the
// agent loop, written once.
package commands

import (
	"context"
	"fmt"
	"time"
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

func Default() Registry {
	return Registry{
		"ping": func(context.Context, map[string]any) (map[string]any, error) {
			return map[string]any{"pong": time.Now().UnixMilli()}, nil
		},
	}
}
