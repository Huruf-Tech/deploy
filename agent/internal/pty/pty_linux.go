// Package pty starts processes on a pseudo-terminal (PLAN §3.6 terminal),
// using only the standard library: /dev/ptmx plus three ioctls.
package pty

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"unsafe"
)

func ioctl(fd, request, arg uintptr) error {
	if _, _, errno := syscall.Syscall(syscall.SYS_IOCTL, fd, request, arg); errno != 0 {
		return errno
	}
	return nil
}

// Start runs cmd with a new terminal as its stdin, stdout, stderr and
// controlling terminal. The returned master end carries the session both ways.
func Start(cmd *exec.Cmd, cols, rows int) (*os.File, error) {
	master, err := os.OpenFile("/dev/ptmx", os.O_RDWR|syscall.O_NOCTTY|syscall.O_CLOEXEC, 0)
	if err != nil {
		return nil, err
	}

	var unlock int32
	if err := ioctl(master.Fd(), syscall.TIOCSPTLCK, uintptr(unsafe.Pointer(&unlock))); err != nil {
		master.Close()
		return nil, fmt.Errorf("unlocking pty: %w", err)
	}
	var number uint32
	if err := ioctl(master.Fd(), syscall.TIOCGPTN, uintptr(unsafe.Pointer(&number))); err != nil {
		master.Close()
		return nil, fmt.Errorf("reading pty number: %w", err)
	}

	slave, err := os.OpenFile(fmt.Sprintf("/dev/pts/%d", number), os.O_RDWR|syscall.O_NOCTTY, 0)
	if err != nil {
		master.Close()
		return nil, err
	}
	defer slave.Close()

	if err := Resize(master, cols, rows); err != nil {
		master.Close()
		return nil, err
	}

	cmd.Stdin, cmd.Stdout, cmd.Stderr = slave, slave, slave
	// A new session whose controlling terminal is the pty (fd 0 in the child).
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true, Setctty: true, Ctty: 0}
	if err := cmd.Start(); err != nil {
		master.Close()
		return nil, err
	}
	return master, nil
}

// Resize tells the terminal (and the program in it) its new size.
func Resize(master *os.File, cols, rows int) error {
	size := struct{ rows, cols, x, y uint16 }{uint16(rows), uint16(cols), 0, 0}
	return ioctl(master.Fd(), syscall.TIOCSWINSZ, uintptr(unsafe.Pointer(&size)))
}
