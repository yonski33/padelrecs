# Player tip rules (all Recs sites)

You read stored reports about products on a Recs site and pull out the small practical tips they give, the kind a
club-mate passes on: "ask the shop to weigh a few, pick one under 370 g", "softer in summer, harder in the cold",
"put a head protector on from day one". Each input file is a JSON array of objects with `id`, `product` and one or more
stored texts: `review` (a player's own review), `summary` (our summary of a web report), `excerpt` (the source's own words)
and `translation` (our English translation of a non-English excerpt).

1. A tip is **actionable advice or a practical observation someone could act on** about this product:
   - `buying`: what to check or choose before buying (weigh a few, pick the lighter version, size up, which variant)
   - `setup`: grips, overgrips, protectors, strings, added weight, how it is set up to play its best
   - `conditions`: when it plays differently (heat, cold, humidity, altitude, indoor/outdoor, surface)
   - `adapting`: how long it takes to get used to it, or what to change in your game while you do
   - `care`: how to protect it or make it last (head protector, don't leave it in a hot car, check the frame)
2. **A plain complaint is not a tip.** "The paint chips" alone is not one; "use a head protector because the paint chips"
   is. Likewise praise, specs and verdicts ("great power", "weighs 365 g", "best I've owned") are not tips.
   An observation counts only when a reader could act on it ("it gets noticeably harder in the cold" counts as conditions).
3. **Never invent a tip.** Only take what the text itself says or plainly implies. Don't add general advice you know.
   **"None" is the normal answer:** most reports give no tip, and an empty list is the right output for them.
4. At most 3 tips per report; usually 0, sometimes 1.
5. `text` is our own short paraphrase: **one sentence of 18 words or fewer**, in a plain club-mate voice ("Ask the shop
   to weigh a few and pick one under 370 g."). No "the reviewer says", no hype, no product name unless it is needed.
6. `quote` is the evidence: an **EXACT, contiguous substring** of ONE of the stored texts (`review`, `summary`, `excerpt`
   or `translation`): same characters, case, punctuation, accents and spacing. Copy it; never paraphrase, fix typos or join
   pieces. At least 12 characters; usually the clause that holds the tip (5–25 words).
7. Pick the `kind` that fits best from the five above; no other kinds.

Output: one JSON object mapping each id to a list of 0–3 tips, covering EVERY id in the input, e.g.
{"w:123": [], "p:456": [{"kind": "setup", "text": "Add an overgrip early; the stock grip gets slippery in the heat.", "quote": "the stock grip gets slippery once it's warm, so I put an overgrip on"}], "w:789": []}
Valid JSON only (escape quotes inside strings). Keep any scratch files in your own subfolder.
