// Package pool is the host role of a pool machine (PLAN §26.5): the machine
// is split into partitions, each running our agent and joining a tenant.
// The remainder partition (Huruf's own) always holds whatever isn't rented,
// so no capacity sits idle (§26.4). How partitions are made is the Driver's
// business (Sysbox for now), so the technology can change behind it.
package pool

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
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
	Usage(ctx context.Context, name string) (Usage, error)
	// Restore re-creates what a reboot loses, at agent start.
	Restore(ctx context.Context, names []string) error
	// Send stops a partition and serves it on `listen` for one Receive; it
	// starts it again if the transfer doesn't finish (PLAN §26.10).
	Send(ctx context.Context, name, listen, token string) error
	// Receive pulls a partition from `from` and starts it here.
	Receive(ctx context.Context, name string, size protocol.PartitionSize, weight int, from, token string) error
	// Forward replaces the machine's ports forwarded into partitions (PLAN
	// §27.3); `added` are new since the last call.
	Forward(ctx context.Context, forwards, added []protocol.PortForward) error
}

// Entry is one partition in the machine's state file.
type Entry struct {
	Size      protocol.PartitionSize `json:"size"`
	Remainder bool                   `json:"remainder,omitempty"`
}

type state struct {
	Allocatable protocol.PartitionSize `json:"allocatable"`
	Partitions  map[string]Entry       `json:"partitions"`
	// From the desired state; re-applied when a partition (re)starts.
	Forwards []protocol.PortForward `json:"forwards,omitempty"`
}

// Manager serializes partition changes (commands run concurrently) and keeps
// the remainder sized to the rest.
type Manager struct {
	Driver Driver
	// Path is the state file: the sizes, so the remainder can be computed.
	Path string

	mu     sync.Mutex
	state  *state
	loaded bool

	// The last usage report, for polls while a change holds mu.
	lastMu sync.Mutex
	last   []protocol.PartitionUsage
}

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

// weight gives each partition a CPU share in proportion to the cores it pays
// for; the remainder gets the least, so it yields at once under contention.
func weight(e Entry) int {
	if e.Remainder {
		return 2
	}
	return max(2, int(e.Size.Cpus*1024))
}

func (s *state) remainder() (string, bool) {
	for name, e := range s.Partitions {
		if e.Remainder {
			return name, true
		}
	}
	return "", false
}

// free is what's left for the remainder once every rented partition is paid
// for, optionally as if `name` had size `size`.
func (s *state) free(name string, size *protocol.PartitionSize) (protocol.PartitionSize, error) {
	left := protocol.PartitionSize{MemMb: s.Allocatable.MemMb, DiskGb: s.Allocatable.DiskGb}
	for n, e := range s.Partitions {
		if e.Remainder {
			continue
		}
		if n == name {
			continue
		}
		left.MemMb -= e.Size.MemMb
		left.DiskGb -= e.Size.DiskGb
	}
	if size != nil {
		if size.MemMb > left.MemMb || size.DiskGb > left.DiskGb {
			return left, fmt.Errorf("doesn't fit on this machine: at most %d MB and %d GB are free for it", left.MemMb, left.DiskGb)
		}
		left.MemMb -= size.MemMb
		left.DiskGb -= size.DiskGb
	}
	return left, nil
}

// fitsIn refuses to shrink a partition below what it uses: the kernel would
// kill its largest process (measured in the 16a spike).
func (m *Manager) fitsIn(ctx context.Context, name string, size protocol.PartitionSize) error {
	usage, err := m.Driver.Usage(ctx, name)
	if err != nil {
		return err
	}
	if usage.MemUsed > size.MemMb*MiB {
		return fmt.Errorf("partition %s uses %d MB of memory, more than %d MB: free memory there first", name, usage.MemUsed/MiB, size.MemMb)
	}
	if usage.DiskUsed > size.DiskGb<<30 {
		return fmt.Errorf("partition %s uses %d GB of disk, more than %d GB: free disk there first", name, usage.DiskUsed>>30, size.DiskGb)
	}
	return nil
}

// sizeRemainder gives the remainder `to` (the CPU stays uncapped).
func (m *Manager) sizeRemainder(ctx context.Context, s *state, to protocol.PartitionSize) error {
	name, ok := s.remainder()
	if !ok {
		return nil
	}
	current := s.Partitions[name]
	to.Cpus = 0
	if to == current.Size {
		return nil
	}
	if to.MemMb < current.Size.MemMb || to.DiskGb < current.Size.DiskGb {
		if err := m.fitsIn(ctx, name, to); err != nil {
			return err
		}
	}
	if err := m.Driver.Resize(ctx, name, to, weight(current)); err != nil {
		return err
	}
	s.Partitions[name] = Entry{Size: to, Remainder: true}
	return m.save()
}

// Ensure prepares the machine (`pool.ensure`) and resizes the remainder to
// the allocatable capacity it reports.
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
	if err := m.save(); err != nil {
		return result, err
	}
	if left, err := s.free("", nil); err == nil {
		if err := m.sizeRemainder(ctx, s, left); err != nil {
			result["remainder"] = err.Error()
		}
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
// it. A rented partition takes its memory and disk from the remainder first;
// re-running for an existing partition only re-runs the install.
func (m *Manager) Create(ctx context.Context, p protocol.PartitionCreatePayload) (map[string]any, error) {
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
		return result, fmt.Errorf("installing the agent in %s: %w: %s", p.Name, err, tail(out, 600))
	}
	result["install"] = tail(out, 600)
	return result, nil
}

// createPartition makes the partition's container (once; re-running only
// re-installs) and returns its size.
func (m *Manager) createPartition(ctx context.Context, p protocol.PartitionCreatePayload) (protocol.PartitionSize, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	none := protocol.PartitionSize{}
	s, err := m.load()
	if err != nil {
		return none, err
	}
	if s.Allocatable.MemMb == 0 {
		return none, errors.New("this machine isn't a pool machine yet (pool.ensure)")
	}

	if _, exists := s.Partitions[p.Name]; !exists {
		var entry Entry
		if p.Remainder {
			if other, ok := s.remainder(); ok {
				return none, fmt.Errorf("the remainder partition is %s already", other)
			}
			left, err := s.free("", nil)
			if err != nil {
				return none, err
			}
			entry = Entry{Size: protocol.PartitionSize{MemMb: left.MemMb, DiskGb: left.DiskGb}, Remainder: true}
		} else {
			if p.Size == nil {
				return none, errors.New("a rented partition needs a size")
			}
			left, err := s.free(p.Name, p.Size)
			if err != nil {
				return none, err
			}
			// The remainder gives up what the new partition takes, first.
			if err := m.sizeRemainder(ctx, s, left); err != nil {
				return none, err
			}
			entry = Entry{Size: *p.Size}
		}
		if err := m.Driver.Create(ctx, p.Name, entry.Size, weight(entry)); err != nil {
			return none, err
		}
		s.Partitions[p.Name] = entry
		if err := m.save(); err != nil {
			return none, err
		}
		_ = m.Driver.Forward(ctx, s.Forwards, nil)
	}
	return s.Partitions[p.Name].Size, nil
}

func tail(s string, n int) string {
	if len(s) > n {
		return s[len(s)-n:]
	}
	return s
}

// Resize changes a rented partition's size (`partition.resize`), live: a
// larger one takes from the remainder first, a smaller one gives back after.
func (m *Manager) Resize(ctx context.Context, p protocol.PartitionResizePayload) (map[string]any, error) {
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
	if current.Remainder {
		return nil, errors.New("the remainder is sized automatically")
	}
	left, err := s.free(p.Name, &p.Size)
	if err != nil {
		return nil, err
	}
	shrinking := p.Size.MemMb < current.Size.MemMb || p.Size.DiskGb < current.Size.DiskGb
	if shrinking {
		if err := m.fitsIn(ctx, p.Name, p.Size); err != nil {
			return nil, err
		}
	} else if err := m.sizeRemainder(ctx, s, left); err != nil {
		return nil, err
	}
	next := Entry{Size: p.Size}
	if err := m.Driver.Resize(ctx, p.Name, p.Size, weight(next)); err != nil {
		return nil, err
	}
	s.Partitions[p.Name] = next
	if err := m.save(); err != nil {
		return nil, err
	}
	if shrinking {
		if err := m.sizeRemainder(ctx, s, left); err != nil {
			return map[string]any{"size": p.Size, "remainder": err.Error()}, nil
		}
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
		return m.Driver.Forward(ctx, m.state.Forwards, nil)
	})
}

func (m *Manager) simple(ctx context.Context, name string, fn func(context.Context, string) error) (map[string]any, error) {
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

// Remove deletes a partition and its data (`partition.remove`); a rented
// partition's memory and disk go back to the remainder.
func (m *Manager) Remove(ctx context.Context, p protocol.PartitionNamePayload) (map[string]any, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, err := m.load()
	if err != nil {
		return nil, err
	}
	entry, ok := s.Partitions[p.Name]
	if !ok {
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
	result := map[string]any{"name": p.Name, "removed": true}
	if !entry.Remainder {
		if left, err := s.free("", nil); err == nil {
			if err := m.sizeRemainder(ctx, s, left); err != nil {
				result["remainder"] = err.Error()
			}
		}
	}
	return result, nil
}

// Send moves a rented partition off this machine (`partition.send`). It
// stays here, stopped, until the control plane removes it once the receiving
// machine runs it. The lock isn't held while sending: polls read usage.
func (m *Manager) Send(ctx context.Context, p protocol.PartitionSendPayload) (map[string]any, error) {
	m.mu.Lock()
	s, err := m.load()
	var entry Entry
	ok := false
	if err == nil {
		entry, ok = s.Partitions[p.Name]
	}
	m.mu.Unlock()
	switch {
	case err != nil:
		return nil, err
	case !ok:
		return nil, fmt.Errorf("no partition %s", p.Name)
	case entry.Remainder:
		return nil, errors.New("the remainder isn't moved: each machine has its own")
	}
	if err := m.Driver.Send(ctx, p.Name, p.Listen, p.Token); err != nil {
		return nil, err
	}
	return map[string]any{"name": p.Name, "sent": true}, nil
}

// Receive takes a moving partition (`partition.receive`): its size is carved
// from the remainder first, and given back if the transfer fails.
func (m *Manager) Receive(ctx context.Context, p protocol.PartitionReceivePayload) (map[string]any, error) {
	m.mu.Lock()
	s, err := m.load()
	if err != nil {
		m.mu.Unlock()
		return nil, err
	}
	if s.Allocatable.MemMb == 0 {
		m.mu.Unlock()
		return nil, errors.New("this machine isn't a pool machine yet (pool.ensure)")
	}
	if _, exists := s.Partitions[p.Name]; exists {
		m.mu.Unlock()
		return nil, fmt.Errorf("partition %s is on this machine already", p.Name)
	}
	left, err := s.free(p.Name, &p.Size)
	if err == nil {
		err = m.sizeRemainder(ctx, s, left)
	}
	entry := Entry{Size: p.Size}
	if err == nil {
		s.Partitions[p.Name] = entry
		err = m.save()
	}
	m.mu.Unlock()
	if err != nil {
		return nil, err
	}

	if err := m.Driver.Receive(ctx, p.Name, p.Size, weight(entry), p.From, p.Token); err != nil {
		m.mu.Lock()
		defer m.mu.Unlock()
		_ = m.Driver.Remove(context.WithoutCancel(ctx), p.Name)
		delete(s.Partitions, p.Name)
		_ = m.save()
		if left, ferr := s.free("", nil); ferr == nil {
			_ = m.sizeRemainder(ctx, s, left)
		}
		return nil, err
	}
	// A canceled move removed it meanwhile: its source runs again, so this copy mustn't.
	m.mu.Lock()
	_, kept := s.Partitions[p.Name]
	if kept {
		_ = m.Driver.Forward(ctx, s.Forwards, nil)
	}
	m.mu.Unlock()
	if !kept {
		_ = m.Driver.Remove(context.WithoutCancel(ctx), p.Name)
		return nil, errors.New("the move was canceled")
	}
	return map[string]any{"name": p.Name, "size": p.Size}, nil
}

// Restore runs at agent start on a pool machine: what a reboot lost.
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
	// Forwards and their firewall rule live in memory: a reboot lost them.
	return m.Driver.Forward(ctx, s.Forwards, nil)
}

// ApplyForwards takes the machine's forwards from its desired state. Agents
// that aren't machines (partitions, servers before PLAN §27) have none.
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
	if len(added) == 0 && len(forwards) == len(s.Forwards) {
		return nil
	}
	if err := m.Driver.Forward(ctx, forwards, added); err != nil {
		return err
	}
	s.Forwards = forwards
	return m.save()
}

// Usage reports every partition for the poll summary; nil on other servers.
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
	out := make([]protocol.PartitionUsage, 0, len(names))
	for _, name := range names {
		e := entries[name]
		u, err := m.Driver.Usage(ctx, name)
		if err != nil {
			u = Usage{State: "unknown"}
		}
		out = append(out, protocol.PartitionUsage{
			Name: name, Remainder: e.Remainder, State: u.State, Size: e.Size,
			CpuMicros: u.CPUMicros, MemUsed: u.MemUsed, DiskUsed: u.DiskUsed,
			RxBytes: u.RxBytes, TxBytes: u.TxBytes,
		})
	}
	m.lastMu.Lock()
	m.last = out
	m.lastMu.Unlock()
	return out
}
