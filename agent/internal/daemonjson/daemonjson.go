// Package daemonjson reads and writes Docker's /etc/docker/daemon.json,
// keeping every key we don't manage as it was.
package daemonjson

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Path is Docker's settings file.
const Path = "/etc/docker/daemon.json"

// Parse reads a daemon.json; empty is {}. Numbers keep their exact text.
func Parse(raw []byte) (map[string]any, error) {
	config := map[string]any{}
	if len(bytes.TrimSpace(raw)) == 0 {
		return config, nil
	}
	d := json.NewDecoder(bytes.NewReader(raw))
	d.UseNumber()
	if err := d.Decode(&config); err != nil {
		return nil, fmt.Errorf("%s is not valid JSON: %w", Path, err)
	}
	return config, nil
}

// Encode writes it indented: Sysbox's installer only recognises keys on
// their own indented lines.
func Encode(config map[string]any) []byte {
	out, _ := json.MarshalIndent(config, "", "  ")
	return append(out, '\n')
}

// Read reads the file; missing is {}.
func Read() (map[string]any, error) {
	raw, err := os.ReadFile(Path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	return Parse(raw)
}

func Write(config map[string]any) error {
	if err := os.MkdirAll(filepath.Dir(Path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(Path, Encode(config), 0o644)
}
