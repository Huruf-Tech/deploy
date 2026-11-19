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
	oldSpace, oldSteps := space, steps
	t.Cleanup(func() { space, steps = oldSpace, oldSteps })
	space = func() (int64, int64) { return total, free }
	steps = nil
	for _, name := range []string{"leftovers", "old cache", "cache share", "rollbacks", "unused images", "all cache"} {
		steps = append(steps, step{name, func(context.Context, int64) error {
			*ran = append(*ran, name)
			free += frees[name]
			return nil
		}})
	}
	return ran
}

func TestCleanStopsOnceThereIsRoom(t *testing.T) {
	// 20 GB disk, 3 GB free: low (under 5 GB).
	ran := fakeDisk(t, 20*gb, 3*gb, map[string]int64{"leftovers": gb, "old cache": 2 * gb})
	note := (&Builder{}).clean(context.Background(), lowMark)
	if !slices.Equal(*ran, []string{"leftovers", "old cache"}) {
		t.Fatalf("ran %v", *ran)
	}
	if !strings.Contains(note, "freed 3.0 GB") || !strings.Contains(note, "6.0 GB free now") {
		t.Fatalf("note = %q", note)
	}
}

func TestRollbackImagesOnlyWhenTheCacheWasntEnough(t *testing.T) {
	// The cache frees enough: rollbacks stay.
	ran := fakeDisk(t, 25*gb, 2*gb, map[string]int64{"cache share": 4 * gb})
	(&Builder{}).clean(context.Background(), lowMark)
	if slices.Contains(*ran, "rollbacks") {
		t.Fatalf("rollback images removed though the cache freed enough: %v", *ran)
	}
	// The partition from 2026-11-18: 1.7 GB free of 25, the cache frees 0.9 GB.
	ran = fakeDisk(t, 25*gb, 17*gb/10, map[string]int64{"cache share": 9 * gb / 10, "rollbacks": 14 * gb})
	note := (&Builder{}).clean(context.Background(), lowMark)
	if !slices.Equal(*ran, []string{"leftovers", "old cache", "cache share", "rollbacks"}) {
		t.Fatalf("ran %v", *ran)
	}
	if !strings.Contains(note, "16.6 GB free now") {
		t.Fatalf("note = %q", note)
	}
}

// 2026-11-20: 5.5 GB free of 25 passed the low mark, and the Next.js build
// filled the rest. A build gets 8 GB first, going as deep as it takes.
func TestABuildGetsRoomFirst(t *testing.T) {
	ran := fakeDisk(t, 25*gb, 11*gb/2, map[string]int64{"rollbacks": gb, "unused images": 3 * gb})
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil {
		t.Fatal(err)
	}
	want := []string{"leftovers", "old cache", "cache share", "rollbacks", "unused images"}
	if !slices.Equal(*ran, want) {
		t.Fatalf("ran %v, want %v", *ran, want)
	}
	// Between builds the same disk is fine: nothing runs.
	ran = fakeDisk(t, 25*gb, 11*gb/2, nil)
	(&Builder{}).settle(context.Background())
	if len(*ran) > 0 {
		t.Fatalf("settle cleaned above the low mark: %v", *ran)
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
