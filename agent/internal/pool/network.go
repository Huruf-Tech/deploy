package pool

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
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

// replaceTable is nft input that replaces a whole table: declaring it first
// lets the delete succeed when it doesn't exist yet.
func replaceTable(family, name, body string) string {
	t := "table " + family + " " + name
	return t + "\n" + "delete " + t + "\n" + t + " {\n" + body + "}\n"
}

// loadRules applies nft input in one transaction.
func loadRules(ctx context.Context, rules string) error {
	_, err := sh.RunInput(ctx, rules, "nft", "-f", "-")
	return err
}

// persist keeps rules for boot in `file`, included by nftables.conf.
func persist(file, rules string) error {
	if err := os.WriteFile(file, []byte(rules), 0o644); err != nil {
		return err
	}
	conf, _ := os.ReadFile(nftablesConf)
	include := []byte(`include "` + file + `"`)
	if bytes.Contains(conf, include) {
		return nil
	}
	if len(conf) == 0 {
		conf = []byte("#!/usr/sbin/nft -f\n")
	}
	return os.WriteFile(nftablesConf, append(append(conf, include...), '\n'), 0o755)
}

// applyRules loads the traffic counters' table. Rentals are isolated one by
// one in their own table (isolate.go, PLAN §28).
func applyRules(ctx context.Context) error {
	rules := replaceTable("inet", table, `  chain count {
    type filter hook forward priority -20; policy accept;
  }
`)
	if err := loadRules(ctx, rules); err != nil {
		return err
	}
	if err := persist(rulesFile, rules); err != nil {
		return err
	}
	_, err := sh.Run(ctx, "systemctl", "enable", "nftables")
	return err
}

// ensureCounters counts a partition's traffic to and from outside the
// machine. They live in memory: re-applied rules or a reboot restart them at
// 0, which readers treat as a reset.
func ensureCounters(ctx context.Context, name string) error {
	if _, err := sh.Run(ctx, "nft", "list", "counter", "inet", table, "out_"+name); err == nil {
		return nil
	}
	for _, rule := range [][]string{
		{"add", "counter", "inet", table, "out_" + name},
		{"add", "counter", "inet", table, "in_" + name},
		{"add", "rule", "inet", table, "count", "iifname", bridge(name), "oifname", "!=", "hp-*", "counter", "name", "out_" + name},
		{"add", "rule", "inet", table, "count", "oifname", bridge(name), "iifname", "!=", "hp-*", "counter", "name", "in_" + name},
	} {
		if _, err := sh.Run(ctx, "nft", rule...); err != nil {
			return err
		}
	}
	return nil
}

func delCounters(ctx context.Context, name string) {
	out := sh.Output(ctx, "nft", "-a", "list", "chain", "inet", table, "count")
	for _, line := range strings.Split(out, "\n") {
		if strings.Contains(line, `"`+bridge(name)+`"`) {
			if i := strings.LastIndex(line, "# handle "); i >= 0 {
				_, _ = sh.Run(ctx, "nft", "delete", "rule", "inet", table, "count", "handle", strings.TrimSpace(line[i+9:]))
			}
		}
	}
	_, _ = sh.Run(ctx, "nft", "delete", "counter", "inet", table, "out_"+name)
	_, _ = sh.Run(ctx, "nft", "delete", "counter", "inet", table, "in_"+name)
}

// readCounters is every counter's bytes (out_<name> and in_<name>), since
// its partition was created.
func readCounters(ctx context.Context) map[string]int64 {
	return parseCounters(sh.Output(ctx, "nft", "-j", "list", "table", "inet", table))
}

func parseCounters(raw string) map[string]int64 {
	var doc struct {
		Nftables []struct {
			Counter *struct {
				Name  string `json:"name"`
				Bytes int64  `json:"bytes"`
			} `json:"counter"`
		} `json:"nftables"`
	}
	counters := map[string]int64{}
	if json.Unmarshal([]byte(raw), &doc) != nil {
		return counters
	}
	for _, item := range doc.Nftables {
		if item.Counter != nil {
			counters[item.Counter.Name] = item.Counter.Bytes
		}
	}
	return counters
}
