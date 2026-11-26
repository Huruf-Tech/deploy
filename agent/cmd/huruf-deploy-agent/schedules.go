package main

import (
	"context"
	"errors"
	"fmt"
	"hash/fnv"
	"strings"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/cron"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

// scheduledJobs turns the spec's schedules into timer jobs. An action this
// agent doesn't know (from a newer control plane) is left out.
func scheduledJobs(spec protocol.DesiredSpec, r *reconcile.Reconciler) []cron.Job {
	jobs := make([]cron.Job, 0, len(spec.Schedules))
	for _, s := range spec.Schedules {
		job := cron.Job{ID: s.Id, Cron: s.Cron, TimeZone: s.Timezone}
		switch {
		case s.Restart != nil:
			workload := s.Restart.Workload
			job.Run = func(ctx context.Context) (string, error) { return "", r.Restart(ctx, workload) }
		case s.Exec != nil && len(s.Exec.Command) > 0:
			command, timeout := s.Exec.Command, time.Duration(s.Exec.TimeoutSec)*time.Second
			job.Run = func(ctx context.Context) (string, error) {
				ctx, cancel := context.WithTimeout(ctx, timeout)
				defer cancel()
				return sh.Run(ctx, command[0], command[1:]...)
			}
		default:
			continue
		}
		jobs = append(jobs, job)
	}
	return jobs
}

// scheduleRan is a job's result as the control plane receives it.
func scheduleRan(job cron.Job, started time.Time, output string, err error) protocol.ScheduleRanEvent {
	data := protocol.ScheduleRanEventData{Job: job.ID, StartedAt: started.UnixMilli(), Status: "ok"}
	var skipped cron.Skipped
	switch {
	case errors.As(err, &skipped):
		data.Status, data.Message = "skipped", skipped.Reason
	case err != nil:
		data.Status, data.Message = "failed", err.Error()
	default:
		data.Message = strings.TrimSpace(output)
	}
	data.Message = sh.Tail(data.Message, 1_990)
	h := fnv.New64a()
	h.Write([]byte(job.ID))
	return protocol.ScheduleRanEvent{
		Id:   fmt.Sprintf("sr-%x-%d", h.Sum64(), data.StartedAt),
		Type: "schedule.ran",
		Data: data,
	}
}
