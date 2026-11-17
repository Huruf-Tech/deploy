package pool

import (
	"context"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// Sysbox serves each partition's /proc and handles its mounts while it runs.
// Restarted under running partitions (an unattended library update's
// needrestart, a crash), it no longer knows them: nothing new starts inside
// ("function not implemented" mounting image layers, "unsafe procfs" on
// exec) until each is restarted. Found on a machine on 2026-11-17.

// needrestartConf keeps Ubuntu's needrestart from restarting Sysbox after an
// update; its services restart with the machine instead.
const needrestartConf = "/etc/needrestart/conf.d/huruf-sysbox.conf"

const needrestartRule = "# Huruf Deploy: restarting Sysbox breaks running partitions.\n$nrconf{override_rc}{qr(^sysbox)} = 0;\n"

// keepSysboxRunning writes the rule where needrestart is installed.
func keepSysboxRunning(notes *[]string) {
	if _, err := os.Stat("/etc/needrestart"); err != nil {
		return
	}
	if current, _ := os.ReadFile(needrestartConf); string(current) == needrestartRule {
		return
	}
	_ = os.MkdirAll(filepath.Dir(needrestartConf), 0o755)
	if err := os.WriteFile(needrestartConf, []byte(needrestartRule), 0o644); err != nil {
		*notes = append(*notes, "needrestart may restart Sysbox: "+err.Error())
	}
}

// sysboxStart is when Sysbox's services last started, in Unix seconds; 0
// when unknown (not running, or systemd can't say).
func sysboxStart(ctx context.Context) int64 {
	out := sh.Output(ctx, "systemctl", "show", "--timestamp=unix", "-p", "ActiveEnterTimestamp", "--value", "sysbox-mgr", "sysbox-fs")
	return latestUnix(out)
}

// latestUnix is the latest of systemd's `@<seconds>` timestamps, one a line.
func latestUnix(out string) int64 {
	var latest int64
	for _, line := range strings.Fields(out) {
		if n, err := strconv.ParseInt(strings.TrimPrefix(line, "@"), 10, 64); err == nil && n > latest {
			latest = n
		}
	}
	return latest
}

// orphaned are the running partitions started before Sysbox last was, from
// `docker inspect` lines of `<name> <StartedAt>`.
func orphaned(inspect string, since int64) []string {
	var names []string
	for _, line := range strings.Split(inspect, "\n") {
		f := strings.Fields(line)
		if len(f) != 2 || !validName.MatchString(f[0]) {
			continue
		}
		started, err := time.Parse(time.RFC3339Nano, f[1])
		if err == nil && started.Unix() < since {
			names = append(names, f[0])
		}
	}
	return names
}

var (
	sysboxHealMu   sync.Mutex
	sysboxHealedAt time.Time
)

// healSysbox restarts the partitions Sysbox no longer knows. At most every 5
// minutes, so a partition that won't come back isn't restarted in a loop.
func healSysbox(ctx context.Context) {
	since := sysboxStart(ctx)
	if since == 0 {
		return
	}
	ids := strings.Fields(sh.Output(ctx, "docker", "ps", "-q", "--filter", "label=huruf.partition"))
	if len(ids) == 0 {
		return
	}
	stale := orphaned(sh.Output(ctx, "docker", append([]string{"inspect", "-f",
		`{{index .Config.Labels "huruf.partition"}} {{.State.StartedAt}}`}, ids...)...), since)
	if len(stale) == 0 {
		return
	}
	sysboxHealMu.Lock()
	defer sysboxHealMu.Unlock()
	if time.Since(sysboxHealedAt) < 5*time.Minute {
		return
	}
	sysboxHealedAt = time.Now()
	for _, name := range stale {
		_, _ = sh.Run(ctx, "docker", "restart", "-t", "30", container(name))
	}
}
