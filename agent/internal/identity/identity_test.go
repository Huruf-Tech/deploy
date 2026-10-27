package identity

import (
	"crypto/ecdh"
	"crypto/ed25519"
	"testing"
	"time"
)

// fromSeed builds an identity from a fixed seed.
func fromSeed(seed []byte) *Identity {
	box, _ := ecdh.X25519().NewPrivateKey(seed)
	return &Identity{sign: ed25519.NewKeyFromSeed(seed), box: box}
}

// Vectors produced by the control plane's lib/agents/signing.ts with the same
// seed, so a drift between the Go and TypeScript implementations fails here.
func TestMatchesControlPlaneSigning(t *testing.T) {
	seed := make([]byte, 32)
	for i := range seed {
		seed[i] = byte(i)
	}
	id := fromSeed(seed)

	check := func(name, got, want string) {
		if got != want {
			t.Errorf("%s = %q, want %q", name, got, want)
		}
	}

	check("public key", id.SignPublicKey(), "A6EHv_POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg")
	check("fingerprint", id.Fingerprint(), "56475aa75463474c0285df5dbf2bcab73da651358839e9b77481b2eab107708c")
	check("pairing code", id.PairingCode(), "KZDVVJ")

	ts, sig := id.SignRequest("post", "/agents/api/poll", time.UnixMilli(1700000000000), []byte(`{"commandCursor":7}`))
	check("timestamp", ts, "1700000000000")
	check("signature", sig, "5PXSjh3_pTnRuvJILiomnfQv3mLZYu2o94hXAPRSaM7fqcszQMbRCl_6L50J9G0UUcgub53TE8OMyP7t9H69DA")
}

func TestLoadOrCreatePersists(t *testing.T) {
	dir := t.TempDir()
	first, err := LoadOrCreate(dir)
	if err != nil {
		t.Fatal(err)
	}
	second, err := LoadOrCreate(dir)
	if err != nil {
		t.Fatal(err)
	}
	if first.Fingerprint() != second.Fingerprint() || first.BoxPublicKey() != second.BoxPublicKey() {
		t.Fatal("identity changed between runs")
	}
}

// A vector sealed by lib/agents/sealing.ts (`deno run -A tests/sealing_test.ts`).
func TestOpenReadsWhatTheControlPlaneSealed(t *testing.T) {
	seed := make([]byte, 32)
	for i := range seed {
		seed[i] = byte(i + 1)
	}
	id := fromSeed(seed)
	if got := id.BoxPublicKey(); got != "B6N8vBQgk8i3VdwbEOhstCY3StFqqFPtC9_AsrhtHHw" {
		t.Fatalf("box public key = %s", got)
	}
	plain, err := id.Open("s1.y-Rk7yXPSuRoBWI1s2hCjOV1DMPqO4UoixBbUTQaNW3uzUmh62ucEYn5qIEjdbqDymANQ3suXDYYPEdMVY7oT4BUH4JjWn7ibty6Z6QPFbiGyUMu9NXr")
	if err != nil || string(plain) != "sealed by the control plane" {
		t.Fatalf("Open = %q, %v", plain, err)
	}
	if _, err := fromSeed(make([]byte, 32)).Open("s1.y-Rk7yXPSuRoBWI1s2hCjOV1DMPqO4UoixBbUTQaNW3uzUmh62ucEYn5qIEjdbqDymANQ3suXDYYPEdMVY7oT4BUH4JjWn7ibty6Z6QPFbiGyUMu9NXr"); err == nil {
		t.Fatal("another key opened it")
	}
}
