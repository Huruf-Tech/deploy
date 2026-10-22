package state

import "testing"

func TestANewRegistrationStartsOver(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	_ = s.Received(55, 55)
	_ = s.SaveSpec(7, "sealed")

	// First record (state from an older agent): same server, nothing resets.
	if changed, _ := s.RegisteredAs("server-a"); changed || s.Cursor() != 55 {
		t.Fatalf("changed=%v cursor=%d", changed, s.Cursor())
	}
	if changed, _ := s.RegisteredAs("server-a"); changed {
		t.Fatal("the same server counted as new")
	}

	// Removed and added again: commands and desired state start from zero.
	if changed, _ := s.RegisteredAs("server-b"); !changed {
		t.Fatal("a new server id wasn't noticed")
	}
	version, sealed := s.Spec()
	if s.Cursor() != 0 || s.IsDone(55) || version != 0 || sealed != "" {
		t.Fatalf("not reset: cursor=%d done55=%v spec=%d %q", s.Cursor(), s.IsDone(55), version, sealed)
	}
}
