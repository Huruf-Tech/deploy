// huruf-deploy-agent runs on a user's server and connects it to Huruf Deploy.
//
// Configuration comes from flags or the environment (the systemd unit loads
// /etc/huruf-deploy-agent/agent.env):
//
//	HURUF_DEPLOY_URL     control plane base URL
//	HURUF_DEPLOY_TENANT  tenant id the server joins
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/agent"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/build"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/cleanup"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/commands"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/dns"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/docker"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/edge"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/ledger"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/mesh"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/metrics"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/monitor"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/pool"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/state"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/streams"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/transport"
)

// Set at build time: -ldflags "-X main.version=1.2.3".
var version = "dev"

const (
	// The project network docker.ensure creates (PLAN D35).
	projectNetwork = "huruf-internal"
	caddyAdmin     = "http://127.0.0.1:2019"
	// tmpfs on every systemd host: `file` variables never touch the disk.
	secretsDir = "/run/huruf-deploy/secrets"
	// Written when the dashboard removes the server; the uninstall deletes it.
	uninstallingMarker = "uninstalling"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "uninstall" {
		os.Exit(uninstall(os.Args[2:]))
	}
	url := flag.String("url", os.Getenv("HURUF_DEPLOY_URL"), "control plane base URL")
	tenant := flag.String("tenant", os.Getenv("HURUF_DEPLOY_TENANT"), "tenant id")
	joinToken := flag.String("join-token", os.Getenv("HURUF_DEPLOY_JOIN_TOKEN"), "one-time token from the SSH install wizard")
	stateDir := flag.String("state-dir", "/var/lib/huruf-deploy-agent", "identity and state directory")
	showVersion := flag.Bool("version", false, "print the version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println(version)
		return
	}
	ledger.Path = filepath.Join(*stateDir, "ledger.jsonl")
	// Removed from the dashboard: wait for the scheduled uninstall to stop
	// this service instead of polling (a poll would register it again).
	if _, err := os.Stat(filepath.Join(*stateDir, uninstallingMarker)); err == nil {
		fmt.Println("uninstalling: not connecting to the control plane")
		wait := make(chan os.Signal, 1)
		signal.Notify(wait, os.Interrupt, syscall.SIGTERM)
		<-wait
		return
	}

	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	if *url == "" || *tenant == "" {
		log.Error("missing configuration: set HURUF_DEPLOY_URL and HURUF_DEPLOY_TENANT (or -url and -tenant)")
		os.Exit(2)
	}

	id, err := identity.LoadOrCreate(*stateDir)
	if err != nil {
		log.Error("cannot load identity", "error", err)
		os.Exit(1)
	}
	store, err := state.Open(*stateDir)
	if err != nil {
		log.Error("cannot open state", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Info("huruf-deploy-agent starting", "version", version, "url", *url, "fingerprint", id.Fingerprint())

	history := &metrics.Recorder{}
	go history.Run(ctx)
	builder := &build.Builder{Dir: filepath.Join(*stateDir, "builds")}
	streamManager := &streams.Manager{History: history, Builds: builder}

	network := &mesh.Mesh{Dir: *stateDir, Log: log}
	names := &dns.Server{Log: log, Peers: network.PeerAddresses}
	var dnsAddr atomic.Value
	dnsAddr.Store("")
	go serveDNS(ctx, names, &dnsAddr, log)
	go serveMeshDNS(ctx, names, network, log)

	dockerRuntime := &docker.Docker{
		SecretsDir: secretsDir,
		DNS:        func() string { return dnsAddr.Load().(string) },
		Log:        log,
	}
	reconciler := &reconcile.Reconciler{
		Runtime: dockerRuntime,
		Router:  &edge.Caddy{Admin: caddyAdmin},
		Names:   names,
		Log:     log,
	}

	a := &agent.Agent{
		Tenant:    *tenant,
		JoinToken: *joinToken,
		Version:   version,
		Identity:  id,
		Client:    transport.New(*url, id),
		Store:     store,
		Commands: commands.Default(ctx, streamManager, builder, id.Open, func() {
			log.Info("agent updated; restarting")
			stop() // Run returns, the last events flush, systemd starts the new binary
		}),
		Streams:    streamManager,
		Reconciler: reconciler,
		Network:    network,
		Log:        log,
	}
	var hostSampler metrics.Sampler
	usage := &monitor.Monitor{
		List:     dockerRuntime.List,
		Stats:    metrics.Stats,
		Host:     hostSampler.Sample,
		Disk:     metrics.DiskUsage,
		Cores:    host.Cores(),
		Scaler:   reconciler,
		Emit:     func(event any) { a.Enqueue(event); a.Wake() },
		Interval: a.MonitorInterval,
		Config:   a.CapacityConfig,
		Path:     filepath.Join(*stateDir, "capacity.json"),
		Log:      log,
		Now:      time.Now,
	}
	usage.Load()
	a.Monitor = usage
	streamManager.Capacity = usage
	go usage.Run(ctx)
	// A pool machine's host role (PLAN §26.5): partitions running our agent.
	pools := &pool.Manager{Driver: pool.Sysbox{}, Path: filepath.Join(*stateDir, "pool.json")}
	if err := pools.Restore(ctx); err != nil {
		log.Warn("restoring partitions", "error", err)
	}
	a.Partitions = pools.Usage
	a.Commands["pool.ensure"] = commands.Typed(pools.Ensure)
	a.Commands["partition.create"] = commands.Sealed(id.Open, pools.Create)
	a.Commands["partition.resize"] = commands.Typed(pools.Resize)
	a.Commands["partition.stop"] = commands.Typed(pools.Stop)
	a.Commands["partition.start"] = commands.Typed(pools.Start)
	a.Commands["partition.remove"] = commands.Typed(pools.Remove)
	// The built-in registry lives with the mesh: it deletes images of releases that are gone.
	a.Commands["registry.delete"] = commands.Typed(func(ctx context.Context, p protocol.RegistryDeletePayload) (map[string]any, error) {
		return network.DeleteTags(ctx, p.Tags)
	})
	// The dashboard's "Remove server": the plan, and with dryRun false the
	// uninstall runs in its own unit, so stopping this service doesn't stop it.
	a.Commands["host.cleanup"] = commands.Typed(func(ctx context.Context, p protocol.HostCleanupPayload) (map[string]any, error) {
		steps := cleanup.Plan(ctx, cleanup.Options{
			StateDir: *stateDir, Keep: p.Keep, Remove: p.Remove, PurgeData: p.PurgeData, Teardown: network.Teardown,
		})
		if p.DryRun {
			return map[string]any{"steps": steps}, nil
		}
		// From here on the agent must not poll: the server is being removed,
		// and a poll after that would register it again as a new one.
		if err := os.WriteFile(filepath.Join(*stateDir, uninstallingMarker), nil, 0o600); err != nil {
			return nil, err
		}
		args := []string{"--unit", "huruf-deploy-uninstall", "--collect", "--on-active", "2",
			cleanup.Binary, "uninstall", "-yes", "-state-dir", *stateDir}
		if len(p.Keep) > 0 {
			args = append(args, "-keep", strings.Join(p.Keep, ","))
		}
		if len(p.Remove) > 0 {
			args = append(args, "-remove", strings.Join(p.Remove, ","))
		}
		if p.PurgeData {
			args = append(args, "-purge-data")
		}
		if out, err := exec.CommandContext(ctx, "systemd-run", args...).CombinedOutput(); err != nil {
			_ = os.Remove(filepath.Join(*stateDir, uninstallingMarker))
			return nil, fmt.Errorf("scheduling the uninstall: %w: %s", err, out)
		}
		log.Info("uninstalling: stopping now; the uninstall starts in 2 s")
		// Once this result is queued (after the handler returns), Run stops
		// and flushes it on the way out: no more polls.
		time.AfterFunc(500*time.Millisecond, stop)
		return map[string]any{"steps": steps, "scheduled": true}, nil
	})
	network.Emit = func(event protocol.MeshStatusEvent) {
		a.Enqueue(event)
		a.Wake()
	}
	go network.Run(ctx, a.ReconcileInterval)
	reconciler.Emit = func(event protocol.WorkloadStatusEvent) {
		a.Enqueue(event)
		a.Wake() // rollouts advance on these: send now
	}
	streamManager.Emit = func(event protocol.StreamChunkEvent, urgent bool) {
		a.Enqueue(event)
		if urgent {
			a.Wake()
		}
	}
	if err := a.Run(ctx); err != nil {
		log.Error("agent stopped", "error", err)
		os.Exit(1)
	}
}

// serveDNS answers .internal names on the project network's gateway, once
// host setup has created the network. Containers started before that use
// Docker's resolver only, and get .internal on their next restart.
func serveDNS(ctx context.Context, names *dns.Server, addr *atomic.Value, log *slog.Logger) {
	for ctx.Err() == nil {
		if gateway, err := docker.Gateway(ctx, projectNetwork); err == nil && gateway != "" {
			listen := net.JoinHostPort(gateway, "53")
			addr.Store(gateway)
			log.Info("serving .internal names", "address", listen)
			if err := names.Serve(ctx, listen); err != nil {
				log.Warn(".internal DNS stopped; retrying", "error", err)
			}
			addr.Store("")
		}
		select {
		case <-ctx.Done():
		case <-time.After(15 * time.Second):
		}
	}
}

// serveMeshDNS answers peers' .internal queries on this server's mesh address
// (local records only), while the server is in the private network.
func serveMeshDNS(ctx context.Context, names *dns.Server, network *mesh.Mesh, log *slog.Logger) {
	for ctx.Err() == nil {
		if address := network.Address(); address != "" {
			if err := names.Serve(ctx, net.JoinHostPort(address, "53"), true); err != nil && ctx.Err() == nil {
				log.Warn("mesh DNS stopped; retrying", "error", err)
			}
		}
		select {
		case <-ctx.Done():
		case <-time.After(10 * time.Second):
		}
	}
}
