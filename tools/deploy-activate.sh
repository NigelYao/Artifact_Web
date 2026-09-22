#!/usr/bin/env bash
set -euo pipefail
RELEASE=${1:?release name required}
case "$RELEASE" in *[!a-zA-Z0-9_-]*|'') exit 2;; esac
ROOT=/opt/artifact-threefold
ARCHIVE="/tmp/artifact-$RELEASE.tar.gz"
DEST="$ROOT/releases/$RELEASE"
if [ -e "$DEST" ]; then printf 'Release already exists: %s\n' "$DEST"; exit 2; fi
sudo install -d -o ubuntu -g ubuntu "$DEST"
ASSETS="$ROOT/artifact-assets-20260922.tar.gz"
[ -f "$ASSETS" ] || ASSETS=/tmp/artifact-assets-20260909.tar.gz
tar -xzf "$ASSETS" -C "$DEST"
tar -xzf "$ARCHIVE" -C "$DEST"
export PATH="$ROOT/runtime/bin:$PATH"
cd "$DEST"
npm ci --omit=dev --no-audit --no-fund
node server/match.test.cjs
node server/admin.test.cjs
node server/deck-share.test.cjs
node tests/deck-library.test.cjs
node server/matchmaking.test.cjs
node tests/matchmaking-http.test.cjs
node tests/matchmaking-ui.test.cjs
node tests/responsive-board.test.cjs
node tests/touch-cards.test.cjs
node tests/hand-drag-targets.test.cjs
node tests/placement-rules.test.cjs
node tests/battle-regressions.cjs
node tests/dota-expansion.test.cjs
node tests/engine.test.cjs
node tests/hero-skills.test.cjs
node tests/hero-skills-ui.test.cjs
sudo chown -R root:root "$DEST"
PREVIOUS=$(readlink "$ROOT/current" || true)
sudo ln -sfn "$DEST" "$ROOT/current-next"
sudo mv -Tf "$ROOT/current-next" "$ROOT/current"
sudo tee /etc/systemd/system/artifact-threefold.service >/dev/null <<'UNIT'
[Unit]
Description=Artifact Threefold game and multiplayer rooms
After=network.target

[Service]
Type=simple
User=artifact
Group=artifact
WorkingDirectory=/opt/artifact-threefold/current
ExecStart=/opt/artifact-threefold/runtime/bin/node /opt/artifact-threefold/current/server/index.cjs
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=80
Environment=ARTIFACT_DB=/var/lib/artifact-threefold/online.sqlite
Environment=ARTIFACT_ADMIN_TOKEN_FILE=/var/lib/artifact-threefold/admin-token
Restart=on-failure
RestartSec=3
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/artifact-threefold
UMask=0077
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable artifact-threefold.service
sudo systemctl restart artifact-threefold.service
for attempt in $(seq 1 20); do
  if curl --fail --silent http://127.0.0.1/health; then printf '\nDEPLOY_READY %s\n' "$RELEASE"; exit 0; fi
  sleep 1
done
sudo journalctl -u artifact-threefold.service -n 30 --no-pager
if [ -n "$PREVIOUS" ]; then
  sudo ln -sfn "$PREVIOUS" "$ROOT/current"
  sudo systemctl restart artifact-threefold.service
  printf 'ROLLED_BACK %s\n' "$PREVIOUS"
fi
exit 1
