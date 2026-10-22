// Package dns answers <name>.internal for containers (PLAN §8.3) with the IPs
// of healthy, routed replicas, and forwards every other query upstream.
// Containers get it with --dns; Docker's embedded resolver passes names it
// doesn't know (anything that isn't a container name) to it.
package dns

import (
	"bufio"
	"context"
	"encoding/binary"
	"errors"
	"log/slog"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	typeA    = 1
	typeAAAA = 28
	ttl      = 5 // seconds: replicas change during rollouts
)

type Server struct {
	Log *slog.Logger

	mu       sync.RWMutex
	records  map[string][]net.IP
	upstream string
}

// Set replaces every record, e.g. {"shop.internal": ["172.18.0.4"]}.
func (s *Server) Set(records map[string][]string) {
	parsed := make(map[string][]net.IP, len(records))
	for name, ips := range records {
		key := strings.ToLower(strings.TrimSuffix(name, "."))
		for _, ip := range ips {
			if v4 := net.ParseIP(ip).To4(); v4 != nil {
				parsed[key] = append(parsed[key], v4)
			}
		}
	}
	s.mu.Lock()
	s.records = parsed
	s.mu.Unlock()
}

// Serve listens on addr (UDP) until ctx ends.
func (s *Server) Serve(ctx context.Context, addr string) error {
	s.upstream = upstreamResolver()
	conn, err := net.ListenPacket("udp", addr)
	if err != nil {
		return err
	}
	go func() {
		<-ctx.Done()
		conn.Close()
	}()

	buf := make([]byte, 1500)
	for {
		n, from, err := conn.ReadFrom(buf)
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			continue
		}
		query := append([]byte(nil), buf[:n]...)
		go func() {
			if answer := s.Answer(query); answer != nil {
				_, _ = conn.WriteTo(answer, from)
			}
		}()
	}
}

// Answer builds the response for one query packet, or nil to drop it.
func (s *Server) Answer(query []byte) []byte {
	name, qtype, end, err := parseQuestion(query)
	if err != nil {
		return nil
	}
	if !strings.HasSuffix(name, ".internal") {
		return s.forward(query)
	}

	s.mu.RLock()
	ips := s.records[name]
	s.mu.RUnlock()

	// Header: same id, response + recursion available, copy RD.
	resp := append([]byte(nil), query[:end]...)
	flags := uint16(0x8080) | binary.BigEndian.Uint16(query[2:4])&0x0100
	if len(ips) == 0 {
		flags |= 3 // NXDOMAIN
	}
	binary.BigEndian.PutUint16(resp[2:4], flags)
	binary.BigEndian.PutUint16(resp[6:8], 0)   // answers
	binary.BigEndian.PutUint16(resp[8:10], 0)  // authority
	binary.BigEndian.PutUint16(resp[10:12], 0) // additional
	if qtype != typeA {
		return resp // AAAA and others: the name exists, but has no such records
	}

	for _, ip := range ips {
		resp = append(resp, 0xc0, 0x0c) // pointer to the question name
		resp = binary.BigEndian.AppendUint16(resp, typeA)
		resp = binary.BigEndian.AppendUint16(resp, 1) // IN
		resp = binary.BigEndian.AppendUint32(resp, ttl)
		resp = binary.BigEndian.AppendUint16(resp, 4)
		resp = append(resp, ip...)
	}
	binary.BigEndian.PutUint16(resp[6:8], uint16(len(ips)))
	return resp
}

func (s *Server) forward(query []byte) []byte {
	if s.upstream == "" {
		return nil
	}
	conn, err := net.DialTimeout("udp", s.upstream, 2*time.Second)
	if err != nil {
		return nil
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(4 * time.Second))
	if _, err := conn.Write(query); err != nil {
		return nil
	}
	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return nil
	}
	return buf[:n]
}

// parseQuestion reads the first question: lowercased name without the
// trailing dot, its type, and where the question section ends.
func parseQuestion(msg []byte) (name string, qtype uint16, end int, err error) {
	if len(msg) < 12 || binary.BigEndian.Uint16(msg[4:6]) < 1 {
		return "", 0, 0, errors.New("no question")
	}
	var labels []string
	i := 12
	for {
		if i >= len(msg) {
			return "", 0, 0, errors.New("truncated name")
		}
		size := int(msg[i])
		if size == 0 {
			i++
			break
		}
		if size&0xc0 != 0 || i+1+size > len(msg) {
			return "", 0, 0, errors.New("unsupported name")
		}
		labels = append(labels, string(msg[i+1:i+1+size]))
		i += 1 + size
	}
	if i+4 > len(msg) {
		return "", 0, 0, errors.New("truncated question")
	}
	qtype = binary.BigEndian.Uint16(msg[i : i+2])
	return strings.ToLower(strings.Join(labels, ".")), qtype, i + 4, nil
}

// upstreamResolver is the host's first nameserver (systemd-resolved's stub is
// reachable from the host, where the agent runs).
func upstreamResolver() string {
	f, err := os.Open("/etc/resolv.conf")
	if err != nil {
		return "1.1.1.1:53"
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) >= 2 && fields[0] == "nameserver" {
			return net.JoinHostPort(fields[1], "53")
		}
	}
	return "1.1.1.1:53"
}
