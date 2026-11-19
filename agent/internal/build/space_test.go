package build

import (
	"context"
	"slices"
	"strings"
	"testing"
)

func TestOlderImages(t *testing.T) {
	images := []string{
		"huruf/shop-1a:7-aaa", "huruf/shop-1a:6-bbb", "huruf/shop-1a:5-ccc", "huruf/shop-1a:4-ddd",
		"huruf/blog-2b:3-eee", "huruf/blog-2b:2-fff",
		"reg.example/shop-1a:4-ddd", "reg.example/shop-1a:3-ggg",
		"huruf/x:<none>",
	}
	used := []string{"huruf/shop-1a:6-bbb", "huruf/blog-2b:3-eee", "nginx:latest"}
	got := olderImages(images, used)
	// shop: 6 is live, 7 is the newest other (kept); 5 and 4 go.
	// blog: 3 is live, 2 is kept. The registry copies: 4 kept, 3 goes.
	want := []string{"huruf/shop-1a:4-ddd", "huruf/shop-1a:5-ccc", "reg.example/shop-1a:3-ggg"}
	if !slices.Equal(got, want) {
		t.Fatalf("olderImages = %v, want %v", got, want)
	}
}

// A fake disk: each step frees what it's given.
func fakeDisk(t *testing.T, total, free int64, frees map[string]int64) *[]string {
	t.Helper()
	ran := &[]string{}
	oldSpace, oldSteps, oldLast := space, steps, lastResort
	t.Cleanup(func() { space, steps, lastResort = oldSpace, oldSteps, oldLast })
	space = func() (int64, int64) { return total, free }
	fake := func(name string) step {
		return step{name, func(context.Context, int64) error {
			*ran = append(*ran, name)
			free += frees[name]
			return nil
		}}
	}
	steps = nil
	for _, name := range []string{"leftovers", "old cache", "cache share", "rollbacks", "unused images"} {
		steps = append(steps, fake(name))
	}
	lastResort = fake("all cache")
	return ran
}

func TestCleanStopsOnceThereIsRoom(t *testing.T) {
	// 20 GB disk, 3 GB free: low (under 5 GB).
	ran := fakeDisk(t, 20*gb, 3*gb, map[string]int64{"leftovers": gb, "old cache": 2 * gb})
	note := (&Builder{}).clean(context.Background(), lowMark, steps)
	if !slices.Equal(*ran, []string{"leftovers", "old cache"}) {
		t.Fatalf("ran %v", *ran)
	}
	if !strings.Contains(note, "freed 3.0 GB") || !strings.Contains(note, "6.0 GB free now") {
		t.Fatalf("note = %q", note)
	}
}

// 2026-11-20: Dokploy's caches kept the pool machine low, so every pass freed
// nothing and went all the way down. Between builds: cheap steps only.
func TestBetweenBuildsTheCacheAndImagesStay(t *testing.T) {
	ran := fakeDisk(t, 96*gb, 12*gb, nil)
	b := &Builder{}
	b.settle(context.Background())
	if !slices.Equal(*ran, []string{"leftovers", "old cache", "cache share"}) {
		t.Fatalf("settle ran %v", *ran)
	}
	// Above the low mark, nothing runs.
	ran = fakeDisk(t, 25*gb, 11*gb/2, nil)
	b.settle(context.Background())
	if len(*ran) > 0 {
		t.Fatalf("settle cleaned above the low mark: %v", *ran)
	}
}

// 2026-11-20: 5.5 GB free of 25 passed the low mark, and the Next.js build
// filled the rest. A build gets 8 GB first, images included; the whole cache
// stays while the build can run.
func TestABuildGetsRoomFirst(t *testing.T) {
	ran := fakeDisk(t, 25*gb, 11*gb/2, map[string]int64{"rollbacks": gb, "unused images": 3 * gb})
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil {
		t.Fatal(err)
	}
	want := []string{"leftovers", "old cache", "cache share", "rollbacks", "unused images"}
	if !slices.Equal(*ran, want) {
		t.Fatalf("ran %v, want %v", *ran, want)
	}
	// Short of 8 GB but above 3: the build runs with its cache.
	ran = fakeDisk(t, 25*gb, 4*gb, nil)
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil || slices.Contains(*ran, "all cache") {
		t.Fatalf("err %v, ran %v", err, *ran)
	}
	// Under 3 GB: the whole cache goes, and the build runs.
	ran = fakeDisk(t, 25*gb, 2*gb, map[string]int64{"all cache": 4 * gb})
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil || !slices.Contains(*ran, "all cache") {
		t.Fatalf("err %v, ran %v", err, *ran)
	}
}

func TestBuildMarks(t *testing.T) {
	for _, c := range []struct{ total, build int64 }{
		{25 * gb, 8 * gb},   // at least 8 GB
		{100 * gb, 25 * gb}, // a quarter
		{12 * gb, 6 * gb},   // never more than half
	} {
		if got := buildMark(c.total); got != c.build {
			t.Fatalf("buildMark(%d GB) = %d GB, want %d", c.total/gb, got/gb, c.build/gb)
		}
	}
}

func TestRoomToBuild(t *testing.T) {
	ran := fakeDisk(t, 100*gb, 50*gb, nil)
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil || len(*ran) > 0 {
		t.Fatalf("plenty of room: err %v, ran %v", err, *ran)
	}
	fakeDisk(t, 20*gb, gb/2, nil)
	err := (&Builder{}).roomToBuild(context.Background(), t.Logf)
	if err == nil || !strings.Contains(err.Error(), "too small for its apps: 0.5 GB free of 20.0 GB") {
		t.Fatalf("err = %v", err)
	}
}

func TestUnusedImages(t *testing.T) {
	got := unusedImages(
		[]string{"app:3", "app:2", "blog:1", "x:<none>"},
		[]string{"app:3", "nginx:latest"},
	)
	if !slices.Equal(got, []string{"app:2", "blog:1"}) {
		t.Fatalf("unusedImages = %v", got)
	}
}

func TestLeftBuilders(t *testing.T) {
	got := leftBuilders([]string{
		"buildx_buildkit_railpack-medicloud-webapp-bqdsoi-khvrcl0_state",
		"triggers-redis-5qgkpb_redis-data", // an app's data: never
		"buildx_buildkit_notes",            // not a builder's state
		"my_buildx_buildkit_x_state",
	})
	if !slices.Equal(got, []string{"buildx_buildkit_railpack-medicloud-webapp-bqdsoi-khvrcl0_state"}) {
		t.Fatalf("leftBuilders = %v", got)
	}
}
