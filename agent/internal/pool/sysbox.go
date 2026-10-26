package pool

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"hash/fnv"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/dockerhost"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

//go:embed partition.Dockerfile
var partitionDockerfile []byte

const (
	// Root is the XFS volume (mounted with prjquota) partitions live on;
	// Docker's own data moves there too, so --storage-opt size works.
	Root       = "/srv/huruf-pool"
	engineRoot = Root + "/.engine"
	loopFile   = "/var/lib/huruf-pool.img"
	image      = "huruf-partition"
	// Each partition's own system files (apt, logs, /tmp), part of its disk size.
	rootGb = 3
	// Our XFS project ids, far from the ones Docker assigns for --storage-opt.
	projectBase = 1_000_000
)

// Sysbox makes partitions as Sysbox system containers (PLAN §26.3).
type Sysbox struct{}

func run(ctx context.Context, name string, args ...string) (string, error) {
	out, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("%s %s: %w: %s", name, strings.Join(args, " "), err, strings.TrimSpace(tail(string(out), 400)))
	}
	return string(out), nil
}

func container(name string) string { return "partition-" + name }
func bridge(name string) string    { return "hp-" + name }
func dir(name string) string       { return filepath.Join(Root, "p", name) }

func projectID(name string) string {
	h := fnv.New32a()
	h.Write([]byte(name))
	return strconv.Itoa(projectBase + int(h.Sum32()%1_000_000))
}

func (Sysbox) Setup(ctx context.Context, p protocol.PoolEnsurePayload) (protocol.PartitionSize, map[string]any, error) {
	notes := []string{}
	result := map[string]any{"notes": &notes}
	none := protocol.PartitionSize{}

	if _, err := run(ctx, "apt-get", "install", "-y", "-qq", "fuse3", "xfsprogs", "nftables", "kmod"); err != nil {
		if _, err2 := run(ctx, "sh", "-c", "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fuse3 xfsprogs nftables kmod"); err2 != nil {
			return none, result, err2
		}
	}
	if err := ensureSysbox(ctx, &notes); err != nil {
		return none, result, err
	}
	if err := ensureVolume(ctx, p.Volume, &notes); err != nil {
		return none, result, err
	}
	if err := ensureEngine(ctx, &notes); err != nil {
		return none, result, err
	}
	// The usual host setup (edge proxy, project network), now on the pool layout.
	host, err := dockerhost.Ensure(ctx, dockerhost.Payload{
		LogMaxSize: p.Docker.LogMaxSize,
		LogMaxFile: int(p.Docker.LogMaxFile),
		EdgeImage:  p.Docker.EdgeImage,
		Network:    p.Docker.Network,
		Subnet:     p.Docker.Subnet,
		MeshCidr:   p.Docker.MeshCidr,
	})
	result["host"] = host
	if err != nil {
		return none, result, err
	}
	if err := buildImage(ctx); err != nil {
		return none, result, err
	}
	if err := applyRules(ctx, p.AllowIps); err != nil {
		return none, result, err
	}
	existing, _ := run(ctx, "docker", "ps", "-a", "--filter", "label=huruf.partition", "--format", `{{.Label "huruf.partition"}}`)
	if err := (Sysbox{}).Restore(ctx, strings.Fields(existing)); err != nil {
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
	if out, err := run(ctx, "sysbox-runc", "--version"); err == nil {
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

// ensureSysbox installs Sysbox CE's latest release once and starts it.
func ensureSysbox(ctx context.Context, notes *[]string) error {
	if _, err := exec.LookPath("sysbox-runc"); err != nil {
		script := `set -e
V=$(curl -fsSL https://api.github.com/repos/nestybox/sysbox/releases/latest | sed -n 's/.*"tag_name": *"\(v[^"]*\)".*/\1/p')
A=$(dpkg --print-architecture)
curl -fsSL -o /tmp/sysbox.deb "https://downloads.nestybox.com/sysbox/releases/$V/sysbox-ce_${V#v}-0.linux_$A.deb"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq /tmp/sysbox.deb || true
rm -f /tmp/sysbox.deb`
		if _, err := run(ctx, "sh", "-c", script); err != nil {
			return fmt.Errorf("installing Sysbox: %w", err)
		}
		*notes = append(*notes, "Sysbox installed")
	}
	_, _ = run(ctx, "systemctl", "reset-failed", "sysbox", "sysbox-mgr", "sysbox-fs")
	if _, err := run(ctx, "systemctl", "enable", "--now", "sysbox"); err != nil {
		return err
	}
	_, err := run(ctx, "systemctl", "is-active", "sysbox-mgr", "sysbox-fs")
	return err
}

// ensureVolume mounts the XFS volume with project quotas: a device (formatted
// only when it has no filesystem) or a loop file.
func ensureVolume(ctx context.Context, v protocol.PoolEnsurePayloadVolume, notes *[]string) error {
	if _, err := run(ctx, "mountpoint", "-q", Root); err == nil {
		return checkQuota(ctx)
	}
	source, options := v.Device, "defaults,prjquota"
	if source == "" {
		if v.LoopSizeGb == nil {
			return errors.New("give a device or loopSizeGb for the pool volume")
		}
		source, options = loopFile, "loop,prjquota"
		if _, err := os.Stat(loopFile); errors.Is(err, os.ErrNotExist) {
			if _, err := run(ctx, "truncate", "-s", fmt.Sprintf("%dG", *v.LoopSizeGb), loopFile); err != nil {
				return err
			}
		}
	}
	if fs, _ := run(ctx, "blkid", "-o", "value", "-s", "TYPE", source); strings.TrimSpace(fs) == "" {
		if _, err := run(ctx, "mkfs.xfs", "-q", source); err != nil {
			return err
		}
		*notes = append(*notes, "Formatted "+source+" as XFS")
	} else if strings.TrimSpace(fs) != "xfs" {
		return fmt.Errorf("%s holds a %s filesystem; the pool volume must be XFS", source, strings.TrimSpace(fs))
	}
	if err := os.MkdirAll(Root, 0o755); err != nil {
		return err
	}
	if _, err := run(ctx, "mount", "-o", options, source, Root); err != nil {
		return err
	}
	line := fmt.Sprintf("%s %s xfs %s 0 0\n", source, Root, options)
	fstab, _ := os.ReadFile("/etc/fstab")
	if !bytes.Contains(fstab, []byte(" "+Root+" ")) {
		f, err := os.OpenFile("/etc/fstab", os.O_APPEND|os.O_WRONLY, 0o644)
		if err != nil {
			return err
		}
		_, err = f.WriteString(line)
		f.Close()
		if err != nil {
			return err
		}
	}
	return checkQuota(ctx)
}

func checkQuota(ctx context.Context) error {
	out, err := run(ctx, "xfs_quota", "-x", "-c", "state -p", Root)
	if err != nil {
		return err
	}
	if !strings.Contains(out, "Enforcement: ON") {
		return fmt.Errorf("%s isn't mounted with prjquota", Root)
	}
	return nil
}

// ensureEngine moves Docker's data onto the pool volume with overlay2 (so
// --storage-opt size caps partitions' system files) and registers Sysbox.
// Only on a fresh machine: anything but our own containers is refused.
func ensureEngine(ctx context.Context, notes *[]string) error {
	const path = "/etc/docker/daemon.json"
	existing, err := os.ReadFile(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	config := map[string]any{}
	if len(bytes.TrimSpace(existing)) > 0 {
		if err := json.Unmarshal(existing, &config); err != nil {
			return fmt.Errorf("%s is not valid JSON: %w", path, err)
		}
	}
	before, _ := json.Marshal(config)
	config["data-root"] = engineRoot
	config["storage-driver"] = "overlay2"
	features, _ := config["features"].(map[string]any)
	if features == nil {
		features = map[string]any{}
	}
	features["containerd-snapshotter"] = false
	config["features"] = features
	runtimes, _ := config["runtimes"].(map[string]any)
	if runtimes == nil {
		runtimes = map[string]any{}
	}
	runtimes["sysbox-runc"] = map[string]any{"path": "/usr/bin/sysbox-runc"}
	config["runtimes"] = runtimes
	after, _ := json.Marshal(config)
	if bytes.Equal(before, after) {
		return nil
	}

	names, _ := run(ctx, "docker", "ps", "-a", "--format", "{{.Names}}")
	for _, n := range strings.Fields(names) {
		if !strings.HasPrefix(n, "huruf-") && !strings.HasPrefix(n, "partition-") {
			return fmt.Errorf("container %s runs on this machine: a pool machine must start empty", n)
		}
	}
	// Ours (the edge proxy, the tunnel) come back on the new data root.
	for _, n := range strings.Fields(names) {
		_, _ = run(ctx, "docker", "rm", "-f", n)
	}
	merged, _ := json.MarshalIndent(config, "", "  ")
	if err := os.MkdirAll(engineRoot, 0o711); err != nil {
		return err
	}
	if err := os.WriteFile(path, append(merged, '\n'), 0o644); err != nil {
		return err
	}
	if _, err := run(ctx, "systemctl", "restart", "docker"); err != nil {
		_ = os.WriteFile(path, existing, 0o644)
		_, _ = run(ctx, "systemctl", "restart", "docker")
		return fmt.Errorf("Docker didn't start on the pool layout, so %s was restored: %w", path, err)
	}
	*notes = append(*notes, "Docker moved to the pool volume (overlay2, Sysbox runtime)")
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
	_, err = run(ctx, "docker", "build", "-q", "-t", image, tmp)
	return err
}

func cpuArgs(cpus float64, weight int) []string {
	return []string{"--cpus", strconv.FormatFloat(cpus, 'f', -1, 64), "--cpu-shares", strconv.Itoa(weight)}
}

func memArgs(memMb int64) []string {
	return []string{"--memory", fmt.Sprintf("%dm", memMb), "--memory-swap", fmt.Sprintf("%dm", memMb)}
}

// dataGb is what the quota allows: the size minus the partition's system files.
func dataGb(size protocol.PartitionSize) int64 { return max(1, size.DiskGb-rootGb) }

func setQuota(ctx context.Context, name string, size protocol.PartitionSize) error {
	_, err := run(ctx, "xfs_quota", "-x", "-c", fmt.Sprintf("limit -p bhard=%dg %s", dataGb(size), projectID(name)), Root)
	return err
}

func (Sysbox) Create(ctx context.Context, name string, size protocol.PartitionSize, weight int) error {
	d := dir(name)
	for _, sub := range []string{"docker", "containerd", "agent"} {
		if err := os.MkdirAll(filepath.Join(d, sub), 0o755); err != nil {
			return err
		}
	}
	if _, err := run(ctx, "xfs_quota", "-x", "-c", fmt.Sprintf("project -s -p %s %s", d, projectID(name)), Root); err != nil {
		return err
	}
	if err := setQuota(ctx, name, size); err != nil {
		return err
	}
	if _, err := run(ctx, "docker", "network", "inspect", bridge(name)); err != nil {
		if _, err := run(ctx, "docker", "network", "create", "--driver", "bridge",
			"--opt", "com.docker.network.bridge.name="+bridge(name), bridge(name)); err != nil {
			return err
		}
	}
	args := []string{"run", "-d", "--runtime=sysbox-runc", "--name", container(name), "--hostname", name,
		"--network", bridge(name), "--restart", "unless-stopped",
		"--storage-opt", fmt.Sprintf("size=%dG", rootGb), "--pids-limit", "8192",
		"-v", filepath.Join(d, "docker") + ":/var/lib/docker",
		"-v", filepath.Join(d, "containerd") + ":/var/lib/containerd",
		"-v", filepath.Join(d, "agent") + ":/var/lib/huruf-deploy-agent",
		"--label", "huruf.partition=" + name}
	args = append(args, cpuArgs(size.Cpus, weight)...)
	args = append(args, memArgs(size.MemMb)...)
	if _, err := run(ctx, "docker", append(args, image)...); err != nil {
		return err
	}
	return ensureCounters(ctx, name)
}

// Restore re-adds what doesn't survive a reboot: the traffic counters.
func (Sysbox) Restore(ctx context.Context, names []string) error {
	for _, name := range names {
		if err := ensureCounters(ctx, name); err != nil {
			return err
		}
	}
	return nil
}

func (Sysbox) Resize(ctx context.Context, name string, size protocol.PartitionSize, weight int) error {
	args := append([]string{"update"}, cpuArgs(size.Cpus, weight)...)
	args = append(args, memArgs(size.MemMb)...)
	if _, err := run(ctx, "docker", append(args, container(name))...); err != nil {
		return err
	}
	return setQuota(ctx, name, size)
}

func (Sysbox) Stop(ctx context.Context, name string) error {
	_, err := run(ctx, "docker", "stop", "-t", "60", container(name))
	return err
}

func (Sysbox) Start(ctx context.Context, name string) error {
	_, err := run(ctx, "docker", "start", container(name))
	return err
}

func (Sysbox) Remove(ctx context.Context, name string) error {
	if out, err := run(ctx, "docker", "rm", "-f", container(name)); err != nil && !strings.Contains(out, "No such container") {
		return err
	}
	_, _ = run(ctx, "docker", "network", "rm", bridge(name))
	delCounters(ctx, name)
	_, _ = run(ctx, "xfs_quota", "-x", "-c", "limit -p bhard=0 "+projectID(name), Root)
	return os.RemoveAll(dir(name))
}

func (Sysbox) Exec(ctx context.Context, name, script string) (string, error) {
	return run(ctx, "docker", "exec", container(name), "bash", "-c", script)
}

func (Sysbox) Usage(ctx context.Context, name string) (Usage, error) {
	out, err := run(ctx, "docker", "inspect", "-f", "{{.State.Status}} {{.Id}}", container(name))
	if err != nil {
		return Usage{}, err
	}
	fields := strings.Fields(out)
	if len(fields) != 2 {
		return Usage{}, fmt.Errorf("unexpected docker inspect output: %q", out)
	}
	u := Usage{State: fields[0]}
	if cg := cgroupDir(fields[1]); cg != "" {
		u.MemUsed = max(0, readInt(cg, "memory.current")-statValue(cg, "memory.stat", "inactive_file"))
		u.CPUMicros = statValue(cg, "cpu.stat", "usage_usec")
	}
	u.DiskUsed = projectUsedBytes(ctx, name)
	u.TxBytes, u.RxBytes = readCounters(ctx, name)
	return u, nil
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

// projectUsedBytes adds the quota'd data to the partition's system files.
func projectUsedBytes(ctx context.Context, name string) int64 {
	out, err := run(ctx, "xfs_quota", "-x", "-c", "report -p -b -N", Root)
	if err != nil {
		return 0
	}
	var used int64
	for _, line := range strings.Split(out, "\n") {
		f := strings.Fields(line)
		if len(f) >= 2 && f[0] == "#"+projectID(name) {
			kb, _ := strconv.ParseInt(f[1], 10, 64)
			used = kb * 1024
		}
	}
	if size, err := run(ctx, "docker", "inspect", "-s", "-f", "{{.SizeRw}}", container(name)); err == nil {
		n, _ := strconv.ParseInt(strings.TrimSpace(size), 10, 64)
		used += n
	}
	return used
}
