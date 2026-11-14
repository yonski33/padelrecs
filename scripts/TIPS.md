# Player tips: how they are made (owner 2026-11-15, TIPS-PLAN.md phase 1)

Each stored report can carry 0–3 small practical tips ("ask the shop to weigh a few, pick one under 370 g"). They are saved
on the review in the database (`reviews.tips` / `external_reviews.tips`, jsonb, migration 0019) as `{kind, text, quote}`:
`kind` is buying | setup | conditions | adapting | care, `text` our one-sentence paraphrase (18 words or fewer), and `quote`
an exact substring of the stored review text, summary, excerpt or translation. `null` means not read yet; `[]` means read,
no tips (the normal case). lib/tips.ts holds the rules the save checks. Nothing on the pages shows tips yet: phase 2 groups
them per product (2+ distinct sources, auto-approved) into a product_tips table.

## Steps for one site (the first run and the daily top-up are the same)

1. Export what needs reading — reviews never read, or with a saved quote that is no longer in the text:
   `NICHE=<id> npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-tip-input.mts <dir>`
2. Sonnet readers, one or two batches (120 reports) each, follow scripts/tip-rules.md: read `<dir>/in/bNNN.json`, write
   `<dir>/out/bNNN.json`. Choose by reading, not by script; a script may only check exact substrings and ids.
   Expect most reports to come back `[]`.
3. Merge the outputs into one file and dry-run the save (it re-checks every tip against the live text):
   `NICHE=<id> … scripts/save-tips.mts <merged.json>`. Dropped tips are listed with a reason and written to
   `<merged>.dropped.json`; a review whose tips were all dropped stays unsaved, so step 1 exports it again. Fix or
   re-run those if worthwhile, then add `--write`.
4. Spot-check ~30 random saved tips against their reports: each is real advice (not a complaint), says what the quote
   says, and nothing is invented.

Daily top-up: after highlights, run steps 1–3 for the site; only new or edited reports come out of step 1 (usually a
handful), so one reader is enough. Then re-group the products that got a new tip (phase 2).
When Reddit reports are removed site-wide, re-run the phase-2 grouping so tips that fall below 2 sources disappear.
