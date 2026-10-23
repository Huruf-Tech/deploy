package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/cleanup"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/ledger"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/mesh"
)

// uninstall: `huruf-deploy-agent uninstall [-yes] [-purge-data]`. Without
// -yes it only prints what would be removed and kept.
func uninstall(args []string) int {
	flags := flag.NewFlagSet("uninstall", flag.ExitOnError)
	yes := flags.Bool("yes", false, "remove (otherwise only show the plan)")
	purgeData := flags.Bool("purge-data", false, "also delete project data volumes")
	stateDir := flags.String("state-dir", "/var/lib/huruf-deploy-agent", "the agent's state directory")
	keep := flags.String("keep", "", "comma-separated step ids to keep although planned")
	remove := flags.String("remove", "", "comma-separated step ids to remove although kept")
	_ = flags.Parse(args)

	if os.Geteuid() != 0 {
		fmt.Fprintln(os.Stderr, "Run as root: sudo huruf-deploy-agent uninstall")
		return 1
	}
	// The dashboard's terminal is a child of the agent: stopping the agent
	// would kill this halfway.
	if *yes && insideAgent() {
		fmt.Fprintln(os.Stderr, "This terminal runs inside the agent, which uninstalling stops. Use SSH, or Remove server in the dashboard.")
		return 1
	}

	ledger.Path = filepath.Join(*stateDir, "ledger.jsonl")
	ctx := context.Background()
	network := &mesh.Mesh{Dir: *stateDir}
	steps := cleanup.Plan(ctx, cleanup.Options{
		StateDir: *stateDir, Keep: ids(*keep), Remove: ids(*remove), PurgeData: *purgeData, Teardown: network.Teardown,
	})

	fmt.Println("Will remove:")
	for _, s := range steps {
		if s.Remove {
			fmt.Printf("  - [%s] %s\n", s.ID, s.Item)
		}
	}
	fmt.Println("Will keep:")
	for _, s := range steps {
		if !s.Remove {
			reason := s.Reason
			if reason == "" {
				reason = "your choice"
			}
			fmt.Printf("  - [%s] %s (%s)\n", s.ID, s.Item, reason)
		}
	}
	if !*yes {
		fmt.Println("\nNothing was changed. Run again with -yes to remove. Change the plan with" +
			" -keep id,id (keep planned removals) and -remove id,id (e.g. -remove data-volumes).")
		return 0
	}

	fmt.Println()
	err := cleanup.Execute(ctx, steps, func(s cleanup.Step, err error) {
		if err != nil {
			fmt.Printf("✗ %s: %v\n", s.Item, err)
		} else {
			fmt.Printf("✓ %s\n", s.Item)
		}
	})
	if err != nil {
		fmt.Println("\nSome steps failed (above); the rest is removed.")
		return 1
	}
	fmt.Println("\nHuruf Deploy is uninstalled.")
	return 0
}

func ids(list string) []string {
	var out []string
	for _, id := range strings.Split(list, ",") {
		if id = strings.TrimSpace(id); id != "" {
			out = append(out, id)
		}
	}
	return out
}

func insideAgent() bool {
	raw, err := os.ReadFile("/proc/self/cgroup")
	return err == nil && strings.Contains(string(raw), cleanup.Service+".service")
}
