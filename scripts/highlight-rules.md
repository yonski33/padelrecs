# Review highlight rules (all Recs sites)

You pick marker highlights for product reviews on a Recs site. Each input file is a JSON array of
{id, product, verdict, text}. `verdict` is the review's overall verdict: positive, mixed, negative (or unknown).

For EVERY review, choose 1 or 2 phrases to highlight, so a reader skimming the page sees the review's key point at a glance.

1. Every review gets at least 1 highlight. Use 2 when the review has two distinct key points.
2. Each phrase must be an EXACT, contiguous substring of `text`: same characters, case, punctuation, accents and spacing.
   Copy it; never paraphrase, fix typos, or join pieces.
3. Length: 2 to 9 words (roughly 10–60 characters), never more than 11 words or 75 characters, and never most of the
   review: on a short review pick its core (for "The best vitamin C serum they have tried." pick "The best vitamin C serum").
4. Highlight claims about the product itself: how it performs, feels, sounds, fits, lasts, what it does well or badly,
   value, or the verdict ("best I've owned", "returned it after a week").
5. Do NOT highlight context: who the reviewer is, how long they used it, what they switched from, prices, shops, or the
   product name alone.
6. Prefer the most specific, informative phrase: "battery lasts two full days" beats "battery".
7. Two phrases must not overlap. Start and end on whole words; no leading or trailing spaces or commas.
8. Balance, following the verdict:
   - mixed: if the text has both a good and a bad point, pick one of each. Only if it truly has one side, pick from it.
   - positive: at least one phrase is praise; at most one is a complaint (a caveat is welcome when the review gives one).
   - negative: at least one phrase is a complaint; at most one is praise.
9. If a review has no clear claim, still pick its most useful short phrase about the product.

Output: one JSON object mapping each id to an array of 1–2 phrase strings, covering every id in the input, e.g.
{"p:123": ["absorbs fast with no white cast", "pilled under my foundation"], "w:456": ["broke me out within a week"]}
Valid JSON only (escape quotes inside phrases). Keep any scratch files in your own subfolder.
