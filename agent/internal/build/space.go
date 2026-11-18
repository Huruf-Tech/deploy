package build

import (
	"context"
	"fmt"
	"os"
	"slices"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/docker"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// Disk pressure (PLAN §9.3): every deploy leaves an image and build cache
// behind, so a small disk fills after a few deploys, builds fail midway and
// running apps can break. Nothing is done while there's room; below it, the
// cheapest things go first until there's room again.

const (
	gb = int64(1) << 30
	// Cleaning starts below this much free: 20% of the disk, at least 5 GB.
	lowShare = 0.20
	lowMin   = 5 * gb
	// A build doesn't start with less than this free after cleaning.
	buildMin = 1 * gb
	// The build cache kept when trimming it: 10% of the disk, at least 1 GB.
	cacheShare = 0.10
	cacheMin   = 1 * gb
	// The watcher's look, and the least time between two cleanups.
	watchEvery = time.Minute
	cleanEvery = 10 * time.Minute
	// Only our images: every one we build carries it.
	ourLabel = "deploy.huruf.project"
)

// space is where Docker keeps images, containers and build cache: the
// tighter of its two directories (Docker 29 keeps images in containerd's).
var space = func() (total, free int64) {
	for _, dir := range []string{"/var/lib/docker", "/var/lib/containerd"} {
		if _, err := os.Stat(dir); err != nil {
			continue
		}
		t, f := host.Disk(dir)
		if t > 0 && (total == 0 || f < free) {
			total, free = t, f
		}
	}
	if total == 0 {
		total, free = host.DataDisk()
	}
	return total, free
}

func low(total, free int64) bool {
	return free < max(int64(float64(total)*lowShare), lowMin)
}

// step is one level of cleaning: what it does, then whether it helped.
type step struct {
	name string
	run  func(ctx context.Context, total int64) error
}

var steps = []step{
	{"leftover images", func(ctx context.Context, _ int64) error {
		_, err := sh.Run(ctx, "docker", "image", "prune", "-f", "--filter", "label="+ourLabel)
		return err
	}},
	{"build cache unused for 3 days", func(ctx context.Context, _ int64) error {
		_, err := sh.Run(ctx, "docker", "builder", "prune", "-f", "--filter", "until=72h")
		return err
	}},
	{"build cache beyond its share", func(ctx context.Context, total int64) error {
		keep := strconv.FormatInt(max(int64(float64(total)*cacheShare), cacheMin), 10)
		if _, err := sh.Run(ctx, "docker", "builder", "prune", "-f", "--max-used-space", keep); err == nil {
			return nil
		}
		// Docker before 28.
		_, err := sh.Run(ctx, "docker", "builder", "prune", "-f", "--keep-storage", keep)
		return err
	}},
}

// lastResort removes rollback images, when trimming the cache wasn't enough:
// each project keeps the ones its containers use and its newest other one.
// Plans keep up to 20 releases for rollbacks, which a small disk can't hold
// (25 GB filled by 1 GB images, found on 2026-11-18). A rollback to a removed
// release then needs a deploy (or a pull, when it was pushed to a registry).
var lastResort = step{"older rollback images", func(ctx context.Context, _ int64) error {
	images := strings.Fields(sh.Output(ctx, "docker", "images", "--filter", "label="+ourLabel,
		"--format", "{{.Repository}}:{{.Tag}}"))
	used := strings.Fields(sh.Output(ctx, "docker", "ps", "-a", "--format", "{{.Image}}"))
	old := slices.DeleteFunc(olderImages(images, used), docker.JustBuilt)
	if len(old) == 0 {
		return nil
	}
	// One that a container still uses fails harmlessly.
	_, err := sh.Run(ctx, "docker", append([]string{"rmi"}, old...)...)
	return err
}}

// olderImages are the images to drop under critical pressure: per repository,
// all but those in use and the newest unused one (tags are `<release>-<commit>`).
func olderImages(images, used []string) []string {
	inUse := map[string]bool{}
	for _, u := range used {
		inUse[u] = true
	}
	byRepo := map[string][]string{}
	for _, image := range images {
		if i := strings.LastIndex(image, ":"); i > 0 && !strings.HasSuffix(image, ":<none>") {
			byRepo[image[:i]] = append(byRepo[image[:i]], image)
		}
	}
	var old []string
	for _, list := range byRepo {
		sort.Slice(list, func(i, j int) bool { return release(list[i]) > release(list[j]) })
		keptSpare := false
		for _, image := range list {
			switch {
			case inUse[image]:
			case !keptSpare:
				keptSpare = true
			default:
				old = append(old, image)
			}
		}
	}
	sort.Strings(old)
	return old
}

func release(image string) int {
	tag := image[strings.LastIndex(image, ":")+1:]
	n, _ := strconv.Atoi(strings.SplitN(tag, "-", 2)[0])
	return n
}

// clean frees space while it's low, cheapest first, and says what it freed.
// The caller holds the build lock.
func (b *Builder) clean(ctx context.Context) string {
	total, start := space()
	if total == 0 || !low(total, start) {
		return ""
	}
	b.cleanedAt = time.Now()
	var done []string
	for _, s := range append(steps, lastResort) {
		_, free := space()
		if !low(total, free) {
			break
		}
		if err := s.run(ctx, total); err != nil && b.Log != nil {
			b.Log.Warn("disk cleanup step failed", "step", s.name, "error", err)
		}
		done = append(done, s.name)
	}
	_, end := space()
	note := fmt.Sprintf("Disk was low (%s free of %s): removed %s, freed %s; %s free now",
		size(start), size(total), strings.Join(done, ", "), size(max(end-start, 0)), size(end))
	if b.Log != nil {
		b.Log.Info(note)
	}
	return note
}

// roomToBuild cleans before a build when needed; with too little left, the
// build fails now with why, not midway.
func (b *Builder) roomToBuild(ctx context.Context, logf func(string, ...any)) error {
	if note := b.clean(ctx); note != "" {
		logf("%s", note)
	}
	total, free := space()
	if total > 0 && free < buildMin {
		return fmt.Errorf("the server's disk is full: %s free of %s. Free space on it (old volumes, files) or give it a bigger disk",
			size(free), size(total))
	}
	return nil
}

// WatchDisk cleans when the disk runs low between builds: a look a minute,
// a cleanup at most every 10 minutes, never during a build.
func (b *Builder) WatchDisk(ctx context.Context) {
	ticker := time.NewTicker(watchEvery)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		if total, free := space(); total == 0 || !low(total, free) || !b.mu.TryLock() {
			continue
		}
		if time.Since(b.cleanedAt) >= cleanEvery {
			b.clean(ctx)
		}
		b.mu.Unlock()
	}
}

func size(bytes int64) string {
	return fmt.Sprintf("%.1f GB", float64(bytes)/float64(gb))
}
