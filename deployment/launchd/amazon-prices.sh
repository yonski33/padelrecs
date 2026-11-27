#!/bin/zsh
# Amazon prices twice a day for SkinRecs, DiscGolfRecs and PickleballRecs (owner 2026-11-27: "Yes, set it up"). Pages show a
# saved Amazon price only while it is under 24 hours old (Amazon's rule), so two runs a day keep it on the page; if this job
# stops, the prices drop off by themselves and pages show a plain Amazon link. Current price only, no history. No AI.
# Run by launchd (com.padelrecs.amazon-prices.plist), never by a Claude task, in its own checkout of main
# (PADELRECS_JOBS_DIR, default ~/padelrecs-jobs), shared with the shop-price job, which runs at 06:00 (this one at :30).
# --saved-only: only products with a saved ASIN are priced; new ASINs come in through a reviewed run, never here.
# Pacing (1.2 s a call) and the 429 backoff live in scripts/amazon-prices.mts. One-time setup: deployment/launchd/README.md.
set -euo pipefail
DIR="${PADELRECS_JOBS_DIR:-$HOME/padelrecs-jobs}"
cd "$DIR"
git fetch -q origin main
git checkout -q --detach origin/main
LOCK=$(shasum package-lock.json | cut -d' ' -f1)
if [[ ! -d node_modules || "$(cat .lock-hash 2>/dev/null)" != "$LOCK" ]]; then npm ci --silent --no-audit --no-fund && echo "$LOCK" > .lock-hash; fi
echo "== $(date -u +%FT%TZ) Amazon prices"
for site in skin discgolf pickleball; do
  NICHE=$site npx tsx --env-file=.env.local scripts/amazon-prices.mts --apply --saved-only | tail -1 || echo "$site Amazon prices failed"
done
