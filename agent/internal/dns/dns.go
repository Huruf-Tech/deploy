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
	"slices"
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
	// Peers are other servers' mesh addresses: .internal queries are also
	// asked there, so names resolve to replicas on every reachable server.
	Peers func() []string

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
// Serve listens on addr (UDP) until ctx ends. A localOnly listener (the mesh
// address, asked by peers) answers from this server's records only, so peer
// queries never fan out again.
func (s *Server) Serve(ctx context.Context, addr string, localOnly ...bool) error {
	s.upstream = upstreamResolver()
	local := len(localOnly) > 0 && localOnly[0]
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
			if answer := s.answer(query, local); answer != nil {
				_, _ = conn.WriteTo(answer, from)
			}
		}()
	}
}

// Answer builds the response for one query packet, or nil to drop it.
func (s *Server) Answer(query []byte) []byte { return s.answer(query, false) }

func (s *Server) answer(query []byte, localOnly bool) []byte {
	name, qtype, end, err := parseQuestion(query)
	if err != nil {
		return nil
	}
	if !strings.HasSuffix(name, ".internal") {
		if localOnly {
			return nil // peers only ask for .internal names
		}
		return s.forward(query)
	}

	s.mu.RLock()
	ips := slices.Clone(s.records[name])
	s.mu.RUnlock()
	if !localOnly && qtype == typeA && s.Peers != nil {
		for _, ip := range s.fromPeers(query) {
			if !slices.ContainsFunc(ips, ip.Equal) {
				ips = append(ips, ip)
			}
		}
	}

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

// fromPeers asks every peer at once and collects the A records they answer
// within a short timeout: an unreachable peer only costs that timeout.
func (s *Server) fromPeers(query []byte) []net.IP {
	peers := s.Peers()
	results := make(chan []net.IP, len(peers))
	for _, peer := range peers {
		go func() {
			results <- aRecords(exchange(net.JoinHostPort(peer, "53"), query, 400*time.Millisecond))
		}()
	}
	var ips []net.IP
	for range peers {
		ips = append(ips, <-results...)
	}
	return ips
}

func exchange(addr string, query []byte, timeout time.Duration) []byte {
	conn, err := net.DialTimeout("udp", addr, timeout)
	if err != nil {
		return nil
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(timeout))
	if _, err := conn.Write(query); err != nil {
		return nil
	}
	buf := make([]byte, 1500)
	n, err := conn.Read(buf)
	if err != nil {
		return nil
	}
	return buf[:n]
}

// aRecords reads the A records of a response (answers use name pointers or labels).
func aRecords(msg []byte) []net.IP {
	_, _, i, err := parseQuestion(msg)
	if err != nil || len(msg) < 12 {
		return nil
	}
	count := int(binary.BigEndian.Uint16(msg[6:8]))
	var ips []net.IP
	for range count {
		// Skip the owner name.
		for i < len(msg) {
			if msg[i]&0xc0 == 0xc0 {
				i += 2
				break
			}
			if msg[i] == 0 {
				i++
				break
			}
			i += int(msg[i]) + 1
		}
		if i+10 > len(msg) {
			return ips
		}
		rtype := binary.BigEndian.Uint16(msg[i : i+2])
		size := int(binary.BigEndian.Uint16(msg[i+8 : i+10]))
		i += 10
		if i+size > len(msg) {
			return ips
		}
		if rtype == typeA && size == 4 {
			ips = append(ips, net.IP(slices.Clone(msg[i:i+4])))
		}
		i += size
	}
	return ips
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
