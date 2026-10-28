package pool

import (
	"context"
	"os"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// Ubuntu 25.10 and later confine fusermount3 with an AppArmor profile that
// only allows FUSE mounts under home, /mnt, /media, /tmp and the like. Sysbox
// mounts each partition's emulated /proc and /sys under /var/lib/sysboxfs, so
// every partition fails to start ("fusermount3: mount failed: Permission
// denied"). The profile includes local/fusermount3: that path alone is added.

var fusermountProfile = "/etc/apparmor.d/fusermount3"

const sysboxFuseRule = `# Huruf: Sysbox mounts each partition's emulated /proc and /sys here.
mount fstype=@{fuse_types} -> /var/lib/sysboxfs/**/,
umount /var/lib/sysboxfs/**/,
`

// allowSysboxFuse adds the rule when the machine has the profile. Best
// effort: a failure is a note (partitions then fail to start, with the reason).
func allowSysboxFuse(ctx context.Context, notes *[]string) {
	profile, err := os.ReadFile(fusermountProfile)
	if err != nil {
		return // no profile: nothing confines fusermount3
	}
	if !strings.Contains(string(profile), "local/fusermount3") {
		*notes = append(*notes, "AppArmor's fusermount3 profile has no local rules: Sysbox may fail to start partitions")
		return
	}
	local := strings.Replace(fusermountProfile, "apparmor.d/", "apparmor.d/local/", 1)
	current, _ := os.ReadFile(local)
	if strings.Contains(string(current), "/var/lib/sysboxfs/") {
		return
	}
	f, err := os.OpenFile(local, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err == nil {
		_, err = f.WriteString(sysboxFuseRule)
		if cerr := f.Close(); err == nil {
			err = cerr
		}
	}
	if err == nil {
		_, err = sh.Run(ctx, "apparmor_parser", "-r", fusermountProfile)
	}
	if err != nil {
		*notes = append(*notes, "AppArmor: couldn't allow Sysbox's mounts: "+err.Error())
		return
	}
	*notes = append(*notes, "AppArmor: allowed Sysbox's mounts for fusermount3")
}
