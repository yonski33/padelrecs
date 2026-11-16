#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (vercel.json ignoreCommand, which Vercel caps at 256 characters, so the logic lives here).
# Exit 1 = build, exit 0 = skip. Owner 2026-11-15: on merges, build only the active sites; frozen sites keep their live deploy;
# preview builds run on padelrecs only. SkinRecs back on 2026-11-15 (match engine, owner: "lets start skinrecs already").
if [ -z "$NICHE" ]; then exit 1; fi
# TEMP (PR #385, PM OK 2026-11-16, ~$0.02 a build): the disc golf preview for its own branch only. Remove before merging.
if [ "$VERCEL_ENV" = "preview" ] && [ "$NICHE" = "discgolf" ] && [ "$VERCEL_GIT_COMMIT_REF" = "discgolf-v2" ]; then exit 1; fi
if [ "$VERCEL_ENV" = "preview" ] && [ "$NICHE" != "padel" ]; then echo "Preview builds run on padelrecs only; skipping $NICHE."; exit 0; fi
case " padel pickleball tennis simracing discgolf skin " in *" $NICHE "*) exit 1;; esac
echo "Frozen site: skipping $NICHE (active sites only, owner 2026-11-15)."
exit 0
