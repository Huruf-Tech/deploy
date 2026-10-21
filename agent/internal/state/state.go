// Package state persists what the agent must not forget across restarts: the
// command cursor (what it has durably received) and recently completed command
// seqs (so a re-delivered command never runs twice).
package state

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"slices"
	"sync"
)

// Bounded dedupe window (PLAN §20.4).
const maxDone = 10_000

type Store struct {
	path string
	mu   sync.Mutex
	data struct {
		CommandCursor int64   `json:"commandCursor"`
		Done          []int64 `json:"done"`
	}
}

func Open(dir string) (*Store, error) {
	s := &Store{path: filepath.Join(dir, "state.json")}
	raw, err := os.ReadFile(s.path)
	if errors.Is(err, os.ErrNotExist) {
		return s, nil
	}
	if err != nil {
		return nil, err
	}
	return s, json.Unmarshal(raw, &s.data)
}

func (s *Store) Cursor() int64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.data.CommandCursor
}

func (s *Store) IsDone(seq int64) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return slices.Contains(s.data.Done, seq)
}

// Received advances the cursor and marks seqs done, then writes atomically.
func (s *Store) Received(cursor int64, done ...int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.data.CommandCursor = max(s.data.CommandCursor, cursor)
	s.data.Done = append(s.data.Done, done...)
	if len(s.data.Done) > maxDone {
		s.data.Done = s.data.Done[len(s.data.Done)-maxDone:]
	}

	raw, err := json.Marshal(s.data)
	if err != nil {
		return err
	}
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}
