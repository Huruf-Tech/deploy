// Package state persists what the agent must not forget across restarts: the
// command cursor (what it has durably received), recently completed command
// seqs (so a re-delivered command never runs twice), and the last desired
// state, still sealed, so workloads come back after a reboot without the
// control plane.
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
		Server        string  `json:"server"`
		CommandCursor int64   `json:"commandCursor"`
		Done          []int64 `json:"done"`
		SpecVersion   int64   `json:"specVersion"`
		Spec          string  `json:"spec"` // sealed DesiredSpec
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
	return s.save()
}

// RegisteredAs records the server this agent is registered as. A different
// one (removed and added again) starts over: its command seqs and desired
// state begin again from zero. Reports whether it changed.
func (s *Store) RegisteredAs(server string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if server == "" || s.data.Server == server {
		return false, nil
	}
	previous := s.data.Server
	s.data.Server = server
	// State from before agents recorded this belongs to the same server: keep it.
	if previous != "" {
		s.data.CommandCursor, s.data.Done = 0, nil
		s.data.SpecVersion, s.data.Spec = 0, ""
	}
	return previous != "", s.save()
}

// Reset forgets received commands and the desired state (the control plane
// saw a cursor from an earlier registration).
func (s *Store) Reset() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.CommandCursor, s.data.Done = 0, nil
	s.data.SpecVersion, s.data.Spec = 0, ""
	return s.save()
}

// Spec is the last desired state received, still sealed (version 0 when none).
func (s *Store) Spec() (int64, string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.data.SpecVersion, s.data.Spec
}

func (s *Store) SaveSpec(version int64, sealed string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.SpecVersion, s.data.Spec = version, sealed
	return s.save()
}

// save writes atomically; the caller holds the lock.
func (s *Store) save() error {
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
