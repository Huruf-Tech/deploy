package pool

import (
	"slices"
	"testing"
)

func TestOrphanedPartitions(t *testing.T) {
	// Sysbox restarted on 2026-11-13 06:56:41 UTC, under p99d5f79c421.
	since := latestUnix("@1794552999\n@1794553001\n")
	if since != 1794553001 {
		t.Fatalf("latest start = %d", since)
	}
	inspect := "p99d5f79c421 2026-10-29T20:20:29.60660636Z\n" +
		"pfresh 2026-11-13T07:10:00.5Z\n" + // restarted since: Sysbox knows it
		"Bad.Name 2026-10-01T00:00:00Z\n" + // not ours
		"pbroken not-a-time\n"
	if got := orphaned(inspect, since); !slices.Equal(got, []string{"p99d5f79c421"}) {
		t.Fatalf("orphaned = %v", got)
	}
	if got := orphaned(inspect, latestUnix("")); len(got) != 0 {
		t.Fatalf("unknown Sysbox start still restarted %v", got)
	}
}
