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

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func Inventory(agentVersion string) protocol.Inventory {
	hostname, _ := os.Hostname()
	mem := meminfo()
	total, _ := disk("/")

	return protocol.Inventory{
		Hostname:      hostname,
		Os:            osName(),
		Arch:          runtime.GOARCH,
		CpuCores:      int64(runtime.NumCPU()),
		Memory:        mem["MemTotal"],
		Disk:          total,
		PrivateIp:     privateIP(),
		DockerVersion: dockerVersion(),
		AgentVersion:  agentVersion,
	}
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

// Sampler computes CPU usage between consecutive calls from /proc/stat.
type Sampler struct{ idle, total uint64 }

func (s *Sampler) Summary() protocol.ResourceSummary {
	idle, total := cpuTimes()
	cpu := 0.0
	if s.total > 0 && total > s.total {
		cpu = 1 - float64(idle-s.idle)/float64(total-s.total)
	}
	s.idle, s.total = idle, total

	_, free := disk("/")
	return protocol.ResourceSummary{
		Cpu:      min(1, max(0, cpu)),
		MemFree:  meminfo()["MemAvailable"],
		DiskFree: free,
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

func cpuTimes() (idle, total uint64) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0, 0
	}
	line, _, _ := strings.Cut(string(data), "\n")
	for i, field := range strings.Fields(line)[1:] {
		n, _ := strconv.ParseUint(field, 10, 64)
		total += n
		if i == 3 || i == 4 { // idle, iowait
			idle += n
		}
	}
	return idle, total
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
