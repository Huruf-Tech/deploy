package pool

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAllowSysboxFuse(t *testing.T) {
	old := fusermountProfile
	defer func() { fusermountProfile = old }()
	root := t.TempDir()
	_ = os.MkdirAll(filepath.Join(root, "apparmor.d", "local"), 0o755)
	fusermountProfile = filepath.Join(root, "apparmor.d", "fusermount3")
	local := filepath.Join(root, "apparmor.d", "local", "fusermount3")
	ctx := context.Background()

	// No profile: nothing to do.
	var notes []string
	allowSysboxFuse(ctx, &notes)
	if len(notes) != 0 {
		t.Fatalf("without a profile: %v", notes)
	}
	// A profile with local rules: the rule is added once, next to others.
	_ = os.WriteFile(fusermountProfile, []byte("profile fusermount3 {\n  include if exists <local/fusermount3>\n}\n"), 0o644)
	_ = os.WriteFile(local, []byte("# mine\n"), 0o644)
	allowSysboxFuse(ctx, &notes)
	allowSysboxFuse(ctx, &notes)
	data, _ := os.ReadFile(local)
	if !strings.HasPrefix(string(data), "# mine\n") || strings.Count(string(data), "/var/lib/sysboxfs/**/,") != 2 {
		t.Fatalf("local rules: %q", data)
	}
}
