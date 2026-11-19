package pool

import (
	"context"
	"sync/atomic"
	"testing"
	"time"
)

func TestTrimVolumeHourly(t *testing.T) {
	old := fstrim
	t.Cleanup(func() { fstrim = old; trimmedAt = time.Time{} })
	var runs atomic.Int32
	fstrim = func(context.Context) { runs.Add(1) }
	trimmedAt = time.Time{}
	trimVolume()
	trimMu.Lock() // waits for the trim
	trimMu.Unlock()
	trimVolume() // within the hour: skipped
	trimMu.Lock()
	trimMu.Unlock()
	if runs.Load() != 1 {
		t.Fatalf("fstrim ran %d times, want 1", runs.Load())
	}
}
