// Package cleanup uninstalls the agent with one fixed rule (PLAN §27.4):
// what is unambiguously ours goes, found by label and exact name; anything
// another tool may use (Docker, WireGuard tools, daemon.json settings, base
// images) stays. Sysbox goes only when asked.
//
// Docker objects are matched by the agent's labels and exact names, never by
// a "huruf-" prefix: other tools' apps can be called huruf-tech-something.
package cleanup

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"slices"
	"strings"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/daemonjson"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/pool"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

const (
	Service    = "huruf-deploy-agent"
	Binary     = "/usr/local/bin/huruf-deploy-agent"
	unitFile   = "/etc/systemd/system/huruf-deploy-agent.service"
	configDir  = "/etc/huruf-deploy-agent"
	secretsDir = "/run/huruf-deploy"
)

// Volumes the agent creates by exact name: registry images and edge state.
var ownVolumes = []string{"huruf-registry-data", "huruf-edge-data", "huruf-edge-config"}

// Project volumes are huruf-<project id>-<name> (local and S3).
var projectVolume = regexp.MustCompile(`^huruf-[0-9a-f]{24}-`)

type Step struct {
	ID   string `json:"id"`
	Item string `json:"item"`
	// Whether this run removes it.
	Remove bool   `json:"remove"`
	Reason string `json:"reason,omitempty"`
	// Always removed (stopping the agent comes first, or it recreates things).
	Required bool `json:"required,omitempty"`
	// The user can flip it: only Sysbox.
	Choice bool `json:"choice"`
	do     func(ctx context.Context) error
}

type Options struct {
	StateDir string
	// Also remove Sysbox (the dashboard's one choice).
	RemoveSysbox bool
	// Teardown removes the private network (wg0, its rules, the key).
	Teardown func(ctx context.Context) error
	// RemovePartitions removes partitions and the host role's setup; tests
	// replace it.
	RemovePartitions func(ctx context.Context) error
	// Run executes a command; tests replace it.
	Run func(ctx context.Context, name string, args ...string) (string, error)
}

// Plan inspects the host and lists every step in run order.
func Plan(ctx context.Context, o Options) []Step {
	if o.Run == nil {
		o.Run = sh.Run
	}
	if o.RemovePartitions == nil {
		o.RemovePartitions = pool.RemoveAll
	}
	var steps []Step
	add := func(s Step) { steps = append(steps, s) }

	// First: a running agent would recreate what the next steps remove.
	add(Step{ID: "service", Item: "The agent service (" + Service + ")", Remove: true, Required: true, do: func(ctx context.Context) error {
		_, _ = o.Run(ctx, "systemctl", "disable", "--now", Service)
		return nil
	}})

	if _, err := o.Run(ctx, "docker", "info", "--format", "{{.ServerVersion}}"); err == nil {
		if names := lines(ctx, o, "ps", "-a", "--filter", "label=huruf.partition", "--format", `{{.Label "huruf.partition"}}`); len(names) > 0 {
			add(Step{
				ID:     "partitions",
				Item:   fmt.Sprintf("%s with their projects and data: %s", plural(len(names), "partition"), strings.Join(names, ", ")),
				Remove: true,
				do:     o.RemovePartitions,
			})
		} else {
			add(Step{ID: "partitions", Item: "The partition volume, image and network rules", Remove: true, do: o.RemovePartitions})
		}
		steps = append(steps, dockerSteps(ctx, o)...)
	} else {
		add(Step{ID: "docker-objects", Item: "Docker objects", Reason: "Docker is not running, so its containers can't be listed; start it and run again"})
	}

	if o.Teardown != nil {
		add(Step{ID: "private-network", Item: "The private network (wg0, its firewall rules and key)", Remove: true, do: o.Teardown})
	}

	if _, err := exec.LookPath("sysbox-runc"); err == nil {
		add(Step{
			ID:     "sysbox",
			Item:   "Sysbox",
			Remove: o.RemoveSysbox,
			Reason: "other tools may use it: removed only if you choose",
			do: func(ctx context.Context) error {
				if _, err := o.Run(ctx, "sh", "-c", "DEBIAN_FRONTEND=noninteractive apt-get remove -y sysbox-ce"); err != nil {
					return err
				}
				// Its package leaves the runtime in daemon.json (spike 17a).
				if changed, err := dropRuntime(); err != nil || !changed {
					return err
				}
				_, err := o.Run(ctx, "systemctl", "reload", "docker")
				return err
			},
		})
	}
	add(Step{ID: "docker", Item: "Docker, WireGuard tools and Docker's settings", Reason: "other tools may use them"})

	for _, f := range []struct{ id, item, path string }{
		{"secrets", "Secrets in memory (" + secretsDir + ")", secretsDir},
		{"config", "Configuration (" + configDir + ")", configDir},
		{"state", "State, identity, build workspaces and the registry login (" + o.StateDir + ")", o.StateDir},
	} {
		path := f.path
		if exists(path) {
			add(Step{ID: f.id, Item: f.item, Remove: true, do: func(context.Context) error { return os.RemoveAll(path) }})
		}
	}
	if exists(unitFile) {
		add(Step{ID: "unit", Item: "Systemd unit (" + unitFile + ")", Remove: true, do: func(ctx context.Context) error {
			if err := os.Remove(unitFile); err != nil {
				return err
			}
			_, _ = o.Run(ctx, "systemctl", "daemon-reload")
			return nil
		}})
	}
	if exists(Binary) {
		add(Step{ID: "binary", Item: "The agent binary (" + Binary + ")", Remove: true, do: func(context.Context) error { return os.Remove(Binary) }})
	}

	for i := range steps {
		steps[i].Choice = steps[i].ID == "sysbox"
	}
	return steps
}

func lines(ctx context.Context, o Options, args ...string) []string {
	out, err := o.Run(ctx, "docker", args...)
	if err != nil {
		return nil
	}
	return strings.Fields(out)
}

// dockerSteps: what a server ran before partitions (projects on the host,
// the edge proxy), all ours by label or exact name.
func dockerSteps(ctx context.Context, o Options) []Step {
	var steps []Step
	if names := lines(ctx, o, "ps", "-a", "--filter", "label=deploy.huruf.managed=true", "--format", "{{.Names}}"); len(names) > 0 {
		steps = append(steps, Step{
			ID:     "containers",
			Item:   fmt.Sprintf("%d containers: %s", len(names), strings.Join(names, ", ")),
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"rm", "-f"}, names...)...)
				return err
			},
		})
	}

	var volumes []string
	out, _ := o.Run(ctx, "docker", "volume", "ls", "--format", "{{.Name}}")
	for _, name := range strings.Fields(out) {
		if slices.Contains(ownVolumes, name) || projectVolume.MatchString(name) {
			volumes = append(volumes, name)
		}
	}
	if len(volumes) > 0 {
		steps = append(steps, Step{
			ID:     "volumes",
			Item:   fmt.Sprintf("%d volumes (project data, registry, edge proxy): %s", len(volumes), strings.Join(volumes, ", ")),
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"volume", "rm", "-f"}, volumes...)...)
				return err
			},
		})
	}

	if ids := unique(lines(ctx, o, "images", "-q", "--filter", "label=deploy.huruf.project")); len(ids) > 0 {
		steps = append(steps, Step{
			ID:     "project-images",
			Item:   fmt.Sprintf("%d images built for projects", len(ids)),
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"rmi", "-f"}, ids...)...)
				return err
			},
		})
	}
	if ids := lines(ctx, o, "network", "ls", "-q", "--filter", "label=deploy.huruf.managed=true"); len(ids) > 0 {
		steps = append(steps, Step{
			ID:     "network",
			Item:   "The project network (huruf-internal)",
			Remove: true,
			do: func(ctx context.Context) error {
				_, err := o.Run(ctx, "docker", append([]string{"network", "rm"}, ids...)...)
				return err
			},
		})
	}
	return steps
}

// dropRuntime removes sysbox-runc from daemon.json's runtimes.
func dropRuntime() (bool, error) {
	config, err := daemonjson.Read()
	if err != nil {
		return false, err
	}
	runtimes, _ := config["runtimes"].(map[string]any)
	if _, ok := runtimes["sysbox-runc"]; !ok {
		return false, nil
	}
	delete(runtimes, "sysbox-runc")
	if len(runtimes) == 0 {
		delete(config, "runtimes")
	}
	return true, daemonjson.Write(config)
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

func plural(n int, noun string) string {
	if n == 1 {
		return "1 " + noun
	}
	return fmt.Sprintf("%d %ss", n, noun)
}

func unique(list []string) []string {
	slices.Sort(list)
	return slices.Compact(list)
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
