# A partition of a pool machine (PLAN §26.3): a Sysbox system container that
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

STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init", "--log-level=err"]
