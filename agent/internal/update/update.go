// Package update replaces the running agent binary (PLAN §16 Phase 12): the
// control plane sends the published binary's URL and SHA-256; the agent
// downloads it next to itself, verifies it and renames it into place. The
// caller then exits and systemd starts the new binary.
package update

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// The agent is ~20 MB; anything far larger isn't it.
const maxBinary = 200 << 20

var (
	selfOnce sync.Once
	selfSum  string
)

// SelfSha256 is the SHA-256 of the running binary, computed once.
func SelfSha256() string {
	selfOnce.Do(func() {
		if exe, err := executable(); err == nil {
			if f, err := os.Open(exe); err == nil {
				defer f.Close()
				h := sha256.New()
				if _, err := io.Copy(h, f); err == nil {
					selfSum = hex.EncodeToString(h.Sum(nil))
				}
			}
		}
	})
	return selfSum
}

// executable is the running binary's path; tests point it elsewhere.
var executable = func() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.EvalSymlinks(exe)
}

// Apply downloads and verifies the new binary, then puts it in place of the
// running one. The running process keeps its old copy until it exits.
func Apply(ctx context.Context, p protocol.AgentUpdatePayload) (map[string]any, error) {
	if p.Sha256 == SelfSha256() {
		return map[string]any{"sha256": p.Sha256, "unchanged": true}, nil
	}
	exe, err := executable()
	if err != nil {
		return nil, err
	}
	tmp := exe + ".new"
	defer os.Remove(tmp) // a no-op once renamed

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.Url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed: HTTP %d", resp.StatusCode)
	}

	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o755)
	if err != nil {
		return nil, err
	}
	h := sha256.New()
	_, err = io.Copy(io.MultiWriter(f, h), io.LimitReader(resp.Body, maxBinary))
	if closeErr := f.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}
	if got := hex.EncodeToString(h.Sum(nil)); got != p.Sha256 {
		return nil, fmt.Errorf("checksum mismatch: got %s, want %s; not installed", got, p.Sha256)
	}
	if err := os.Rename(tmp, exe); err != nil {
		return nil, err
	}
	return map[string]any{"sha256": p.Sha256, "restarting": true}, nil
}
