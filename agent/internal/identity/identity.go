// Package identity holds the agent's keys (PLAN §4.2): Ed25519 to sign
// requests and X25519 to receive sealed secrets. Both are created on first run
// and stored with mode 0600.
package identity

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdh"
	"crypto/ed25519"
	"crypto/hkdf"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Identity struct {
	sign ed25519.PrivateKey
	box  *ecdh.PrivateKey
}

type stored struct {
	SignSeed   string `json:"signSeed"`
	BoxPrivate string `json:"boxPrivate"`
}

var b64 = base64.RawURLEncoding

// LoadOrCreate reads the identity from dir, creating it on first run.
func LoadOrCreate(dir string) (*Identity, error) {
	path := filepath.Join(dir, "identity")
	data, err := os.ReadFile(path)

	if errors.Is(err, os.ErrNotExist) {
		return create(dir, path)
	}
	if err != nil {
		return nil, err
	}

	var s stored
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("identity file is corrupt: %w", err)
	}
	seed, err := b64.DecodeString(s.SignSeed)
	if err != nil || len(seed) != ed25519.SeedSize {
		return nil, errors.New("identity file has an invalid signing key")
	}
	boxRaw, err := b64.DecodeString(s.BoxPrivate)
	if err != nil {
		return nil, err
	}
	box, err := ecdh.X25519().NewPrivateKey(boxRaw)
	if err != nil {
		return nil, err
	}
	return &Identity{sign: ed25519.NewKeyFromSeed(seed), box: box}, nil
}

func create(dir, path string) (*Identity, error) {
	_, sign, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	box, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}

	data, _ := json.Marshal(stored{
		SignSeed:   b64.EncodeToString(sign.Seed()),
		BoxPrivate: b64.EncodeToString(box.Bytes()),
	})
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	// Written whole or not at all: a crash mid-write mustn't leave a corrupt
	// identity, which would make the server register as a new one.
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return nil, err
	}
	if err := os.Rename(tmp, path); err != nil {
		return nil, err
	}
	return &Identity{sign: sign, box: box}, nil
}

func (i *Identity) SignPublicKey() string {
	return b64.EncodeToString(i.sign.Public().(ed25519.PublicKey))
}

func (i *Identity) BoxPublicKey() string {
	return b64.EncodeToString(i.box.PublicKey().Bytes())
}

// Fingerprint is the hex SHA-256 of the raw signing public key.
func (i *Identity) Fingerprint() string {
	sum := sha256.Sum256(i.sign.Public().(ed25519.PublicKey))
	return hex.EncodeToString(sum[:])
}

// PairingCode is computed locally, so the code the user compares never depends
// on what the network returned (PLAN §4.2).
func (i *Identity) PairingCode() string {
	sum := sha256.Sum256(i.sign.Public().(ed25519.PublicKey))
	return base32.StdEncoding.EncodeToString(sum[:])[:6]
}

// SignRequest signs `METHOD \n path \n timestamp \n sha256hex(body)` (PLAN §4.1).
func (i *Identity) SignRequest(method, path string, timestamp time.Time, body []byte) (ts, signature string) {
	ts = fmt.Sprint(timestamp.UnixMilli())
	sum := sha256.Sum256(body)
	canonical := strings.Join(
		[]string{strings.ToUpper(method), path, ts, hex.EncodeToString(sum[:])},
		"\n",
	)
	return ts, b64.EncodeToString(ed25519.Sign(i.sign, []byte(canonical)))
}

const sealInfo = "huruf-deploy seal v1"

// Open decrypts a value the control plane sealed to this agent's X25519 key
// (PLAN §4.2): `s1.` + base64url(ephemeral public key ‖ nonce ‖ ciphertext),
// X25519 → HKDF-SHA256 → AES-256-GCM. Mirrors lib/agents/sealing.ts.
func (i *Identity) Open(sealed string) ([]byte, error) {
	encoded, ok := strings.CutPrefix(sealed, "s1.")
	if !ok {
		return nil, errors.New("unknown sealed format")
	}
	raw, err := b64.DecodeString(encoded)
	if err != nil || len(raw) < 32+12+16 {
		return nil, errors.New("malformed sealed value")
	}
	ephemeral, err := ecdh.X25519().NewPublicKey(raw[:32])
	if err != nil {
		return nil, err
	}
	shared, err := i.box.ECDH(ephemeral)
	if err != nil {
		return nil, err
	}
	salt := append(append([]byte{}, raw[:32]...), i.box.PublicKey().Bytes()...)
	key, err := hkdf.Key(sha256.New, shared, salt, sealInfo, 32)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return gcm.Open(nil, raw[32:44], raw[44:], nil)
}
