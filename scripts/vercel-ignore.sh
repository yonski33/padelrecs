#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (vercel.json ignoreCommand, which Vercel caps at 256 characters, so the logic lives here).
# Exit 1 = build, exit 0 = skip. Owner 2026-11-15: on merges, build only the active sites; frozen sites keep their live deploy.
# SkinRecs back on 2026-11-15 (match engine, owner: "lets start skinrecs already").
# CoffeeRecs back on 2026-11-18 (match engine and v11c pages, owner OK via the PM).
# CoffeeRecs back on 2026-11-18 (match engine and v11c pages, owner OK via the PM).
# StackRecs (owner 2026-11-19): previews on request ([preview stackrecs]); on the merge builds since launch (owner OK 2026-11-20).
# AudioRecs (owner design handoff 2026-11-21, its Thread switch): previews and merge builds again. Its Vercel project needs
# Git reconnected first (it was disconnected with the frozen sites on 2026-11-16).
# LaptopRecs (owner 2026-11-24, onto the PickleballRecs template, #683): previews and merge builds again. Its Vercel project
# needs Git reconnected first, as AudioRecs' did.
# Previews (owner 2026-11-16, Vercel cost): only on request, padel included: a branch named preview/… or a commit message
# with [preview] builds PadelRecs' preview, "[preview tennis skin]" those kept sites' too; every other push to a pull request
# builds nothing.
if [ -z "$NICHE" ]; then exit 1; fi
if [ "$VERCEL_ENV" = "preview" ]; then
  case "$VERCEL_GIT_COMMIT_REF" in preview/*) asked=1;; esac
  case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[preview]"*) asked=1;; esac
  # Other kept sites on request too: "[preview tennis simracing]" builds those sites' previews (and padel's).
  extra=$(printf '%s' "$VERCEL_GIT_COMMIT_MESSAGE" | sed -n 's/.*\[preview \([a-z ]*\)\].*/\1/p')
  case " $extra " in *" $NICHE "*) case " padel pickleball tennis simracing discgolf skin coffee stackrecs audio laptop " in *" $NICHE "*) asked=1; named=1;; esac;; esac
  if [ -z "$asked" ]; then echo "Preview not requested (branch preview/… or [preview] in the commit message); skipping $NICHE."; exit 0; fi
  if [ "$NICHE" != "padel" ] && [ -z "$named" ]; then echo "Preview builds run on padelrecs only unless named ([preview $NICHE]); skipping $NICHE."; exit 0; fi
  exit 1
fi
case " padel pickleball tennis simracing discgolf skin coffee stackrecs audio laptop " in *" $NICHE "*) ;; *)
  echo "Frozen site: skipping $NICHE (active sites only, owner 2026-11-15)."; exit 0;; esac

# Production merges (owner 2026-11-23, Vercel cost: ~50 merges a day x 9 sites): build only the sites a merge can change.
# A skipped site still gets the change on its next build (Vercel diffs from its last good deploy), so a wrong skip only
# delays. Any doubt = build.
# 1) "[site pickleball]" or "[site padel audio]" in the merge commit title: only those sites build.
# Tag every site a merge changes: shared code (the creator product page, app/thread/creator-page.tsx) changes all the
# CREATOR_PAGE sites, so a lone [site pickleball] there leaves the others on the old page until their next build
# (#723 and #724, 2026-11-26: laptoprecs and discgolfrecs needed a [site laptop discgolf] merge to catch up).
# The title line only: a squash merge repeats the tag in its body ("* [site discgolf] ..."), and several matches joined by
# newlines never matched " $NICHE " below, so #695's merge skipped discgolfrecs (2026-11-24).
sites=$(printf '%s' "$VERCEL_GIT_COMMIT_MESSAGE" | head -n 1 | sed -n 's/.*\[site \([a-z ]*\)\].*/\1/p')
if [ -n "$sites" ]; then
  case " $sites " in *" $NICHE "*) echo "Tagged [site $sites]: building $NICHE."; exit 1;; esac
  echo "Tagged [site $sites]: skipping $NICHE."; exit 0
fi
# 2) Changed files since this site's last deploy: docs, tests and scripts never change a site; a path naming one other
#    site (db/creators/pickleball.json, public/creator-covers/pickleball/…) only changes that site.
prev="$VERCEL_GIT_PREVIOUS_SHA"; cur="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
if [ -z "$prev" ]; then exit 1; fi
git cat-file -e "$prev^{commit}" 2>/dev/null || git fetch -q --deepen=300 2>/dev/null || true
files=$(git diff --name-only "$prev" "$cur" 2>/dev/null) || exit 1
if [ -z "$files" ]; then exit 1; fi
tok() { # print the active site a path belongs to, "many" for two or more, nothing for shared
  hit=""
  for n in padel pickleball tennis simracing discgolf skin coffee stackrecs audio laptop; do
    case "$n" in simracing) re='simracing|sim';; skin) re='skin|skinrecs';; *) re="$n|${n}recs";; esac
    if printf '%s' "$1" | grep -Eq "(^|[/._-])($re)([/._-]|$)"; then [ -n "$hit" ] && { echo many; return; }; hit=$n; fi
  done
  echo "$hit"
}
while IFS= read -r f; do
  case "$f" in *.md|tests/*|scripts/*|docs/*|.github/*) continue;; esac
  owner=$(tok "$f")
  if [ -z "$owner" ] || [ "$owner" = many ] || [ "$owner" = "$NICHE" ]; then echo "Building $NICHE: $f"; exit 1; fi
done <<< "$files"
echo "No change for $NICHE since its last deploy (only other sites' files, docs, tests or scripts); skipping."
exit 0
