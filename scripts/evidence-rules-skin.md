# Evidence reader rules (SkinRecs; ENGINE-PLAN.md section B, pass A approved 2026-11-15)

You read stored reports about skincare products and write down **only the facts a report states** about the product it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product`, `type` (Moisturizer,
Sunscreen, …) and one or more stored texts: `review` (a user's own review), `summary` (our summary of a web report or video),
`excerpt` (the source's own words) and `translation` (our English translation of a non-English excerpt).

## Attributes (skin profile)

| attribute | +1 means | −1 means |
|---|---|---|
| `skin_type` | — the **writer's own** skin type; use `group` instead of `value` (see below) | |
| `hydration` | hydrating, moisturizing, skin feels plump / comfortable for hours | drying, stripping, tight or flaky after, not moisturizing enough |
| `gentle` | gentle, no irritation, calming, fine on reactive skin | irritating, stinging, burning, redness, rash, itchy |
| `breakouts` | cleared or reduced breakouts / acne / clogged pores | broke them out, clogged pores, closed comedones, milia, purging that didn't stop |
| `finish` | dewy, glowy, shiny, leaves a sheen | matte, mattifying, dry-touch, no shine |
| `texture` | rich, thick, heavy, greasy, occlusive, buttery | light, lightweight, watery, gel, thin, sinks in fast |

`finish` and `texture` are positions, not praise: "too greasy for me" is texture +1 (rich) even though it's a complaint;
"lovely matte finish" is finish −1.

## The writer's skin type (`skin_type`)

`{"attribute": "skin_type", "group": "dry" | "oily" | "combination" | "normal" | "sensitive" | "acne", "quote": "…"}`

- Only the **writer's own** skin (or the reviewer's, in our summaries: "Has oily skin", "their dry skin", "I'm oily").
  Rosacea, eczema, perioral dermatitis and "reactive skin" count as `sensitive`; acne-prone, breakout-prone, hormonal or cystic
  acne count as `acne`; dehydrated alone is not a type.
- "Normal to dry" / "normal-to-oily" → only the non-normal type (dry / oily).
- `finish` is only how the product leaves the skin looking (matte vs dewy / shiny), not the writer's skin getting less oily over weeks.
- Several types → one row each ("my oily, acne-prone skin" → oily and acne).
- Advice or claims are **not** the writer's type: "great for oily skin", "made for dry skin", "if you have sensitive skin",
  "my sister has dry skin", "I don't have sensitive skin" → no row.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}` (or the `skin_type` shape above).

1. **State, don't infer.** A row needs words that say it. "Love it", "holy grail", "repurchased", five stars are verdicts,
   not attributes: **no row**. Don't infer hydration from "ceramides" or gentleness from "fragrance-free"; ingredients and
   claims are not evidence here. Don't add general knowledge about the product.
2. **Nothing stated → no rows.** That is the normal case: many reports give `[]`.
3. `strength`: **0.5** passing or hedged ("a bit greasy", "fairly hydrating", "slight tingle"); **1** a clear statement
   ("very hydrating", "it burned my skin"); **1.5** tested over time ("after 3 months no breakouts at all", "every time I use it
   my cheeks go red").
4. Only the product in `product`. Comparisons with other products give rows only when they say something clear about this one
   ("richer than the Cetaphil" → texture +1, strength 0.5).
5. At most one row per attribute per report (pick the clearest quote), plus skin_type rows. At most 6 rows per report.
6. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts: same characters, case, punctuation
   and spacing. Copy it; never paraphrase, fix typos or join pieces. At least 6 characters; usually the clause (3–20 words).
7. Summaries are ours and already paraphrase the source; quote them as written.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3), e.g.
{"w:1": [], "w:2": [{"attribute": "skin_type", "group": "oily", "quote": "Has oily skin"}, {"attribute": "finish", "value": -1, "strength": 1, "quote": "keeps them matte all day"}], "w:3": [{"attribute": "gentle", "value": -1, "strength": 1, "quote": "it stung and left red patches"}]}
Valid JSON only (escape quotes inside strings).
