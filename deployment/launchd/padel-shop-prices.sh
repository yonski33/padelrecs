#!/bin/zsh
# Daily PadelRecs shop prices (owner 2026-11-26: daily, plain script, no AI). Run by launchd
# (com.padelrecs.shop-prices.plist), never by a Claude task. It works in its own checkout of main
# (PADELRECS_JOBS_DIR, default ~/padelrecs-jobs) so it never touches a checkout someone is working in.
# One-time setup: deployment/launchd/README.md.
set -euo pipefail
DIR="${PADELRECS_JOBS_DIR:-$HOME/padelrecs-jobs}"
cd "$DIR"
git fetch -q origin main
git checkout -q --detach origin/main
# Reinstall packages only when the lockfile changed since the last run.
LOCK=$(shasum package-lock.json | cut -d' ' -f1)
if [[ ! -d node_modules || "$(cat .lock-hash 2>/dev/null)" != "$LOCK" ]]; then npm ci --silent --no-audit --no-fund && echo "$LOCK" > .lock-hash; fi
NICHE=padel npx tsx --env-file=.env.local scripts/padel-shop-prices.mts --apply
