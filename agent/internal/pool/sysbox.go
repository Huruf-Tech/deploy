package pool

import (
	"bytes"
	"context"
	_ "embed"
	"errors"
	"fmt"
	"hash/fnv"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/daemonjson"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/dockerhost"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

//go:embed partition.Dockerfile
var partitionDockerfile []byte

const (
	// Root is the XFS volume (mounted with prjquota) partitions live on.
	Root     = "/srv/huruf-pool"
	loopFile = "/var/lib/huruf-pool.img"
	image    = "huruf-partition"
	// Partitions' XFS project ids start here.
	projectBase = 1_000_000
	// How old an older partition's measured container layer may be in a
	// usage report.
	layerTTL = 10 * time.Minute
)

// Sysbox makes partitions as Sysbox system containers (PLAN §26.3).
type Sysbox struct {
	layers layerSizes
}

// layerSizes are older partitions' container layer sizes: measuring walks
// their system files, too slow for every poll.
type layerSizes struct {
	mu    sync.Mutex
	sizes map[string]int64
	at    time.Time
	busy  bool
}

func container(name string) string { return "partition-" + name }
func bridge(name string) string    { return "hp-" + name }
func dir(name string) string       { return filepath.Join(Root, "p", name) }

// systemDirs are mounted from the partition's own copy of its system files,
// under its quota, so everything it writes counts in its disk size (PLAN §28).
// Only new entries right under / stay in the container's own layer.
var systemDirs = []string{"usr", "etc", "var", "opt", "root", "home", "srv", "mnt", "media", "tmp", "boot"}

func rootDir(name string) string { return filepath.Join(dir(name), "root") }

// ownRoot: made since its system files live under its quota (PLAN §28);
// older partitions keep theirs in the container's layer.
func ownRoot(name string) bool {
	_, err := os.Stat(rootDir(name))
	return err == nil
}

func projectID(name string) string {
	h := fnv.New32a()
	h.Write([]byte(name))
	return strconv.Itoa(projectBase + int(h.Sum32()%1_000_000))
}

func (d *Sysbox) Setup(ctx context.Context, p protocol.PoolEnsurePayload) (protocol.PartitionSize, map[string]any, error) {
	notes := []string{}
	result := map[string]any{"notes": &notes}
	none := protocol.PartitionSize{}

	packages := "fuse3 xfsprogs nftables kmod conntrack"
	if _, err := sh.Run(ctx, "sh", "-c", "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "+packages); err != nil {
		if _, err2 := sh.Run(ctx, "sh", "-c", "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "+packages); err2 != nil {
			return none, result, err2
		}
	}
	if installed, err := dockerhost.InstallDocker(ctx); err != nil {
		return none, result, err
	} else if installed {
		notes = append(notes, "Docker installed")
	}
	if err := ensureSysbox(ctx, &notes); err != nil {
		return none, result, err
	}
	// Partitions' private network runs WireGuard, which needs the module here.
	_, _ = sh.Run(ctx, "modprobe", "wireguard")
	if err := ensureVolume(ctx, &notes); err != nil {
		return none, result, err
	}
	if err := buildImage(ctx); err != nil {
		return none, result, err
	}
	ensureLxcfs(ctx, &notes)
	if err := applyRules(ctx); err != nil {
		return none, result, err
	}
	var existing []string
	for _, name := range strings.Fields(sh.Output(ctx, "docker", "ps", "-a", "--filter", "label=huruf.partition", "--format", `{{.Label "huruf.partition"}}`)) {
		if validName.MatchString(name) {
			existing = append(existing, name)
		}
	}
	if err := d.Restore(ctx, existing); err != nil {
		return none, result, err
	}

	var st syscall.Statfs_t
	if err := syscall.Statfs(Root, &st); err != nil {
		return none, result, err
	}
	volumeGb := int64(st.Blocks) * st.Bsize >> 30
	allocatable := protocol.PartitionSize{
		Cpus:   float64(runtime.NumCPU()) - p.Reserve.Cpus,
		MemMb:  memTotalMb() - p.Reserve.MemMb,
		DiskGb: volumeGb - p.Reserve.DiskGb,
	}
	if allocatable.Cpus <= 0 || allocatable.MemMb < 256 || allocatable.DiskGb < 5 {
		return none, result, fmt.Errorf("nothing left for partitions after the reserve: %+v", allocatable)
	}
	if out, err := sh.Run(ctx, "sysbox-runc", "--version"); err == nil {
		for _, line := range strings.Split(out, "\n") {
			if v, ok := strings.CutPrefix(strings.TrimSpace(line), "version:"); ok {
				result["sysbox"] = strings.TrimSpace(v)
			}
		}
	}
	return allocatable, result, nil
}

func memTotalMb() int64 {
	data, _ := os.ReadFile("/proc/meminfo")
	for _, line := range strings.Split(string(data), "\n") {
		if f := strings.Fields(line); len(f) >= 2 && f[0] == "MemTotal:" {
			kb, _ := strconv.ParseInt(f[1], 10, 64)
			return kb / 1024
		}
	}
	return 0
}

// sysboxVersion is the release partitions are tested with (spikes 16a, 17a).
// Pinned: asking GitHub for the latest fails under its rate limit, and an
// upgrade is a decision, not a side effect of setting up a machine.
const sysboxVersion = "v0.7.1"

// ensureSysbox installs Sysbox CE once and starts it,
// without restarting Docker: other tools' containers may run there.
// Sysbox's installer restarts Docker for `bip` and `default-address-pools`
// unless daemon.json has them, so they're written first with the values
// Docker uses already, which changes nothing. Then it only reloads Docker.
func ensureSysbox(ctx context.Context, notes *[]string) error {
	allowSysboxFuse(ctx, notes)
	if _, err := exec.LookPath("sysbox-runc"); err != nil {
		if err := pinNetworkDefaults(ctx); err != nil {
			return err
		}
		script := `set -e
V=` + sysboxVersion + `
A=$(dpkg --print-architecture)
curl -fsSL -o /tmp/sysbox.deb "https://downloads.nestybox.com/sysbox/releases/$V/sysbox-ce_${V#v}-0.linux_$A.deb"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq /tmp/sysbox.deb
rm -f /tmp/sysbox.deb`
		if _, err := sh.Run(ctx, "sh", "-c", script); err != nil {
			return fmt.Errorf("installing Sysbox: %w", err)
		}
		*notes = append(*notes, "Sysbox installed")
	}
	// Its installer registers the runtime and reloads Docker; make sure.
	if out, _ := sh.Run(ctx, "docker", "info", "--format", "{{json .Runtimes}}"); !strings.Contains(out, "sysbox-runc") {
		if err := addRuntime(); err != nil {
			return err
		}
		if _, err := sh.Run(ctx, "systemctl", "reload", "docker"); err != nil {
			return err
		}
	}
	_, _ = sh.Run(ctx, "systemctl", "reset-failed", "sysbox", "sysbox-mgr", "sysbox-fs")
	if _, err := sh.Run(ctx, "systemctl", "enable", "--now", "sysbox"); err != nil {
		return err
	}
	// sysbox-mgr takes a few seconds to come up.
	for range 30 {
		if _, err := sh.Run(ctx, "systemctl", "is-active", "sysbox-mgr", "sysbox-fs"); err == nil {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
	_, err := sh.Run(ctx, "systemctl", "is-active", "sysbox-mgr", "sysbox-fs")
	return err
}

// pinNetworkDefaults writes `bip` (docker0's address now) and Docker's
// built-in address pools when daemon.json doesn't set them.
func pinNetworkDefaults(ctx context.Context) error {
	config, err := daemonjson.Read()
	if err != nil {
		return err
	}
	_, hasBip := config["bip"]
	_, hasPools := config["default-address-pools"]
	if hasBip && hasPools {
		return nil
	}
	if !hasBip {
		bip := "172.17.0.1/16"
		if f := strings.Fields(sh.Output(ctx, "ip", "-4", "-o", "addr", "show", "docker0")); len(f) > 3 {
			bip = f[3]
		}
		config["bip"] = bip
	}
	if !hasPools {
		pools := []map[string]any{}
		for n := 17; n <= 31; n++ {
			pools = append(pools, map[string]any{"base": fmt.Sprintf("172.%d.0.0/16", n), "size": 16})
		}
		config["default-address-pools"] = append(pools, map[string]any{"base": "192.168.0.0/16", "size": 20})
	}
	return daemonjson.Write(config)
}

// addRuntime registers sysbox-runc in daemon.json.
func addRuntime() error {
	config, err := daemonjson.Read()
	if err != nil {
		return err
	}
	runtimes, _ := config["runtimes"].(map[string]any)
	if runtimes == nil {
		runtimes = map[string]any{}
	}
	runtimes["sysbox-runc"] = map[string]any{"path": "/usr/bin/sysbox-runc"}
	config["runtimes"] = runtimes
	return daemonjson.Write(config)
}

// ensureVolume mounts the XFS volume with project quotas, on a sparse loop
// file: it takes only what partitions write, up to the disk's free space
// when it was made.
func ensureVolume(ctx context.Context, notes *[]string) error {
	if _, err := sh.Run(ctx, "mountpoint", "-q", Root); err == nil {
		return checkQuota(ctx)
	}
	const options = "loop,prjquota"
	if _, err := os.Stat(loopFile); errors.Is(err, os.ErrNotExist) {
		var st syscall.Statfs_t
		if err := syscall.Statfs(filepath.Dir(loopFile), &st); err != nil {
			return err
		}
		size := int64(st.Bavail) * st.Bsize >> 30
		if size < 10 {
			return fmt.Errorf("only %d GB free on %s: partitions need at least 10", size, filepath.Dir(loopFile))
		}
		if _, err := sh.Run(ctx, "truncate", "-s", fmt.Sprintf("%dG", size), loopFile); err != nil {
			return err
		}
	}
	if fs, _ := sh.Run(ctx, "blkid", "-o", "value", "-s", "TYPE", loopFile); strings.TrimSpace(fs) == "" {
		if _, err := sh.Run(ctx, "mkfs.xfs", "-q", loopFile); err != nil {
			return err
		}
		*notes = append(*notes, "Formatted "+loopFile+" as XFS")
	} else if strings.TrimSpace(fs) != "xfs" {
		return fmt.Errorf("%s holds a %s filesystem; the partition volume must be XFS", loopFile, strings.TrimSpace(fs))
	}
	if err := os.MkdirAll(Root, 0o755); err != nil {
		return err
	}
	if _, err := sh.Run(ctx, "mount", "-o", options, loopFile, Root); err != nil {
		return err
	}
	fstab, _ := os.ReadFile("/etc/fstab")
	if !bytes.Contains(fstab, []byte(" "+Root+" ")) {
		f, err := os.OpenFile("/etc/fstab", os.O_APPEND|os.O_WRONLY, 0o644)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintf(f, "%s %s xfs %s 0 0\n", loopFile, Root, options)
		f.Close()
		if err != nil {
			return err
		}
	}
	return checkQuota(ctx)
}

func checkQuota(ctx context.Context) error {
	out, err := sh.Run(ctx, "xfs_quota", "-x", "-c", "state -p", Root)
	if err != nil {
		return err
	}
	if !strings.Contains(out, "Enforcement: ON") {
		return fmt.Errorf("%s isn't mounted with prjquota", Root)
	}
	return nil
}

func buildImage(ctx context.Context) error {
	tmp, err := os.MkdirTemp("", "huruf-partition")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmp)
	if err := os.WriteFile(filepath.Join(tmp, "Dockerfile"), partitionDockerfile, 0o644); err != nil {
		return err
	}
	_, err = sh.Run(ctx, "docker", "build", "-q", "-t", image, tmp)
	return err
}

func cpuArgs(cpus float64, weight int) []string {
	return []string{"--cpus", strconv.FormatFloat(cpus, 'f', -1, 64), "--cpu-shares", strconv.Itoa(weight)}
}

func memArgs(memMb int64) []string {
	return []string{"--memory", fmt.Sprintf("%dm", memMb), "--memory-swap", fmt.Sprintf("%dm", memMb)}
}

// setQuota caps the partition's directory at its whole disk size.
func setQuota(ctx context.Context, name string, size protocol.PartitionSize) error {
	_, err := sh.Run(ctx, "xfs_quota", "-x", "-c", fmt.Sprintf("limit -p bhard=%dg %s", size.DiskGb, projectID(name)), Root)
	return err
}

// ensureImage builds the partition image when it's gone: another tool's
// cleanup (e.g. `docker image prune -a`) removes it once no partition uses it.
func ensureImage(ctx context.Context) error {
	if _, err := sh.Run(ctx, "docker", "image", "inspect", image); err != nil {
		if err := buildImage(ctx); err != nil {
			return fmt.Errorf("building the partition image: %w", err)
		}
	}
	return nil
}

func (d *Sysbox) Create(ctx context.Context, name string, size protocol.PartitionSize, weight int) error {
	if err := ensureImage(ctx); err != nil {
		return err
	}
	if err := prepareDir(ctx, name, size); err != nil {
		return err
	}
	if err := extractRoot(ctx, name, image); err != nil {
		return err
	}
	return runPartition(ctx, name, size, weight, image)
}

// prepareDir makes the partition's directory, under its disk quota.
func prepareDir(ctx context.Context, name string, size protocol.PartitionSize) error {
	d := dir(name)
	for _, sub := range []string{"root", "docker", "containerd", "agent"} {
		if err := os.MkdirAll(filepath.Join(d, sub), 0o755); err != nil {
			return err
		}
	}
	if _, err := sh.Run(ctx, "xfs_quota", "-x", "-c", fmt.Sprintf("project -s -p %s %s", d, projectID(name)), Root); err != nil {
		return err
	}
	return setQuota(ctx, name, size)
}

// extractRoot copies an image's filesystem into the partition's own root.
func extractRoot(ctx context.Context, name, img string) error {
	tmp := "huruf-root-" + name
	_, _ = sh.Run(ctx, "docker", "rm", "-f", tmp)
	if _, err := sh.Run(ctx, "docker", "create", "--name", tmp, img); err != nil {
		return err
	}
	defer sh.Run(context.WithoutCancel(ctx), "docker", "rm", "-f", tmp)
	if err := pipe(ctx, []string{"docker", "export", tmp},
		[]string{"tar", "-C", rootDir(name), "--numeric-owner", "--xattrs", "--xattrs-include=*", "-xpf", "-"}); err != nil {
		return fmt.Errorf("copying the system files (over the disk size?): %w", err)
	}
	return nil
}

// pipe runs `from | to`, without a shell.
func pipe(ctx context.Context, from, to []string) error {
	r, w, err := os.Pipe()
	if err != nil {
		return err
	}
	var fromErr, toOut bytes.Buffer
	src := exec.CommandContext(ctx, from[0], from[1:]...)
	src.Stdout, src.Stderr = w, &fromErr
	dst := exec.CommandContext(ctx, to[0], to[1:]...)
	dst.Stdin, dst.Stdout, dst.Stderr = r, &toOut, &toOut
	if err := src.Start(); err != nil {
		r.Close()
		w.Close()
		return err
	}
	// Only the children hold the pipe now: a failing reader stops the writer.
	w.Close()
	err = dst.Start()
	r.Close()
	if err != nil {
		_ = src.Process.Kill()
		_ = src.Wait()
		return err
	}
	// Both may fail: a full disk stops the reader, then the writer.
	var errs []error
	if err := dst.Wait(); err != nil {
		errs = append(errs, fmt.Errorf("%s: %w: %s", to[0], err, sh.Tail(strings.TrimSpace(toOut.String()), 300)))
	}
	if err := src.Wait(); err != nil {
		errs = append(errs, fmt.Errorf("%s: %w: %s", from[0], err, sh.Tail(strings.TrimSpace(fromErr.String()), 300)))
	}
	return errors.Join(errs...)
}

// runPartition starts the partition's container from `img`, its system files
// mounted from its own root.
func runPartition(ctx context.Context, name string, size protocol.PartitionSize, weight int, img string) error {
	d := dir(name)
	if _, err := sh.Run(ctx, "docker", "network", "inspect", bridge(name)); err != nil {
		if _, err := sh.Run(ctx, "docker", "network", "create", "--driver", "bridge",
			"--opt", "com.docker.network.bridge.name="+bridge(name), bridge(name)); err != nil {
			return err
		}
	}
	args := []string{"run", "-d", "--runtime=sysbox-runc", "--name", container(name), "--hostname", name,
		"--network", bridge(name), "--restart", "unless-stopped", "--pids-limit", "8192",
		"-v", filepath.Join(d, "docker") + ":/var/lib/docker",
		"-v", filepath.Join(d, "containerd") + ":/var/lib/containerd",
		"-v", filepath.Join(d, "agent") + ":/var/lib/huruf-deploy-agent",
		"--label", "huruf.partition=" + name}
	for _, sub := range systemDirs {
		args = append(args, "-v", filepath.Join(rootDir(name), sub)+":/"+sub)
	}
	args = append(args, cpuArgs(size.Cpus, weight)...)
	args = append(args, memArgs(size.MemMb)...)
	args = append(args, lxcfsArgs()...)
	if _, err := sh.Run(ctx, "docker", append(args, img)...); err != nil {
		// A container created but never started would hold its mounts and
		// name, failing the retry: it goes. A running one is never touched.
		if strings.TrimSpace(sh.Output(ctx, "docker", "inspect", "-f", "{{.State.Status}}", container(name))) == "created" {
			_, _ = sh.Run(ctx, "docker", "rm", "-f", container(name))
		}
		return err
	}
	return ensureCounters(ctx, name)
}

// Restore re-adds what doesn't survive a reboot: the traffic counters.
func (d *Sysbox) Restore(ctx context.Context, names []string) error {
	for _, name := range names {
		if err := ensureCounters(ctx, name); err != nil {
			return err
		}
	}
	return nil
}

func (d *Sysbox) Resize(ctx context.Context, name string, size protocol.PartitionSize, weight int) error {
	args := append([]string{"update"}, cpuArgs(size.Cpus, weight)...)
	args = append(args, memArgs(size.MemMb)...)
	if _, err := sh.Run(ctx, "docker", append(args, container(name))...); err != nil {
		return err
	}
	return setQuota(ctx, name, size)
}

func (d *Sysbox) Stop(ctx context.Context, name string) error {
	_, err := sh.Run(ctx, "docker", "stop", "-t", "60", container(name))
	return err
}

func (d *Sysbox) Start(ctx context.Context, name string) error {
	_, err := sh.Run(ctx, "docker", "start", container(name))
	return err
}

func (d *Sysbox) Remove(ctx context.Context, name string) error {
	if out, err := sh.Run(ctx, "docker", "rm", "-f", container(name)); err != nil && !strings.Contains(out, "No such container") {
		return err
	}
	_, _ = sh.Run(ctx, "docker", "network", "rm", bridge(name))
	delCounters(ctx, name)
	_, _ = sh.Run(ctx, "xfs_quota", "-x", "-c", "limit -p bhard=0 "+projectID(name), Root)
	// The system files a move brought in.
	if ids := strings.Fields(sh.Output(ctx, "docker", "images", "-q", "--filter", "label="+movedLabel+"="+name)); len(ids) > 0 {
		_, _ = sh.Run(ctx, "docker", append([]string{"rmi", "-f"}, ids...)...)
	}
	return os.RemoveAll(dir(name))
}

func (d *Sysbox) Exec(ctx context.Context, name, script string) (string, error) {
	return sh.Run(ctx, "docker", "exec", container(name), "bash", "-c", script)
}

// Usage reads every partition at once: one docker inspect, one quota report
// and one counter listing, whatever their number.
func (d *Sysbox) Usage(ctx context.Context, names []string, exact bool) (map[string]Usage, error) {
	if len(names) == 0 {
		return map[string]Usage{}, nil
	}
	healLxcfs(ctx)
	containers := make([]string, len(names))
	for i, name := range names {
		containers[i] = container(name)
	}
	// A missing container fails the command; the others are still listed.
	out, err := sh.Run(ctx, "docker", append([]string{"inspect", "-f", "{{.Name}} {{.State.Status}} {{.Id}}"}, containers...)...)
	quota := projectUsage(ctx)
	counters := readCounters(ctx)
	result := map[string]Usage{}
	var older []string
	for _, line := range strings.Split(out, "\n") {
		f := strings.Fields(line)
		if len(f) != 3 {
			continue
		}
		name, ok := strings.CutPrefix(f[0], "/"+container(""))
		if !ok || !validName.MatchString(name) {
			continue
		}
		u := Usage{State: f[1], DiskUsed: quota[projectID(name)], TxBytes: counters["out_"+name], RxBytes: counters["in_"+name]}
		if cg := cgroupDir(f[2]); cg != "" {
			u.MemUsed = max(0, readInt(cg, "memory.current")-statValue(cg, "memory.stat", "inactive_file"))
			u.CPUMicros = statValue(cg, "cpu.stat", "usage_usec")
		}
		if !ownRoot(name) {
			older = append(older, name)
		}
		result[name] = u
	}
	if len(result) == 0 && err != nil {
		return nil, err
	}
	// An older partition's system files are in its container's layer.
	for name, size := range d.layerSizes(ctx, older, exact) {
		if u, ok := result[name]; ok {
			u.DiskUsed += size
			result[name] = u
		}
	}
	return result, nil
}

// layerSizes measures these containers' layers now (`exact`), or returns
// the last measurement and refreshes it in the background when stale.
func (d *Sysbox) layerSizes(ctx context.Context, names []string, exact bool) map[string]int64 {
	if len(names) == 0 {
		return nil
	}
	if exact {
		return measureLayers(ctx, names)
	}
	c := &d.layers
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.busy && time.Since(c.at) > layerTTL {
		c.busy = true
		go func() {
			measure, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Minute)
			defer cancel()
			sizes := measureLayers(measure, names)
			c.mu.Lock()
			c.sizes, c.at, c.busy = sizes, time.Now(), false
			c.mu.Unlock()
		}()
	}
	return c.sizes // replaced, never changed: safe to read after unlocking
}

func measureLayers(ctx context.Context, names []string) map[string]int64 {
	containers := make([]string, len(names))
	for i, name := range names {
		containers[i] = container(name)
	}
	out, _ := sh.Run(ctx, "docker", append([]string{"inspect", "-s", "-f", "{{.Name}} {{.SizeRw}}"}, containers...)...)
	sizes := map[string]int64{}
	for _, line := range strings.Split(out, "\n") {
		if f := strings.Fields(line); len(f) == 2 {
			if name, ok := strings.CutPrefix(f[0], "/"+container("")); ok {
				sizes[name], _ = strconv.ParseInt(f[1], 10, 64)
			}
		}
	}
	return sizes
}

// cgroupDir finds a container's cgroup (systemd or cgroupfs driver).
func cgroupDir(id string) string {
	for _, p := range []string{
		"/sys/fs/cgroup/system.slice/docker-" + id + ".scope",
		"/sys/fs/cgroup/docker/" + id,
	} {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func readInt(cg, file string) int64 {
	data, _ := os.ReadFile(filepath.Join(cg, file))
	n, _ := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64)
	return n
}

func statValue(cg, file, key string) int64 {
	data, _ := os.ReadFile(filepath.Join(cg, file))
	for _, line := range strings.Split(string(data), "\n") {
		if k, v, ok := strings.Cut(line, " "); ok && k == key {
			n, _ := strconv.ParseInt(v, 10, 64)
			return n
		}
	}
	return 0
}

// projectUsage is the bytes each XFS project (partition directory) uses.
func projectUsage(ctx context.Context) map[string]int64 {
	return parseQuotaReport(sh.Output(ctx, "xfs_quota", "-x", "-c", "report -p -b -N", Root))
}

func parseQuotaReport(out string) map[string]int64 {
	used := map[string]int64{}
	for _, line := range strings.Split(out, "\n") {
		f := strings.Fields(line)
		if len(f) >= 2 && strings.HasPrefix(f[0], "#") {
			kb, _ := strconv.ParseInt(f[1], 10, 64)
			used[f[0][1:]] = kb * 1024
		}
	}
	return used
}
