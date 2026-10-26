#!/usr/bin/env bash
# Spike of the PartitionDriver (PLAN §26.3, Phase 16a), run on a pool machine:
#   partition.sh create <name> <cpus|0=uncapped> <memMb> <diskGb> [weight]
#   partition.sh resize <name> <cpus|0> <memMb> <diskGb>
#   partition.sh stop|start|remove|usage <name>
# A partition is a Sysbox system container (`huruf-partition` image) on its
# own network. Its Docker data lives on the XFS pool volume under an XFS
# project quota, so disk limits can change while it runs.
set -euo pipefail

POOL=/srv/pool            # XFS mounted with prjquota
NET_PREFIX=huruf-p        # one bridge network per partition
ROOT_GB=3                 # the partition's own system files (apt, logs, /tmp)

cmd=${1:?command}; name=${2:?name}
dir="$POOL/$name"
ctr="partition-$name"

project_id() { # stable XFS project id from the name
  echo $(( 0x$(printf '%s' "$name" | sha256sum | cut -c1-6) + 1000 ))
}

set_quota() { # <diskGb>
  # The partition's size minus its system files: Docker, containerd, agent.
  xfs_quota -x -c "limit -p bhard=$(( $1 - ROOT_GB ))g $(project_id)" "$POOL"
}

cpu_args() { # <cpus> [weight]
  local cpus=$1 weight=${2:-}
  if [ "$cpus" != 0 ]; then echo "--cpus=$cpus"; else echo "--cpus=0"; fi
  # Docker's cpu-shares maps to cgroup v2 cpu.weight (1024 shares = weight 100).
  if [ -n "$weight" ]; then echo "--cpu-shares=$weight"; fi
}

case "$cmd" in
  create)
    cpus=${3:?cpus}; mem=${4:?memMb}; disk=${5:?diskGb}; weight=${6:-1024}
    mkdir -p "$dir/docker" "$dir/containerd" "$dir/agent"
    xfs_quota -x -c "project -s -p $dir $(project_id)" "$POOL" >/dev/null
    set_quota "$disk"
    docker network create --driver bridge \
      --opt com.docker.network.bridge.name="${NET_PREFIX}-${name:0:8}" \
      "${NET_PREFIX}-$name" >/dev/null
    # shellcheck disable=SC2046
    docker run -d --runtime=sysbox-runc --name "$ctr" --hostname "$name" \
      --network "${NET_PREFIX}-$name" \
      $(cpu_args "$cpus" "$weight") \
      --memory="${mem}m" --memory-swap="${mem}m" --pids-limit=4096 \
      --storage-opt size=${ROOT_GB}G \
      -v "$dir/docker:/var/lib/docker" \
      -v "$dir/containerd:/var/lib/containerd" \
      -v "$dir/agent:/var/lib/huruf-deploy-agent" \
      --add-host=host.docker.internal:"$(getent ahostsv4 host.docker.internal | awk 'NR==1{print $1}')" \
      --label huruf.partition="$name" \
      huruf-partition >/dev/null
    echo "created $ctr"
    ;;
  resize)
    cpus=${3:?cpus}; mem=${4:?memMb}; disk=${5:?diskGb}
    used=$(docker stats --no-stream --format '{{.MemUsage}}' "$ctr" | awk '{print $1}')
    echo "memory in use: $used"
    # shellcheck disable=SC2046
    docker update $(cpu_args "$cpus") --memory="${mem}m" --memory-swap="${mem}m" "$ctr" >/dev/null
    set_quota "$disk"
    echo "resized $ctr to cpus=$cpus mem=${mem}m disk=${disk}g"
    ;;
  stop) docker stop -t 30 "$ctr" >/dev/null && echo "stopped $ctr" ;;
  start) docker start "$ctr" >/dev/null && echo "started $ctr" ;;
  remove)
    docker rm -f "$ctr" >/dev/null || true
    docker network rm "${NET_PREFIX}-$name" >/dev/null || true
    xfs_quota -x -c "limit -p bhard=0 $(project_id)" "$POOL"
    rm -rf "$dir"
    echo "removed $ctr"
    ;;
  usage)
    docker stats --no-stream --format '{{.Name}} cpu={{.CPUPerc}} mem={{.MemUsage}} net={{.NetIO}}' "$ctr"
    xfs_quota -x -c "report -p -h" "$POOL" | awk -v id="#$(project_id)" '$1==id'
    ;;
  *) echo "unknown command $cmd" >&2; exit 2 ;;
esac
