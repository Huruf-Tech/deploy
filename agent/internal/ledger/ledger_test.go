package ledger

import (
	"path/filepath"
	"testing"
)

// The first record of a thing is kept: it holds the original state.
func TestRecordKeepsTheFirst(t *testing.T) {
	Path = filepath.Join(t.TempDir(), "ledger.jsonl")
	defer func() { Path = "" }()
	_ = Record(Entry{Kind: "daemon-key", Name: "log-driver", Prev: []byte(`"json-file"`)})
	_ = Record(Entry{Kind: "daemon-key", Name: "log-driver", Prev: []byte(`"local"`)})
	_ = Record(Entry{Kind: "package", Name: "wireguard-tools"})
	got := Read()
	if len(got) != 2 || string(got[0].Prev) != `"json-file"` || !Has(got, "package", "wireguard-tools") {
		t.Fatalf("got %+v", got)
	}
}
