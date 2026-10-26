// Package cgroup reads the limits and usage of the cgroup the agent runs in.
// In a partition of a pool machine (PLAN §26) that is the partition's size,
// which /proc doesn't show: /proc/meminfo and the CPU count are the whole
// machine's. On a plain machine the agent sees the root cgroup: no limits.
package cgroup

import (
	"os"
	"strconv"
	"strings"
)

// Root is where cgroup v2 is mounted; tests point it elsewhere.
var Root = "/sys/fs/cgroup"

func read(name string) string {
	data, err := os.ReadFile(Root + "/" + name)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

// CPUs is the CPU limit in cores (cpu.max), 0 when unlimited.
func CPUs() float64 {
	quota, period, ok := strings.Cut(read("cpu.max"), " ")
	if !ok || quota == "max" {
		return 0
	}
	q, err1 := strconv.ParseFloat(quota, 64)
	p, err2 := strconv.ParseFloat(period, 64)
	if err1 != nil || err2 != nil || p <= 0 {
		return 0
	}
	return q / p
}

// MemoryMax is the memory limit in bytes (memory.max), 0 when unlimited.
func MemoryMax() int64 {
	n, err := strconv.ParseInt(read("memory.max"), 10, 64)
	if err != nil {
		return 0
	}
	return n
}

// MemoryUsed is what the cgroup uses and can't give back: memory.current minus
// the inactive page cache the kernel reclaims first. 0 when unknown.
func MemoryUsed() int64 {
	current, err := strconv.ParseInt(read("memory.current"), 10, 64)
	if err != nil {
		return 0
	}
	return max(0, current-stat("memory.stat", "inactive_file"))
}

// CPUUsageMicros is the CPU time used since the cgroup started (cpu.stat).
func CPUUsageMicros() uint64 {
	return uint64(max(0, stat("cpu.stat", "usage_usec")))
}

func stat(file, key string) int64 {
	for _, line := range strings.Split(read(file), "\n") {
		if name, value, ok := strings.Cut(line, " "); ok && name == key {
			n, _ := strconv.ParseInt(value, 10, 64)
			return n
		}
	}
	return 0
}
