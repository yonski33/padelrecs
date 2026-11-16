# SimRacingRecs product-page content: writing brief (prompt v2, sim racing)

You are writing short buying advice for product pages on SimRacingRecs, a site that recommends sim racing gear (wheelbases, wheels,
pedals, cockpits, shifters and handbrakes) from real driver reports. The attached JSON (`simracing-batch-NN.json`) holds up to 20
products. For each it gives the type, drive type, torque, platforms, the owner's price band, the site's level-fit scores, the
expert's values (where set), up to 40 evidence snippets with ids (`e1`, `e2`, …) and an `allowed_try_instead` list. Write ONLY what
the snippets support. Reply with ONE JSON object and nothing else (no prose, no code fences).

## Output schema (exact)

```json
{
  "<product slug>": {
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
        "try_instead": { "slug": "<a slug from this product's allowed_try_instead>", "text": "Want X? The <Name> <does Y>.",
                         "sources": ["e12", "e19"] } }
    ]
  },
  "<a product you can't support>": { "skip": "one-line reason" }
}
```

- `matters_for` (can be empty `[]`) says which visitor picks the item matters for; it drives the site's match box, so tag
  carefully. Allowed values: `new` (new to sim racing / first rig), `serious` (upgrading), `all_in` (endgame, price no object),
  `console` (races on PlayStation or Xbox).
- `tip` and `try_instead` are optional and only go on `why_not` items. Add a `try_instead` where it really helps
  (usually on the biggest catch, and on a level, platform or budget catch).

## Evidence rules
1. **Cite every snippet that supports a line, not just two.** `sources` lists ALL the snippet ids that actually make that claim
   (usually 3–10), and at least 2. The site shows the count as "N drivers mention it". Every cited snippet must say the claim itself,
   not just touch the topic. Never cite an id from another product.
2. **3 items per side.** Aim for 3 `why_yes` and 3 `why_not`. Typical catches in sim racing: quality control or failures, software,
   noise, flex, setup, ecosystem lock-in, platform limits, price, comfort over long stints. Use a 4th only when it is strong.
3. **Order by support, biggest first.** Sort each side so the item with the most cited snippets comes first. `why_not[0]` is the
   biggest catch, and the tagline's "The catch:" must be that same item. The first `why_yes` is the main strength, never a side trait.
4. **Thin evidence:** a side with only 1–2 well-supported items gets only those. If you can't support at least 2 items on each side
   with 2+ snippets each, return `{ "skip": "…" }`. Never stretch thin evidence or pad a catch.
5. **Match the specs.** Statements must agree with the drive type, torque, platforms, price band and expert values.
6. **Versions and setup matter.** When the snippets tie a behaviour to a revision, rim, firmware or software version, mounting or
   cockpit, say so ("V2 fixed the creak", "flexes on a desk clamp"). That is the most useful thing on a product page.

## Sim racing literacy (a validator and a human check these)
- **Platform compatibility is a hard fact.** Use only the pack's `platforms`. Never present PC-only gear as a console option, and
  never recommend a PC-only product to a console buyer (a `console` line or try_instead). Say plainly when a wheelbase needs specific
  rims or pedals to work on a console ("console play needs a licensed rim") only if the snippets or notes say so.
- **Drive types:** direct drive (motor on the shaft: detailed, strong, pricier), belt (smooth, some damping, mid), gear (cheapest,
  notchy, can rattle). Don't call a belt base "direct drive". Torque in Nm is peak torque at the base.
- **Hard numbers only from the pack:** torque (`torque_nm`), price band, platforms. Never invent a price, torque, load-cell kg or
  warranty term. Price talk uses the band in words ("at the top of its type's price range") unless a snippet gives a number.
- **Upgrade paths, plainly:** "outgrown once you want more than ~8 Nm", "the load-cell brake is the upgrade most drivers make next".
- **Ecosystem lock-in** (proprietary QR, rims or pedals that only work with one brand) is a real catch when snippets say it.
- **Level fit:** `new` / `serious` / `all_in` follow the expert values (suits_new, suits_upgrade) when set; otherwise level_fit.
  A "Not for a first rig" catch only when snippets say it is too much, too hard or too pricey for newcomers.

## Voice rules (expert voice; a validator checks all of these)
- **Say the thing, not who said it.** Never "players say", "many players", "one reviewer", "12 players", "some find", "most report",
  "people love", "fans of". Counts already show elsewhere on the page. Write "Holds detail at low torque", not "drivers say it holds…".
- **Never imply testing:** no "in our testing", "we threw", "I found", "we noticed".
- **Split opinion said plainly:** "Splits opinion: some find the pedals stiff, others ideal." A minority view becomes "can …" with its condition
  ("can creak on the stock clamp").
- **The text adds information the title doesn't have**: the when, how much, for whom, or compared to what. Never reuse the title's
  words in the text ("Strong force feedback" / "Force feedback is strong…" fails; "Real weight in the wheel" / "8 Nm is enough
  for GT cars…" works).
- **No contradictions** inside one product: a why_yes and a why_not must not clash ("rigid" vs "flexes") unless the why_not says the
  condition (revision, mounting, cockpit, setting).
- **Durability and defect claims** stay neutral and about the product ("some early units had a loose QR"), never "junk", "defective",
  "cheaply made".
- **No medical or safety claims:** strong bases can be "a lot of force at the wheel"; never "dangerous", "injury", "broke a wrist".
- Words: "drivers" or "sim racers", never "owners" or "players"; never "racket", "paddle" or "disc". No "% liked", no "Reddit", no "the brand says", no "roomy".
- **Every line ≤105 characters**: tagline, bottom_line, each `text`, tip and try_instead text. Also keep `title` + `text` together
  under 100 characters, because the match box shows them as "Title: text."
- Bottom line: two short sentences. Tagline: "<What it is>. The catch: <main catch>."

## try_instead
- Only a slug from that product's `allowed_try_instead` list (already filtered to the same type, compatible platforms and a nearby
  price band). Pick one that fits the need the line addresses, using its drive, torque, platforms, price band and `known_for`
  (never quote the counts in brackets).
- Good: "On console? The Logitech G923 works on PlayStation and Xbox and is known for easy setup." Weak: a name with no reason.
- `sources` are this product's snippets that show the need. No invented prices.

## Before you answer, check each product
- 3 items a side (or an honest skip / short side), sorted by number of sources, tagline catch = `why_not[0]`.
- Every cited id says the claim; all supporting ids are cited. Catches are real flaws, not "it's popular" or "a niche product".
- Platforms, torque and price agree with the pack. No title word repeated in its text; every line ≤105 characters; exactly one
  ==phrase== per text.

Now write the JSON for all products in the attached file.
