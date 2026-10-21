# A disposable "VM" for developing the SSH wizard and agent (PLAN §21.3):
# Ubuntu 24.04 with real systemd and sshd, and a sudo user `deploy` / `deploy`.
# Started by `deno task dev:vm`; SSH on localhost:2223.
FROM ubuntu:24.04

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    systemd systemd-sysv openssh-server sudo curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && useradd -m -s /bin/bash -G sudo deploy \
  && echo 'deploy:deploy' | chpasswd \
  && systemctl enable ssh

STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
