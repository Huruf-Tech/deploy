package dns

import (
	"encoding/binary"
	"net"
	"testing"
)

func query(name string, qtype uint16) []byte {
	msg := []byte{0x12, 0x34, 0x01, 0x00, 0, 1, 0, 0, 0, 0, 0, 0}
	for _, label := range splitLabels(name) {
		msg = append(msg, byte(len(label)))
		msg = append(msg, label...)
	}
	msg = append(msg, 0)
	msg = binary.BigEndian.AppendUint16(msg, qtype)
	return binary.BigEndian.AppendUint16(msg, 1)
}

func splitLabels(name string) []string {
	var labels []string
	start := 0
	for i := range len(name) {
		if name[i] == '.' {
			labels = append(labels, name[start:i])
			start = i + 1
		}
	}
	return append(labels, name[start:])
}

func TestAnswersInternalNamesWithEveryReplica(t *testing.T) {
	s := &Server{}
	s.Set(map[string][]string{"shop.internal": {"172.18.0.4", "172.18.0.5"}})

	resp := s.Answer(query("Shop.Internal", typeA))
	if id := binary.BigEndian.Uint16(resp[0:2]); id != 0x1234 {
		t.Fatalf("id = %x", id)
	}
	if rcode := resp[3] & 0x0f; rcode != 0 {
		t.Fatalf("rcode = %d", rcode)
	}
	if answers := binary.BigEndian.Uint16(resp[6:8]); answers != 2 {
		t.Fatalf("answers = %d", answers)
	}
	last := resp[len(resp)-4:]
	if !net.IP(last).Equal(net.ParseIP("172.18.0.5")) {
		t.Fatalf("last answer = %v", net.IP(last))
	}
}

func TestUnknownInternalNamesAreNXDOMAIN(t *testing.T) {
	s := &Server{}
	s.Set(map[string][]string{"shop.internal": {"172.18.0.4"}})

	resp := s.Answer(query("db.internal", typeA))
	if rcode := resp[3] & 0x0f; rcode != 3 {
		t.Fatalf("rcode = %d, want NXDOMAIN", rcode)
	}
	if resp := s.Answer(query("shop.internal", typeAAAA)); binary.BigEndian.Uint16(resp[6:8]) != 0 || resp[3]&0x0f != 0 {
		t.Fatal("AAAA for a known name should be an empty NOERROR")
	}
}

func TestOtherNamesAreForwarded(t *testing.T) {
	upstream, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer upstream.Close()
	go func() {
		buf := make([]byte, 512)
		n, from, err := upstream.ReadFrom(buf)
		if err == nil {
			_, _ = upstream.WriteTo(append([]byte("ok:"), buf[:n]...), from)
		}
	}()

	s := &Server{upstream: upstream.LocalAddr().String()}
	resp := s.Answer(query("example.com", typeA))
	if string(resp[:3]) != "ok:" {
		t.Fatalf("not forwarded: %q", resp)
	}
}

// A name served on two servers resolves to the replicas of both.
func TestInternalNamesIncludePeerReplicas(t *testing.T) {
	peer := &Server{}
	peer.Set(map[string][]string{"db.internal": {"10.210.2.5"}})
	conn, err := net.ListenPacket("udp", "127.0.0.2:53")
	if err != nil {
		t.Skip("cannot bind 127.0.0.2:53:", err)
	}
	defer conn.Close()
	go func() {
		buf := make([]byte, 512)
		for {
			n, from, err := conn.ReadFrom(buf)
			if err != nil {
				return
			}
			_, _ = conn.WriteTo(peer.answer(buf[:n], true), from)
		}
	}()

	local := &Server{Peers: func() []string { return []string{"127.0.0.2", "127.0.0.3"} }}
	local.Set(map[string][]string{"db.internal": {"10.210.1.7"}})

	resp := local.Answer(query("db.internal", typeA))
	if got := aRecords(resp); len(got) != 2 || !got[0].Equal(net.ParseIP("10.210.1.7")) || !got[1].Equal(net.ParseIP("10.210.2.5")) {
		t.Fatalf("answers = %v", got)
	}
	// Peers never forward or fan out.
	if peer.answer(query("example.com", typeA), true) != nil {
		t.Fatal("a local-only listener forwarded a query")
	}
}
