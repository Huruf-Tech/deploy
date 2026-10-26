#!/usr/bin/env bash
# Spike of a pool machine's partition network rules (PLAN §26.3, Phase 16a):
#   network.sh apply              base rules for every partition bridge
#   network.sh add|del <name>     a partition's traffic counters
#   network.sh read <name>        bytes out/in since the counters were created
# Partition bridges are named `huruf-p-<name>` (see partition.sh). Our table
# runs before Docker's own rules; a drop here is final.
set -euo pipefail
T="inet huruf_pool"
cmd=${1:?command}

bridge() { echo "huruf-p-${1:0:8}"; }

case "$cmd" in
  apply)
    nft -f - <<'EOF'
table inet huruf_pool
delete table inet huruf_pool
table inet huruf_pool {
  chain forward {
    type filter hook forward priority -10; policy accept;
    # Partitions never reach each other.
    iifname "huruf-p-*" oifname "huruf-p-*" drop
    # Nor the cloud's metadata endpoint (the machine's credentials) or SMTP.
    iifname "huruf-p-*" ip daddr 169.254.169.254 drop
    iifname "huruf-p-*" tcp dport { 25, 465, 587 } drop
    # Nor the machine's private network (other hosts in the VPC).
    iifname "huruf-p-*" ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } ct state new drop
  }
  chain input {
    type filter hook input priority -10; policy accept;
    # Nothing on the machine itself is reachable from a partition.
    iifname "huruf-p-*" ct state established,related accept
    iifname "huruf-p-*" drop
  }
}
EOF
    # The control plane may sit on a private address (same VPC, or the spike's
    # Docker Desktop host): ALLOW_IPS="a.b.c.d ..." lets partitions reach it.
    for ip in ${ALLOW_IPS:-}; do
      nft insert rule $T forward iifname "huruf-p-*" ip daddr "$ip" accept
    done
    echo "pool rules applied"
    ;;
  add)
    n=${2:?name}; b=$(bridge "$n")
    nft add counter $T "out_$n" 2>/dev/null || true
    nft add counter $T "in_$n" 2>/dev/null || true
    nft add chain $T count "{ type filter hook forward priority -20; policy accept; }" 2>/dev/null || true
    nft add rule $T count iifname "$b" oifname != "huruf-p-*" counter name "out_$n"
    nft add rule $T count oifname "$b" iifname != "huruf-p-*" counter name "in_$n"
    ;;
  del)
    n=${2:?name}
    for h in $(nft -a list chain $T count | awk -v n="_$n\"" '$0 ~ n {print $NF}'); do
      nft delete rule $T count handle "$h"
    done
    nft delete counter $T "out_$n" 2>/dev/null || true
    nft delete counter $T "in_$n" 2>/dev/null || true
    ;;
  read)
    n=${2:?name}
    for dir in out in; do
      printf '%s=%s ' "$dir" "$(nft list counter $T "${dir}_$n" | awk '/bytes/{for(i=1;i<=NF;i++) if($i=="bytes") print $(i+1)}')"
    done
    echo
    ;;
  *) echo "unknown command $cmd" >&2; exit 2 ;;
esac
