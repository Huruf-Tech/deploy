package pool

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// Partition network rules (PLAN §26.3), in our own nftables table so they
// run before Docker's and a drop is final. Partition bridges are `hp-<name>`.
const table = "huruf_pool"

// The rules also load at boot, before Docker starts the partitions again:
// nftables.service includes this file.
const (
	rulesFile    = "/etc/huruf-pool.nft"
	nftablesConf = "/etc/nftables.conf"
)

// applyRules loads the table: traffic counters on every machine, and on a
// pool machine (`isolate`) the rules that keep rented partitions apart. A
// customer's own partitions reach their network, as projects on a server do.
func applyRules(ctx context.Context, isolate bool, allowIps []string) error {
	allow := ""
	for _, ip := range allowIps {
		allow += fmt.Sprintf("    iifname \"hp-*\" ip daddr %s accept\n", ip)
	}
	isolation := `  chain forward {
    type filter hook forward priority -10; policy accept;
` + allow + `    # Partitions never reach each other, the cloud's metadata endpoint (the
    # machine's credentials), mail ports, or the machine's private network.
    iifname "hp-*" oifname "hp-*" drop
    iifname "hp-*" ip daddr 169.254.169.254 drop
    iifname "hp-*" tcp dport { 25, 465, 587 } drop
    iifname "hp-*" ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } ct state new drop
  }
  chain input {
    type filter hook input priority -10; policy accept;
    # Nothing on the machine itself is reachable from a partition.
    iifname "hp-*" ct state established,related accept
    iifname "hp-*" drop
  }
`
	if !isolate {
		isolation = ""
	}
	rules := `table inet ` + table + `
delete table inet ` + table + `
table inet ` + table + ` {
` + isolation + `  chain count {
    type filter hook forward priority -20; policy accept;
  }
}
`
	if err := os.WriteFile(rulesFile, []byte(rules), 0o644); err != nil {
		return err
	}
	if out, err := exec.CommandContext(ctx, "nft", "-f", rulesFile).CombinedOutput(); err != nil {
		return fmt.Errorf("nft: %w: %s", err, strings.TrimSpace(string(out)))
	}
	conf, _ := os.ReadFile(nftablesConf)
	include := []byte(`include "` + rulesFile + `"`)
	if !bytes.Contains(conf, include) {
		if len(conf) == 0 {
			conf = []byte("#!/usr/sbin/nft -f\n")
		}
		conf = append(append(conf, include...), '\n')
		if err := os.WriteFile(nftablesConf, conf, 0o755); err != nil {
			return err
		}
	}
	_, err := run(ctx, "systemctl", "enable", "nftables")
	return err
}

// ensureCounters counts a partition's traffic to and from outside the
// machine. They live in memory: re-applied rules or a reboot restart them at
// 0, which readers treat as a reset.
func ensureCounters(ctx context.Context, name string) error {
	if _, err := run(ctx, "nft", "list", "counter", "inet", table, "out_"+name); err == nil {
		return nil
	}
	for _, rule := range [][]string{
		{"add", "counter", "inet", table, "out_" + name},
		{"add", "counter", "inet", table, "in_" + name},
		{"add", "rule", "inet", table, "count", "iifname", bridge(name), "oifname", "!=", "hp-*", "counter", "name", "out_" + name},
		{"add", "rule", "inet", table, "count", "oifname", bridge(name), "iifname", "!=", "hp-*", "counter", "name", "in_" + name},
	} {
		if _, err := run(ctx, "nft", rule...); err != nil {
			return err
		}
	}
	return nil
}

func delCounters(ctx context.Context, name string) {
	out, _ := run(ctx, "nft", "-a", "list", "chain", "inet", table, "count")
	for _, line := range strings.Split(out, "\n") {
		if strings.Contains(line, `"`+bridge(name)+`"`) {
			if i := strings.LastIndex(line, "# handle "); i >= 0 {
				_, _ = run(ctx, "nft", "delete", "rule", "inet", table, "count", "handle", strings.TrimSpace(line[i+9:]))
			}
		}
	}
	_, _ = run(ctx, "nft", "delete", "counter", "inet", table, "out_"+name)
	_, _ = run(ctx, "nft", "delete", "counter", "inet", table, "in_"+name)
}

// readCounters returns the bytes out and in since the partition was created.
func readCounters(ctx context.Context, name string) (out, in int64) {
	read := func(counter string) int64 {
		raw, err := run(ctx, "nft", "-j", "list", "counter", "inet", table, counter)
		if err != nil {
			return 0
		}
		var doc struct {
			Nftables []struct {
				Counter *struct {
					Bytes int64 `json:"bytes"`
				} `json:"counter"`
			} `json:"nftables"`
		}
		if json.Unmarshal([]byte(raw), &doc) != nil {
			return 0
		}
		for _, item := range doc.Nftables {
			if item.Counter != nil {
				return item.Counter.Bytes
			}
		}
		return 0
	}
	return read("out_" + name), read("in_" + name)
}
