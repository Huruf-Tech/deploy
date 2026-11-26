package cron

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func at(t *testing.T, s, zone string) time.Time {
	t.Helper()
	loc, err := time.LoadLocation(zone)
	if err != nil {
		t.Fatal(err)
	}
	v, err := time.ParseInLocation("2006-01-02 15:04", s, loc)
	if err != nil {
		t.Fatal(err)
	}
	return v
}

func TestExpressions(t *testing.T) {
	cases := []struct {
		expr, time string
		want       bool
	}{
		{"0 3 * * *", "2026-11-27 03:00", true},
		{"0 3 * * *", "2026-11-27 03:01", false},
		{"@daily", "2026-11-27 00:00", true},
		{"*/15 * * * *", "2026-11-27 10:45", true},
		{"*/15 * * * *", "2026-11-27 10:46", false},
		{"0 9-17/4 * * *", "2026-11-27 13:00", true},
		{"0 9-17/4 * * *", "2026-11-27 15:00", false},
		{"30 2 * * 0", "2026-11-29 02:30", true}, // a Sunday
		{"30 2 * * 7", "2026-11-29 02:30", true},
		{"30 2 * * 1-5", "2026-11-29 02:30", false},
		{"0 0 1,15 * *", "2026-11-15 00:00", true},
		// Both day fields set: either matches (Vixie cron).
		{"0 0 1 * 5", "2026-11-27 00:00", true}, // a Friday
		{"0 0 1 * 5", "2026-11-26 00:00", false},
		// A day field starting with * defers to the other.
		{"0 0 */2 * 5", "2026-11-26 00:00", false},
	}
	for _, c := range cases {
		e, err := Parse(c.expr)
		if err != nil {
			t.Fatalf("%s: %v", c.expr, err)
		}
		if got := e.Matches(at(t, c.time, "UTC")); got != c.want {
			t.Errorf("%s at %s = %v, want %v", c.expr, c.time, got, c.want)
		}
	}
	for _, bad := range []string{"", "* * * *", "60 * * * *", "* 24 * * *", "* * 0 * *", "*/0 * * * *", "5-1 * * * *", "a * * * *", "* * * * 8"} {
		if _, err := Parse(bad); err == nil {
			t.Errorf("%q parsed", bad)
		}
	}
}

func scheduler() *Scheduler {
	return &Scheduler{Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
}

type results struct {
	mu   sync.Mutex
	errs map[string]error
	done chan string
}

func collect(s *Scheduler) *results {
	r := &results{errs: map[string]error{}, done: make(chan string, 100)}
	s.Done = func(j Job, _ time.Time, _ string, err error) {
		r.mu.Lock()
		r.errs[j.ID] = err
		r.mu.Unlock()
		r.done <- j.ID
	}
	return r
}

func (r *results) wait(t *testing.T, n int) {
	t.Helper()
	for range n {
		select {
		case <-r.done:
		case <-time.After(5 * time.Second):
			t.Fatal("job never finished")
		}
	}
}

func TestJobsFireInTheirTimeZone(t *testing.T) {
	s := scheduler()
	got := collect(s)
	var ran atomic.Int32
	s.Set([]Job{{
		ID: "karachi", Cron: "0 3 * * *", TimeZone: "Asia/Karachi",
		Run: func(context.Context) (string, error) { ran.Add(1); return "", nil },
	}})
	s.Tick(context.Background(), at(t, "2026-11-27 03:00", "UTC"))
	s.Tick(context.Background(), at(t, "2026-11-26 22:00", "UTC")) // 03:00 in Karachi
	got.wait(t, 1)
	if ran.Load() != 1 {
		t.Fatalf("ran %d times", ran.Load())
	}
}

func TestFailuresAndPanicsAreReportedNotFatal(t *testing.T) {
	s := scheduler()
	got := collect(s)
	s.Set([]Job{
		{ID: "fails", Cron: "* * * * *", Run: func(context.Context) (string, error) { return "", errors.New("boom") }},
		{ID: "panics", Cron: "* * * * *", Run: func(context.Context) (string, error) { panic("oops") }},
		{ID: "skips", Cron: "* * * * *", Run: func(context.Context) (string, error) { return "", Skipped{"nothing running"} }},
		// Left out: never reported, never run.
		{ID: "bad cron", Cron: "nope", Run: func(context.Context) (string, error) { panic("ran") }},
		{ID: "bad zone", Cron: "* * * * *", TimeZone: "Mars/Olympus", Run: func(context.Context) (string, error) { panic("ran") }},
	})
	s.Tick(context.Background(), time.Now())
	got.wait(t, 3)
	if got.errs["fails"] == nil || got.errs["panics"] == nil {
		t.Fatalf("errors = %v", got.errs)
	}
	var skipped Skipped
	if !errors.As(got.errs["skips"], &skipped) {
		t.Fatalf("skips = %v", got.errs["skips"])
	}
}

func TestAtMostConcurrencyRunAtOnceAndNoneTwice(t *testing.T) {
	s := scheduler()
	s.Concurrency = 2
	got := collect(s)
	var running, peak atomic.Int32
	release := make(chan struct{})
	var jobs []Job
	for _, id := range []string{"a", "b", "c", "d", "e"} {
		jobs = append(jobs, Job{ID: id, Cron: "* * * * *", Run: func(ctx context.Context) (string, error) {
			n := running.Add(1)
			for p := peak.Load(); n > p && !peak.CompareAndSwap(p, n); p = peak.Load() {
			}
			<-release
			running.Add(-1)
			return "", nil
		}})
	}
	s.Set(jobs)
	now := time.Now()
	s.Tick(context.Background(), now)
	// The next minute while all are still busy: none starts a second time.
	s.Tick(context.Background(), now.Add(time.Minute))
	time.Sleep(50 * time.Millisecond)
	close(release)
	got.wait(t, 5)
	if peak.Load() != 2 {
		t.Fatalf("peak = %d, want 2", peak.Load())
	}
	select {
	case id := <-got.done:
		t.Fatalf("%s ran twice", id)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestARepeatedWallClockMinuteFiresOnce(t *testing.T) {
	s := scheduler()
	got := collect(s)
	var ran atomic.Int32
	s.Set([]Job{{ID: "dst", Cron: "30 1 * * *", TimeZone: "America/New_York",
		Run: func(context.Context) (string, error) { ran.Add(1); return "", nil }}})
	// 2026-11-01: 01:30 happens twice in New York (05:30 and 06:30 UTC).
	s.Tick(context.Background(), at(t, "2026-11-01 05:30", "UTC"))
	got.wait(t, 1)
	s.Tick(context.Background(), at(t, "2026-11-01 06:30", "UTC"))
	time.Sleep(50 * time.Millisecond)
	if ran.Load() != 1 {
		t.Fatalf("ran %d times", ran.Load())
	}
}
