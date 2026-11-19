#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (vercel.json ignoreCommand, which Vercel caps at 256 characters, so the logic lives here).
# Exit 1 = build, exit 0 = skip. Owner 2026-11-15: on merges, build only the active sites; frozen sites keep their live deploy.
# SkinRecs back on 2026-11-15 (match engine, owner: "lets start skinrecs already").
# CoffeeRecs back on 2026-11-18 (match engine and v11c pages, owner OK via the PM).
# CoffeeRecs back on 2026-11-18 (match engine and v11c pages, owner OK via the PM).
# StackRecs (owner 2026-11-19): previews on request only ([preview stackrecs]); off the merge builds until launch.
# Previews (owner 2026-11-16, Vercel cost): only on request, padel included: a branch named preview/… or a commit message
# with [preview] builds PadelRecs' preview, "[preview tennis skin]" those kept sites' too; every other push to a pull request
# builds nothing.
if [ -z "$NICHE" ]; then exit 1; fi
if [ "$VERCEL_ENV" = "preview" ]; then
  case "$VERCEL_GIT_COMMIT_REF" in preview/*) asked=1;; esac
  case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[preview]"*) asked=1;; esac
  # Other kept sites on request too: "[preview tennis simracing]" builds those sites' previews (and padel's).
  extra=$(printf '%s' "$VERCEL_GIT_COMMIT_MESSAGE" | sed -n 's/.*\[preview \([a-z ]*\)\].*/\1/p')
  case " $extra " in *" $NICHE "*) case " padel pickleball tennis simracing discgolf skin coffee stackrecs " in *" $NICHE "*) asked=1; named=1;; esac;; esac
  if [ -z "$asked" ]; then echo "Preview not requested (branch preview/… or [preview] in the commit message); skipping $NICHE."; exit 0; fi
  if [ "$NICHE" != "padel" ] && [ -z "$named" ]; then echo "Preview builds run on padelrecs only unless named ([preview $NICHE]); skipping $NICHE."; exit 0; fi
  exit 1
fi
case " padel pickleball tennis simracing discgolf skin coffee " in *" $NICHE "*) exit 1;; esac
echo "Frozen site: skipping $NICHE (active sites only, owner 2026-11-15)."
exit 0
