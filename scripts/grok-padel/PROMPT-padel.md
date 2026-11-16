# PadelRecs racket-page content: writing brief (prompt v2, padel)

You are writing short buying advice for racket pages on PadelRecs, a site that recommends padel rackets from real player reports.
The attached JSON (`padel-batch-NN.json`) holds up to 20 rackets. For each it gives the specs (shape, weight, balance, core,
surface), the engine's style side and trait dots, the level fit (with what it rests on), the expert's values
(where set), up to 40 evidence snippets with ids (`e1`, `e2`, …) and an `allowed_try_instead` list. Write ONLY what the snippets
support. Reply with ONE JSON object and nothing else (no prose, no code fences).

## Output schema (exact)

```json
{
  "<racket slug>": {
    "tagline": "<What it is>. The catch: <the main Why not>.",
    "bottom_line": "Who it's for. Who should skip it.",
    "why_yes": [
      { "title": "2–5 words", "text": "One line with exactly one ==key phrase== marked like this.",
        "matters_for": ["understable"], "sources": ["e3", "e7"] }
    ],
    "why_not": [
      { "title": "2–5 words", "text": "One line with exactly one ==key phrase==.",
        "matters_for": ["beginner"], "sources": ["e12", "e19"],
        "tip": { "text": "A fix the snippets give (optional).", "sources": ["e4", "e9"] },
        "try_instead": { "slug": "<a slug from this racket's allowed_try_instead>", "text": "Want X? The <Name> <does Y>.",
                         "sources": ["e12", "e19"] } }
    ]
  },
  "<a racket you can't support>": { "skip": "one-line reason" }
}
```

- `matters_for` (can be empty `[]`) says which visitor picks the item matters for; it drives the site's match box, so tag
  carefully. Allowed values: `control`, `power` (the style the visitor wants), `beginner`, `intermediate`, `advanced`, `arm`
  (has a sore elbow or wrist).
- `tip` and `try_instead` are optional and only go on `why_not` items. Add a `try_instead` where it really helps (usually on the
  biggest catch, and on an arm or level catch).

## Evidence rules
1. **Cite every snippet that supports a line, not just two.** `sources` lists ALL the snippet ids that actually make that claim
   (usually 3–10), and at least 2. The site shows the count as "N players mention it" (shown only from 5 sources up). Every cited snippet must say the claim itself,
   not just touch the topic. Never cite an id from another racket.
2. **3 items per side.** Aim for 3 `why_yes` and 3 `why_not`. Typical catches in padel: arm comfort (a hard core), a small sweet spot, little free power
   or too much pop, head-heavy handling, a demanding feel, grit or face wear, cracks, price. Use a 4th only when it is strong.
3. **Order by support, biggest first.** Sort each side so the item with the most cited snippets comes first. `why_not[0]` is the
   biggest catch, and the tagline's "The catch:" must be that same item. The first `why_yes` is the main strength, never a side trait.
4. **Thin evidence:** a side with only 1–2 well-supported items gets only those. If you can't support at least 2 items on each side
   with 2+ snippets each, return `{ "skip": "…" }`. Never stretch thin evidence or pad a catch.
5. **Match the specs.** Statements must agree with the specs, the side, the dots and the expert values. Don't praise
   power on a racket with power dot ≤3; lead the tagline and bottom line with its side (control / all-round / power).
6. **Versions and setup matter.** When the snippets tie a behaviour to a year/version, the core, added weight or the climate
   (cold/heat), say so ("the 2025 is softer than the 2024", "stiffer in the cold"). That is the most useful thing on a racket page.

## Racket-spec literacy (a validator and a human check these)
- **Shape:** round = control, a big low sweet spot, easy for newer players; teardrop = all-round; diamond = power, a high, small
  sweet spot, demanding.
- **Balance:** low (head-light) = quick handling and defence; high (head-heavy) = more power on smashes, slower and harder on the arm.
- **Core:** soft EVA / foam = comfort and easy exit at low pace; hard EVA = control and power for fast swings, firmer on the arm.
- **Surface:** fibreglass = softer, more forgiving; higher-K carbon (12K, 18K) = firmer, more precise; grit/sand = spin.
- **Weight:** heavier (370 g+) = stability and power, slower; lighter = quicker and kinder for newer players.
- **Hard numbers only from the pack** (weight, K, years). Never invent a weight, price or year.
- **Upgrade paths, plainly:** "outgrown once you want real power on smashes", "move up to a teardrop at intermediate".
- **Level fit:** the expert level wins when set. A "Not a first racket" catch only when snippets say it is too demanding, hard or
  unforgiving for newer players.
- **Arm items** stay experiential ("kind to a sore elbow", "can jar the arm"), never medical.

## Voice rules (expert voice; a validator checks all of these)
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
- `sources` are this racket's snippets that show the need. No prices.

## Before you answer, check each racket
- 3 items a side (or an honest skip / short side), sorted by number of sources, tagline catch = `why_not[0]`.
- Every cited id says the claim; all supporting ids are cited. Catches are real flaws, not "it's popular" or "a niche racket".
- Specs and numbers agree with the pack; the side leads the tagline. No title word repeated in its text; every line ≤105 characters; exactly one
  ==phrase== per text.

Now write the JSON for all rackets in the attached file.
