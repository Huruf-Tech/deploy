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
	steps = []step{fake("leftovers"), fake("old cache"), fake("cache share")}
	lastResort = fake("rollbacks")
	return ran
}

func TestCleanStopsOnceThereIsRoom(t *testing.T) {
	// 20 GB disk, 3 GB free: low (under 5 GB), not critical.
	ran := fakeDisk(t, 20*gb, 3*gb, map[string]int64{"leftovers": gb, "old cache": 2 * gb})
	note := (&Builder{}).clean(context.Background())
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
	(&Builder{}).clean(context.Background())
	if slices.Contains(*ran, "rollbacks") {
		t.Fatalf("rollback images removed though the cache freed enough: %v", *ran)
	}
	// The partition from 2026-11-18: 1.7 GB free of 25, the cache frees 0.9 GB.
	ran = fakeDisk(t, 25*gb, 17*gb/10, map[string]int64{"cache share": 9 * gb / 10, "rollbacks": 14 * gb})
	note := (&Builder{}).clean(context.Background())
	if !slices.Equal(*ran, []string{"leftovers", "old cache", "cache share", "rollbacks"}) {
		t.Fatalf("ran %v", *ran)
	}
	if !strings.Contains(note, "16.6 GB free now") {
		t.Fatalf("note = %q", note)
	}
}

func TestRoomToBuild(t *testing.T) {
	ran := fakeDisk(t, 100*gb, 50*gb, nil)
	if err := (&Builder{}).roomToBuild(context.Background(), t.Logf); err != nil || len(*ran) > 0 {
		t.Fatalf("plenty of room: err %v, ran %v", err, *ran)
	}
	fakeDisk(t, 20*gb, gb/2, nil)
	err := (&Builder{}).roomToBuild(context.Background(), t.Logf)
	if err == nil || !strings.Contains(err.Error(), "disk is full: 0.5 GB free of 20.0 GB") {
		t.Fatalf("err = %v", err)
	}
}
