package sh

import (
	"context"
	"strings"
	"testing"
)

func TestCapKeepsStartAndEnd(t *testing.T) {
	long := "docker run --name partition-x " + strings.Repeat("-v a:b ", 200) + "failed: no sysbox-mgr"
	got := Cap(long, 500)
	if len(got) > 500 || !strings.HasPrefix(got, "docker run") || !strings.HasSuffix(got, "no sysbox-mgr") {
		t.Fatalf("Cap = %d bytes: %q", len(got), got)
	}
	if Cap("short", 500) != "short" {
		t.Error("a short error stays as it is")
	}
}

// A failure names the command and its first two arguments, not later ones
// (a script, a secret), and ends with its output.
func TestRunErrorLeavesOutLaterArguments(t *testing.T) {
	_, err := Run(context.Background(), "sh", "-c", "echo fail-$((1+1)) >&2; exit 3", "secret-token")
	if err == nil || !strings.Contains(err.Error(), "fail-2") || strings.Contains(err.Error(), "secret-token") {
		t.Fatalf("err = %v", err)
	}
	out, err := RunInput(context.Background(), "from stdin", "cat")
	if err != nil || out != "from stdin" {
		t.Fatalf("RunInput = %q, %v", out, err)
	}
}
