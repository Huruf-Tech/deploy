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
		if got := parseBytes(text); got != want {
			t.Errorf("parseBytes(%q) = %d, want %d", text, got, want)
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

func sample(t int64) protocol.MetricsSample { return protocol.MetricsSample{T: t} }
