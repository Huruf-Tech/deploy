package cleanup

import (
	"context"
	"errors"
	"strings"
	"testing"
)

// Project volumes match by id pattern; another tool's huruf-tech-* names don't.
func TestProjectVolumePattern(t *testing.T) {
	if !projectVolume.MatchString("huruf-6adb97c6e67447ba4bf232fc-data") {
		t.Fatal("project volume not matched")
	}
	for _, name := range []string{"huruf-tech-redistriggers-c9a23p_redis-data", "huruf-registry-data", "dokploy-postgres"} {
		if projectVolume.MatchString(name) {
			t.Fatalf("%s matched", name)
		}
	}
}

func fakeDocker(_ context.Context, name string, args ...string) (string, error) {
	if name != "docker" {
		return "", nil
	}
	switch args[0] {
	case "ps":
		if strings.Contains(strings.Join(args, " "), "huruf.partition") {
			return "p6adf8d3c2b5\n", nil
		}
		return "shop-app-1\n", nil
	case "volume":
		return "huruf-6adb97c6e67447ba4bf232fc-data\nhuruf-tech-redis\n", nil
	case "images", "network":
		return "", errors.New("none")
	}
	return "", nil
}

// Ours goes, by label and exact name; another tool's things and shared
// packages stay; only Sysbox is a choice.
func TestPlanRemovesOursOnly(t *testing.T) {
	steps := Plan(context.Background(), Options{StateDir: t.TempDir(), Run: fakeDocker})
	byID := map[string]Step{}
	for _, s := range steps {
		byID[s.ID] = s
	}
	if steps[0].ID != "service" || !steps[0].Required {
		t.Fatal("the agent must stop first")
	}
	if !byID["partitions"].Remove || !strings.Contains(byID["partitions"].Item, "p6adf8d3c2b5") {
		t.Fatalf("partitions: %+v", byID["partitions"])
	}
	if !byID["volumes"].Remove || strings.Contains(byID["volumes"].Item, "huruf-tech") {
		t.Fatalf("volumes: %+v", byID["volumes"])
	}
	if byID["docker"].Remove || byID["docker"].Choice {
		t.Fatal("Docker must never be removable")
	}
	for _, s := range steps {
		if s.Choice && s.ID != "sysbox" {
			t.Fatalf("%s offered as a choice", s.ID)
		}
	}
}

func TestPartitionsRemovedThroughThePool(t *testing.T) {
	called := false
	steps := Plan(context.Background(), Options{
		StateDir: t.TempDir(),
		Run:      fakeDocker,
		RemovePartitions: func(context.Context) error {
			called = true
			return nil
		},
	})
	only := []Step{}
	for _, s := range steps {
		if s.ID == "partitions" {
			only = append(only, s)
		}
	}
	if err := Execute(context.Background(), only, func(Step, error) {}); err != nil || !called {
		t.Fatalf("partitions not removed: %v", err)
	}
}
