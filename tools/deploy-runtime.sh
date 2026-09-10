#!/usr/bin/env bash
set -euo pipefail
NODE_VERSION=v22.20.0
ROOT=/opt/artifact-threefold
sudo install -d -m 755 "$ROOT/releases" /var/lib/artifact-threefold
if ! id artifact >/dev/null 2>&1; then sudo useradd --system --home-dir /var/lib/artifact-threefold --shell /usr/sbin/nologin artifact; fi
sudo chown artifact:artifact /var/lib/artifact-threefold
if [ ! -x "$ROOT/$NODE_VERSION/bin/node" ]; then
  cd /tmp
  curl --fail --location --retry 3 --connect-timeout 20 --max-time 180 -o "node-$NODE_VERSION-linux-x64.tar.xz" "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz"
  curl --fail --location --retry 3 --connect-timeout 20 --max-time 60 -o artifact-node-checksums.txt "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt"
  awk -v filename="node-$NODE_VERSION-linux-x64.tar.xz" '$2 == filename {print}' artifact-node-checksums.txt | sha256sum --check -
  sudo install -d "$ROOT/$NODE_VERSION"
  sudo tar -xJf "node-$NODE_VERSION-linux-x64.tar.xz" -C "$ROOT/$NODE_VERSION" --strip-components=1
fi
"$ROOT/$NODE_VERSION/bin/node" --version
sudo ln -sfn "$ROOT/$NODE_VERSION" "$ROOT/runtime"
printf 'RUNTIME_READY\n'
