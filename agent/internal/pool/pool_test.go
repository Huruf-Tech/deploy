package pool

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type fake struct {
	sizes   map[string]protocol.PartitionSize
	weights map[string]int
	used    map[string]Usage
	scripts []string
	// Partitions that aren't running: no address to forward to.
	down map[string]bool

	sendErr, receiveErr error
	forwards, added     []protocol.PortForward
	forwardCalls        int
	isolated            []string
}

func newFake() *fake {
	return &fake{sizes: map[string]protocol.PartitionSize{}, weights: map[string]int{}, used: map[string]Usage{}, down: map[string]bool{}}
}

func (f *fake) Setup(context.Context, protocol.PoolEnsurePayload) (protocol.PartitionSize, map[string]any, error) {
	return protocol.PartitionSize{Cpus: 2, MemMb: 7168, DiskGb: 100}, map[string]any{}, nil
}
func (f *fake) Create(_ context.Context, name string, size protocol.PartitionSize, weight int) error {
	f.sizes[name], f.weights[name] = size, weight
	return nil
}
func (f *fake) Resize(_ context.Context, name string, size protocol.PartitionSize, weight int) error {
	f.sizes[name], f.weights[name] = size, weight
	return nil
}
func (f *fake) Stop(context.Context, string) error  { return nil }
func (f *fake) Start(context.Context, string) error { return nil }
func (f *fake) Remove(_ context.Context, name string) error {
	delete(f.sizes, name)
	return nil
}
func (f *fake) Exec(_ context.Context, _ string, script string) (string, error) {
	f.scripts = append(f.scripts, script)
	return "Agent installed", nil
}
func (f *fake) Usage(_ context.Context, names []string, _ bool) (map[string]Usage, error) {
	all := map[string]Usage{}
	for _, name := range names {
		u := f.used[name]
		u.State = "running"
		if f.down[name] {
			u.State = "exited"
		}
		all[name] = u
	}
	return all, nil
}
func (f *fake) Restore(context.Context, []string) error { return nil }
func (f *fake) Send(context.Context, string, string, string, string, *protocol.MoveRelay) error {
	return f.sendErr
}
func (f *fake) Isolate(_ context.Context, names []string) error {
	f.isolated = names
	return nil
}
func (f *fake) Forward(_ context.Context, forwards, added []protocol.PortForward) ([]string, error) {
	f.forwards, f.added = forwards, added
	f.forwardCalls++
	var waiting []string
	for _, fw := range forwards {
		if f.down[fw.Partition] {
			waiting = append(waiting, fw.Partition)
		}
	}
	return waiting, nil
}
func (f *fake) Receive(_ context.Context, name string, size protocol.PartitionSize, weight int, _, _, _ string, _ *protocol.MoveRelay) error {
	if f.receiveErr != nil {
		return f.receiveErr
	}
	f.sizes[name], f.weights[name] = size, weight
	return nil
}

func install() protocol.PartitionCreatePayloadInstall {
	return protocol.PartitionCreatePayloadInstall{Url: "https://cp.example", Tenant: "6adf368974315b9a88178fa5", JoinToken: "tok'en"}
}

func setup(t *testing.T) (*Manager, *fake) {
	t.Helper()
	f := newFake()
	m := &Manager{Driver: f, Path: filepath.Join(t.TempDir(), "pool.json")}
	if _, err := m.Ensure(context.Background(), protocol.PoolEnsurePayload{}); err != nil {
		t.Fatal(err)
	}
	return m, f
}

func create(t *testing.T, m *Manager, name string, size protocol.PartitionSize, isolated bool) {
	t.Helper()
	if _, err := m.Create(context.Background(), protocol.PartitionCreatePayload{Name: name, Size: size, Isolated: isolated, Install: install()}); err != nil {
		t.Fatal(err)
	}
}

func TestCreateAndRemove(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	create(t, m, "salha", protocol.PartitionSize{Cpus: 1, MemMb: 2304, DiskGb: 25}, false)
	if f.sizes["salha"].MemMb != 2304 || f.weights["salha"] != 1024 {
		t.Errorf("partition = %+v, weight %d", f.sizes["salha"], f.weights["salha"])
	}
	// The agent is installed with the join token, quoted for the shell.
	last := f.scripts[len(f.scripts)-1]
	if !strings.Contains(last, `--join-token 'tok'\''en'`) || !strings.Contains(last, "'https://cp.example/agents/api/install.sh'") {
		t.Errorf("install script: %s", last)
	}
	if _, err := m.Remove(ctx, protocol.PartitionNamePayload{Name: "salha"}); err != nil {
		t.Fatal(err)
	}
	if _, ok := f.sizes["salha"]; ok {
		t.Error("the partition is still there")
	}
}

func TestRefusesWhatDoesntFit(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	huge := protocol.PartitionSize{Cpus: 1, MemMb: 8000, DiskGb: 25}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "big", Size: huge, Install: install()}); err == nil {
		t.Error("a partition bigger than the machine was created")
	}
	create(t, m, "first", protocol.PartitionSize{Cpus: 1, MemMb: 5000, DiskGb: 25}, false)
	small := protocol.PartitionSize{Cpus: 1, MemMb: 2304, DiskGb: 25}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "second", Size: small, Install: install()}); err == nil || !strings.Contains(err.Error(), "2168 MB") {
		t.Fatalf("expected a refusal, got %v", err)
	}
	if _, ok := f.sizes["second"]; ok {
		t.Error("the partition was created anyway")
	}
}

func TestRefusesBeforeSetupAndBadNames(t *testing.T) {
	ctx := context.Background()
	m := &Manager{Driver: newFake(), Path: filepath.Join(t.TempDir(), "pool.json")}
	size := protocol.PartitionSize{Cpus: 1, MemMb: 512, DiskGb: 10}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "p1", Size: size, Install: install()}); err == nil || !strings.Contains(err.Error(), "isn't set up for partitions") {
		t.Fatalf("create before setup: %v", err)
	}
	m, _ = setup(t)
	for _, name := range []string{"", "../etc", "P1", "a b", "abcdefghijklm"} {
		if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: name, Size: size, Install: install()}); err == nil {
			t.Errorf("created %q", name)
		}
		if _, err := m.Remove(ctx, protocol.PartitionNamePayload{Name: name}); err == nil {
			t.Errorf("removed %q", name)
		}
	}
}

func TestResize(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	small := protocol.PartitionSize{Cpus: 1, MemMb: 2048, DiskGb: 25}
	create(t, m, "salha", small, false)
	create(t, m, "other", small, false)
	medium := protocol.PartitionSize{Cpus: 2, MemMb: 4096, DiskGb: 50}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: medium}); err != nil {
		t.Fatal(err)
	}
	if f.sizes["salha"] != medium || f.weights["salha"] != 2048 {
		t.Errorf("after growing: %+v", f.sizes["salha"])
	}
	// Growing past what the others leave is refused.
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: protocol.PartitionSize{Cpus: 2, MemMb: 6000, DiskGb: 50}}); err == nil {
		t.Error("grew past the machine")
	}
	// Shrinking below what the partition uses is refused.
	f.used["salha"] = Usage{MemUsed: 3 << 30}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: small}); err == nil {
		t.Error("shrunk below its use")
	}
	// The failure is reported with the size it was asked for, until a resize applies.
	report := func() protocol.PartitionUsage {
		for _, u := range m.Usage(ctx) {
			if u.Name == "salha" {
				return u
			}
		}
		t.Fatal("not reported")
		return protocol.PartitionUsage{}
	}
	if u := report(); u.ResizeError == nil || u.ResizeError.Size != small || u.Size != medium || u.Resizing != nil {
		t.Errorf("after a failed resize: %+v", u)
	}
	f.used["salha"] = Usage{MemUsed: 1 << 30}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: small}); err != nil {
		t.Fatal(err)
	}
	if u := report(); u.ResizeError != nil || u.Resizing != nil || u.Size != small {
		t.Errorf("after resizing: %+v", u)
	}
	// While it applies (holding the lock), polls say so.
	m.setResize("salha", resizeState{to: &medium})
	m.mu.Lock()
	if u := report(); u.Resizing == nil || *u.Resizing != medium {
		t.Errorf("while resizing: %+v", u)
	}
	m.mu.Unlock()
	m.setResize("salha", resizeState{})
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "nope", Size: small}); err == nil {
		t.Error("resized an unknown partition")
	}
}

// A resized rental stays a rental: isolated now and after a restart.
func TestResizeKeepsIsolation(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	create(t, m, "prent", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, true)
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "prent", Size: protocol.PartitionSize{Cpus: 1, MemMb: 2048, DiskGb: 20}}); err != nil {
		t.Fatal(err)
	}
	create(t, m, "pown", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false) // re-applies the rules
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated after a resize = %v", f.isolated)
	}
	again := &Manager{Driver: f, Path: m.Path}
	if err := again.Restore(ctx); err != nil {
		t.Fatal(err)
	}
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated after a restart = %v", f.isolated)
	}
}

func TestSetupIsolatesTheNamedRentals(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	// Made by an older agent: not recorded as a rental.
	create(t, m, "prent", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false)
	create(t, m, "pown", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false)
	if _, err := m.Ensure(ctx, protocol.PoolEnsurePayload{Isolated: []string{"prent", "pgone"}}); err != nil {
		t.Fatal(err)
	}
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated after setup = %v", f.isolated)
	}
	// Kept: a later setup that doesn't name it never opens it up.
	if _, err := m.Ensure(ctx, protocol.PoolEnsurePayload{}); err != nil {
		t.Fatal(err)
	}
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated after a second setup = %v", f.isolated)
	}
}

func TestUsageAndState(t *testing.T) {
	m, f := setup(t)
	small := protocol.PartitionSize{Cpus: 0.5, MemMb: 1024, DiskGb: 10}
	create(t, m, "salha", small, false)
	create(t, m, "abc", small, false)
	f.used["salha"] = Usage{MemUsed: 100, RxBytes: 5, TxBytes: 7}
	usage := m.Usage(context.Background())
	if len(usage) != 2 || usage[0].Name != "abc" || usage[1].TxBytes != 7 || usage[1].Size.Cpus != 0.5 {
		t.Errorf("usage = %+v", usage)
	}

	// A new manager (the agent restarted) reads the sizes back.
	again := &Manager{Driver: f, Path: m.Path}
	if got := again.Usage(context.Background()); len(got) != 2 {
		t.Errorf("state not kept: %+v", got)
	}
	// Creating a partition that exists only re-runs the install.
	before := len(f.scripts)
	create(t, again, "salha", small, false)
	if len(f.scripts) != before+1 || f.sizes["salha"] != small {
		t.Error("re-creating changed more than the install")
	}
}

// A state file from an older agent: keys it no longer knows are ignored, a
// rental stays isolated.
func TestReadsAnOlderStateFile(t *testing.T) {
	f := newFake()
	path := filepath.Join(t.TempDir(), "pool.json")
	old := `{"allocatable":{"cpus":2,"memMb":7168,"diskGb":100},"pool":false,"allowIps":["10.0.0.5"],
"partitions":{"prent":{"size":{"cpus":1,"memMb":1024,"diskGb":10},"isolated":true},"pown":{"size":{"cpus":1,"memMb":1024,"diskGb":10}}}}`
	if err := os.WriteFile(path, []byte(old), 0o600); err != nil {
		t.Fatal(err)
	}
	m := &Manager{Driver: f, Path: path}
	if err := m.Restore(context.Background()); err != nil {
		t.Fatal(err)
	}
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated = %v", f.isolated)
	}
	if got := m.Usage(context.Background()); len(got) != 2 {
		t.Fatalf("usage = %+v", got)
	}
}

func TestSendKnownPartitionsOnly(t *testing.T) {
	m, _ := setup(t)
	if _, err := m.Send(context.Background(), protocol.PartitionSendPayload{Name: "nope"}); err == nil {
		t.Error("sending an unknown partition should fail")
	}
}

func TestReceiveReservesAndGivesBack(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	size := protocol.PartitionSize{Cpus: 1, MemMb: 4096, DiskGb: 25}
	f.receiveErr = errors.New("connection reset")
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err == nil {
		t.Fatal("a failed transfer should fail")
	}
	if _, ok := f.sizes["pmoved"]; ok {
		t.Error("the failed partition should be gone")
	}

	f.receiveErr = nil
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err != nil {
		t.Fatal(err) // the failed one gave its size back
	}
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err == nil {
		t.Error("receiving a partition twice should fail")
	}
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "ptoobig", Size: size}); err == nil {
		t.Error("a partition that doesn't fit should be refused")
	}
}

// Forwards are kept and only new ones count as added (their stale connection
// tracking is cleared); agents that aren't machines ignore them.
func TestForwardsAppliedOnMachinesOnly(t *testing.T) {
	ctx := context.Background()
	idle := &Manager{Driver: newFake(), Path: filepath.Join(t.TempDir(), "pool.json")}
	if err := idle.ApplyForwards(ctx, []protocol.PortForward{{Protocol: "tcp", Port: 8080, Partition: "p1", To: 8080}}); err != nil {
		t.Fatal(err)
	}
	if idle.Driver.(*fake).forwards != nil {
		t.Error("a partition's agent shouldn't forward")
	}

	m, f := setup(t)
	create(t, m, "huruf", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false)
	web := protocol.PortForward{Protocol: "tcp", Port: 8080, Partition: "huruf", To: 8080}
	mesh := protocol.PortForward{Protocol: "udp", Port: 51821, Partition: "huruf", To: 51820}
	if err := m.ApplyForwards(ctx, []protocol.PortForward{mesh}); err != nil {
		t.Fatal(err)
	}
	if err := m.ApplyForwards(ctx, []protocol.PortForward{mesh, web}); err != nil {
		t.Fatal(err)
	}
	if len(f.forwards) != 2 || len(f.added) != 1 || f.added[0] != web {
		t.Fatalf("forwards %v added %v", f.forwards, f.added)
	}
	f.forwards = nil
	if err := m.ApplyForwards(ctx, []protocol.PortForward{mesh, web}); err != nil || f.forwards != nil {
		t.Fatalf("unchanged forwards re-applied: %v", err)
	}
}

// A forward to a partition that isn't running yet (after a reboot) is
// applied once the partition runs.
func TestForwardsWaitForTheirPartition(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	create(t, m, "p1", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false)
	f.down["p1"] = true
	if err := m.ApplyForwards(ctx, []protocol.PortForward{{Protocol: "tcp", Port: 8080, Partition: "p1", To: 8080}}); err != nil {
		t.Fatal(err)
	}
	calls := f.forwardCalls
	m.Usage(ctx)
	if f.forwardCalls != calls {
		t.Fatal("re-applied while the partition is down")
	}
	f.down["p1"] = false
	m.Usage(ctx)
	if f.forwardCalls != calls+1 {
		t.Fatal("not re-applied once the partition runs")
	}
	m.Usage(ctx)
	if f.forwardCalls != calls+1 {
		t.Fatal("re-applied with nothing left to apply")
	}
}

// A change holding the lock (host setup, installing an agent) mustn't stall
// the poll: usage comes from the last report meanwhile.
func TestUsageNeverWaitsOnAChange(t *testing.T) {
	m, _ := setup(t)
	ctx := context.Background()
	create(t, m, "p1", protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}, false)
	first := m.Usage(ctx)
	if len(first) == 0 {
		t.Fatal("no usage")
	}
	m.mu.Lock()
	done := make(chan []protocol.PartitionUsage, 1)
	go func() { done <- m.Usage(ctx) }()
	select {
	case got := <-done:
		if len(got) != len(first) || got[0].Name != first[0].Name {
			t.Fatalf("usage while locked = %+v", got)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Usage waited on the lock")
	}
	m.mu.Unlock()
}

// Rentals are isolated one by one; the owner's own partitions aren't (PLAN §28).
func TestOnlyRentalsAreIsolated(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	own := protocol.PartitionSize{Cpus: 1, MemMb: 1024, DiskGb: 10}
	create(t, m, "pown", own, false)
	if len(f.isolated) != 0 {
		t.Fatalf("own partition isolated: %v", f.isolated)
	}
	create(t, m, "prent", own, true)
	if len(f.isolated) != 1 || f.isolated[0] != "prent" {
		t.Fatalf("isolated = %v", f.isolated)
	}
	if _, err := m.Remove(ctx, protocol.PartitionNamePayload{Name: "prent"}); err != nil {
		t.Fatal(err)
	}
	if len(f.isolated) != 0 {
		t.Fatalf("removed rental still isolated: %v", f.isolated)
	}
}

func TestParsesQuotaAndCounters(t *testing.T) {
	quota := parseQuotaReport("Project quota on /srv/huruf-pool (/dev/loop0)\n#0 0 0 0 00 [------]\n#" + projectID("p1") + "   2048   0  10485760  00 [------]\n")
	if quota[projectID("p1")] != 2048*1024 {
		t.Fatalf("quota = %v", quota)
	}
	counters := parseCounters(`{"nftables":[{"metainfo":{}},{"table":{"name":"huruf_pool"}},{"counter":{"name":"out_p1","bytes":7}},{"counter":{"name":"in_p1","bytes":5}},{"rule":{"expr":[{"counter":"out_p1"}]}}]}`)
	if counters["out_p1"] != 7 || counters["in_p1"] != 5 {
		t.Fatalf("counters = %v", counters)
	}
}
