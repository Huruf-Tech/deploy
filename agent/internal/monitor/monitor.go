// Package monitor samples workload and host usage on the agent (PLAN §7.1,
// §10, §13). It evaluates metric alert rules, autoscales workloads within
// their bounds, and keeps footprints and daily peaks for capacity reports.
// Usage stays on the server: only alert and autoscale events leave it.
package monitor

import (
	"cmp"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"os"
	"slices"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/metrics"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/reconcile"
)

const (
	weekHours = 7 * 24
	// Autoscaling looks at the average of the last few samples, so one spike doesn't scale.
	smoothing = 4
	// No change while usage is within 10% of the target.
	tolerance = 0.1
)

// Scaler is what autoscaling needs from the reconciler.
type Scaler interface {
	Replicas(w protocol.Workload) int
	Scale(ctx context.Context, workload string, n int)
}

type Monitor struct {
	List  func(ctx context.Context) ([]reconcile.Container, error)
	Stats func(ctx context.Context) map[string]metrics.Usage
	Host  func() protocol.MetricsSample
	// Disk sizes of images (by repo:tag) and volumes (by name); may be nil.
	Disk     func(ctx context.Context) (images, volumes map[string]int64)
	Cores    int
	Scaler   Scaler
	Emit     func(event any)
	Interval func() time.Duration
	Config   func() protocol.AgentConfigCapacity
	// File the rollups and firing alerts survive restarts in.
	Path string
	Log  *slog.Logger
	Now  func() time.Time

	mu       sync.Mutex
	spec     *protocol.DesiredSpec
	data     stored
	hour     int64 // unix hour of the samples being collected
	hostAcc  acc
	accs     map[string]*acc // workload → this hour's samples
	recent   map[string][][2]float64
	since    map[string]time.Time // rule → breaching since
	scaledAt map[string]time.Time
	last     protocol.MetricsSample
}

// bucket rolls up one hour: per replica for workloads, the whole host otherwise.
type bucket struct {
	Hour     int64   `json:"h"`
	CpuP95   float64 `json:"c"`
	CpuPeak  float64 `json:"cp"`
	MemP95   int64   `json:"m"`
	MemPeak  int64   `json:"mp"`
	DiskPeak int64   `json:"d,omitempty"`
	Samples  int     `json:"n"`
}

type stored struct {
	Host      []bucket                           `json:"host"`
	Workloads map[string][]bucket                `json:"workloads"`
	Daily     []protocol.CapacityReportDailyItem `json:"daily"`
	Firing    map[string]int64                   `json:"firing"` // rule → firedAt (ms)
}

type acc struct {
	cpu  []float64
	mem  []int64
	disk int64
}

func (a *acc) bucket(hour int64) bucket {
	b := bucket{Hour: hour, DiskPeak: a.disk, Samples: len(a.cpu)}
	if len(a.cpu) > 0 {
		b.CpuP95, b.CpuPeak = p95(a.cpu), slices.Max(a.cpu)
		b.MemP95, b.MemPeak = p95(a.mem), slices.Max(a.mem)
	}
	return b
}

// p95 is the nearest-rank 95th percentile.
func p95[T int64 | float64](values []T) T {
	if len(values) == 0 {
		return 0
	}
	sorted := slices.Sorted(slices.Values(values))
	return sorted[int(math.Ceil(0.95*float64(len(sorted))))-1]
}

// Load reads what an earlier run kept; a missing or damaged file starts empty.
func (m *Monitor) Load() {
	m.mu.Lock()
	defer m.mu.Unlock()
	raw, err := os.ReadFile(m.Path)
	if err == nil {
		err = json.Unmarshal(raw, &m.data)
	}
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		m.Log.Warn("capacity history unreadable; starting over", "error", err)
		m.data = stored{}
	}
}

func (m *Monitor) SetSpec(spec protocol.DesiredSpec) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.spec = &spec
}

func (m *Monitor) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(m.Interval()):
			m.Tick(ctx)
		}
	}
}

type usage struct {
	cpu      float64 // cores per replica
	mem      int64   // bytes per replica
	replicas int
}

// Tick takes one sample and acts on it.
func (m *Monitor) Tick(ctx context.Context) {
	containers, err := m.List(ctx)
	if err != nil {
		m.Log.Warn("monitor: listing containers failed", "error", err)
		return
	}
	stats := m.Stats(ctx)
	host := m.Host()

	byWorkload := map[string]*usage{}
	for _, c := range containers {
		u, ok := stats[c.Name]
		if !c.Running || !ok {
			continue
		}
		w := byWorkload[c.Workload]
		if w == nil {
			w = &usage{}
			byWorkload[c.Workload] = w
		}
		w.cpu += u.Cpu
		w.mem += u.Mem
		w.replicas++
	}
	for _, w := range byWorkload {
		w.cpu /= float64(w.replicas)
		w.mem /= int64(w.replicas)
	}

	now := m.Now()
	m.mu.Lock()
	m.last = host
	m.record(now, host, byWorkload)
	spec := m.spec
	var events []any
	if spec != nil {
		events = m.alerts(now, *spec, host, byWorkload)
	}
	m.mu.Unlock()

	if spec != nil {
		events = append(events, m.autoscale(ctx, now, *spec, byWorkload)...)
	}
	for _, e := range events {
		m.Emit(e)
	}
}

// record adds a sample to this hour, closing the previous hour first.
func (m *Monitor) record(now time.Time, host protocol.MetricsSample, byWorkload map[string]*usage) {
	hour := now.Unix() / 3600
	if m.hour != 0 && hour != m.hour {
		m.closeHour()
	}
	m.hour = hour
	if m.accs == nil {
		m.accs = map[string]*acc{}
	}
	m.hostAcc.cpu = append(m.hostAcc.cpu, host.Cpu*float64(m.Cores))
	m.hostAcc.mem = append(m.hostAcc.mem, host.MemUsed)
	m.hostAcc.disk = max(m.hostAcc.disk, host.DiskUsed)
	for name, u := range byWorkload {
		a := m.accs[name]
		if a == nil {
			a = &acc{}
			m.accs[name] = a
		}
		a.cpu = append(a.cpu, u.cpu)
		a.mem = append(a.mem, u.mem)
	}
}

// closeHour rolls the hour's samples into buckets and its day's row, then saves.
func (m *Monitor) closeHour() {
	hostBucket := m.hostAcc.bucket(m.hour)
	m.data.Host = keepLast(append(m.data.Host, hostBucket), weekHours)
	if m.data.Workloads == nil {
		m.data.Workloads = map[string][]bucket{}
	}
	day := time.Unix(m.hour*3600, 0).UTC().Format(time.DateOnly)
	if n := len(m.data.Daily); n == 0 || m.data.Daily[n-1].Day != day {
		m.data.Daily = append(m.data.Daily, protocol.CapacityReportDailyItem{Day: day, Workloads: map[string]int64{}})
	}
	row := &m.data.Daily[len(m.data.Daily)-1]
	row.MemPeak = max(row.MemPeak, hostBucket.MemPeak)
	// ponytail: the day's CPU "p95" is its busiest hour's p95; keep minute samples if that's too coarse.
	row.CpuP95 = max(row.CpuP95, hostBucket.CpuP95)
	row.DiskPeak = max(row.DiskPeak, hostBucket.DiskPeak)
	for name, a := range m.accs {
		b := a.bucket(m.hour)
		m.data.Workloads[name] = keepLast(append(m.data.Workloads[name], b), weekHours)
		row.Workloads[name] = max(row.Workloads[name], b.MemPeak)
	}
	// Workloads gone for a week are forgotten (PLAN §20.4).
	for name, list := range m.data.Workloads {
		if list[len(list)-1].Hour < m.hour-weekHours {
			delete(m.data.Workloads, name)
		}
	}
	retention := 90
	if m.Config != nil {
		retention = int(m.Config().RetentionDays)
	}
	m.data.Daily = keepLast(m.data.Daily, retention)
	m.hostAcc, m.accs = acc{}, map[string]*acc{}
	m.save()
}

func keepLast[T any](list []T, n int) []T {
	if len(list) > n {
		return list[len(list)-n:]
	}
	return list
}

// save writes atomically; the caller holds the lock.
func (m *Monitor) save() {
	raw, err := json.Marshal(m.data)
	if err == nil {
		tmp := m.Path + ".tmp"
		if err = os.WriteFile(tmp, raw, 0o600); err == nil {
			err = os.Rename(tmp, m.Path)
		}
	}
	if err != nil {
		m.Log.Warn("saving capacity history failed", "error", err)
	}
}

// footprint over the last `hours` closed hours plus the current one.
// ponytail: window p95 is the sample-weighted p95 of hourly p95s; keep a histogram if it misleads.
func footprint(buckets []bucket, current *acc, nowHour int64, hours int64) *protocol.Footprint {
	var list []bucket
	for _, b := range buckets {
		if b.Hour > nowHour-hours {
			list = append(list, b)
		}
	}
	if current != nil && len(current.cpu) > 0 {
		list = append(list, current.bucket(nowHour))
	}
	if len(list) == 0 {
		return nil
	}
	f := &protocol.Footprint{}
	for _, b := range list {
		f.CpuPeak, f.MemPeak = max(f.CpuPeak, b.CpuPeak), max(f.MemPeak, b.MemPeak)
	}
	f.CpuP95 = weightedP95(list, func(b bucket) float64 { return b.CpuP95 })
	f.MemP95 = weightedP95(list, func(b bucket) int64 { return b.MemP95 })
	return f
}

// weightedP95 counts each bucket's p95 once per sample it summarizes.
func weightedP95[T int64 | float64](list []bucket, value func(bucket) T) T {
	sorted := slices.SortedFunc(slices.Values(list), func(a, b bucket) int { return cmp.Compare(value(a), value(b)) })
	total := 0
	for _, b := range sorted {
		total += max(b.Samples, 1)
	}
	seen := 0
	for _, b := range sorted {
		seen += max(b.Samples, 1)
		if float64(seen) >= 0.95*float64(total) {
			return value(b)
		}
	}
	return 0
}

// roomMb is memory left for more apps: capacity minus headroom minus the
// larger of what's reserved (autoscale max) and what's used at p95 (24 h).
func (m *Monitor) roomMb(spec protocol.DesiredSpec, host protocol.MetricsSample) float64 {
	headroom := m.headroom()
	var reserved float64
	for _, w := range spec.Workloads {
		reserved += float64(w.Reserve.MemMb) * float64(maxReplicas(w, m.Scaler))
	}
	used := float64(host.MemUsed) / (1 << 20)
	if f := footprint(m.data.Host, &m.hostAcc, m.hour, 24); f != nil {
		used = float64(f.MemP95) / (1 << 20)
	}
	return float64(host.MemTotal)/(1<<20)*(1-headroom/100) - max(reserved, used)
}

func (m *Monitor) headroom() float64 {
	if m.Config != nil {
		return m.Config().HeadroomPercent
	}
	return 15
}

func maxReplicas(w protocol.Workload, s Scaler) int {
	if w.Autoscale != nil {
		return int(w.Autoscale.Max)
	}
	if s != nil {
		return s.Replicas(w)
	}
	if len(w.Releases) > 0 {
		return int(w.Releases[len(w.Releases)-1].Replicas)
	}
	return 0
}

// value of a rule's metric now; false when it can't be measured here.
func (m *Monitor) value(rule protocol.AlertSpec, spec protocol.DesiredSpec, host protocol.MetricsSample, byWorkload map[string]*usage) (float64, bool) {
	if rule.Project == "" {
		switch rule.Metric {
		case "cpu":
			return host.Cpu * 100, true
		case "memory":
			return percent(float64(host.MemUsed), float64(host.MemTotal))
		case "disk":
			return percent(float64(host.DiskUsed), float64(host.DiskTotal))
		case "room":
			return m.roomMb(spec, host), host.MemTotal > 0
		}
		return 0, false
	}
	// A project's busiest workload here, against its per-replica base.
	found, value := false, 0.0
	for _, w := range spec.Workloads {
		u := byWorkload[w.Name]
		if w.Project != rule.Project || u == nil {
			continue
		}
		var v float64
		switch rule.Metric {
		case "cpu":
			v = u.cpu / w.Base.Cpu * 100
		case "memory":
			v = float64(u.mem) / (w.Base.MemMb * (1 << 20)) * 100
		default:
			continue
		}
		found, value = true, max(value, v)
	}
	return value, found
}

func percent(part, whole float64) (float64, bool) {
	if whole <= 0 {
		return 0, false
	}
	return part / whole * 100, true
}

// alerts fires a rule that breached for its forSec and resolves it once it
// stops; the caller holds the lock.
func (m *Monitor) alerts(now time.Time, spec protocol.DesiredSpec, host protocol.MetricsSample, byWorkload map[string]*usage) []any {
	if m.since == nil {
		m.since = map[string]time.Time{}
	}
	if m.data.Firing == nil {
		m.data.Firing = map[string]int64{}
	}
	var events []any
	changed := false
	emit := func(kind, rule string, value float64, firedAt int64) {
		events = append(events, protocol.AlertEvent{
			Id:   fmt.Sprintf("%s-%s-%d", kind, rule, firedAt),
			Type: "alert." + kind,
			Data: protocol.AlertEventData{Rule: rule, Value: math.Round(value*100) / 100, FiredAt: firedAt},
		})
		changed = true
	}

	active := map[string]bool{}
	for _, rule := range spec.Alerts {
		active[rule.Rule] = true
		value, ok := m.value(rule, spec, host, byWorkload)
		breach := ok && (rule.Metric == "room" && value < rule.Threshold || rule.Metric != "room" && value > rule.Threshold)
		firedAt, firing := m.data.Firing[rule.Rule]
		if !breach {
			delete(m.since, rule.Rule)
			if firing {
				delete(m.data.Firing, rule.Rule)
				emit("resolved", rule.Rule, value, firedAt)
			}
			continue
		}
		if _, ok := m.since[rule.Rule]; !ok {
			m.since[rule.Rule] = now
		}
		if !firing && now.Sub(m.since[rule.Rule]) >= time.Duration(rule.ForSec)*time.Second {
			m.data.Firing[rule.Rule] = now.UnixMilli()
			emit("fired", rule.Rule, value, now.UnixMilli())
		}
	}
	// Rules removed from the spec: the control plane resolves their events.
	for rule := range m.data.Firing {
		if !active[rule] {
			delete(m.data.Firing, rule)
			changed = true
		}
	}
	for rule := range m.since {
		if !active[rule] {
			delete(m.since, rule)
		}
	}
	if changed {
		m.save()
	}
	return events
}

// autoscale moves each autoscaled workload toward its targets (PLAN §10):
// proportionally, within min..max, at most once per cooldown.
func (m *Monitor) autoscale(ctx context.Context, now time.Time, spec protocol.DesiredSpec, byWorkload map[string]*usage) []any {
	m.mu.Lock()
	if m.recent == nil {
		m.recent, m.scaledAt = map[string][][2]float64{}, map[string]time.Time{}
	}
	type change struct {
		w        protocol.Workload
		from, to int
		reason   string
	}
	var changes []change
	for _, w := range spec.Workloads {
		a, u := w.Autoscale, byWorkload[w.Name]
		if a == nil || u == nil || len(w.Releases) != 1 {
			continue // rollouts keep their count
		}
		sample := [2]float64{u.cpu / w.Base.Cpu * 100, float64(u.mem) / (w.Base.MemMb * (1 << 20)) * 100}
		m.recent[w.Name] = keepLast(append(m.recent[w.Name], sample), smoothing)
		if len(m.recent[w.Name]) < smoothing || now.Sub(m.scaledAt[w.Name]) < time.Duration(a.CooldownSec)*time.Second {
			continue
		}
		var avg [2]float64
		for _, s := range m.recent[w.Name] {
			avg[0], avg[1] = avg[0]+s[0]/smoothing, avg[1]+s[1]/smoothing
		}
		ratio, reason := 0.0, ""
		if a.CpuPercent != nil {
			ratio, reason = avg[0]/float64(*a.CpuPercent), fmt.Sprintf("CPU %.0f%% (target %d%%)", avg[0], *a.CpuPercent)
		}
		if a.MemPercent != nil {
			if r := avg[1] / float64(*a.MemPercent); r > ratio {
				ratio, reason = r, fmt.Sprintf("memory %.0f%% (target %d%%)", avg[1], *a.MemPercent)
			}
		}
		if reason == "" || math.Abs(ratio-1) <= tolerance {
			continue
		}
		from := m.Scaler.Replicas(w)
		to := min(max(int(math.Ceil(float64(from)*ratio)), int(a.Min)), int(a.Max))
		if to == from {
			continue
		}
		m.scaledAt[w.Name] = now
		m.recent[w.Name] = nil // judge the new count on fresh samples
		changes = append(changes, change{w, from, to, reason})
	}
	for name := range m.recent {
		if !slices.ContainsFunc(spec.Workloads, func(w protocol.Workload) bool { return w.Name == name }) {
			delete(m.recent, name)
			delete(m.scaledAt, name)
		}
	}
	m.mu.Unlock()

	var events []any
	for _, c := range changes {
		m.Log.Info("autoscaling", "workload", c.w.Name, "from", c.from, "to", c.to, "reason", c.reason)
		m.Scaler.Scale(ctx, c.w.Name, c.to)
		events = append(events, protocol.AutoscaleEvent{
			Id:   fmt.Sprintf("as-%s-%d", c.w.Name, now.UnixMilli()),
			Type: "autoscale.changed",
			Data: protocol.AutoscaleEventData{Project: c.w.Project, Workload: c.w.Name, From: int64(c.from), To: int64(c.to), Reason: c.reason},
		})
	}
	return events
}

// Report answers `capacity.report` (PLAN §7.1): footprints and daily peaks.
func (m *Monitor) Report(ctx context.Context) protocol.CapacityReport {
	var images, volumes map[string]int64
	if m.Disk != nil {
		images, volumes = m.Disk(ctx)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	host := m.last
	if host.MemTotal == 0 {
		host = m.Host()
	}
	report := protocol.CapacityReport{
		At: m.Now().UnixMilli(),
		Host: protocol.CapacityReportHost{
			CpuCores: int64(m.Cores), MemTotal: host.MemTotal, DiskTotal: host.DiskTotal,
			HeadroomPercent: m.headroom(),
		},
		Workloads: []protocol.CapacityReportWorkloadsItem{},
		Daily:     append([]protocol.CapacityReportDailyItem{}, m.data.Daily...),
	}
	if f := footprint(m.data.Host, &m.hostAcc, m.hour, 24); f != nil {
		disk := m.hostAcc.disk
		for _, b := range m.data.Host {
			if b.Hour > m.hour-24 {
				disk = max(disk, b.DiskPeak)
			}
		}
		report.Host.Day = &protocol.CapacityReportHostDay{
			CpuP95: f.CpuP95, CpuPeak: f.CpuPeak, MemP95: f.MemP95, MemPeak: f.MemPeak, DiskPeak: disk,
		}
	}
	if m.spec == nil {
		return report
	}
	for _, w := range m.spec.Workloads {
		item := protocol.CapacityReportWorkloadsItem{
			Project: w.Project, Workload: w.Name,
			MaxReplicas: int64(maxReplicas(w, m.Scaler)),
			Reserve:     protocol.CapacityReportWorkloadsItemReserve{Cpu: w.Reserve.Cpu, MemMb: w.Reserve.MemMb},
			Day:         footprint(m.data.Workloads[w.Name], m.accs[w.Name], m.hour, 24),
			Week:        footprint(m.data.Workloads[w.Name], m.accs[w.Name], m.hour, weekHours),
		}
		if m.Scaler != nil {
			item.Replicas = int64(m.Scaler.Replicas(w))
		}
		if len(w.Releases) > 0 {
			rel := w.Releases[len(w.Releases)-1]
			item.Disk = images[rel.Image]
			for _, v := range rel.Volumes {
				item.Disk += volumes[v.Name]
			}
		}
		report.Workloads = append(report.Workloads, item)
	}
	return report
}
