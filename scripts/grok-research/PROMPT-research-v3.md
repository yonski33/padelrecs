# PadelRecs research content: writing brief v3 (web research, pilot)

You are writing short buying advice for racket pages on PadelRecs. These 20 rackets have fewer than 4 player reports on our site,
so you RESEARCH them yourself on the open web, X and YouTube, then write as an expert. The attached JSON
(`padel-research-01.json`) gives each racket's name, brand, year, specs, the engine's side and dots, level fit, the expert's
values (where set), our few report snippets (ids `e1`…, a starting point only) and an `allowed_try_instead` list. Reply with ONE
JSON object and nothing else (no prose, no code fences).

## Output schema (exact)

```json
{
  "<racket slug>": {
    "tagline": "<What it is>. The catch: <the main Why not>.",
    "bottom_line": "Who it's for. Who should skip it.",
    "why_yes": [
      { "title": "2–5 words", "text": "One line with exactly one ==key phrase==.", "matters_for": ["control"],
        "sources": [ { "url": "https://…", "note": "what this page says that supports the line" },
                     { "url": "https://…", "note": "…" } ] }
    ],
    "why_not": [ { "title": "…", "text": "…", "matters_for": [], "sources": [ … ],
                   "try_instead": { "slug": "<from allowed_try_instead>", "text": "Want X? The <Name> <does Y>.", "sources": [ … ] } } ],
    "sources_checked": 6
  },
  "<a racket you can't validate>": { "skip": "one-line reason (what you searched, what was missing)" }
}
```
- `matters_for` values: `control`, `power`, `beginner`, `intermediate`, `advanced`, `arm` (sore elbow or wrist). Can be `[]`.
- `sources_checked`: how many distinct pages you actually read for this racket.

## Research rules (a validator and a human check these; one invented source fails the whole batch)
1. **Every line cites 2+ independent sources**: different domains, real pages you opened (a review article, a video, a forum or
   X post by a player or coach, the maker's product page). Not homepages, not search-result pages, not two shops copying the
   maker's text. Each source gets a one-line `note` saying what it supports.
2. **Never invent a URL, a quote, a reviewer or a number.** If you can't open it, don't cite it. A spec line (weight, shape,
   balance, core, surface) may cite the maker page plus one retailer or review that lists the same specs.
3. **Conflicting sources:** say the split plainly ("Splits opinion: some reviews find it firm, others medium").
4. **Paraphrase; never copy.** No sentence from a source, no quote marks. Lines ≤105 characters.
5. **2 items per side minimum, 3 when the sources support it**, sorted with the best-supported first; the tagline's catch is
   `why_not[0]`. Catches are real flaws or limits from the sources, not padding.
6. **Skip rather than guess.** If you can't validate at least 2 items a side with 2+ independent sources each, return `skip`.
   Our report snippets can confirm a line but never replace the 2 web sources.
7. **This year's model:** use sources about the exact year and version in the pack (e.g. 2026), or say plainly when a line
   carries over from the previous version and the sources say it is unchanged.

## Racket-spec literacy (a validator and a human check these)
- **Shape:** round = control, a big low sweet spot, easy for newer players; teardrop = all-round; diamond = power, a high, small
  sweet spot, demanding.
- **Balance:** low (head-light) = quick handling and defence; high (head-heavy) = more power on smashes, slower and harder on the arm.
- **Core:** soft EVA / foam = comfort and easy exit at low pace; hard EVA = control and power for fast swings, firmer on the arm.
- **Surface:** fibreglass = softer, more forgiving; higher-K carbon (12K, 18K) = firmer, more precise; grit/sand = spin.
- **Weight:** heavier (370 g+) = stability and power, slower; lighter = quicker and kinder for newer players.
- **Hard numbers only from the pack** (weight, K, years). Never invent a weight, price or year.
- **Upgrade paths, plainly:** "outgrown once you want real power on smashes", "move up to a teardrop at intermediate".
- **Level fit:** the expert level wins when set. A "Not a first racket" catch only when sources say it is too demanding, hard or
  unforgiving for newer players.
- **Arm items** stay experiential ("kind to a sore elbow", "can jar the arm"), never medical.

## Voice rules (expert voice; a validator checks all of these)
- **Never claim testing:** no "we tested", "in our hands", "on court we found".
- **Say the thing, not who said it.** Never "players say", "many players", "one reviewer", "12 players", "some find", "most report",
  "people love", "fans of". Counts already show elsewhere on the page. Write "Easy depth on a short swing", not "players say it gives easy depth…".
- **Never imply testing:** no "in our testing", "we threw", "I found", "we noticed".
- **Split opinion said plainly:** "Splits opinion: some find it soft, others firm." A minority view becomes "can …" with its condition
  ("can feel hard in the cold").
- **The text adds information the title doesn't have**: the when, how much, for whom, or compared to what. Never reuse the title's
  words in the text ("Easy power" / "Power comes easy…" fails; "Free depth" / "A head-heavy balance adds pace on…" works).
- **No contradictions** inside one racket: a why_yes and a why_not must not clash ("forgiving" vs "small sweet spot", "soft" vs "hard") unless the why_not says the
  condition (version, core, added weight, temperature).
- **Durability and defect claims** stay neutral and about the racket ("some frames cracked at the throat within months"), never "junk", "defective",
  "cheaply made".
- **No medical claims:** say "kind to a sore elbow" or "can flare a sore arm", never "prevents tennis elbow", "injury", "heals".
- Words: "racket" and "players"; never "owners", "paddle" or "disc". No "% liked", no "Reddit", no "the brand says", no "roomy".
- **Every line ≤105 characters**: tagline, bottom_line, each `text`, tip and try_instead text. Also keep `title` + `text` together
  under 100 characters, because the match box shows them as "Title: text."
- Bottom line: two short sentences. Tagline: "<What it is>. The catch: <main catch>."

## try_instead
- Only a slug from that racket's `allowed_try_instead` list. Pick one that fits the need the line addresses, using its side, dots,
  specs, level fit and `known_for` (never quote the counts in brackets).
- Good: "Sore arm? The Head Flash is softer and known for arm comfort." Weak: a name with no reason.
- `sources` are 2+ URLs (distinct domains) that show the need. No prices.

## Before you answer, check each racket
- 2+ distinct-domain, real-page sources on every line, tip and try_instead, each with a note. No invented URLs.
- 2–3 items a side (or a skip), sorted by support; tagline catch = `why_not[0]`; no copied sentences; ≤105 characters a line.

Now research and write the JSON for all 20 rackets in the attached file.
