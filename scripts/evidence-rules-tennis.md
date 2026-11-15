# Evidence reader rules (tennis; ENGINE-PLAN.md section B)

You read stored reports about tennis rackets and write down **only the facts a report states** about the racket it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product`, `kind` (`player`, or `blog`
for our summary of an independent review site's write-up; shop playtests and YouTube summaries also come as `player`) and
one or more stored texts: `review` (a player's own review), `summary` (our summary of a web report, video or playtest),
`excerpt` (the source's own words) and `translation` (our English translation of a non-English excerpt).

## Attributes (tennis profile)

`value` says **how much of the attribute the racket has**, not whether the writer liked it: "too powerful for me, balls fly
long" is power +1 (and control −1); "too stiff for my elbow" is arm −1.

| attribute | +1 means | −1 means |
|---|---|---|
| `power` | easy depth / pace, free power, big serve, plow-through, launches | underpowered, has to supply all the pace, short balls, low playtest power score |
| `control` | placement, precision, can swing out and it stays in, predictable, good touch / volleys placed, "control" praised | launchy, flies long, trampoline, imprecise, hard to keep in |
| `spin` | easy topspin / slice / kick, ball dips, grabs the ball, high spin score | hard to get spin, flat, low spin |
| `arm` | arm-friendly, comfortable, plush, dampened, no elbow / wrist / shoulder pain | harsh, jarring, vibrates, stiff on the arm, caused or worsened tennis elbow / wrist / shoulder pain |
| `maneuverability` | quick through the air, whippy, fast at net, easy to swing, low swingweight | sluggish, hard to swing, tiring, late on fast balls, high swingweight felt as a burden |
| `stability` | stable, solid, plow-through on returns, doesn't twist, handles heavy balls / big servers | twists, flutters, pushed around by heavy balls, unstable on off-centre hits |
| `forgiveness` | big / generous sweet spot, forgiving on mishits, easy to use | small sweet spot, punishes mishits, demanding, frames a lot |
| `feel` | soft, plush, muted, dwell, ball pocketing | crisp, firm, boardy, stiff, direct / connected but firm |
| `swing` | needs or rewards long, fast, full swings ("you have to swing out", "for players with big swings") | suits compact / short / slower swings, gives pace to players who don't generate their own |
| `durability` | holds up after months of play, paint and grommets survive | cracked frame, broken grommets, chipped paint / bumper wear soon, warps |
| `level` | use `level` instead of `value` (see below) | |
| `issue` | a factual defect: `value` −1 with `issue` set to `weight_off_spec`, `balance_off_spec`, `rattle`, `grip` or `other` | |

Only these attributes. A report about a different racket (a comparison) gives rows **only for the racket in `product`**;
"the Pure Aero has more spin than this" is a −1 spin row for this racket only if it clearly says this one has little spin.
String effects are not racket facts: "the full poly made it harsh" or "after restringing with a multi it felt soft" gives
no arm or feel row unless the writer says the frame itself is harsh or soft. Lead tape and customisation: no row for what
the added weight did.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}`, or for level
`{"attribute": "level", "level": "beginner" | "intermediate" | "advanced", "strength": …, "quote": "…"}`
(the level the **writer says the racket suits**, or the writer's own stated level when they say they liked / disliked it at
that level: "great for beginners" or "for developing players" → beginner; "not for beginners" / "for advanced players" /
"needs good technique" / "tournament players" → advanced; "for intermediates" / "club players" → intermediate;
"I'm a 3.5 and…" → intermediate. NTRP / UTR: NTRP under 3.0 beginner, 3.0–3.5 intermediate, 4.0+ advanced; UTR under 4
beginner, 4–7 intermediate, 8+ advanced. A junior or a pro using it is not a level statement by itself).

1. **State, don't infer.** A row needs words that say it. A high star rating, "great racket", "love it", "best I've had"
   are verdicts, not attributes: **no row**. Do not infer spin from "16x19" or power from "100 sq in"; specs are not
   evidence here. Don't add general knowledge about the model.
2. **Nothing stated → no rows.** That is the normal case for many player reports: many give `[]`.
3. `strength`: **0.5** a passing or hedged mention ("decent spin", "a bit head heavy", "seems quite powerful");
   **1** a clear statement ("the control is excellent", "it hurt my elbow"); **1.5** measured or tested over time
   ("scored 8.7 for power in the playtest", "after 6 months my elbow is fine", "cracked after two weeks").
4. Mixed statements give two rows only when they are about **different** attributes ("great spin but hard to control"
   → spin +1, control −1). The same attribute both ways → one row with the overall sense, strength 0.5.
5. **Comparisons and conditions are weak.** A quote that only compares or sets a condition ("more power than the V8",
   "less stable than expected", "stable when you hit the centre", "good for a 98") gets strength **0.5** at most.
   Exception: a shop playtest's own category score ("scored 8.7 on serves") is a clear measured statement (1.5): +1 for
   8.0 and up, −1 for 7.0 and under, nothing between. "Less X than / with the other one", "more X than my old racket"
   are comparisons too: 0.5.
   **Not played:** a writer who only imagines or expects ("sounds like work", "I'd guess it's stiff", "looks powerful")
   gives no rows.
6. At most one row per attribute per report (pick the clearest quote). At most 8 rows per report.
7. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts (`review`, `summary`,
   `excerpt` or `translation`): same characters, case, punctuation, accents and spacing. Copy it; never paraphrase, fix
   typos or join pieces. At least 8 characters; usually the clause that states it (3–20 words).
8. Summaries (`summary`) are ours and already paraphrase the source; quote them as written. Don't treat our summary's
   hedges ("the reviewer found") as weaker than the excerpt. Playtest, blog and YouTube summaries often state several
   attributes: give a row for each one they state clearly.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3 for players, more for reviewers), e.g.
{"w:123": [], "p:456": [{"attribute": "spin", "value": 1, "strength": 1, "quote": "Really easy to get topspin with this racket"}, {"attribute": "arm", "value": 1, "strength": 1, "quote": "my elbow doesn't hurt after long hitting sessions anymore"}], "w:789": [{"attribute": "level", "level": "beginner", "strength": 1, "quote": "recommending it primarily for developing players"}]}
Valid JSON only (escape quotes inside strings). Keep any scratch files in your own subfolder.
