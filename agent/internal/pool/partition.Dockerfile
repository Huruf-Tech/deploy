# A partition (PLAN §27): a Sysbox system container that
# looks like a small Ubuntu 24.04 machine, with systemd and its own Docker, so
# our agent installs and runs in it exactly as on a server.
FROM ubuntu:24.04

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    systemd systemd-sysv docker.io docker-buildx wireguard-tools curl ca-certificates iproute2 kmod \
  && rm -rf /var/lib/apt/lists/* \
  && systemctl enable docker \
  && systemctl mask systemd-resolved.service getty@tty1.service \
    sys-kernel-config.mount sys-kernel-debug.mount sys-kernel-tracing.mount

# Its Docker stays out of 172.16.0.0/12, where its default would swallow
# replies to peers there: other machines' Docker networks, AWS's default VPC
# (spike 17a). Clear of the private network's 10.209/10.210 too.
RUN mkdir -p /etc/docker && printf '%s\n' '{' \
    '  "bip": "10.212.0.1/24",' \
    '  "default-address-pools": [{ "base": "10.213.0.0/16", "size": 24 }]' \
    '}' > /etc/docker/daemon.json

STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init", "--log-level=err"]
