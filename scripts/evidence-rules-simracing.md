# Evidence reader rules (SimRacingRecs; ENGINE-PLAN.md section B, full pass approved 2026-11-15)

You read stored reports about sim racing gear and write down **only the facts a report states** about the product it is
filed under, as evidence rows. Each input file is a JSON array of objects with `id`, `product`, `type` (Wheelbase, Wheel,
Pedals, Cockpit, Shifter / handbrake) and one or more stored texts: `summary` (our summary of a forum post, video or blog
review), `excerpt` (the source's own words) and sometimes `review` or `translation`.

## Attributes (sim racing profile)

Only use an attribute where the `type` is listed.

| attribute | types | +1 means | −1 means |
|---|---|---|---|
| `ffb_detail` | Wheelbase | detailed, nuanced force feedback: feel the road, grip, kerbs, tyre slip, smooth and precise | numb, vague, grainy, notchy, cogging felt in the wheel, lacks detail, clipping |
| `ffb_strength` | Wheelbase | strong, plenty of torque, heavy, more than enough force | weak, not enough torque, too light, runs out of force |
| `brake_feel` | Pedals | great brake feel: realistic, progressive, consistent, easy to modulate, trail-brake | spongy, inconsistent, hard to modulate, vague, too soft / unrealistic brake |
| `rigidity` | Cockpit, Pedals, Shifter / handbrake | rigid, stable, no flex, no wobble, rock solid | flex, wobble, bends, moves under braking |
| `build` | all | well built, premium materials, solid, still fine after long use | broke, failed, defect, RMA, quality control problem, wore out, loose, cheap plastic |
| `quiet` | Wheelbase, Pedals, Shifter / handbrake | quiet, silent | noisy, loud, whine, rattle, clunk, squeak |
| `setup` | all | easy to set up / assemble / mount, plug and play, worked out of the box | hard or long to assemble, fiddly mounting, poor instructions, needed lots of tuning to work |
| `software` | Wheelbase, Wheel, Pedals | good software / app / firmware / drivers, easy to tune | buggy software, firmware problems, driver issues, disconnects caused by software, bad app |
| `ergonomics` | Wheel, Cockpit, Shifter / handbrake | comfortable grip, good button / paddle reach, good seating position, nice shift feel | uncomfortable, awkward reach, bad seating position, cramped |
| `value` | all | good value, worth the price, great for the money | overpriced, not worth it, too expensive for what it is |
| `driver` | all (`upgrade`: Wheelbase, Pedals, Cockpit only) | — who the **writer** is; use `group` instead of `value` (see below) | |

## Who the writer is (`driver`)

`{"attribute": "driver", "group": "new" | "upgrade", "quote": "…"}`

- `new`: the writer says this is their **first** wheel, pedals or rig, or that they're new to sim racing or a beginner
  ("my first wheel", "just getting into sim racing", "as a beginner").
- `upgrade`: the writer **moved up to this product from a named or described lower-tier one** ("upgraded from a G29",
  "coming from a CSL DD", "my old T300 → this").
- Not the writer: advice or claims ("great for beginners", "a good first wheel", "if you're upgrading from…") → no row.
  Planning to upgrade *away from* this product ("already looking to upgrade from it") → no `upgrade` row. The product the
  writer moved *to* must be the one in `product`; if they moved to something else, no `upgrade` row.

## Rows

Each row: `{"attribute": …, "value": 1 | -1, "strength": 0.5 | 1 | 1.5, "quote": "…"}` (or the `driver` shape above).

1. **State, don't infer.** A row needs words that say it. "Love it", "best purchase", "10/10" are verdicts, not
   attributes: **no row**. Don't infer brake feel from "load cell" or strength from "25 Nm": specs are not evidence here.
   Don't add general knowledge about the product.
2. **Nothing stated → no rows.** That is the normal case: many reports give `[]`.
3. `strength`: **0.5** passing or hedged ("a bit noisy", "fairly easy to set up"); **1** a clear statement ("the FFB is
   incredibly detailed", "the pedal plate flexes"); **1.5** used over time or measured ("two years of daily use, zero
   issues", "died after 3 months", "measured 2 mm of flex").
4. Only the product in `product`. Comparisons give rows only when they say something clear about this one ("much
   stronger than my G29" → ffb_strength +1, strength 1). A problem with another product in the setup → no row.
5. At most one row per attribute per report (pick the clearest quote), plus driver rows. At most 6 rows per report.
6. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts: same characters, case,
   punctuation and spacing. Copy it; never paraphrase, fix typos or join pieces. At least 6 characters; usually the
   clause (3–20 words).
7. Summaries are ours and already paraphrase the source; quote them as written.

Output: one JSON object mapping **every** input id to a list of rows (usually 0–3), e.g.
{"w:1": [], "w:2": [{"attribute": "driver", "group": "upgrade", "quote": "Coming from a CSL DD"}, {"attribute": "build", "value": 1, "strength": 1, "quote": "they were amazed by the build quality"}], "w:3": [{"attribute": "quiet", "value": -1, "strength": 1, "quote": "the motor whines at low speed"}]}
Valid JSON only (escape quotes inside strings).
