# Evidence reader rules (padel; ENGINE-PLAN.md section B)

You read stored reports about padel rackets and write down **only the facts a report states** about the racket it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product` and one or more stored
texts: `review` (a player's own review), `summary` (our summary of a web report), `excerpt` (the source's own words) and
`translation` (our English translation of a non-English excerpt).

## Attributes (padel profile)

| attribute | +1 means | −1 means |
|---|---|---|
| `forgiveness` | big / forgiving sweet spot, mishits still work, easy to play | small sweet spot, demanding, punishes off-centre hits |
| `power` | easy power, big smashes, ball exit, pop | lacks power, has to be forced, weak smashes |
| `control` | control, precision, placement, touch, ball stays in | hard to control, flies long, trampoline, imprecise |
| `defence` | good in defence, blocks, lobs, from the back | struggles in defence, blocks fly, hard to defend |
| `arm` | kind to the arm / elbow, absorbs vibration, comfortable | vibrates, hurt the arm / elbow / wrist, harsh |
| `speed` | quick / light in the hand, fast at the net, manoeuvrable | heavy, head-heavy, slow, tiring |
| `durability` | holds up well after long use | cracks, breaks, delaminates, paint/frame damage, goes dead quickly |
| `level` | — use `level` instead of `value` (see below) | |
| `issue` | — a factual defect, `value` −1 with `issue` set: `weight_off_spec`, `balance_off_spec`, `screws_loose`, `rattle`, `grip`, `other` | |

Only these attributes. A report about a different racket (a comparison) gives rows **only for the racket in `product`**;
"the X has more power than this one" is a −1 power row for this racket only if it clearly says this one lacks power.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}`, or for level
`{"attribute": "level", "level": "beginner" | "intermediate" | "advanced", "strength": …, "quote": "…"}`
(the level the **writer says the racket suits**, or the writer's own stated level when they say they liked/disliked it at
that level; "great for beginners" → beginner; "only for advanced players" → advanced; "I'm a 4.0 intermediate and…" →
intermediate). For `issue` add `"issue": "<kind>"`.

1. **State, don't infer.** A row needs words that say it. A high star rating, "great racket", "love it", "best I've had"
   are verdicts, not attributes: **no row**. Do not infer power from "diamond shape" or control from "round"; specs are
   not evidence here. Don't add general knowledge about the model.
2. **Nothing stated → no rows.** That is the normal case: many reports give `[]`.
3. `strength`: **0.5** a passing or hedged mention ("decent control", "a bit heavy", "seems quite powerful");
   **1** a clear statement ("the control is excellent", "it hurt my elbow"); **1.5** measured or tested over time
   ("weighed 372 g on my scale", "after 6 months no elbow pain at all", "cracked after 3 weeks").
4. Mixed statements give two rows only when they are about **different** attributes ("great power but my elbow hurt" →
   power +1, arm −1). The same attribute both ways ("good control, though it flies a bit on blocks") → one row with the
   overall sense, strength 0.5.
5. At most one row per attribute per report (pick the clearest quote). At most 6 rows per report.
6. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts (`review`, `summary`,
   `excerpt` or `translation`): same characters, case, punctuation, accents and spacing. Copy it; never paraphrase, fix
   typos or join pieces. At least 8 characters; usually the clause that states it (3–20 words).
7. Summaries (`summary`) are ours and already paraphrase the source; quote them as written. Don't treat our summary's
   hedges ("players say") as weaker than the excerpt.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3), e.g.
{"w:123": [], "p:456": [{"attribute": "control", "value": 1, "strength": 1, "quote": "placement is spot on, even on fast balls"}, {"attribute": "arm", "value": -1, "strength": 1, "quote": "after two weeks my elbow started to hurt"}], "w:789": [{"attribute": "level", "level": "advanced", "strength": 1, "quote": "really only for advanced players"}]}
Valid JSON only (escape quotes inside strings). Keep any scratch files in your own subfolder.
