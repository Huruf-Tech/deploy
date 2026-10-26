package pool

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

// What every machine has besides partitions (PLAN §27): ports forwarded into
// partitions, and the teardown uninstall runs.

// forwardTable holds the machine's forwards into its partitions: public ports
// and each partition's private-network port (PLAN §27.3).
const forwardTable = "huruf_forward"

// dockerOnVolume: a pool machine's Docker keeps its data on the partition
// volume (§26.5); a machine's stays where it was.
func dockerOnVolume(ctx context.Context) bool {
	out, err := run(ctx, "docker", "info", "--format", "{{.DockerRootDir}}")
	return err == nil && strings.TrimSpace(out) == engineRoot
}

func containerIP(ctx context.Context, name string) string {
	out, _ := run(ctx, "docker", "inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", container(name))
	return strings.TrimSpace(out)
}

// acceptForwarded lets traffic we forwarded reach partition bridges: Docker
// 29 drops routed traffic to ports it didn't publish itself (spike 17a).
// DOCKER-USER runs first in Docker's FORWARD chain.
var acceptForwarded = []string{"DOCKER-USER", "-o", "hp-+", "-m", "conntrack", "--ctstate", "DNAT", "-j", "ACCEPT"}

func ensureAcceptForwarded(ctx context.Context) error {
	if _, err := run(ctx, "iptables", append([]string{"-C"}, acceptForwarded...)...); err == nil {
		return nil
	}
	_, err := run(ctx, "iptables", append([]string{"-I"}, acceptForwarded...)...)
	return err
}

// Forward replaces the machine's forwards. A partition that isn't running has
// no address, so its forwards wait until it starts (Start re-applies them).
// `added` are new since the last time: connection tracking may hold a flow
// to that port from before the rule, which would never be forwarded.
func (Sysbox) Forward(ctx context.Context, forwards, added []protocol.PortForward) error {
	ips := map[string]string{}
	for _, f := range forwards {
		if _, ok := ips[f.Partition]; !ok {
			ips[f.Partition] = containerIP(ctx, f.Partition)
		}
	}
	cmd := exec.CommandContext(ctx, "nft", "-f", "-")
	cmd.Stdin = strings.NewReader(forwardRules(forwards, ips))
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("nft: %w: %s", err, strings.TrimSpace(string(out)))
	}
	if err := ensureAcceptForwarded(ctx); err != nil {
		return err
	}
	for _, f := range added {
		_, _ = run(ctx, "conntrack", "-D", "-p", f.Protocol, "--orig-port-dst", fmt.Sprint(f.Port))
	}
	return nil
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
	return "table ip " + forwardTable + "\ndelete table ip " + forwardTable + "\ntable ip " + forwardTable + ` {
  chain prerouting {
    type nat hook prerouting priority dstnat; policy accept;
` + rules.String() + `  }
}
`
}

// RemoveAll removes every partition with its data and everything the host
// role set up for them (uninstall, PLAN §27.4). A pool machine's volume stays
// when Docker's own data is on it. Missing pieces are skipped.
func RemoveAll(ctx context.Context) (note string, err error) {
	if ids := strings.Fields(must(run(ctx, "docker", "ps", "-aq", "--filter", "label=huruf.partition"))); len(ids) > 0 {
		if _, err := run(ctx, "docker", append([]string{"rm", "-f"}, ids...)...); err != nil {
			return "", err
		}
	}
	for _, id := range strings.Fields(must(run(ctx, "docker", "network", "ls", "-q", "--filter", "name=hp-"))) {
		_, _ = run(ctx, "docker", "network", "rm", id)
	}
	images := strings.Fields(must(run(ctx, "docker", "images", "-q", "--filter", "label="+movedLabel)))
	if out, err := run(ctx, "docker", "images", "-q", image); err == nil {
		images = append(images, strings.Fields(out)...)
	}
	if len(images) > 0 {
		_, _ = run(ctx, "docker", append([]string{"rmi", "-f"}, images...)...)
	}

	_, _ = run(ctx, "nft", "delete", "table", "inet", table)
	_, _ = run(ctx, "nft", "delete", "table", "ip", forwardTable)
	_, _ = run(ctx, "iptables", append([]string{"-D"}, acceptForwarded...)...)
	_ = os.Remove(rulesFile)
	if conf, err := os.ReadFile(nftablesConf); err == nil {
		include := []byte(`include "` + rulesFile + `"` + "\n")
		if bytes.Contains(conf, include) {
			_ = os.WriteFile(nftablesConf, bytes.ReplaceAll(conf, include, nil), 0o755)
		}
	}

	if dockerOnVolume(ctx) {
		return "The partition volume stays: Docker's own data is on it (" + engineRoot + ")", nil
	}
	if _, err := run(ctx, "mountpoint", "-q", Root); err == nil {
		if _, err := run(ctx, "umount", Root); err != nil {
			return "", err
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
	return "", nil
}
