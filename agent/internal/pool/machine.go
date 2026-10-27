package pool

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"slices"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// What every machine has besides partitions (PLAN §27): ports forwarded into
// partitions, and the teardown uninstall runs.

// forwardTable holds the machine's forwards into its partitions: public ports
// and each partition's private-network port (PLAN §27.3).
const forwardTable = "huruf_forward"

// containerIPs are these partitions' addresses; one that isn't running has none.
func containerIPs(ctx context.Context, names []string) map[string]string {
	ips := map[string]string{}
	if len(names) == 0 {
		return ips
	}
	args := []string{"inspect", "-f", "{{.Name}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"}
	for _, name := range names {
		args = append(args, container(name))
	}
	out, _ := sh.Run(ctx, "docker", args...) // a missing one fails it; the others are listed
	for _, line := range strings.Split(out, "\n") {
		if f := strings.Fields(line); len(f) == 2 {
			if name, ok := strings.CutPrefix(f[0], "/"+container("")); ok {
				ips[name] = f[1]
			}
		}
	}
	return ips
}

// acceptForwarded lets traffic we forwarded reach partition bridges: Docker
// 29 drops routed traffic to ports it didn't publish itself (spike 17a).
// DOCKER-USER runs first in Docker's FORWARD chain.
var acceptForwarded = []string{"DOCKER-USER", "-o", "hp-+", "-m", "conntrack", "--ctstate", "DNAT", "-j", "ACCEPT"}

// Forward replaces the machine's forwards. A partition that isn't running has
// no address, so its forwards wait until it runs. `added` are new since the
// last time: connection tracking may hold a flow to that port from before
// the rule, which would never be forwarded.
func (d *Sysbox) Forward(ctx context.Context, forwards, added []protocol.PortForward) ([]string, error) {
	var names []string
	for _, f := range forwards {
		if !slices.Contains(names, f.Partition) && validName.MatchString(f.Partition) {
			names = append(names, f.Partition)
		}
	}
	ips := containerIPs(ctx, names)
	var waiting []string
	for _, name := range names {
		if ips[name] == "" {
			waiting = append(waiting, name)
		}
	}
	if err := loadRules(ctx, forwardRules(forwards, ips)); err != nil {
		return waiting, err
	}
	if err := sh.Iptables(ctx, true, acceptForwarded...); err != nil {
		return waiting, err
	}
	for _, f := range added {
		_, _ = sh.Run(ctx, "conntrack", "-D", "-p", f.Protocol, "--orig-port-dst", fmt.Sprint(f.Port))
	}
	return waiting, nil
}

// forwardRules is the forward table for these partition addresses. Only
// traffic to the machine itself is forwarded (`fib daddr type local`): a
// partition's own connections to the same port elsewhere, e.g. another
// machine's forwarded private-network port, must go out (found in 17).
func forwardRules(forwards []protocol.PortForward, ips map[string]string) string {
	var rules strings.Builder
	for _, f := range forwards {
		if ip := ips[f.Partition]; ip != "" {
			fmt.Fprintf(&rules, "    fib daddr type local %s dport %d dnat to %s:%d\n", f.Protocol, f.Port, ip, f.To)
		}
	}
	return replaceTable("ip", forwardTable, `  chain prerouting {
    type nat hook prerouting priority dstnat; policy accept;
`+rules.String()+`  }
`)
}

// RemoveAll removes every partition with its data and everything the host
// role set up for them (uninstall, PLAN §27.4). Missing pieces are skipped.
func RemoveAll(ctx context.Context) error {
	if ids := strings.Fields(sh.Output(ctx, "docker", "ps", "-aq", "--filter", "label=huruf.partition")); len(ids) > 0 {
		if _, err := sh.Run(ctx, "docker", append([]string{"rm", "-f"}, ids...)...); err != nil {
			return err
		}
	}
	for _, id := range strings.Fields(sh.Output(ctx, "docker", "network", "ls", "-q", "--filter", "name=hp-")) {
		_, _ = sh.Run(ctx, "docker", "network", "rm", id)
	}
	images := strings.Fields(sh.Output(ctx, "docker", "images", "-q", "--filter", "label="+movedLabel))
	images = append(images, strings.Fields(sh.Output(ctx, "docker", "images", "-q", image))...)
	if len(images) > 0 {
		_, _ = sh.Run(ctx, "docker", append([]string{"rmi", "-f"}, images...)...)
	}

	_, _ = sh.Run(ctx, "nft", "delete", "table", "inet", table)
	_, _ = sh.Run(ctx, "nft", "delete", "table", "ip", forwardTable)
	_, _ = sh.Run(ctx, "nft", "delete", "table", "inet", isolateTable)
	_ = sh.Iptables(ctx, false, acceptForwarded...)
	if conf, err := os.ReadFile(nftablesConf); err == nil {
		for _, file := range []string{rulesFile, isolateFile} {
			conf = bytes.ReplaceAll(conf, []byte(`include "`+file+`"`+"\n"), nil)
		}
		_ = os.WriteFile(nftablesConf, conf, 0o755)
	}
	_ = os.Remove(rulesFile)
	_ = os.Remove(isolateFile)

	if _, err := sh.Run(ctx, "mountpoint", "-q", Root); err == nil {
		if _, err := sh.Run(ctx, "umount", Root); err != nil {
			return err
		}
	}
	if fstab, err := os.ReadFile("/etc/fstab"); err == nil {
		var kept []string
		for _, line := range strings.Split(string(fstab), "\n") {
			if !strings.Contains(line, " "+Root+" ") {
				kept = append(kept, line)
			}
		}
		_ = os.WriteFile("/etc/fstab", []byte(strings.Join(kept, "\n")), 0o644)
	}
	_ = os.Remove(loopFile)
	_ = os.Remove(Root)
	return nil
}
