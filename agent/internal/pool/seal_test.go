package pool

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"io"
	"strings"
	"testing"
)

// A fixed key for the move tests.
var testKey = base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{7}, 32))

func seal(t *testing.T, key, part string, data []byte) []byte {
	t.Helper()
	var out bytes.Buffer
	w, err := newSealWriter(key, part, &out)
	if err != nil {
		t.Fatal(err)
	}
	// Uneven writes cross chunk boundaries.
	for len(data) > 0 {
		n := min(len(data), 70_000)
		if _, err := w.Write(data[:n]); err != nil {
			t.Fatal(err)
		}
		data = data[n:]
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}

func open(key, part string, sealed []byte) ([]byte, error) {
	r, err := newOpenReader(key, part, bytes.NewReader(sealed))
	if err != nil {
		return nil, err
	}
	return io.ReadAll(r)
}

func TestSealRoundTrip(t *testing.T) {
	for _, size := range []int{0, 1, sealChunk, sealChunk + 1, 3*sealChunk + 17} {
		data := make([]byte, size)
		_, _ = rand.Read(data)
		got, err := open(testKey, "/data", seal(t, testKey, "/data", data))
		if err != nil || !bytes.Equal(got, data) {
			t.Fatalf("size %d: %v", size, err)
		}
	}
}

func TestSealRefusesTamperingAndTruncation(t *testing.T) {
	data := bytes.Repeat([]byte("partition "), 20_000)
	sealed := seal(t, testKey, "/data", data)

	other := base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{8}, 32))
	if _, err := open(other, "/data", sealed); err == nil {
		t.Error("another key opened it")
	}
	if _, err := open(testKey, "/image", sealed); err == nil {
		t.Error("another part's nonces opened it")
	}
	flipped := bytes.Clone(sealed)
	flipped[len(flipped)/2] ^= 1
	if _, err := open(testKey, "/data", flipped); err == nil {
		t.Error("a flipped bit went unnoticed")
	}
	// Cut at a chunk boundary: every chunk read is valid, the last never comes.
	first := 4 + sealChunk + 16
	if _, err := open(testKey, "/data", sealed[:first]); err == nil || !strings.Contains(err.Error(), "cut short") {
		t.Errorf("a cut-off stream: %v", err)
	}
	if _, err := newSealWriter("short", "/data", io.Discard); err == nil {
		t.Error("a bad key was accepted")
	}
}
