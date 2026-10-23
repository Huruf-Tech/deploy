// Package ledger records what the agent changes on the host, as it changes it,
// so uninstalling undoes only the agent's own changes (a Dokploy or other
// setup on the same host keeps what it had).
//
// One JSON object per line in <state-dir>/ledger.jsonl. The installer writes
// an "installed" entry first; a ledger without it belongs to a server set up
// before the ledger existed, and cleanup falls back to conservative rules.
package ledger

import (
	"bufio"
	"encoding/json"
	"os"
	"sync"
	"time"
)

// Path is set by main from the state directory; empty disables recording.
var Path string

var mu sync.Mutex

type Entry struct {
	// installed | docker | package | plugin | daemon-key | insecure-registry
	Kind string `json:"kind"`
	// Package or plugin name, daemon.json key, or registry range.
	Name string `json:"name,omitempty"`
	// daemon-key: the value before the agent set it; absent when Absent.
	Prev   json.RawMessage `json:"prev,omitempty"`
	Absent bool            `json:"absent,omitempty"`
	At     time.Time       `json:"at"`
}

// Record appends an entry once: a later change to the same thing keeps the
// first (original) state.
func Record(e Entry) error {
	if Path == "" {
		return nil
	}
	mu.Lock()
	defer mu.Unlock()
	for _, old := range read() {
		if old.Kind == e.Kind && old.Name == e.Name {
			return nil
		}
	}
	e.At = time.Now().UTC()
	line, err := json.Marshal(e)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(Path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(append(line, '\n'))
	return err
}

// Read returns every entry; a missing or partly corrupt file yields what parses.
func Read() []Entry {
	mu.Lock()
	defer mu.Unlock()
	return read()
}

func read() []Entry {
	f, err := os.Open(Path)
	if err != nil {
		return nil
	}
	defer f.Close()
	var entries []Entry
	scan := bufio.NewScanner(f)
	for scan.Scan() {
		var e Entry
		if json.Unmarshal(scan.Bytes(), &e) == nil {
			entries = append(entries, e)
		}
	}
	return entries
}

// Has reports whether an entry of this kind and name exists.
func Has(entries []Entry, kind, name string) bool {
	for _, e := range entries {
		if e.Kind == kind && e.Name == name {
			return true
		}
	}
	return false
}
