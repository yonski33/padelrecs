# Evidence reader rules (pickleball; ENGINE-PLAN.md section B)

You read stored reports about pickleball paddles and write down **only the facts a report states** about the paddle it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product`, `kind` (`player` for a
player's report, `blog` for our summary of an independent review site's write-up) and one or more stored texts: `review`
(a player's own review), `summary` (our summary of a web report), `excerpt` (the source's own words) and `translation`
(our English translation of a non-English excerpt).

## Attributes (pickleball profile)

`value` says **how much of the attribute the paddle has**, not whether the writer liked it: "too poppy for my resets" is
pop +1 (and control −1); "too much power for me" is power +1.

| attribute | +1 means | −1 means |
|---|---|---|
| `power` | easy put-away / drive power, plow-through, hits hard, lab power high | lacks power, underpowered, has to be swung hard, lab power low |
| `pop` | lively / springy / hot off the face on short swings, punch volleys and counters, lab pop high | muted / dead / low pop on short swings, lab pop low |
| `control` | control, touch, dinks, drops and resets land, placement, ball stays low | hard to control, dinks and resets pop up or fly long, trampoline, imprecise |
| `spin` | grabs the ball, heavy topspin / slice, high spin, high RPM | little spin, slick face, low RPM |
| `forgiveness` | big / generous sweet spot, stable on mishits, high twist weight, no dead spots | small sweet spot, dead spots, twists on off-centre hits, low twist weight |
| `speed` | quick in the hand, fast in hand battles, manoeuvrable, light swing weight | head-heavy, slow, sluggish in hand battles, high swing weight |
| `arm` | kind to the arm / elbow, soft, absorbs vibration, comfortable | vibrates, harsh, hurt the arm / elbow / wrist / shoulder |
| `durability` | holds up after months of play, grit lasts | core crush, delamination, cracks, edge guard comes off, grit wears smooth, goes dead |
| `level` | — use `level` instead of `value` (see below) | |
| `issue` | — a factual defect, `value` −1 with `issue` set: `rattle`, `weight_off_spec`, `grip`, `not_usap_approved`, `other` | |

Only these attributes. A report about a different paddle (a comparison) gives rows **only for the paddle in `product`**;
"the X has more pop than this one" is a −1 pop row for this paddle only if it clearly says this one has little pop.
A grit or spin drop over time is a `durability` −1 (not spin −1) unless it says the spin is low.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}`, or for level
`{"attribute": "level", "level": "beginner" | "intermediate" | "advanced", "strength": …, "quote": "…"}`
(the level the **writer says the paddle suits**, or the writer's own stated level when they say they liked/disliked it at
that level; "great for beginners" → beginner; "not for beginners" / "for 4.0+ players" → advanced; "I'm a 3.5 and…" →
intermediate; DUPR / ratings: under 3.0 beginner, 3.0–3.99 intermediate, 4.0+ advanced). For `issue` add `"issue": "<kind>"`.

1. **State, don't infer.** A row needs words that say it. A high star rating, "great paddle", "love it", "best I've had"
   are verdicts, not attributes: **no row**. Do not infer power from "elongated" or control from "16 mm"; specs are not
   evidence here. Don't add general knowledge about the model.
2. **Nothing stated → no rows.** That is the normal case for many player reports: many give `[]`.
3. `strength`: **0.5** a passing or hedged mention ("decent spin", "a bit head heavy", "seems quite powerful");
   **1** a clear statement ("the control is excellent", "it hurt my elbow"); **1.5** measured or tested over time
   ("swing weight 105", "spin 2,300 RPM", "power near the top of the database", "after 6 months no core crush",
   "delaminated after 3 weeks").
4. Mixed statements give two rows only when they are about **different** attributes ("great pop but hard to reset" →
   pop +1, control −1). The same attribute both ways → one row with the overall sense, strength 0.5.
5. **Comparisons and conditions are weak.** A quote that only compares or sets a condition ("more power than the Gen 2",
   "less pop than expected", "stable when you hit the centre", "good for an elongated") gets strength **0.5** at most.
   Exception: a blog's place in its own measured database ("among the highest twist weights tested") is a clear,
   measured statement (1.5).
6. At most one row per attribute per report (pick the clearest quote). At most 7 rows per report.
7. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts (`review`, `summary`,
   `excerpt` or `translation`): same characters, case, punctuation, accents and spacing. Copy it; never paraphrase, fix
   typos or join pieces. At least 8 characters; usually the clause that states it (3–20 words).
8. Summaries (`summary`) are ours and already paraphrase the source; quote them as written. Don't treat our summary's
   hedges ("players say") as weaker than the excerpt. Blog summaries often state several attributes: give a row for each
   one they state clearly.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3 for players, more for blogs), e.g.
{"w:123": [], "p:456": [{"attribute": "control", "value": 1, "strength": 1, "quote": "resets die in the kitchen"}, {"attribute": "arm", "value": -1, "strength": 1, "quote": "after two weeks my elbow started to hurt"}], "w:789": [{"attribute": "level", "level": "advanced", "strength": 1, "quote": "not a paddle for beginners"}]}
Valid JSON only (escape quotes inside strings). Keep any scratch files in your own subfolder.
