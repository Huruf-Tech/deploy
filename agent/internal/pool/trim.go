package pool

import (
	"context"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// The partitions' volume is a sparse file: space a partition frees stays
// taken on the host's disk until the volume is trimmed (2026-11-20:
// huruf-pool.img held space its partitions had long freed). Hourly, off the
// poll's path.
var (
	trimMu    sync.Mutex
	trimmedAt time.Time
	trimEvery = time.Hour
	fstrim    = func(ctx context.Context) { _, _ = sh.Run(ctx, "fstrim", Root) }
)

func trimVolume() {
	if !trimMu.TryLock() {
		return
	}
	if time.Since(trimmedAt) < trimEvery {
		trimMu.Unlock()
		return
	}
	trimmedAt = time.Now()
	go func() {
		defer trimMu.Unlock()
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		fstrim(ctx)
	}()
}
