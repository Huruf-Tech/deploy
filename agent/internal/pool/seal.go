package pool

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
)

// A moving partition crosses the internet between machines (PLAN §26.10),
// encrypted with the move's one-time key, which the control plane seals to
// both. Each part is AES-256-GCM in chunks: a 4-byte big-endian header (the
// chunk's length; the top bit marks the last one), then the sealed chunk. The
// header is authenticated, nonces count up per part, so chunks can't be
// reordered, cut short or moved between parts.

const sealChunk = 64 << 10

const lastChunk = 1 << 31

func moveCipher(key, part string) (cipher.AEAD, [4]byte, error) {
	var prefix [4]byte
	raw, err := base64.StdEncoding.DecodeString(key)
	if err != nil || len(raw) != 32 {
		return nil, prefix, errors.New("the move's key must be 32 bytes, base64")
	}
	block, err := aes.NewCipher(raw)
	if err != nil {
		return nil, prefix, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, prefix, err
	}
	sum := sha256.Sum256([]byte(part))
	copy(prefix[:], sum[:4])
	return aead, prefix, nil
}

func chunkNonce(prefix [4]byte, n uint64) []byte {
	nonce := make([]byte, 12)
	copy(nonce, prefix[:])
	binary.BigEndian.PutUint64(nonce[4:], n)
	return nonce
}

// sealWriter encrypts what's written to it; Close writes the last chunk.
type sealWriter struct {
	aead   cipher.AEAD
	prefix [4]byte
	w      io.Writer
	buf    []byte
	n      uint64
}

func newSealWriter(key, part string, w io.Writer) (*sealWriter, error) {
	aead, prefix, err := moveCipher(key, part)
	if err != nil {
		return nil, err
	}
	return &sealWriter{aead: aead, prefix: prefix, w: w}, nil
}

func (s *sealWriter) Write(p []byte) (int, error) {
	s.buf = append(s.buf, p...)
	for len(s.buf) >= sealChunk {
		if err := s.flush(s.buf[:sealChunk], false); err != nil {
			return 0, err
		}
		s.buf = s.buf[sealChunk:]
	}
	return len(p), nil
}

func (s *sealWriter) Close() error {
	err := s.flush(s.buf, true)
	s.buf = nil
	return err
}

func (s *sealWriter) flush(data []byte, last bool) error {
	length := uint32(len(data))
	if last {
		length |= lastChunk
	}
	header := binary.BigEndian.AppendUint32(nil, length)
	out := s.aead.Seal(header, chunkNonce(s.prefix, s.n), data, header)
	s.n++
	_, err := s.w.Write(out)
	return err
}

// openReader decrypts a sealed part; it fails unless the last chunk arrives.
type openReader struct {
	aead   cipher.AEAD
	prefix [4]byte
	r      io.Reader
	buf    []byte
	n      uint64
	done   bool
	err    error // the first failure: the reason a reader of it gives up
}

func newOpenReader(key, part string, r io.Reader) (*openReader, error) {
	aead, prefix, err := moveCipher(key, part)
	if err != nil {
		return nil, err
	}
	return &openReader{aead: aead, prefix: prefix, r: r}, nil
}

func (o *openReader) Read(p []byte) (int, error) {
	if o.err != nil {
		return 0, o.err
	}
	n, err := o.read(p)
	if err != nil && err != io.EOF {
		o.err = err
	}
	return n, err
}

func (o *openReader) read(p []byte) (int, error) {
	for len(o.buf) == 0 {
		if o.done {
			return 0, io.EOF
		}
		header := make([]byte, 4)
		if _, err := io.ReadFull(o.r, header); err != nil {
			return 0, truncated(err)
		}
		length := binary.BigEndian.Uint32(header)
		last := length&lastChunk != 0
		length &^= lastChunk
		if length > sealChunk {
			return 0, errors.New("the moving partition's data is corrupt")
		}
		sealed := make([]byte, int(length)+o.aead.Overhead())
		if _, err := io.ReadFull(o.r, sealed); err != nil {
			return 0, truncated(err)
		}
		plain, err := o.aead.Open(nil, chunkNonce(o.prefix, o.n), sealed, header)
		if err != nil {
			return 0, errors.New("the moving partition's data didn't pass its check")
		}
		o.n++
		o.buf, o.done = plain, last
	}
	n := copy(p, o.buf)
	o.buf = o.buf[n:]
	return n, nil
}

func truncated(err error) error {
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return fmt.Errorf("the moving partition's data was cut short: %w", io.ErrUnexpectedEOF)
	}
	return err
}
