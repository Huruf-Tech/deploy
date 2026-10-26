package pool

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type fake struct {
	sizes   map[string]protocol.PartitionSize
	weights map[string]int
	used    map[string]Usage
	scripts []string

	sendErr, receiveErr error
}

func newFake() *fake {
	return &fake{sizes: map[string]protocol.PartitionSize{}, weights: map[string]int{}, used: map[string]Usage{}}
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
func (f *fake) Usage(_ context.Context, name string) (Usage, error) {
	u := f.used[name]
	u.State = "running"
	return u, nil
}
func (f *fake) Restore(context.Context, []string) error            { return nil }
func (f *fake) Send(context.Context, string, string, string) error { return f.sendErr }
func (f *fake) Receive(_ context.Context, name string, size protocol.PartitionSize, weight int, _, _ string) error {
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
	ctx := context.Background()
	if _, err := m.Ensure(ctx, protocol.PoolEnsurePayload{}); err != nil {
		t.Fatal(err)
	}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "huruf", Remainder: true, Install: install()}); err != nil {
		t.Fatal(err)
	}
	return m, f
}

func TestRemainderTakesEverything(t *testing.T) {
	_, f := setup(t)
	if got := f.sizes["huruf"]; got != (protocol.PartitionSize{Cpus: 0, MemMb: 7168, DiskGb: 100}) {
		t.Errorf("remainder = %+v", got)
	}
	if f.weights["huruf"] != 2 {
		t.Errorf("remainder weight = %d, want the least", f.weights["huruf"])
	}
}

func TestRentalIsCarvedFromTheRemainder(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	small := protocol.PartitionSize{Cpus: 1, MemMb: 2304, DiskGb: 25}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "salha", Size: &small, Install: install()}); err != nil {
		t.Fatal(err)
	}
	if got := f.sizes["huruf"]; got.MemMb != 7168-2304 || got.DiskGb != 75 || got.Cpus != 0 {
		t.Errorf("remainder after the rental = %+v", got)
	}
	if f.weights["salha"] != 1024 {
		t.Errorf("rental weight = %d", f.weights["salha"])
	}
	// The agent is installed with the join token, quoted for the shell.
	last := f.scripts[len(f.scripts)-1]
	if !strings.Contains(last, `--join-token 'tok'\''en'`) || !strings.Contains(last, "'https://cp.example/agents/api/install.sh'") {
		t.Errorf("install script: %s", last)
	}

	// Removing it gives everything back.
	if _, err := m.Remove(ctx, protocol.PartitionNamePayload{Name: "salha"}); err != nil {
		t.Fatal(err)
	}
	if got := f.sizes["huruf"]; got.MemMb != 7168 || got.DiskGb != 100 {
		t.Errorf("remainder after removal = %+v", got)
	}
}

func TestTooBigOrRemainderInUse(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	huge := protocol.PartitionSize{Cpus: 1, MemMb: 8000, DiskGb: 25}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "big", Size: &huge, Install: install()}); err == nil {
		t.Error("a partition bigger than the machine was created")
	}
	// Huruf's partition uses 6 GB: carving 2.25 GB would leave it 4.75 GB.
	f.used["huruf"] = Usage{MemUsed: 6 << 30}
	small := protocol.PartitionSize{Cpus: 1, MemMb: 2304, DiskGb: 25}
	_, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "salha", Size: &small, Install: install()})
	if err == nil || !strings.Contains(err.Error(), "free memory there first") {
		t.Fatalf("expected a refusal, got %v", err)
	}
	if _, ok := f.sizes["salha"]; ok {
		t.Error("the partition was created anyway")
	}
	if f.sizes["huruf"].MemMb != 7168 {
		t.Error("the remainder shrank anyway")
	}
}

func TestResize(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	small := protocol.PartitionSize{Cpus: 1, MemMb: 2048, DiskGb: 25}
	if _, err := m.Create(ctx, protocol.PartitionCreatePayload{Name: "salha", Size: &small, Install: install()}); err != nil {
		t.Fatal(err)
	}
	medium := protocol.PartitionSize{Cpus: 2, MemMb: 4096, DiskGb: 50}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: medium}); err != nil {
		t.Fatal(err)
	}
	if f.sizes["salha"] != medium || f.sizes["huruf"].MemMb != 7168-4096 || f.weights["salha"] != 2048 {
		t.Errorf("after growing: %+v / %+v", f.sizes["salha"], f.sizes["huruf"])
	}
	// Shrinking below what the partition uses is refused.
	f.used["salha"] = Usage{MemUsed: 3 << 30}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: small}); err == nil {
		t.Error("shrunk below its use")
	}
	f.used["salha"] = Usage{MemUsed: 1 << 30}
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "salha", Size: small}); err != nil {
		t.Fatal(err)
	}
	if f.sizes["huruf"].MemMb != 7168-2048 {
		t.Errorf("the remainder didn't get the memory back: %+v", f.sizes["huruf"])
	}
	// The remainder isn't resized by hand.
	if _, err := m.Resize(ctx, protocol.PartitionResizePayload{Name: "huruf", Size: small}); err == nil {
		t.Error("resized the remainder by hand")
	}
}

func TestUsageAndState(t *testing.T) {
	m, f := setup(t)
	small := protocol.PartitionSize{Cpus: 0.5, MemMb: 1024, DiskGb: 10}
	if _, err := m.Create(context.Background(), protocol.PartitionCreatePayload{Name: "salha", Size: &small, Install: install()}); err != nil {
		t.Fatal(err)
	}
	f.used["salha"] = Usage{MemUsed: 100, RxBytes: 5, TxBytes: 7}
	usage := m.Usage(context.Background())
	if len(usage) != 2 || usage[0].Name != "huruf" || !usage[0].Remainder || usage[1].TxBytes != 7 || usage[1].Size.Cpus != 0.5 {
		t.Errorf("usage = %+v", usage)
	}

	// A new manager (the agent restarted) reads the sizes back.
	again := &Manager{Driver: f, Path: m.Path}
	if got := again.Usage(context.Background()); len(got) != 2 {
		t.Errorf("state not kept: %+v", got)
	}
	// Creating a partition that exists only re-runs the install.
	before := len(f.scripts)
	if _, err := again.Create(context.Background(), protocol.PartitionCreatePayload{Name: "salha", Size: &small, Install: install()}); err != nil {
		t.Fatal(err)
	}
	if len(f.scripts) != before+1 || f.sizes["salha"] != small {
		t.Error("re-creating changed more than the install")
	}
}

func TestMoveSendsRentalsOnly(t *testing.T) {
	m, _ := setup(t)
	ctx := context.Background()
	if _, err := m.Send(ctx, protocol.PartitionSendPayload{Name: "huruf"}); err == nil {
		t.Error("sending the remainder should fail")
	}
	if _, err := m.Send(ctx, protocol.PartitionSendPayload{Name: "nope"}); err == nil {
		t.Error("sending an unknown partition should fail")
	}
}

func TestReceiveCarvesAndGivesBack(t *testing.T) {
	m, f := setup(t)
	ctx := context.Background()
	size := protocol.PartitionSize{Cpus: 1, MemMb: 2176, DiskGb: 25}
	f.receiveErr = errors.New("connection reset")
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err == nil {
		t.Fatal("a failed transfer should fail")
	}
	if got := f.sizes["huruf"]; got.MemMb != 7168 || got.DiskGb != 100 {
		t.Errorf("remainder after a failed receive = %+v, want everything back", got)
	}
	if _, ok := f.sizes["pmoved"]; ok {
		t.Error("the failed partition should be gone")
	}

	f.receiveErr = nil
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err != nil {
		t.Fatal(err)
	}
	if got := f.sizes["huruf"]; got.MemMb != 7168-2176 || got.DiskGb != 75 {
		t.Errorf("remainder = %+v, want what the move took carved off", got)
	}
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "pmoved", Size: size}); err == nil {
		t.Error("receiving a partition twice should fail")
	}
	big := protocol.PartitionSize{Cpus: 1, MemMb: 8000, DiskGb: 10}
	if _, err := m.Receive(ctx, protocol.PartitionReceivePayload{Name: "ptoobig", Size: big}); err == nil {
		t.Error("a partition that doesn't fit should be refused")
	}
}
