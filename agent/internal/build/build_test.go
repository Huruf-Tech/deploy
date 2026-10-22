package build

import (
	"os"
	"os/exec"
	"strings"
	"testing"
)

// The huruf-env secret must survive any value when sourced by sh.
func TestExportsAreShellSafe(t *testing.T) {
	env := map[string]string{
		"QUOTE":     `it's "quoted" $HOME`,
		"MULTILINE": "line one\nline two",
	}
	file := t.TempDir() + "/env"
	if err := os.WriteFile(file, []byte(exports(env)), 0o600); err != nil {
		t.Fatal(err)
	}
	out, err := exec.Command("sh", "-c", `. "$1" && printf '%s|%s' "$QUOTE" "$MULTILINE"`, "sh", file).Output()
	if err != nil {
		t.Fatal(err)
	}
	if want := env["QUOTE"] + "|" + env["MULTILINE"]; string(out) != want {
		t.Fatalf("got %q, want %q", out, want)
	}
}

func TestRedactHidesCredentials(t *testing.T) {
	got := redact("https://x-access-token:ghs_secret@github.com/acme/shop.git")
	if strings.Contains(got, "ghs_secret") || got != "https://***@github.com/acme/shop.git" {
		t.Fatalf("redact = %s", got)
	}
}
