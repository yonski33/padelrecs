# Evidence reader rules (DiscGolfRecs; ENGINE-PLAN.md section B, targeted pass approved 2026-11-15)

You read stored reports about disc golf discs and write down **only the facts a report states** about the disc (mold) it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product` (brand + mold), `type`
(Distance driver, Fairway driver, Midrange, Putter), `flight` (the maker's speed / glide / turn / fade) and one or more stored
texts: `review` (a player's own review), `summary` (our summary of a forum post, video or blog review), `excerpt` (the
source's own words) and `translation` (our English translation of a non-English excerpt).

## Attributes

`value` says **where the disc sits or how much of it it has**, not whether the writer liked it.

| attribute | +1 means | −1 means |
|---|---|---|
| `stability` | overstable, fades hard, resists turn, beefy, "more stable than its numbers", holds up to power / headwind | understable, flippy, turns over, "less stable than its numbers", flips up to flat |
| `glide` | lots of glide, floats, carries forever, stays up | little glide, drops out of the sky, no carry |
| `grip` | grippy, tacky, gummy, good in the wet / cold | slick, slippery, hard to grip, stiff and slick in the cold |
| `beat_in` | beats in / seasons fast, got flippier with use, scuffs and warps easily | holds its flight for months / years, durable, still the same after a season |
| `accuracy` | accurate, holds lines, consistent, goes where aimed | inconsistent between runs or copies, erratic, hard to throw on line |
| `distance` | long, more distance than expected, max-distance disc | lacks distance, short |
| `wind` | good in wind, cuts through wind | gets pushed around, unpredictable in wind |
| `forehand` | good for forehands / sidearm, handles forehand torque | turns over on forehands, rolls off the hand on forehands |
| `suits` | — a statement about **who the disc is for**, with `group` (see below) and `value` +1 (good for them) / −1 (not for them) | |
| `writer` | — the **writer's own** level or arm, with `group` (see below); no `value` | |

`stability` is a position: "too overstable for me" is stability +1 (it's a complaint, but the disc is overstable); "turns
over" is −1. `beat_in` +1 means it changes fast. Stability for **this writer's arm** still counts: "fades way too early for my
arm" is stability +1 strength 0.5.

## Groups (`suits` and `writer`)

`beginner`, `intermediate`, `advanced` (level) and `arm_slow` (under ~250 ft max), `arm_mid` (250–325 ft), `arm_fast` (325 ft +).

- `suits`: "great first driver", "perfect for beginners" → beginner +1; "not a beginner disc", "needs a big arm",
  "you need power to get it to turn" → beginner −1 **or** arm_slow −1 (pick what the words say; "needs a big arm" is
  arm_slow −1, not level); "great for slower arms / low power" → arm_slow +1; "for big arms only" → arm_fast +1;
  "too flippy for big arms" → arm_fast −1. One row per group the words name.
- `writer`: the writer's own level or arm, stated: "I'm a newer player" / "first year" → beginner; "I play league",
  "rated 870" → intermediate; "rated 950", "I play tournaments at MPO / FPO level", "pro" → advanced. A distance: "I throw
  about 280 ft" → arm_mid, "max 220" → arm_slow, "400+ ft" → arm_fast. PDGA ratings: under 850 beginner, 850–929
  intermediate, 930+ advanced. A writer can have a level row and an arm row.
- Advice is not the writer: "if you're a beginner…" is `suits`, never `writer`.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}`;
suits: `{"attribute": "suits", "group": …, "value": 1 | -1, "strength": …, "quote": "…"}`;
writer: `{"attribute": "writer", "group": …, "quote": "…"}`.

1. **State, don't infer.** A row needs words that say it. "Love it", "bagged", "my go-to", "best disc ever" are verdicts:
   **no row**. Never infer stability from the flight numbers or the type. Don't add general knowledge about the mold.
2. **Nothing stated → no rows.** That is the normal case: many reports give `[]`.
3. `strength`: **0.5** passing, hedged or a comparison ("a bit flippy", "more glide than a Teebird"); **1** a clear statement
   ("very overstable", "great in the wind"); **1.5** tested over time or by measurement ("after two seasons it's still
   overstable", "fieldwork: 20 throws all faded left").
4. Only the disc in `product`. A comparison gives a row for this disc only when it clearly says where this one sits.
   Plastic matters: a statement about one plastic of this mold still counts for the mold.
5. At most one row per attribute per report (one per group for `suits` / `writer`), at most 7 rows per report.
6. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts: same characters, case,
   punctuation and spacing. Copy it; never paraphrase, fix typos or join pieces. At least 6 characters, usually 3–20 words.
7. Summaries are ours and already paraphrase the source; quote them as written.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3), e.g.
{"w:1": [], "w:2": [{"attribute": "stability", "value": 1, "strength": 1, "quote": "way more stable than the numbers say"}, {"attribute": "suits", "group": "arm_slow", "value": -1, "strength": 1, "quote": "needs a big arm"}], "w:3": [{"attribute": "writer", "group": "beginner", "quote": "As a newer player"}, {"attribute": "glide", "value": 1, "strength": 1, "quote": "floats forever"}]}
Valid JSON only (escape quotes inside strings).
