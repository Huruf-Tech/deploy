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
	"os"
	"os/signal"
	"syscall"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/agent"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/commands"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/state"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/transport"
)

// Set at build time: -ldflags "-X main.version=1.2.3".
var version = "dev"

func main() {
	url := flag.String("url", os.Getenv("HURUF_DEPLOY_URL"), "control plane base URL")
	tenant := flag.String("tenant", os.Getenv("HURUF_DEPLOY_TENANT"), "tenant id")
	stateDir := flag.String("state-dir", "/var/lib/huruf-deploy-agent", "identity and state directory")
	showVersion := flag.Bool("version", false, "print the version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println(version)
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

	a := &agent.Agent{
		Tenant:   *tenant,
		Version:  version,
		Identity: id,
		Client:   transport.New(*url, id),
		Store:    store,
		Commands: commands.Default(),
		Log:      log,
	}
	if err := a.Run(ctx); err != nil {
		log.Error("agent stopped", "error", err)
		os.Exit(1)
	}
}
