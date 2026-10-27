// Package sh runs the host commands the agent drives (docker, nft, ip, …).
package sh

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

// Run runs a command and returns its combined output. A failure names the
// command and its first two arguments (later ones may be secrets or scripts)
// and ends with the output's last lines.
func Run(ctx context.Context, name string, args ...string) (string, error) {
	return RunWith(ctx, nil, nil, name, args...)
}

// RunInput is Run with `input` on stdin, e.g. a secret kept off the command line.
func RunInput(ctx context.Context, input string, name string, args ...string) (string, error) {
	return RunWith(ctx, strings.NewReader(input), nil, name, args...)
}

// RunWith is Run with stdin and `env` added to the agent's environment.
func RunWith(ctx context.Context, stdin io.Reader, env []string, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Stdin = stdin
	if env != nil {
		cmd.Env = append(os.Environ(), env...)
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("%s: %w: %s", strings.Join(append([]string{name}, args[:min(2, len(args))]...), " "), err, Tail(strings.TrimSpace(string(out)), 300))
	}
	return string(out), nil
}

// Output is the command's output, ignoring a failure.
func Output(ctx context.Context, name string, args ...string) string {
	out, _ := Run(ctx, name, args...)
	return out
}

// Tail keeps the last n bytes of s, marked when cut.
func Tail(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return "…" + strings.ToValidUTF8(s[len(s)-n:], "")
}

// Cap keeps s within n bytes: its start says what ran, its end why it failed.
func Cap(s string, n int) string {
	if len(s) <= n {
		return s
	}
	const gap = " … "
	head := min(200, (n-len(gap))/2)
	return strings.ToValidUTF8(s[:head], "") + gap + strings.ToValidUTF8(s[len(s)-(n-head-len(gap)):], "")
}

// Iptables adds the rule at the top of its chain (`present`) or removes it,
// whichever is needed.
func Iptables(ctx context.Context, present bool, rule ...string) error {
	_, missing := Run(ctx, "iptables", append([]string{"-C"}, rule...)...)
	switch {
	case present && missing != nil:
		_, err := Run(ctx, "iptables", append([]string{"-I"}, rule...)...)
		return err
	case !present && missing == nil:
		_, err := Run(ctx, "iptables", append([]string{"-D"}, rule...)...)
		return err
	}
	return nil
}
