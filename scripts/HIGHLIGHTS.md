# Review highlights: how they are made (owner 2026-11-14)

Each review card can show 1–2 yellow marker phrases. They are saved on the review in the database
(`reviews.highlights` / `external_reviews.highlights`, text[], migration 0017) and drawn by lib/highlights.ts. A phrase that
no longer matches the card's text is simply not drawn, so an edited review loses its highlight rather than showing a wrong one.
The Highlights switch shows on any product page whose reviews have saved phrases.

## Steps for one site (the rollout and the daily top-up are the same)

1. Export what needs doing — reviews with no phrases, or phrases that no longer match:
   `NICHE=<id> npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-highlight-input.mts <dir>`
2. Sonnet readers, about 7 batches (840 reviews) each, follow scripts/highlight-rules.md: read `<dir>/in/bNNN.json`,
   write `<dir>/out/bNNN.json`. Choose by reading, not by script; a script may only check exact substrings and ids.
3. Merge the outputs into one file and dry-run the save (it re-checks every phrase against the live text):
   `NICHE=<id> … scripts/save-highlights.mts <merged.json>`; fix or re-run anything skipped, then add `--write`.
4. Spot-check ~20 random reviews (context not highlighted; mixed reviews show both sides when the text has both).

Daily top-up: after a sweep publishes, run steps 1–3 for that site; only the new or edited reviews come out of step 1
(usually a handful), so one reader is enough. No merge or deploy is needed: pages pick the phrases up within a minute.
