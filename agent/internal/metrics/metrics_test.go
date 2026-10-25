package metrics

import (
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

func TestParseBytes(t *testing.T) {
	cases := map[string]int64{
		"12.5MiB": 13107200,
		"1GiB":    1 << 30,
		"512KiB":  512 << 10,
		"1.5GB":   1_500_000_000,
		"900B":    900,
		"":        0,
		"garbage": 0,
	}
	for text, want := range cases {
		if got := ParseBytes(text); got != want {
			t.Errorf("ParseBytes(%q) = %d, want %d", text, got, want)
		}
	}
}

func TestRecorderRingIsBoundedAndOrdered(t *testing.T) {
	var r Recorder
	for i := range historySize + 5 {
		r.add(sample(int64(i)))
	}
	history := r.History()
	if len(history) != historySize {
		t.Fatalf("len = %d, want %d", len(history), historySize)
	}
	if history[0].T != 5 || history[len(history)-1].T != historySize+4 {
		t.Fatalf("not oldest-first: first=%d last=%d", history[0].T, history[len(history)-1].T)
	}
}

func TestHistoryEndsWithTheRecentBuffer(t *testing.T) {
	var r Recorder
	for _, at := range []int64{0, 60, 120, 180} {
		r.add(sample(at))
	}
	for at := int64(125); at <= 200; at += 5 {
		r.addRecent(sample(at))
	}
	for i := range recentSize + 3 { // overflow the recent ring too
		r.addRecent(sample(int64(1000 + i)))
	}
	history := r.History()
	// Minute samples before the recent buffer's first sample, then the buffer.
	if len(history) != 4+recentSize {
		t.Fatalf("len = %d, want %d", len(history), 4+recentSize)
	}
	for i := 1; i < len(history); i++ {
		if history[i].T <= history[i-1].T {
			t.Fatalf("not strictly ascending at %d: %d after %d", i, history[i].T, history[i-1].T)
		}
	}
	if last := history[len(history)-1].T; last != int64(1000+recentSize+2) {
		t.Fatalf("last = %d", last)
	}
}

func sample(t int64) protocol.MetricsSample { return protocol.MetricsSample{T: t} }
