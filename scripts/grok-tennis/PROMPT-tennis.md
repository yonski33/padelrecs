# TennisRecs racket-page content: writing brief (prompt v2, tennis)

You are writing short buying advice for racket pages on TennisRecs, a site that recommends tennis rackets from real player reports.
The attached JSON (`tennis-batch-NN.json`) holds up to 20 rackets. For each it gives the specs (head size, weight, balance,
string pattern, stiffness RA), the engine's style side and trait dots, the level fit (with what it rests on), the expert's values
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
2. **3 items per side.** Aim for 3 `why_yes` and 3 `why_not`. Typical catches in tennis: arm comfort (stiffness), a small sweet spot, low power, low
   stability vs heavy balls, swing weight, launch angle or spin that overshoots, durability (cracks, grommets), price. Use a 4th only when it is strong.
3. **Order by support, biggest first.** Sort each side so the item with the most cited snippets comes first. `why_not[0]` is the
   biggest catch, and the tagline's "The catch:" must be that same item. The first `why_yes` is the main strength, never a side trait.
4. **Thin evidence:** a side with only 1–2 well-supported items gets only those. If you can't support at least 2 items on each side
   with 2+ snippets each, return `{ "skip": "…" }`. Never stretch thin evidence or pad a catch.
5. **Match the specs.** Statements must agree with the specs, the side, the dots and the expert values. Don't praise
   power on a racket with power dot ≤3; lead the tagline and bottom line with its side (control / all-round / power).
6. **Strings and versions matter.** When the snippets tie a behaviour to the strings, the tension, a year/version or added weight,
   say so ("harsh with poly at high tension", "the 2023 is softer than the 2021"). That is the most useful thing on a racket page.

## Racket-spec literacy (a validator and a human check these)
- **Head size:** 95–98 sq in = control and precision, smaller sweet spot; 100 = all-round; 102+ = forgiving and powerful.
- **String pattern:** open (16x19, 16x18) = more spin and launch, strings move and break sooner; dense (18x20) = control, flatter
  ball, less spin, often firmer.
- **Stiffness (RA):** a comfort signal, not a verdict: ≤63 RA usually reads soft / arm-friendly, 64–67 medium, 68+ firm and powerful
  but harsher. Say "can be harsh for sore arms" only when snippets back it; strings matter as much as the frame.
- **Weight and balance:** heavier (305 g+) = stability and plow-through, harder to swing; head-light = quick at the net; head-heavy
  or light = easier power for short swings.
- **Hard numbers only from the pack:** head size, weight, balance, pattern, RA. Never invent a swingweight, price or year.
- **Upgrade paths, plainly:** "outgrown once you swing fast and want a flatter ball", "a beginner frame; move up at about 3.5 NTRP".
- **Level fit:** the expert level wins when set. A "Not a first racket" catch only when snippets say it is too demanding, heavy
  or unforgiving for newer players. Use NTRP for levels ("3.5", "4.0+") or beginner / intermediate / advanced.
- **Arm items** stay experiential ("kind to a sore elbow", "can jar the arm"), never medical.

## Voice rules (expert voice; a validator checks all of these)
- **Say the thing, not who said it.** Never "players say", "many players", "one reviewer", "12 players", "some find", "most report",
  "people love", "fans of". Counts already show elsewhere on the page. Write "Easy depth on a short swing", not "players say it gives easy depth…".
- **Never imply testing:** no "in our testing", "we threw", "I found", "we noticed".
- **Split opinion said plainly:** "Splits opinion: some find it soft, others firm." A minority view becomes "can …" with its condition
  ("can feel harsh with full poly").
- **The text adds information the title doesn't have**: the when, how much, for whom, or compared to what. Never reuse the title's
  words in the text ("Easy power" / "Power comes easy…" fails; "Free depth" / "A 102 head pushes the ball deep on…" works).
- **No contradictions** inside one racket: a why_yes and a why_not must not clash ("forgiving" vs "small sweet spot", "soft" vs "harsh") unless the why_not says the
  condition (strings, tension, version, added weight).
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
- Good: "Sore arm? The Wilson Clash 100 is far softer and known for arm comfort." Weak: a name with no reason.
- `sources` are this racket's snippets that show the need. No prices.

## Before you answer, check each racket
- 3 items a side (or an honest skip / short side), sorted by number of sources, tagline catch = `why_not[0]`.
- Every cited id says the claim; all supporting ids are cited. Catches are real flaws, not "it's popular" or "a niche racket".
- Specs and numbers agree with the pack; the side leads the tagline. No title word repeated in its text; every line ≤105 characters; exactly one
  ==phrase== per text.

Now write the JSON for all rackets in the attached file.
