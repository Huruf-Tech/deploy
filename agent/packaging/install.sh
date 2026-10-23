#!/bin/sh
# Installs the Huruf Deploy agent (Ubuntu 22.04/24.04, amd64/arm64).
#
#   curl -fsSL <control-plane>/agents/api/install.sh | sudo sh -s -- --url <control-plane-url> --tenant <tenant-id>
#
# Downloads the agent binary, verifies its SHA-256 against the published
# checksums, installs a systemd unit, and prints the pairing code to enter in
# the dashboard. The SSH wizard runs this same script with a one-time
# --join-token, which activates the server without pairing. Safe to re-run.
set -eu

REPO="Huruf-Tech/huruf-deploy"
VERSION="latest"
URL=""
TENANT=""
JOIN_TOKEN=""
DOWNLOAD_BASE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --tenant) TENANT="$2"; shift 2 ;;
    --version) VERSION="$2"; shift 2 ;;
    --join-token) JOIN_TOKEN="$2"; shift 2 ;;
    --download-base) DOWNLOAD_BASE="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -n "$URL" ] && [ -n "$TENANT" ] || { echo "usage: install.sh --url URL --tenant TENANT [--version X.Y.Z] [--download-base URL] [--join-token TOKEN]" >&2; exit 2; }
[ "$(id -u)" -eq 0 ] || { echo "run as root (sudo)" >&2; exit 1; }

case "$(uname -m)" in
  x86_64) ARCH=amd64 ;;
  aarch64 | arm64) ARCH=arm64 ;;
  *) echo "unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

if [ -n "$DOWNLOAD_BASE" ]; then
  BASE="$DOWNLOAD_BASE"
elif [ "$VERSION" = "latest" ]; then
  BASE="https://github.com/$REPO/releases/latest/download"
else
  BASE="https://github.com/$REPO/releases/download/agent-v$VERSION"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading the agent ($ARCH) from $BASE"
BINARY="huruf-deploy-agent-linux-$ARCH"
curl -fsSL "$BASE/$BINARY" -o "$TMP/$BINARY"
curl -fsSL "$BASE/SHA256SUMS" -o "$TMP/SHA256SUMS"
(cd "$TMP" && grep " $BINARY\$" SHA256SUMS | sha256sum -c -) || { echo "checksum mismatch: refusing to install" >&2; exit 1; }

install -m 0755 "$TMP/$BINARY" /usr/local/bin/huruf-deploy-agent

install -d -m 0700 /etc/huruf-deploy-agent
# The ledger of host changes, which uninstall undoes. Only a fresh install
# starts it: an older install's earlier changes weren't recorded.
if [ ! -d /var/lib/huruf-deploy-agent ]; then
  install -d -m 0700 /var/lib/huruf-deploy-agent
  printf '{"kind":"installed","at":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > /var/lib/huruf-deploy-agent/ledger.jsonl
  chmod 0600 /var/lib/huruf-deploy-agent/ledger.jsonl
fi
umask 077
cat > /etc/huruf-deploy-agent/agent.env <<EOF
HURUF_DEPLOY_URL=$URL
HURUF_DEPLOY_TENANT=$TENANT
HURUF_DEPLOY_JOIN_TOKEN=$JOIN_TOKEN
EOF

# The unit ships inside this script, so the installer never depends on a repository branch.
cat > /etc/systemd/system/huruf-deploy-agent.service <<'EOF'
[Unit]
Description=Huruf Deploy agent
Documentation=https://github.com/Huruf-Tech/huruf-deploy
After=network-online.target docker.service
Wants=network-online.target

[Service]
EnvironmentFile=/etc/huruf-deploy-agent/agent.env
ExecStart=/usr/local/bin/huruf-deploy-agent -state-dir /var/lib/huruf-deploy-agent
Restart=always
RestartSec=5
StateDirectory=huruf-deploy-agent
StateDirectoryMode=0700

[Install]
WantedBy=multi-user.target
EOF
chmod 0644 /etc/systemd/system/huruf-deploy-agent.service
systemctl daemon-reload
systemctl enable huruf-deploy-agent
# Restart rather than start, so a re-run picks up a new binary or settings.
systemctl restart huruf-deploy-agent

if [ -n "$JOIN_TOKEN" ]; then
  echo "Agent installed; it activates itself with the join token."
  exit 0
fi

echo "Agent installed. Waiting for the pairing code..."
for _ in 1 2 3 4 5 6 7 8 9 10; do
  CODE="$(journalctl -u huruf-deploy-agent -n 50 --no-pager -o cat 2>/dev/null | grep -o 'pairingCode=[A-Z2-7]*' | tail -1 | cut -d= -f2)"
  [ -n "$CODE" ] && break
  sleep 1
done

if [ -n "${CODE:-}" ]; then
  echo "Pairing code: $CODE  (accept the server in the dashboard with this code)"
else
  echo "Check the pairing code with: journalctl -u huruf-deploy-agent -n 20"
fi
