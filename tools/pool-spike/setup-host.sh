#!/usr/bin/env bash
# Spike of the pool profile (PLAN §26.3, Phase 16a): prepares a pool machine
# (Ubuntu 22.04/24.04) for partitions: Docker, Sysbox, an XFS volume with
# project quotas for partition data, and the partition image.
#   setup-host.sh [pool-size, default 30G]
# On a real machine the XFS volume would be a dedicated disk; the spike uses a
# loop file so it also runs in a test container.
set -euo pipefail
SIZE=${1:-30G}
HERE=$(cd "$(dirname "$0")" && pwd)
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -qq docker.io jq fuse3 xfsprogs nftables rsync wget iproute2 kmod >/dev/null
systemctl enable --now docker >/dev/null 2>&1

if ! command -v sysbox-runc >/dev/null; then
  V=$(curl -fsSL https://api.github.com/repos/nestybox/sysbox/releases/latest | jq -r .tag_name)
  wget -q -O /tmp/sysbox.deb "https://downloads.nestybox.com/sysbox/releases/$V/sysbox-ce_${V#v}-0.linux_amd64.deb"
  apt-get install -y -qq /tmp/sysbox.deb >/dev/null 2>&1 || true
fi
systemctl reset-failed || true
systemctl start sysbox
systemctl is-active sysbox-mgr sysbox-fs >/dev/null

if ! mountpoint -q /srv/pool; then
  [ -f /var/lib/pool.img ] || { truncate -s "$SIZE" /var/lib/pool.img; mkfs.xfs -q -f /var/lib/pool.img; }
  mkdir -p /srv/pool
  mount -o loop,prjquota /var/lib/pool.img /srv/pool
fi

docker build -q -t huruf-partition "$HERE/partition" >/dev/null
echo "pool host ready: sysbox $(sysbox-runc --version 2>/dev/null | awk '/^version/{print $2}'), $(df -h --output=size /srv/pool | tail -1 | tr -d ' ') XFS with project quotas"
