// Package pool is the host role of every machine (PLAN §27): the agent
// installed on a machine runs no projects itself; the owner splits the
// machine into partitions, each running our agent as a server of its own.
// A rental is an isolated partition on one of the platform's machines (§28).
// How partitions are made is the Driver's business (Sysbox for now), so the
// technology can change behind it.
package pool

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/sh"
)

const MiB = 1 << 20

// Usage is what a Driver reads about one partition.
type Usage struct {
	State     string
	CPUMicros int64
	MemUsed   int64 // bytes it can't give back (anon, not reclaimable cache)
	DiskUsed  int64
	RxBytes   int64
	TxBytes   int64
}

// Driver makes partitions (PLAN §26.3: `PartitionDriver`).
type Driver interface {
	// Setup prepares the machine and reports what partitions may use in all.
	Setup(ctx context.Context, p protocol.PoolEnsurePayload) (allocatable protocol.PartitionSize, result map[string]any, err error)
	// Create starts a partition; `weight` is its CPU share under contention.
	Create(ctx context.Context, name string, size protocol.PartitionSize, weight int) error
	// Resize changes a running partition's limits without restarting it.
	Resize(ctx context.Context, name string, size protocol.PartitionSize, weight int) error
	Stop(ctx context.Context, name string) error
	Start(ctx context.Context, name string) error
	Remove(ctx context.Context, name string) error
	// Exec runs a shell script inside the partition.
	Exec(ctx context.Context, name, script string) (string, error)
	// Usage reads these partitions; a missing one is left out. Without
	// `exact`, what is slow to measure may come from a recent measurement.
	Usage(ctx context.Context, names []string, exact bool) (map[string]Usage, error)
	// Restore re-creates what a reboot loses, at agent start.
	Restore(ctx context.Context, names []string) error
	// Send stops a partition and serves it on `listen` for one Receive; it
	// starts it again if the transfer doesn't finish (PLAN §26.10).
	Send(ctx context.Context, name, listen, token, key string) error
	// Receive pulls a partition from `from` and starts it here.
	Receive(ctx context.Context, name string, size protocol.PartitionSize, weight int, from, token, key string) error
	// Forward replaces the machine's ports forwarded into partitions (PLAN
	// §27.3); `added` are new since the last call. It returns the partitions
	// whose forwards wait for an address (not running yet).
	Forward(ctx context.Context, forwards, added []protocol.PortForward) (waiting []string, err error)
	// Isolate keeps these partitions (rentals) apart (PLAN §28).
	Isolate(ctx context.Context, names []string) error
}

// Entry is one partition in the machine's state file.
type Entry struct {
	Size protocol.PartitionSize `json:"size"`
	// A rental: kept apart from the machine and its other partitions.
	Isolated bool `json:"isolated,omitempty"`
}

type state struct {
	Allocatable protocol.PartitionSize `json:"allocatable"`
	Partitions  map[string]Entry       `json:"partitions"`
	// From the desired state; re-applied when a partition (re)starts.
	Forwards []protocol.PortForward `json:"forwards,omitempty"`
}

// validName is the control plane's partition name: it goes into paths and
// commands, so anything else is refused.
var validName = regexp.MustCompile(`^[a-z0-9]{1,12}$`)

func checkName(name string) error {
	if !validName.MatchString(name) {
		return fmt.Errorf("invalid partition name %q", name)
	}
	return nil
}

// isolate applies the rules for every rental on the machine.
func (m *Manager) isolate(ctx context.Context, s *state) error {
	var names []string
	for name, e := range s.Partitions {
		if e.Isolated {
			names = append(names, name)
		}
	}
	sort.Strings(names)
	return m.Driver.Isolate(ctx, names)
}

// Manager serializes partition changes (commands run concurrently) and keeps
// them within what the machine has.
type Manager struct {
	Driver Driver
	// Path is the state file: the partitions and their sizes.
	Path string

	mu     sync.Mutex
	state  *state
	loaded bool
	// Forwards still to apply: partitions that had no address, or a failure.
	waiting []string
	failed  bool

	// The last usage report, for polls while a change holds mu.
	lastMu sync.Mutex
	last   []protocol.PartitionUsage
}

// load reads the state file once. Keys older agents wrote (`remainder`,
// `pool`, `allowIps`) are ignored.
func (m *Manager) load() (*state, error) {
	if m.loaded {
		return m.state, nil
	}
	s := &state{Partitions: map[string]Entry{}}
	data, err := os.ReadFile(m.Path)
	if err == nil {
		if err := json.Unmarshal(data, s); err != nil {
			return nil, fmt.Errorf("reading %s: %w", m.Path, err)
		}
		if s.Partitions == nil {
			s.Partitions = map[string]Entry{}
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	m.state, m.loaded = s, true
	return s, nil
}

func (m *Manager) save() error {
	data, _ := json.MarshalIndent(m.state, "", "  ")
	if err := os.MkdirAll(filepath.Dir(m.Path), 0o700); err != nil {
		return err
	}
	tmp := m.Path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, m.Path)
}

// weight gives each partition a CPU share in proportion to the cores it pays for.
func weight(e Entry) int {
	return max(2, int(e.Size.Cpus*1024))
}

// fits checks that `size` fits next to every other partition than `name`.
func (s *state) fits(name string, size protocol.PartitionSize) error {
	left := protocol.PartitionSize{MemMb: s.Allocatable.MemMb, DiskGb: s.Allocatable.DiskGb}
	for n, e := range s.Partitions {
		if n != name {
			left.MemMb -= e.Size.MemMb
			left.DiskGb -= e.Size.DiskGb
		}
	}
	if size.MemMb > left.MemMb || size.DiskGb > left.DiskGb {
		return fmt.Errorf("doesn't fit on this machine: at most %d MB and %d GB are free for it", left.MemMb, left.DiskGb)
	}
	return nil
}

// ready loads the state of a machine set up for partitions.
func (m *Manager) ready() (*state, error) {
	s, err := m.load()
	if err == nil && s.Allocatable.MemMb == 0 {
		err = errors.New("this machine isn't set up for partitions yet")
	}
	return s, err
}

// fitsIn refuses to shrink a partition below what it uses: the kernel would
// kill its largest process (measured in the 16a spike).
func (m *Manager) fitsIn(ctx context.Context, name string, size protocol.PartitionSize) error {
	all, err := m.Driver.Usage(ctx, []string{name}, true)
	if err != nil {
		return err
	}
	usage, ok := all[name]
	if !ok {
		return fmt.Errorf("partition %s isn't on this machine's Docker", name)
	}
	if usage.MemUsed > size.MemMb*MiB {
		return fmt.Errorf("partition %s uses %d MB of memory, more than %d MB: free memory there first", name, usage.MemUsed/MiB, size.MemMb)
	}
	if usage.DiskUsed > size.DiskGb<<30 {
		return fmt.Errorf("partition %s uses %d GB of disk, more than %d GB: free disk there first", name, usage.DiskUsed>>30, size.DiskGb)
	}
	return nil
}

// Ensure prepares the machine (`pool.ensure`).
func (m *Manager) Ensure(ctx context.Context, p protocol.PoolEnsurePayload) (map[string]any, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil {
		return nil, err
	}
	allocatable, result, err := m.Driver.Setup(ctx, p)
	if err != nil {
		return result, err
	}
	s.Allocatable = allocatable
	// The control plane names its rentals: an older agent may not have
	// recorded them as isolated. Never the other way round.
	for _, name := range p.Isolated {
		if e, ok := s.Partitions[name]; ok && !e.Isolated {
			e.Isolated = true
			s.Partitions[name] = e
		}
	}
	if err := m.save(); err != nil {
		return result, err
	}
	if err := m.isolate(ctx, s); err != nil {
		return result, err
	}
	result["allocatable"] = allocatable
	return result, nil
}

// installScript waits for the partition's systemd, then installs our agent
// with the join token, like the SSH wizard does on a server.
func installScript(i protocol.PartitionCreatePayloadInstall) string {
	args := fmt.Sprintf("--url %s --tenant %s --join-token %s", quote(i.Url), quote(i.Tenant), quote(i.JoinToken))
	if i.DownloadBase != "" {
		args += " --download-base " + quote(i.DownloadBase)
	}
	return `for i in $(seq 1 120); do
  case "$(systemctl is-system-running 2>/dev/null)" in running|degraded) break;; esac
  sleep 0.5
done
curl -fsSL ` + quote(i.Url+"/agents/api/install.sh") + ` | sh -s -- ` + args
}

func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

// Create makes a partition (`partition.create`) and installs our agent in
// it; re-running for an existing partition only re-runs the install.
func (m *Manager) Create(ctx context.Context, p protocol.PartitionCreatePayload) (map[string]any, error) {
	if err := checkName(p.Name); err != nil {
		return nil, err
	}
	size, err := m.createPartition(ctx, p)
	if err != nil {
		return nil, err
	}
	// Outside the lock: installing waits for the partition's systemd and a
	// download, and polls read usage meanwhile (they'd stall the agent).
	install, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()
	out, err := m.Driver.Exec(install, p.Name, installScript(p.Install))
	result := map[string]any{"name": p.Name, "size": size}
	if err != nil {
		return result, fmt.Errorf("installing the agent in %s: %w", p.Name, err)
	}
	result["install"] = sh.Tail(out, 600)
	return result, nil
}

// createPartition makes the partition's container (once; re-running only
// re-installs) and returns its size.
func (m *Manager) createPartition(ctx context.Context, p protocol.PartitionCreatePayload) (protocol.PartitionSize, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	none := protocol.PartitionSize{}
	s, err := m.ready()
	if err != nil {
		return none, err
	}
	if _, exists := s.Partitions[p.Name]; !exists {
		if err := s.fits(p.Name, p.Size); err != nil {
			return none, err
		}
		entry := Entry{Size: p.Size, Isolated: p.Isolated}
		if err := m.Driver.Create(ctx, p.Name, entry.Size, weight(entry)); err != nil {
			return none, err
		}
		s.Partitions[p.Name] = entry
		if err := m.save(); err != nil {
			return none, err
		}
		_ = m.forward(ctx, s.Forwards, nil)
	}
	if err := m.isolate(ctx, s); err != nil {
		return none, err
	}
	return s.Partitions[p.Name].Size, nil
}

// Resize changes a partition's size (`partition.resize`), live.
func (m *Manager) Resize(ctx context.Context, p protocol.PartitionResizePayload) (map[string]any, error) {
	if err := checkName(p.Name); err != nil {
		return nil, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil {
		return nil, err
	}
	current, ok := s.Partitions[p.Name]
	if !ok {
		return nil, fmt.Errorf("no partition %s", p.Name)
	}
	if err := s.fits(p.Name, p.Size); err != nil {
		return nil, err
	}
	if p.Size.MemMb < current.Size.MemMb || p.Size.DiskGb < current.Size.DiskGb {
		if err := m.fitsIn(ctx, p.Name, p.Size); err != nil {
			return nil, err
		}
	}
	next := current
	next.Size = p.Size
	if err := m.Driver.Resize(ctx, p.Name, p.Size, weight(next)); err != nil {
		return nil, err
	}
	s.Partitions[p.Name] = next
	if err := m.save(); err != nil {
		return nil, err
	}
	return map[string]any{"size": p.Size}, nil
}

// Stop and Start suspend and resume a partition (`partition.stop/start`):
// data is kept, its size stays reserved.
func (m *Manager) Stop(ctx context.Context, p protocol.PartitionNamePayload) (map[string]any, error) {
	return m.simple(ctx, p.Name, m.Driver.Stop)
}

func (m *Manager) Start(ctx context.Context, p protocol.PartitionNamePayload) (map[string]any, error) {
	return m.simple(ctx, p.Name, func(ctx context.Context, name string) error {
		if err := m.Driver.Start(ctx, name); err != nil {
			return err
		}
		// Its address may have changed.
		return m.forward(ctx, m.state.Forwards, nil)
	})
}

func (m *Manager) simple(ctx context.Context, name string, fn func(context.Context, string) error) (map[string]any, error) {
	if err := checkName(name); err != nil {
		return nil, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil {
		return nil, err
	}
	if _, ok := s.Partitions[name]; !ok {
		return nil, fmt.Errorf("no partition %s", name)
	}
	return map[string]any{"name": name}, fn(ctx, name)
}

// Remove deletes a partition and its data (`partition.remove`).
func (m *Manager) Remove(ctx context.Context, p protocol.PartitionNamePayload) (map[string]any, error) {
	if err := checkName(p.Name); err != nil {
		return nil, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil {
		return nil, err
	}
	if _, ok := s.Partitions[p.Name]; !ok {
		// A creation that failed halfway left its directory, quota and bridge.
		_ = m.Driver.Remove(ctx, p.Name)
		return map[string]any{"name": p.Name, "removed": false}, nil
	}
	if err := m.Driver.Remove(ctx, p.Name); err != nil {
		return nil, err
	}
	delete(s.Partitions, p.Name)
	if err := m.save(); err != nil {
		return nil, err
	}
	_ = m.isolate(ctx, s)
	return map[string]any{"name": p.Name, "removed": true}, nil
}

// Send moves a partition off this machine (`partition.send`). It stays here,
// stopped, until the control plane removes it once the receiving machine
// runs it. The lock isn't held while sending: polls read usage.
func (m *Manager) Send(ctx context.Context, p protocol.PartitionSendPayload) (map[string]any, error) {
	if err := checkName(p.Name); err != nil {
		return nil, err
	}
	m.mu.Lock()
	s, err := m.load()
	ok := false
	if err == nil {
		_, ok = s.Partitions[p.Name]
	}
	m.mu.Unlock()
	switch {
	case err != nil:
		return nil, err
	case !ok:
		return nil, fmt.Errorf("no partition %s", p.Name)
	}
	if err := m.Driver.Send(ctx, p.Name, p.Listen, p.Token, p.Key); err != nil {
		return nil, err
	}
	return map[string]any{"name": p.Name, "sent": true}, nil
}

// Receive takes a moving partition (`partition.receive`): its size is
// reserved first, and given back if the transfer fails.
func (m *Manager) Receive(ctx context.Context, p protocol.PartitionReceivePayload) (map[string]any, error) {
	if err := checkName(p.Name); err != nil {
		return nil, err
	}
	m.mu.Lock()
	s, err := m.ready()
	if err == nil {
		if _, exists := s.Partitions[p.Name]; exists {
			err = fmt.Errorf("partition %s is on this machine already", p.Name)
		}
	}
	if err == nil {
		err = s.fits(p.Name, p.Size)
	}
	entry := Entry{Size: p.Size, Isolated: p.Isolated}
	if err == nil {
		s.Partitions[p.Name] = entry
		err = m.save()
	}
	if err == nil {
		err = m.isolate(ctx, s)
	}
	m.mu.Unlock()
	if err != nil {
		return nil, err
	}

	if err := m.Driver.Receive(ctx, p.Name, p.Size, weight(entry), p.From, p.Token, p.Key); err != nil {
		m.mu.Lock()
		defer m.mu.Unlock()
		_ = m.Driver.Remove(context.WithoutCancel(ctx), p.Name)
		delete(s.Partitions, p.Name)
		_ = m.save()
		return nil, err
	}
	// A canceled move removed it meanwhile: its source runs again, so this copy mustn't.
	m.mu.Lock()
	_, kept := s.Partitions[p.Name]
	if kept {
		_ = m.forward(ctx, s.Forwards, nil)
	}
	m.mu.Unlock()
	if !kept {
		_ = m.Driver.Remove(context.WithoutCancel(ctx), p.Name)
		return nil, errors.New("the move was canceled")
	}
	return map[string]any{"name": p.Name, "size": p.Size}, nil
}

// Restore runs at agent start: what a reboot lost.
func (m *Manager) Restore(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil || len(s.Partitions) == 0 {
		return err
	}
	names := make([]string, 0, len(s.Partitions))
	for name := range s.Partitions {
		names = append(names, name)
	}
	if err := m.Driver.Restore(ctx, names); err != nil {
		return err
	}
	if err := m.isolate(ctx, s); err != nil {
		return err
	}
	// Forwards and their firewall rule live in memory: a reboot lost them.
	return m.forward(ctx, s.Forwards, nil)
}

// forward applies the forwards and remembers what is left to apply; the
// caller holds the lock.
func (m *Manager) forward(ctx context.Context, forwards, added []protocol.PortForward) error {
	waiting, err := m.Driver.Forward(ctx, forwards, added)
	m.waiting, m.failed = waiting, err != nil
	return err
}

// ApplyForwards takes the machine's forwards from its desired state. Agents
// that aren't machines (partitions) have none.
func (m *Manager) ApplyForwards(ctx context.Context, forwards []protocol.PortForward) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil || s.Allocatable.MemMb == 0 {
		return err
	}
	var added []protocol.PortForward
	for _, f := range forwards {
		if !slices.Contains(s.Forwards, f) {
			added = append(added, f)
		}
	}
	if len(added) == 0 && len(forwards) == len(s.Forwards) && len(m.waiting) == 0 && !m.failed {
		return nil
	}
	if err := m.forward(ctx, forwards, added); err != nil {
		return err
	}
	s.Forwards = forwards
	return m.save()
}

// Usage reports every partition for the poll summary; nil on other servers.
// Forwards that waited for a partition are applied once it runs.
func (m *Manager) Usage(ctx context.Context) []protocol.PartitionUsage {
	// A change in progress (host setup, a resize) holds the lock: the poll
	// gets the last report rather than waiting on it.
	if !m.mu.TryLock() {
		m.lastMu.Lock()
		defer m.lastMu.Unlock()
		return m.last
	}
	s, err := m.load()
	if err != nil || len(s.Partitions) == 0 {
		m.mu.Unlock()
		return nil
	}
	entries := make(map[string]Entry, len(s.Partitions))
	names := make([]string, 0, len(s.Partitions))
	for name, e := range s.Partitions {
		entries[name] = e
		names = append(names, name)
	}
	m.mu.Unlock()
	sort.Strings(names)
	all, _ := m.Driver.Usage(ctx, names, false)
	out := make([]protocol.PartitionUsage, 0, len(names))
	for _, name := range names {
		u, ok := all[name]
		if !ok {
			u = Usage{State: "unknown"}
		}
		out = append(out, protocol.PartitionUsage{
			Name: name, State: u.State, Size: entries[name].Size,
			CpuMicros: u.CPUMicros, MemUsed: u.MemUsed, DiskUsed: u.DiskUsed,
			RxBytes: u.RxBytes, TxBytes: u.TxBytes,
		})
	}
	m.lastMu.Lock()
	m.last = out
	m.lastMu.Unlock()
	m.retryForwards(ctx, all)
	return out
}

// retryForwards re-applies the forwards after a failure, or once a partition
// they waited for runs (e.g. Docker started it after a reboot).
func (m *Manager) retryForwards(ctx context.Context, usage map[string]Usage) {
	if !m.mu.TryLock() {
		return
	}
	defer m.mu.Unlock()
	due := m.failed
	for _, name := range m.waiting {
		due = due || usage[name].State == "running"
	}
	if due {
		_ = m.forward(ctx, m.state.Forwards, nil)
	}
}
