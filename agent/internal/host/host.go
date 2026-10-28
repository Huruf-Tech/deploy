// Package host reads inventory and resource usage on Linux (PLAN D18: Ubuntu only).
package host

import (
	"bufio"
	"context"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/cgroup"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/update"
)

func Inventory(agentVersion string) protocol.Inventory {
	hostname, _ := os.Hostname()
	total, _ := DataDisk()

	return protocol.Inventory{
		Hostname:       hostname,
		Os:             osName(),
		Arch:           runtime.GOARCH,
		CpuCores:       Cores(),
		Memory:         Memory(),
		Disk:           total,
		PrivateIp:      privateIP(),
		DockerVersion:  dockerVersion(),
		AgentVersion:   agentVersion,
		AgentSha256:    update.SelfSha256(),
		Virtualization: virtualization(),
	}
}

// virtualization is what systemd-detect-virt says: "none" on bare metal,
// else the hypervisor or container (kvm, microsoft, docker…); empty when
// it can't tell.
func virtualization() string {
	out, _ := exec.Command("systemd-detect-virt").Output()
	return strings.TrimSpace(string(out))
}

// privateIP is the address of the interface holding the default route: a UDP
// "dial" picks it without sending anything. Mesh peers on the same network
// reach the server there (PLAN §8.2).
func privateIP() string {
	conn, err := net.Dial("udp", "192.0.2.1:9")
	if err != nil {
		return ""
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP.String()
}

// Cores is what the agent may use: the partition's CPU limit (PLAN §27), else
// the machine's cores.
func Cores() float64 {
	if cpus := cgroup.CPUs(); cpus > 0 {
		return cpus
	}
	return float64(runtime.NumCPU())
}

// Memory is the partition's memory limit, else the machine's memory.
func Memory() int64 {
	total := meminfo()["MemTotal"]
	if limit := cgroup.MemoryMax(); limit > 0 && (total == 0 || limit < total) {
		return limit
	}
	return total
}

// MemoryFree is what's left for apps: within the partition's limit, else
// the machine's available memory.
func MemoryFree() int64 {
	if limit := cgroup.MemoryMax(); limit > 0 {
		return max(0, Memory()-cgroup.MemoryUsed())
	}
	return meminfo()["MemAvailable"]
}

// DataDisk is Docker's data disk: the system disk, or another filesystem
// mounted for Docker. In a partition that's its quota'd directory (PLAN
// §28), whose size is the partition's whole disk; its "/" is the machine's.
func DataDisk() (total, free int64) {
	var root, data syscall.Statfs_t
	if syscall.Statfs("/", &root) == nil && syscall.Statfs("/var/lib/docker", &data) == nil &&
		root.Fsid != data.Fsid {
		return disk("/var/lib/docker")
	}
	return disk("/")
}

// Sampler computes CPU usage between consecutive calls: from the partition's
// cgroup when it has a CPU limit, else from /proc/stat.
type Sampler struct {
	idle, total uint64
	usage       uint64
	at          time.Time
	// For steal time, always from /proc/stat.
	steal, stealTotal uint64
}

// Steal is the share of CPU time the hypervisor gave to other guests since
// the previous call: 0 on bare metal, high on an oversold host.
func (s *Sampler) Steal() float64 {
	_, total, steal := cpuTimes()
	share := 0.0
	if s.stealTotal > 0 && total > s.stealTotal && steal >= s.steal {
		share = float64(steal-s.steal) / float64(total-s.stealTotal)
	}
	s.steal, s.stealTotal = steal, total
	return min(1, max(0, share))
}

// CPU is the share of Cores() used since the previous call.
func (s *Sampler) CPU() float64 {
	cpu := 0.0
	if cores := cgroup.CPUs(); cores > 0 {
		now, usage := time.Now(), cgroup.CPUUsageMicros()
		if elapsed := now.Sub(s.at).Microseconds(); !s.at.IsZero() && elapsed > 0 && usage >= s.usage {
			cpu = float64(usage-s.usage) / (float64(elapsed) * cores)
		}
		s.usage, s.at = usage, now
	} else {
		idle, total, _ := cpuTimes()
		if s.total > 0 && total > s.total {
			cpu = 1 - float64(idle-s.idle)/float64(total-s.total)
		}
		s.idle, s.total = idle, total
	}
	return min(1, max(0, cpu))
}

func (s *Sampler) Summary() protocol.ResourceSummary {
	_, free := DataDisk()
	steal := s.Steal()
	return protocol.ResourceSummary{
		Cpu:      s.CPU(),
		MemFree:  MemoryFree(),
		DiskFree: free,
		Steal:    &steal,
	}
}

func osName() string {
	f, err := os.Open("/etc/os-release")
	if err != nil {
		return runtime.GOOS
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		if value, ok := strings.CutPrefix(scanner.Text(), "PRETTY_NAME="); ok {
			return strings.Trim(value, `"`)
		}
	}
	return runtime.GOOS
}

// meminfo returns /proc/meminfo values in bytes.
func meminfo() map[string]int64 {
	values := map[string]int64{}
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return values
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) >= 2 {
			kb, _ := strconv.ParseInt(fields[1], 10, 64)
			values[strings.TrimSuffix(fields[0], ":")] = kb * 1024
		}
	}
	return values
}

func disk(path string) (total, free int64) {
	var st syscall.Statfs_t
	if syscall.Statfs(path, &st) != nil {
		return 0, 0
	}
	return int64(st.Blocks) * st.Bsize, int64(st.Bavail) * st.Bsize
}

func cpuTimes() (idle, total, steal uint64) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0, 0, 0
	}
	line, _, _ := strings.Cut(string(data), "\n")
	for i, field := range strings.Fields(line)[1:] {
		n, _ := strconv.ParseUint(field, 10, 64)
		total += n
		if i == 3 || i == 4 { // idle, iowait
			idle += n
		}
		if i == 7 { // steal
			steal = n
		}
	}
	return idle, total, steal
}

func dockerVersion() string {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx, "docker", "version", "--format", "{{.Server.Version}}").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}
