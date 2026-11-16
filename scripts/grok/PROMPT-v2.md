# DiscGolfRecs disc-page content: writing brief v2 (batch 02)

You are writing short buying advice for disc pages on DiscGolfRecs, a site that recommends disc golf discs from real player
reports. The attached JSON (`discgolf-batch-02.json`) holds 20 discs. For each disc it gives the specs, the flight numbers,
the site's level-fit scores, the site expert's values (where set), up to 40 evidence snippets with ids (`e1`, `e2`, …) and an
`allowed_try_instead` list. Write ONLY what the snippets support. Reply with ONE JSON object and nothing else (no prose, no
code fences).

## Output schema (exact)

```json
{
  "<disc slug>": {
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
        "try_instead": { "slug": "<a slug from this disc's allowed_try_instead>", "text": "Want X? The <Name> <does Y>.",
                         "sources": ["e12", "e19"] } }
    ]
  },
  "<a disc you can't support>": { "skip": "one-line reason" }
}
```

- `matters_for` (can be empty `[]`) says which visitor picks the item matters for. It drives the site's match box (the ✓ fit / ! catch
  lines shown when a visitor's picks match), so tag carefully. Allowed values: `understable` (wants it to turn / easy to shape),
  `overstable` (wants a reliable fade / wind), `slow_arm` (has a slower arm), `beginner`, `intermediate`, `advanced`, `forehand`,
  `grip`, `wind`, `distance`.
- `tip` and `try_instead` are optional and only go on `why_not` items. Add a `try_instead` where it really helps
  (usually on the biggest catch, and on a level or arm catch).

## Evidence rules
1. **Cite every snippet that supports a line, not just two.** `sources` must list ALL the snippet ids that actually make that
   claim (usually 3–10), and at least 2. The site shows the count as "N players mention it", so citing only two undercounts.
   Every cited snippet must say the claim itself, not just touch the topic. Batch 01 failure to avoid: "takes real power to fly
   straight" cited a snippet that praised the disc's wind resistance and one about overshooting; neither said it. Never cite an
   id from another disc.
2. **3 items per side.** Aim for 3 `why_yes` and 3 `why_not`. Typical catches in disc golf: how it changes as it beats in, which
   plastics or weights fly differently, arm-speed or level fit, wind, grip, glide that overshoots, durability. Use a 4th only when
   it is strong. Go below 3 only when the snippets truly don't support a third (see rule 4).
3. **Order by support, biggest first.** Sort each side so the item with the most cited snippets comes first. `why_not[0]` is the
   biggest catch, and the tagline's "The catch:" must be that same item. The first `why_yes` item is the disc's main strength,
   never a side trait (looks, colours, price).
4. **Thin evidence:** if a side only has 1–2 well-supported items, write only those. If you can't support at least 2 items on each
   side with 2+ snippets each, return `{ "skip": "…" }` for that disc. Some discs in this batch have only 8 snippets on purpose:
   judge them honestly, and never stretch thin evidence.
5. **Level fit:** if `expert.level` is set, it wins over everything else. Otherwise use `level_fit` (0–100), but write a level catch
   ("Not a first disc", `matters_for: ["beginner"]`) only when the score is 50 or below AND snippets support it. The bottom line
   names who should skip.
6. **Match the specs.** Statements must agree with the flight numbers and the expert values. Don't call an 11-speed disc easy for slow
   arms unless the snippets say so; don't call a 0/3 disc understable.
7. **Plastic and weight matter in disc golf.** When the snippets tie a behaviour to a plastic, weight or wear ("beats in fast in DX",
   "the 175 g Star is more overstable"), say so. That's the single most useful thing on a disc page. (Batch 01 did this well; keep it.)

## Flight-number literacy
Flight numbers are speed / glide / turn / fade. Speed 1–14: higher needs more arm speed to fly as rated. Glide 1–7: how long it stays
up. Turn +1 to -5: negative = drifts right at high speed for a right-hand backhand (understable). Fade 0–5: how hard it finishes left
at the end. Turn + fade near 0 or below = understable / straight; 3+ = overstable. "Beat in" = the plastic wears and the disc gets
more understable over time. Use RHBH (right-hand backhand) directions only when you say so; prefer "turns", "fades", "flips up",
"hyzer", "anhyzer", "turnover", "flex line", "roller".

## Voice rules (expert voice; a validator checks all of these)
- **Say the thing, not who said it.** Never "players say", "many players", "one reviewer", "12 players", "some find", "most report",
  "people love", "fans of". Counts already show elsewhere on the page. Write "Holds a long anhyzer line", not "players say it holds…".
- **Never imply testing:** no "in our testing", "we threw", "I found", "we noticed".
- **Split opinion said plainly:** "Splits opinion: some runs flip, others hold." A minority view becomes "can …" with its condition
  ("can flip in light plastic").
- **The text adds information the title doesn't have**: the when, how much, for whom, or compared to what. Never reuse the title's
  words in the text. Batch 01 failures: "Turnover and roller tool" / "…easy hyzer flips, turnovers and rollers"; "Flick forehands" /
  "…short forehand flicks". Rename the title instead ("Shot-shaping tool", "Short sidearm touch").
- **No contradictions** inside one disc: a why_yes and a why_not must not clash ("stable" vs "flippy") unless the why_not says the
  condition (plastic, weight, wear, arm speed).
- **Durability and defect claims** stay neutral and about the disc ("DX runs beat in within weeks"), never "junk", "defective",
  "cheaply made".
- **No medical claims:** a lighter, slower disc can be "easier on the arm", nothing more. Avoid "cure", "heal", "injury" even
  figuratively ("fixes griplock", not "cures griplock").
- Words: "disc", never "racket" or "paddle"; "players", never "owners". No "% liked", no "Reddit", no "the brand says", no "roomy".
- **Every line ≤105 characters**: tagline, bottom_line, each `text`, tip and try_instead text. Also keep `title` + `text` together
  under 100 characters, because the match box shows them as "Title: text."
- Bottom line: two short sentences. Tagline: "<What it is>. The catch: <main catch>."

## try_instead
- Only a slug from that disc's `allowed_try_instead` list. Pick one that fits the need the line addresses (check its flight numbers,
  `lean`, `level_fit` and `known_for`).
- Say why it fits in plain words, using its flight numbers and what it is `known_for` (the tags most of its reports give, with
  counts in brackets: never quote the counts). Good: "Big arm? The Innova Destroyer holds a straighter line and is known for
  distance: 12/5/-1/3." Weak (batch 01): "The MVP Volt is rated 8/5/-0.5/2." on its own.
- `sources` are this disc's snippets that show the need (e.g. the ones saying it flips for big arms).
- No prices.

## Example (style only; a made-up disc)
```json
{"example-driver": {
  "tagline": "A glidey, understable distance driver. The catch: light DX runs flip fast.",
  "bottom_line": "A great first distance driver for slower arms. Big arms want something more stable.",
  "why_yes": [{"title": "Easy distance", "text": "Lots of glide ==carries slower arms past their usual drives==.", "matters_for": ["slow_arm", "beginner"], "sources": ["e1","e4","e9"]}],
  "why_not": [{"title": "Flips for big arms", "text": "Full power ==turns it over too far==, worst in light DX.", "matters_for": ["advanced"], "sources": ["e2","e7"],
     "try_instead": {"slug": "example-stable-driver", "text": "Big arm? The Example Stable Driver holds a straighter line: 12/5/-1/3.", "sources": ["e2","e7"]}}]
}}
```

## Before you answer, check each disc
- 3 items a side (or an honest skip / short side), sorted by number of sources, tagline catch = `why_not[0]`.
- Every cited id says the claim; all supporting ids are cited.
- No title word repeated in its text; every line ≤105 characters; exactly one ==phrase== per text.

Now write the JSON for all 20 discs in the attached file.
