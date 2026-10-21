package pty

import (
	"bytes"
	"io"
	"os/exec"
	"strings"
	"testing"
	"time"
)

// A real round trip through a pty: the shell sees a terminal of the given
// size, echoes input, and the session ends when the shell exits.
func TestShellOnAPty(t *testing.T) {
	master, err := Start(exec.Command("sh"), 120, 40)
	if err != nil {
		t.Fatal(err)
	}
	defer master.Close()

	if _, err := master.Write([]byte("[ -t 0 ] && echo IS-TTY; stty size; exit\n")); err != nil {
		t.Fatal(err)
	}

	var out bytes.Buffer
	done := make(chan struct{})
	go func() { _, _ = io.Copy(&out, master); close(done) }()
	select {
	case <-done: // EIO once the shell exits and the slave closes
	case <-time.After(5 * time.Second):
		t.Fatal("shell did not exit")
	}

	text := out.String()
	if !strings.Contains(text, "IS-TTY") {
		t.Errorf("stdin is not a terminal: %q", text)
	}
	if !strings.Contains(text, "40 120") {
		t.Errorf("size not applied: %q", text)
	}
}
