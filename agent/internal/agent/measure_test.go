package agent

import (
	"math"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/host"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestRoundTripIsTheMedianOfRecentPolls(t *testing.T) {
	a := &Agent{}
	for _, ms := range []int{40, 10, 30, 1000, 20} {
		a.addRTT(time.Duration(ms) * time.Millisecond)
	}
	a.addRTT(-time.Millisecond) // a clock hiccup: ignored
	if got := median(a.rtts); got != 30*time.Millisecond {
		t.Fatalf("median = %v, one slow poll shouldn't move it", got)
	}
	for range rttKept + 5 {
		a.addRTT(5 * time.Millisecond)
	}
	if len(a.rtts) != rttKept || median(a.rtts) != 5*time.Millisecond {
		t.Fatalf("kept %d, median %v", len(a.rtts), median(a.rtts))
	}
}

// The machine's CPU minus what its partitions used is what else runs on it,
// smoothed so a short burst doesn't make it look busy.
func TestCPUOutsidePartitions(t *testing.T) {
	a := &Agent{}
	cores := host.Cores()
	start := time.Unix(1_000_000, 0)
	part := func(micros int64) []protocol.PartitionUsage {
		return []protocol.PartitionUsage{{Name: "p1", CpuMicros: micros}}
	}
	if got := a.outsidePartitions(0.5, part(0), start); got != nil {
		t.Fatalf("no baseline yet, got %v", *got)
	}
	// A minute where the partition used 30% of the machine and the machine 50%.
	minute := time.Minute
	used := int64(0.3 * cores * float64(minute.Microseconds()))
	got := a.outsidePartitions(0.5, part(used), start.Add(minute))
	if got == nil || math.Abs(*got-0.2) > 0.001 {
		t.Fatalf("outside = %v, want 0.2", got)
	}
	// Then a minute where only the partition ran: it moves down, but only a
	// little (an hour's average).
	got = a.outsidePartitions(0.3, part(used*2), start.Add(2*minute))
	if *got >= 0.2 || *got < 0.19 {
		t.Fatalf("smoothed = %v", *got)
	}
}
