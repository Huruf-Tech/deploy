// Package cleanup uninstalls the agent: what it created goes, what was on the
// host before (or belongs to another tool, e.g. Dokploy) stays.
//
// Docker objects are matched by the agent's labels and exact names, never by
// a "huruf-" prefix: other tools' apps can be called huruf-tech-something.
// Host changes come from the ledger (package ledger); a server set up before
// the ledger existed gets conservative rules instead.
package cleanup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"slices"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/ledger"
)

const (
	Service    = "huruf-deploy-agent"
	Binary     = "/usr/local/bin/huruf-deploy-agent"
	unitFile   = "/etc/systemd/system/huruf-deploy-agent.service"
	configDir  = "/etc/huruf-deploy-agent"
	secretsDir = "/run/huruf-deploy"
	rcloneDir  = "/var/lib/docker-plugins/rclone"
	daemonJSON = "/etc/docker/daemon.json"
	swarmState = "/var/lib/docker/swarm/state.json"
	// The private network's range (MESH_CIDR); servers set up before the
	// ledger don't record it.
	meshCIDR = "10.209.0.0/16"
)

// Volumes the agent creates by exact name: registry images and edge state.
var ownVolumes = []string{"huruf-registry-data", "huruf-edge-data", "huruf-edge-config"}

// Project volumes are huruf-<project id>-<name> (local and S3).
var projectVolume = regexp.MustCompile(`^huruf-[0-9a-f]{24}-`)

type Step struct {
	Item   string `json:"item"`
	Remove bool   `json:"remove"`
	Reason string `json:"reason,omitempty"`
	do     func(ctx context.Context) error
}

type Options struct {
	StateDir  string
	PurgeData bool
	// Teardown removes the private network (wg0, its rules, the key).
	Teardown func(ctx context.Context) error
	// Run executes a command; tests replace it.
	Run func(ctx context.Context, name string, args ...string) (string, error)
}

// Plan inspects the host and lists every step, removals first in run order.
func Plan(ctx context.Context, o Options) []Step {
	if o.Run == nil {
		o.Run = run
	}
	entries := ledger.Read()
	tracked := ledger.Has(entries, "installed", "")
	var steps []Step
	remove := func(item string, do func(context.Context) error) {
		steps = append(steps, Step{Item: item, Remove: true, do: do})
	}
	keep := func(item, reason string) {
		steps = append(steps, Step{Item: item, Reason: reason})
	}

	// First: a running agent would recreate what the next steps remove.
	remove("The agent service ("+Service+")", func(ctx context.Context) error {
		_, _ = o.Run(ctx, "systemctl", "disable", "--now", Service)
		return nil
	})

	_, dockerErr := o.Run(ctx, "docker", "info", "--format", "{{.ServerVersion}}")
	if dockerErr == nil {
		steps = append(steps, dockerSteps(ctx, o, entries)...)
		if s, ok := daemonStep(o, entries, tracked); ok {
			steps = append(steps, s)
		}
	} else {
		keep("Docker objects", "Docker isn't running, so its containers and volumes can't be listed; start it and run again")
	}

	if o.Teardown != nil {
		remove("The private network (wg0, its firewall rules and key)", o.Teardown)
	}

	if ledger.Has(entries, "package", "wireguard-tools") {
		remove("Package wireguard-tools (installed by the agent)", func(ctx context.Context) error {
			_, err := o.Run(ctx, "sh", "-c", "DEBIAN_FRONTEND=noninteractive apt-get remove -y wireguard-tools")
			return err
		})
	} else if _, err := exec.LookPath("wg"); err == nil {
		keep("Package wireguard-tools", reasonUntracked(tracked, "it was installed before the agent"))
	}

	if ledger.Has(entries, "docker", "") {
		keep("Docker", "installed by the agent, but other tools may use it: remove it yourself (apt-get purge docker-ce docker-ce-cli containerd.io) if nothing does")
	} else {
		keep("Docker", "it was there before the agent")
	}

	for _, f := range []struct{ item, path string }{
		{"Secrets in memory (" + secretsDir + ")", secretsDir},
		{"Configuration (" + configDir + ")", configDir},
		{"State, identity, build workspaces and the registry login (" + o.StateDir + ")", o.StateDir},
	} {
		path := f.path
		if exists(path) {
			remove(f.item, func(context.Context) error { return os.RemoveAll(path) })
		}
	}
	if exists(unitFile) {
		remove("Systemd unit ("+unitFile+")", func(ctx context.Context) error {
			if err := os.Remove(unitFile); err != nil {
				return err
			}
			_, _ = o.Run(ctx, "systemctl", "daemon-reload")
			return nil
		})
	}
	if exists(Binary) {
		remove("The agent binary ("+Binary+")", func(context.Context) error { return os.Remove(Binary) })
	}
	return steps
}

func dockerSteps(ctx context.Context, o Options, entries []ledger.Entry) []Step {
	var steps []Step
	lines := func(args ...string) []string {
		out, err := o.Run(ctx, "docker", args...)
		if err != nil {
			return nil
		}
		return strings.Fields(out)
	}

	if names := lines("ps", "-a", "--filter", "label=deploy.huruf.managed=true", "--format", "{{.Names}}"); len(names) > 0 {
		steps = append(steps, Step{
			Item:   fmt.Sprintf("%d containers: %s", len(names), strings.Join(names, ", ")),
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"rm", "-f"}, names...)...)
				return err
			},
		})
	}

	var own, data []string
	rcloneLeft := false
	out, _ := o.Run(ctx, "docker", "volume", "ls", "--format", "{{.Name}} {{.Driver}}")
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		name, driver, _ := strings.Cut(line, " ")
		switch {
		case slices.Contains(ownVolumes, name):
			own = append(own, name)
		case projectVolume.MatchString(name):
			data = append(data, name)
			if driver == "rclone" && !o.PurgeData {
				rcloneLeft = true
			}
		}
	}
	rmVolumes := func(names []string) func(context.Context) error {
		return func(ctx context.Context) error {
			_, err := o.Run(ctx, "docker", append([]string{"volume", "rm", "-f"}, names...)...)
			return err
		}
	}
	if len(own) > 0 {
		steps = append(steps, Step{Item: "Registry images and edge proxy state: " + strings.Join(own, ", "), Remove: true, do: rmVolumes(own)})
	}
	if len(data) > 0 {
		item := fmt.Sprintf("%d project data volumes: %s", len(data), strings.Join(data, ", "))
		if o.PurgeData {
			steps = append(steps, Step{Item: item, Remove: true, do: rmVolumes(data)})
		} else {
			steps = append(steps, Step{Item: item, Reason: "project data: kept unless you choose to delete it"})
		}
	}

	if ids := unique(lines("images", "-q", "--filter", "label=deploy.huruf.project")); len(ids) > 0 {
		steps = append(steps, Step{
			Item:   fmt.Sprintf("%d images built for projects", len(ids)),
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"rmi", "-f"}, ids...)...)
				return err
			},
		})
	}
	if ids := lines("network", "ls", "-q", "--filter", "label=deploy.huruf.managed=true"); len(ids) > 0 {
		steps = append(steps, Step{
			Item:   "The project network (huruf-internal)",
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"network", "rm"}, ids...)...)
				return err
			},
		})
	}

	if _, err := o.Run(ctx, "docker", "plugin", "inspect", "rclone"); err == nil {
		switch {
		case !ledger.Has(entries, "plugin", "rclone"):
			steps = append(steps, Step{Item: "The rclone volume plugin", Reason: "not recorded as the agent's"})
		case rcloneLeft:
			steps = append(steps, Step{Item: "The rclone volume plugin", Reason: "kept S3 volumes need it"})
		default:
			steps = append(steps, Step{Item: "The rclone volume plugin and its config", Remove: true, do: func(ctx context.Context) error {
				_, _ = o.Run(ctx, "docker", "plugin", "disable", "-f", "rclone")
				if _, err := o.Run(ctx, "docker", "plugin", "rm", "-f", "rclone"); err != nil {
					return err
				}
				return os.RemoveAll(rcloneDir)
			}})
		}
	}

	steps = append(steps, Step{
		Item:   "Base images (caddy, registry) and the build cache",
		Reason: "shared with other tools; `docker image prune` and `docker builder prune` free them",
	})
	return steps
}

// daemonStep restores daemon.json keys the agent set, then reloads Docker
// (a reload, so no container stops).
func daemonStep(o Options, entries []ledger.Entry, tracked bool) (Step, bool) {
	raw, err := os.ReadFile(daemonJSON)
	if err != nil {
		return Step{}, false
	}
	restored, changes, err := RestoreDaemonConfig(raw, entries, tracked, exists(swarmState))
	if err != nil || len(changes) == 0 {
		return Step{}, false
	}
	return Step{
		Item:   daemonJSON + ": " + strings.Join(changes, "; "),
		Remove: true,
		do: func(ctx context.Context) error {
			if err := os.WriteFile(daemonJSON, restored, 0o644); err != nil {
				return err
			}
			_, err := o.Run(ctx, "systemctl", "reload", "docker")
			return err
		},
	}, true
}

// RestoreDaemonConfig undoes the agent's daemon.json changes. Untracked
// servers lose only live-restore and the private network's registry range;
// log settings stay, since they may have been there before.
func RestoreDaemonConfig(raw []byte, entries []ledger.Entry, tracked, swarm bool) ([]byte, []string, error) {
	config := map[string]json.RawMessage{}
	if err := json.Unmarshal(raw, &config); err != nil {
		return nil, nil, err
	}
	var changes []string
	recorded := map[string]bool{}
	for _, e := range entries {
		if e.Kind != "daemon-key" {
			continue
		}
		recorded[e.Name] = true
		switch {
		case e.Absent:
			if _, ok := config[e.Name]; ok {
				delete(config, e.Name)
				changes = append(changes, "remove "+e.Name)
			}
		case e.Name == "live-restore" && swarm:
			// Docker won't start in swarm mode with it.
		default:
			config[e.Name] = e.Prev
			changes = append(changes, "restore "+e.Name)
		}
	}
	if !tracked && !recorded["live-restore"] {
		if _, ok := config["live-restore"]; ok {
			delete(config, "live-restore")
			changes = append(changes, "remove live-restore")
		}
	}

	ranges := []string{}
	for _, e := range entries {
		if e.Kind == "insecure-registry" {
			ranges = append(ranges, e.Name)
		}
	}
	if !tracked {
		ranges = append(ranges, meshCIDR)
	}
	var registries []string
	if err := json.Unmarshal(config["insecure-registries"], &registries); err == nil {
		kept := slices.DeleteFunc(slices.Clone(registries), func(r string) bool { return slices.Contains(ranges, r) })
		if len(kept) != len(registries) {
			changes = append(changes, "remove the private network's registry range")
			if len(kept) == 0 {
				delete(config, "insecure-registries")
			} else {
				config["insecure-registries"], _ = json.Marshal(kept)
			}
		}
	}

	out, err := json.MarshalIndent(config, "", "  ")
	return append(out, '\n'), changes, err
}

// Execute runs the removals in order; a failure doesn't stop the rest.
func Execute(ctx context.Context, steps []Step, report func(Step, error)) error {
	var failed []error
	for _, s := range steps {
		if !s.Remove || s.do == nil {
			continue
		}
		err := s.do(ctx)
		report(s, err)
		if err != nil {
			failed = append(failed, fmt.Errorf("%s: %w", s.Item, err))
		}
	}
	return errors.Join(failed...)
}

func reasonUntracked(tracked bool, reason string) string {
	if tracked {
		return reason
	}
	return "may have been there before the agent (installed before the ledger existed)"
}

func unique(list []string) []string {
	slices.Sort(list)
	return slices.Compact(list)
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func run(ctx context.Context, name string, args ...string) (string, error) {
	out, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("%s: %w: %s", name, err, strings.TrimSpace(string(out)))
	}
	return string(out), nil
}
