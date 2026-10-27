package pool

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// Rented partitions are isolated one by one (PLAN §28): a machine also runs
// its owner's own partitions and other tools, which keep their network. The
// rules live in their own table, so rewriting them leaves the traffic
// counters (table huruf_pool) alone, and a file loaded at boot before Docker
// starts the partitions again.
const (
	isolateTable = "huruf_isolate"
	isolateFile  = "/etc/huruf-isolate.nft"
)

// isolateRules is the table for these rented partitions' bridges.
func isolateRules(bridges, allowIps []string) string {
	elements := ""
	if len(bridges) > 0 {
		quoted := make([]string, len(bridges))
		for i, b := range bridges {
			quoted[i] = `"` + b + `"`
		}
		elements = "\n    elements = { " + strings.Join(quoted, ", ") + " }"
	}
	allow := ""
	for _, ip := range allowIps {
		allow += fmt.Sprintf("    iifname @rented ip daddr %s accept\n", ip)
	}
	return `table inet ` + isolateTable + `
delete table inet ` + isolateTable + `
table inet ` + isolateTable + ` {
  set rented {
    type ifname;` + elements + `
  }
  chain forward {
    type filter hook forward priority -10; policy accept;
` + allow + `    # A rental never reaches another partition (or is reached from one), the
    # cloud's metadata endpoint (the machine's credentials), mail ports, or
    # the machine's private network.
    iifname @rented oifname "hp-*" drop
    iifname "hp-*" oifname @rented drop
    iifname @rented ip daddr 169.254.169.254 drop
    iifname @rented tcp dport { 25, 465, 587 } drop
    iifname @rented ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } ct state new drop
  }
  chain input {
    type filter hook input priority -10; policy accept;
    # Nothing on the machine itself is reachable from a rental.
    iifname @rented ct state established,related accept
    iifname @rented drop
  }
}
`
}

// Isolate applies the rules to these partitions and keeps them for boot.
func (Sysbox) Isolate(ctx context.Context, names, allowIps []string) error {
	bridges := make([]string, len(names))
	for i, n := range names {
		bridges[i] = bridge(n)
	}
	rules := isolateRules(bridges, allowIps)
	cmd := exec.CommandContext(ctx, "nft", "-f", "-")
	cmd.Stdin = strings.NewReader(rules)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("nft: %w: %s", err, strings.TrimSpace(string(out)))
	}
	if err := os.WriteFile(isolateFile, []byte(rules), 0o644); err != nil {
		return err
	}
	conf, _ := os.ReadFile(nftablesConf)
	include := []byte(`include "` + isolateFile + `"`)
	if !bytes.Contains(conf, include) {
		if len(conf) == 0 {
			conf = []byte("#!/usr/sbin/nft -f\n")
		}
		if err := os.WriteFile(nftablesConf, append(append(conf, include...), '\n'), 0o755); err != nil {
			return err
		}
	}
	return nil
}
