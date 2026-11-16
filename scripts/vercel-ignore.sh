#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (vercel.json ignoreCommand, which Vercel caps at 256 characters, so the logic lives here).
# Exit 1 = build, exit 0 = skip. Owner 2026-11-15: on merges, build only the active sites; frozen sites keep their live deploy.
# SkinRecs back on 2026-11-15 (match engine, owner: "lets start skinrecs already").
# Previews (owner 2026-11-16, Vercel cost): only on request, padel included: a branch named preview/… or a commit message
# with [preview] builds PadelRecs' preview; every other push to a pull request builds nothing.
if [ -z "$NICHE" ]; then exit 1; fi
if [ "$VERCEL_ENV" = "preview" ]; then
  case "$VERCEL_GIT_COMMIT_REF" in preview/*) asked=1;; esac
  case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[preview]"*) asked=1;; esac
  if [ -z "$asked" ]; then echo "Preview not requested (branch preview/… or [preview] in the commit message); skipping $NICHE."; exit 0; fi
  if [ "$NICHE" != "padel" ]; then echo "Preview builds run on padelrecs only; skipping $NICHE."; exit 0; fi
  exit 1
fi
case " padel pickleball tennis simracing discgolf skin " in *" $NICHE "*) exit 1;; esac
echo "Frozen site: skipping $NICHE (active sites only, owner 2026-11-15)."
exit 0
