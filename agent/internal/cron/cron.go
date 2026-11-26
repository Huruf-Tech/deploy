// Package cron is the agent's timer (PLAN §10.1): jobs the control plane sends
// with the desired state, each a 5-field cron expression in a time zone. One
// goroutine checks every job once a minute (microseconds for thousands), at
// most Concurrency jobs run at once while the rest wait their turn, and a job
// that fails, hangs or panics is logged and reported, never fatal.
package cron

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"
	_ "time/tzdata" // time zones on hosts without /usr/share/zoneinfo
)

// Expr is a parsed cron expression: minute hour day-of-month month day-of-week.
type Expr struct {
	minute, hour, dom, month, dow uint64
	// A day field starting with * leaves the days to the other one (Vixie cron).
	anyDay bool
}

var macros = map[string]string{
	"@hourly": "0 * * * *", "@daily": "0 0 * * *", "@midnight": "0 0 * * *",
	"@weekly": "0 0 * * 0", "@monthly": "0 0 1 * *", "@yearly": "0 0 1 1 *",
	"@annually": "0 0 1 1 *",
}

var bounds = [5][2]int{{0, 59}, {0, 23}, {1, 31}, {1, 12}, {0, 7}}

// Parse reads `*`, values, ranges (1-5), steps (*/15, 1-30/5), lists (1,15)
// and the @daily-style macros. Weekdays are 0-7, both 0 and 7 Sunday.
func Parse(s string) (Expr, error) {
	s = strings.TrimSpace(s)
	if m, ok := macros[s]; ok {
		s = m
	}
	f := strings.Fields(s)
	if len(f) != 5 {
		return Expr{}, fmt.Errorf("cron %q: want 5 fields", s)
	}
	var e Expr
	for i, out := range []*uint64{&e.minute, &e.hour, &e.dom, &e.month, &e.dow} {
		bits, err := field(f[i], bounds[i][0], bounds[i][1])
		if err != nil {
			return Expr{}, fmt.Errorf("cron %q: %w", s, err)
		}
		*out = bits
	}
	if e.dow&(1<<7) != 0 {
		e.dow |= 1
	}
	e.anyDay = strings.HasPrefix(f[2], "*") || strings.HasPrefix(f[4], "*")
	return e, nil
}

func field(s string, lo, hi int) (uint64, error) {
	var bits uint64
	for _, part := range strings.Split(s, ",") {
		span, stepText, stepped := strings.Cut(part, "/")
		step := 1
		if stepped {
			n, err := strconv.Atoi(stepText)
			if err != nil || n < 1 {
				return 0, fmt.Errorf("bad step in %q", part)
			}
			step = n
		}
		from, to := lo, hi
		if span != "*" {
			a, b, ranged := strings.Cut(span, "-")
			x, err := strconv.Atoi(a)
			if err != nil {
				return 0, fmt.Errorf("bad value %q", part)
			}
			from, to = x, x
			if ranged {
				if to, err = strconv.Atoi(b); err != nil {
					return 0, fmt.Errorf("bad range %q", part)
				}
			} else if stepped {
				to = hi
			}
		}
		if from < lo || to > hi || from > to {
			return 0, fmt.Errorf("%q is outside %d-%d", part, lo, hi)
		}
		for v := from; v <= to; v += step {
			bits |= 1 << v
		}
	}
	return bits, nil
}

// Matches reports whether the expression fires in t's minute, in t's zone.
func (e Expr) Matches(t time.Time) bool {
	if e.minute&(1<<t.Minute()) == 0 || e.hour&(1<<t.Hour()) == 0 || e.month&(1<<int(t.Month())) == 0 {
		return false
	}
	dom, dow := e.dom&(1<<t.Day()) != 0, e.dow&(1<<int(t.Weekday())) != 0
	if e.anyDay {
		return dom && dow
	}
	return dom || dow
}

// Skipped is a job that had nothing to do this time (reported as skipped, not failed).
type Skipped struct{ Reason string }

func (s Skipped) Error() string { return s.Reason }

// Job is one scheduled job. Its ID stays the same across specs, so a job still
// running when a new spec arrives isn't started twice.
type Job struct {
	ID       string
	Cron     string
	TimeZone string // IANA name; UTC when empty
	// Run's output (may be empty) is reported with the result.
	Run func(ctx context.Context) (string, error)
}

type entry struct {
	job  Job
	expr Expr
	loc  *time.Location
}

type Scheduler struct {
	Log *slog.Logger
	// Most jobs running at once (default 2): many projects due at 03:00 on one
	// machine take turns instead of all restarting together.
	Concurrency int
	// The longest a job may run (default 1 h); it holds a slot meanwhile.
	MaxRun time.Duration
	// Called with each result; may be nil.
	Done func(job Job, started time.Time, output string, err error)

	mu    sync.Mutex
	jobs  map[string]entry
	busy  map[string]bool   // waiting for a slot or running
	fired map[string]string // job → the local minute it last fired: a repeated wall-clock minute (DST) fires once
	slots chan struct{}
}

// catchUp is how far back minutes missed while the host slept or the clock
// jumped ahead still fire.
const catchUp = 30 * time.Minute

// Set replaces the jobs. An invalid one is logged and left out.
func (s *Scheduler) Set(jobs []Job) {
	next := make(map[string]entry, len(jobs))
	for _, j := range jobs {
		expr, err := Parse(j.Cron)
		var loc *time.Location
		if err == nil {
			loc, err = time.LoadLocation(j.TimeZone)
		}
		if err == nil && j.Run == nil {
			err = errors.New("no action")
		}
		if err != nil {
			s.Log.Warn("scheduled job left out", "job", j.ID, "error", err)
			continue
		}
		next[j.ID] = entry{job: j, expr: expr, loc: loc}
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs = next
	for id := range s.fired {
		if _, ok := next[id]; !ok {
			delete(s.fired, id)
		}
	}
}

// Run fires due jobs at the start of every minute until ctx ends.
func (s *Scheduler) Run(ctx context.Context) {
	last := time.Now().Truncate(time.Minute)
	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Until(last.Add(time.Minute))):
		}
		now := time.Now().Truncate(time.Minute)
		from := last.Add(time.Minute)
		if early := now.Add(-catchUp); from.Before(early) {
			from = early
		}
		for t := from; !t.After(now); t = t.Add(time.Minute) {
			s.Tick(ctx, t)
		}
		last = now // a clock set back starts over from there; `fired` keeps repeats out
	}
}

// Tick starts the jobs due in t's minute.
func (s *Scheduler) Tick(ctx context.Context, t time.Time) {
	defer func() {
		if p := recover(); p != nil {
			s.Log.Error("scheduler tick panicked", "panic", p)
		}
	}()
	s.mu.Lock()
	if s.slots == nil {
		n := s.Concurrency
		if n <= 0 {
			n = 2
		}
		s.slots = make(chan struct{}, n)
		s.busy, s.fired = map[string]bool{}, map[string]string{}
	}
	var due []Job
	for id, e := range s.jobs {
		local := t.In(e.loc)
		if !e.expr.Matches(local) {
			continue
		}
		minute := local.Format("2006-01-02 15:04")
		if s.fired[id] == minute {
			continue
		}
		s.fired[id] = minute
		if s.busy[id] {
			s.Log.Info("scheduled job still running; skipping this run", "job", id)
			continue
		}
		s.busy[id] = true
		due = append(due, e.job)
	}
	s.mu.Unlock()
	for _, j := range due {
		go s.run(ctx, j)
	}
}

func (s *Scheduler) run(ctx context.Context, j Job) {
	defer func() {
		s.mu.Lock()
		delete(s.busy, j.ID)
		s.mu.Unlock()
	}()
	select {
	case s.slots <- struct{}{}:
	case <-ctx.Done():
		return
	}
	defer func() { <-s.slots }()

	limit := s.MaxRun
	if limit <= 0 {
		limit = time.Hour
	}
	runCtx, cancel := context.WithTimeout(ctx, limit)
	defer cancel()
	started := time.Now()
	output, err := safely(runCtx, j.Run)
	var skipped Skipped
	switch {
	case errors.As(err, &skipped):
		s.Log.Info("scheduled job skipped", "job", j.ID, "reason", skipped.Reason)
	case err != nil:
		s.Log.Warn("scheduled job failed", "job", j.ID, "error", err)
	default:
		s.Log.Info("scheduled job done", "job", j.ID, "took", time.Since(started).Round(time.Second))
	}
	if s.Done != nil && ctx.Err() == nil {
		func() {
			defer func() {
				if p := recover(); p != nil {
					s.Log.Error("reporting a scheduled job panicked", "job", j.ID, "panic", p)
				}
			}()
			s.Done(j, started, output, err)
		}()
	}
}

func safely(ctx context.Context, run func(context.Context) (string, error)) (output string, err error) {
	defer func() {
		if p := recover(); p != nil {
			err = fmt.Errorf("panicked: %v", p)
		}
	}()
	return run(ctx)
}
