package pool

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// LXCFS makes a partition's /proc show its own limits (PLAN §28): `top`,
// `free` and /proc/cpuinfo inside report its memory and vCPUs, not the
// machine's, so a renter neither misreads nor learns the machine's size.
// Partitions bind its files over theirs; while it's down they'd fail to read
// them, so the agent restarts it and the partitions using it.

// lxcfsRoot is where LXCFS mounts; tests point it elsewhere.
var lxcfsRoot = "/var/lib/lxcfs"

// lxcfsFiles are the /proc files partitions take from LXCFS.
var lxcfsFiles = []string{"cpuinfo", "meminfo", "stat", "uptime", "loadavg", "diskstats", "swaps"}

const lxcfsDropIn = `[Service]
ExecStart=
ExecStart=/usr/bin/lxcfs --enable-cfs /var/lib/lxcfs
`

// ensureLxcfs installs LXCFS and starts it with CPU limits shown
// (--enable-cfs). Best effort: without it, partitions show the machine's
// totals in /proc, as before.
func ensureLxcfs(ctx context.Context, notes *[]string) {
	if _, err := exec.LookPath("lxcfs"); err != nil {
		if _, err := sh.Run(ctx, "sh", "-c", "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq lxcfs"); err != nil {
			*notes = append(*notes, "LXCFS couldn't be installed: partitions show the machine's totals in /proc")
			return
		}
		*notes = append(*notes, "LXCFS installed")
	}
	dropIn := "/etc/systemd/system/lxcfs.service.d/huruf.conf"
	current, _ := os.ReadFile(dropIn)
	changed := string(current) != lxcfsDropIn
	if changed {
		_ = os.MkdirAll(filepath.Dir(dropIn), 0o755)
		if err := os.WriteFile(dropIn, []byte(lxcfsDropIn), 0o644); err != nil {
			*notes = append(*notes, "LXCFS: "+err.Error())
			return
		}
		_, _ = sh.Run(ctx, "systemctl", "daemon-reload")
	}
	_, _ = sh.Run(ctx, "systemctl", "enable", "lxcfs")
	// Restarting it breaks the files partitions hold: only when nothing
	// uses it yet (its options changed) or it isn't running.
	if _, err := sh.Run(ctx, "systemctl", "is-active", "lxcfs"); err != nil ||
		(changed && len(lxcfsUsers(ctx)) == 0) {
		_, _ = sh.Run(ctx, "systemctl", "restart", "lxcfs")
	}
	if !lxcfsReady() {
		*notes = append(*notes, "LXCFS isn't running: partitions show the machine's totals in /proc")
	}
}

// lxcfsReady says whether LXCFS answers.
func lxcfsReady() bool {
	_, err := os.ReadFile(filepath.Join(lxcfsRoot, "proc", "meminfo"))
	return err == nil
}

// lxcfsArgs mounts LXCFS's /proc files into a new partition, when it answers.
func lxcfsArgs() []string {
	if !lxcfsReady() {
		return nil
	}
	var args []string
	for _, f := range lxcfsFiles {
		src := filepath.Join(lxcfsRoot, "proc", f)
		if _, err := os.Stat(src); err == nil {
			args = append(args, "-v", src+":/proc/"+f+":ro")
		}
	}
	return args
}

// lxcfsUsers are the partitions holding LXCFS's files.
func lxcfsUsers(ctx context.Context) []string {
	var users []string
	out := sh.Output(ctx, "docker", "ps", "-a", "--filter", "label=huruf.partition",
		"--format", `{{.Label "huruf.partition"}}`)
	for _, name := range strings.Fields(out) {
		mounts := sh.Output(ctx, "docker", "inspect", "-f",
			"{{range .Mounts}}{{.Source}} {{end}}", container(name))
		if strings.Contains(mounts, lxcfsRoot) {
			users = append(users, name)
		}
	}
	return users
}

var (
	lxcfsHealMu   sync.Mutex
	lxcfsHealedAt time.Time
)

// healLxcfs restarts LXCFS when partitions use it and it stopped answering,
// then those partitions, whose files broke with it. At most every 5 minutes.
func healLxcfs(ctx context.Context) {
	if lxcfsReady() {
		return
	}
	lxcfsHealMu.Lock()
	defer lxcfsHealMu.Unlock()
	if time.Since(lxcfsHealedAt) < 5*time.Minute {
		return
	}
	lxcfsHealedAt = time.Now()
	users := lxcfsUsers(ctx)
	if len(users) == 0 {
		return
	}
	_, _ = sh.Run(ctx, "systemctl", "restart", "lxcfs")
	for range 10 {
		if lxcfsReady() {
			break
		}
		time.Sleep(time.Second)
	}
	for _, name := range users {
		_, _ = sh.Run(ctx, "docker", "restart", "-t", "30", container(name))
	}
}
