# Quick-take pages: how a block is written (owner 2026-11-15)

A quick take is the editorial "what players said" page for a product: *We read the web so you don't have to.* The spec is
site-jobs/QUICK-TAKE-RECIPE.md (sections, voice, accuracy rules, module triggers). This file is the working part: the JSON a
writer produces, and the checks it must pass. The block is stored in `rackets.quick_take` (migration 0020), drawn by
app/rackets/[slug]/quick-take.tsx, and products without one keep the normal page.

## Steps

1. Export: `NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-quicktake-input.mts <dir>/in <slug>…`
   (or `--top 10`). One file per product: the product, its counts, every stored report, the catalog's slugs.
2. A Sonnet writer reads **every** report in `<dir>/in/<slug>.json` and writes `<dir>/out/<slug>.json` (format below).
   Count first, then write: the counts decide the words.
3. Dry run: `… scripts/save-quicktake.mts <dir>/out` (re-reads the live reports and checks everything). Fix every error.
4. Save: the same with `--write`. Pages pick it up within a couple of minutes (the catalog cache). `--clear <slug>` removes one.

## The report file

Each report has `id`, `kind` (web, or own = posted on this site), `platform`, `sourceName`, `url`, `date`, `sentiment`,
`tags`, `summary` and `words`.
- `summary` is **our** paraphrase (or translation). Read it, never quote it.
- `words` is the player's exact text (a web excerpt or an own review). Only `words` may go inside quote marks.
- Cite reports by `id`. A claim's `reports` list holds every report that supports it, each id once.

## The block

Text fields take `**bold**` and `==marker==` (yellow marker). Keep every line short; one sentence per lead.

```jsonc
{
  "v": 1,
  "kind": "full",                       // "full" at 20+ reports; "short" at 8–19 (hero, TL;DR, catch, answers only)
  "hook": { "good": "Power on tap and spin for days.", "catch": "Just be ready for the bounce." },  // catch gets the marker on its own
  "tldr": { "lead": "An all-rounder that hands you free power. …",
            "madeFor": ["**Smash lovers**: x3s and kicks come easy", "…"],   // 3–4, a kind of player or a situation, never a spec
            "notFor": ["Fans of a **dry, calm** feel", "…"] },              // 2–3
  "level": { "from": 1, "to": 2, "answer": "Intermediate and up.", "note": "…", "reports": ["…3+ ids"] },  // 0 beginner · 1 intermediate · 2 advanced
  "plays": { "lead": "…",
    "court": { "net": { "chip": "Tricky", "line": "…", "reports": ["5+ ids"] }, "overheads": {…}, "defence": {…} },  // 2+ zones with 5+ mentions
    "rows": [ { "label": "Spin", "chip": "Strong", "line": "…", "reports": ["5+ ids"] } ] },  // Attack, Defence, Control, Power, Comfort, Sweet spot, Handling, Spin, Feel; drop <5
  "catch": { "lead": "The bounce. About 40 players bring it up, and ==most of them wish there was less==.",
             "bullets": ["…2–4"], "reports": ["every id that raises it, 3+"], "about": true, "what": "that mention the bounce",
             "receipts": [ { "id": "…", "text": "paraphrase", "verbatim": false } ] },
  "modules": [ … 1–3, see below … ],
  "compare": { "lead": "…", "cards": [ { "slug": "nox-at10-genius-18k-2026", "name": "AT10 18K 2026", "tile": "ST3",
                 "arrows": [ { "dir": "up", "text": "More power" }, { "dir": "down", "text": "More bounce" }, { "dir": "same", "text": "Close cousins" }, { "dir": "none", "text": "Handling: split" } ],
                 "reports": ["3+ ids of reports that compare the two"] } ],   // 2–4 cards; a rival named by fewer than 3 players is left out
               "went": { "label": "Who went where?", "text": "Most who moved from an **AT10** stayed …" } },
  "answers": [ { "q": "Good for beginners?", "badge": "Probably not", "tone": "no", "a": "…", "reports": ["3+ ids"] } ],  // 3–6 questions the rest of the page doesn't already answer, or [] (section skipped); tone yes | maybe | no
  "tips": [ { "label": "Player tip", "text": "Ask the shop to weigh a few and pick one under 370 g. Two players suggest it.", "after": "weigh", "reports": ["2+ ids, different sources"] } ],
  "thinSpot": "only 3 players compared it with the ST3, so take that card lightly.",
  "counts": { "reports": 137, "positive": 65, "mixed": 51, "negative": 20 },   // copy from the export
  "written": "2026-11-15"
}
```

`slug` on a compare card or a version module is a catalog slug from the export (for its photo and link), or null. `tile` is
the short name shown when there's no photo. Tip `after` is where the note sits: tldr, plays, catch, compare, answers, or a
module type.

### Modules (only when the trigger is met; recipe §4)

| type | trigger (checked) | fields |
|---|---|---|
| `themes` | 4+ bars, each 8+ mentions, most first | `lead`, `bars[] {label, complaint?, reports}`, `receipts?` |
| `setup` | 5+ players discuss weights/grip/balance | `lead`, `rows[] {label, line}`, `numbers?[] {value, note, reports}`, `note?`, `reports`, `receipts?` |
| `version` | 10+ players compare a sibling or last year's | `title` ("12K or 18K?"), `lead`, `other {slug, short, says}`, `self {short, says}`, `pickSelf[]`, `pickOther[]`, `reports`, `receipts?` |
| `durability` | 5+ reports of breaks, cracks, wear | `lead`, `rows[] {label, line}`, `reports`, `receipts?` |
| `weigh` | 8+ players give their unit's weight, spanning 15 g+ | `lead`, `heavy {title, bullets}`, `light {title, bullets}`, `weights[] {grams, id}` (the report must contain the number) |
| `arm` | 6+ players on elbow/arm comfort | `lead`, `kind[]`, `harsh[]`, `reports`, `receipts?` |
| `hardness` | 8+ players' plain feel words, one feel 60%+ | `answer`, `soft`, `medium`, `hard` (id lists), `brand?` |

## What the checker rejects (scripts/save-quicktake.mts → lib/quick-take-check.ts)

- counts that don't match the database; cited ids that aren't this product's reports; an id cited twice in one list
- quote marks around anything that isn't a player's exact `words` (receipts with `"verbatim": true` too)
- a number of people in the text ("five players", "15 testers") bigger than the reports that line cites
- fewer than 3 reports behind a claim, quick answer, level band or compare card; fewer than 5 behind a How it plays row or
  court zone; tips without 2 different sources
- more than 3 `==markers==` outside the hook; a marker inside the hook
- modules whose trigger isn't met, two of one type, more than 3
- "owners", "users", "copies", "Reddit reviews", "N in 10", brand-speak ("game-changer", "unleash")

It warns (doesn't block) on fewer than 2 tips, a full page without plays/compare/modules, and receipts outside 6–10.

## Voice (recipe §5)

The good friend who is a bit wild, with a stain on his shirt, but tells you the truth. Short, punchy, a club mate, never a
magazine. "Players said", never "owners". Share words must match the real share: almost everyone ≥85%, most 60–84%,
about half / many 40–59%, some / about a third 20–39%, a few / a handful 5–19%, one or two <5%. Never invent a tip; a
complaint isn't a tip. Hero and leads never lead with Reddit. The catch is never softened.
