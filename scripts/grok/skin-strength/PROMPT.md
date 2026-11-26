# SkinRecs: active strength and leave-on acids, from ingredient lists

You get a JSON pack of skincare products: `id`, `name`, `brand`, `category`, and `maker_url` (the maker's page we list).
For **each** product, find its current ingredient list (INCI). Prefer INCIDecoder (`https://incidecoder.com/products/…`).
If INCIDecoder doesn't have it, use the maker's page. Then judge how strong its actives are for a face.

Return **only** a JSON array, one object per product, in the pack's order:

```json
{"id": "<pack id>", "inci_url": "https://…", "first5": ["Aqua", "…"],
 "strength": "strong|moderate|gentle", "reason": "retinoid|aha|bha|aha+bha|pha|vitamin c 15%+|alcohol first|benzoyl peroxide|sulfur|none|other: …",
 "acid": "none|aha|bha|pha|aha+bha|aha+pha|bha+pha", "acid_ingredients": ["Glycolic Acid"],
 "leave_on": true, "sources": ["https://…"], "unsure": false, "note": ""}
```

Rules:
- **strong**: any of the following.
  - A retinoid (retinol, retinal/retinaldehyde, retinyl esters at a stated strength, hydroxypinacolone retinoate, adapalene, tretinoin).
  - A leave-on AHA at 5%+ or BHA at 1%+. Glycolic, lactic or mandelic acid in the first 5 counts as 5%+ when the maker gives no %.
  - L-ascorbic acid at 15%+.
  - Denatured or isopropyl alcohol as ingredient 1–3 in a leave-on product.
  - Benzoyl peroxide.
  - Sulfur at 3%+.
- **moderate**: a lower-strength active (AHA under 5%, BHA under 1%, PHA, azelaic acid, niacinamide 10%+, vitamin C under 15% or a vitamin C derivative, retinoid-like bakuchiol).
- **Essential oils are fragrance, not strength.** They never make a product strong or moderate; rate it on its actives alone (we track fragrance separately).
- **gentle**: none of the above.
- Rinse-off cleansers and masks are at most **moderate** unless they contain benzoyl peroxide or 2%+ salicylic acid. Set `leave_on: false` for them.
- `acid`: the AHA/BHA/PHA family present anywhere in the list (`none` if none). Name each in `acid_ingredients` as written in the INCI.
- `first5`: the first 5 INCI names exactly as listed.
- `sources`: every page you used (https only). `inci_url` must be one of them.
- **Never guess.** If you can't find this exact product's list (same name and variant), set `unsure: true`, `strength` and `acid` to `null`, and say why in `note`.
- Don't add medical claims. This is about cosmetic formulation only.
