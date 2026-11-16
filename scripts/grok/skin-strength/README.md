# SkinRecs strength and acid pass (Grok, owner OK 2026-11-17)

This pass fills two owner facts the match reads when "reacts easily" is ticked (`app/skin/rank.ts`):
- **`strength`**: strong, moderate or gentle, with the reason.
- **`acid`**: none, aha, bha or pha.

Until the facts are filled, a name rule in `lib/skin-safety.ts` stands in. Owner rows replace it product by product.

1. `python3 build_pack.py <snapshot.json> ../../../db/catalogs/skin.json`
   - Writes `packs/strength-01…08.json` (311 products, 40 per pack).
   - The snapshot comes from `scripts/skin-snapshot.mts`.
2. The owner pastes `PROMPT.md` plus one pack into Grok and saves the reply as `strength-NN.out.json`.
3. `python3 validate.py packs/strength-NN.json strength-NN.out.json` checks:
   - schema, enums, every id answered once;
   - https sources, with `inci_url` among them;
   - acid matches its ingredients;
   - the rinse-off ceiling;
   - and lists where the reply differs from the name rule.
4. **Spot-check 1 in 5.** The validator prints the sample.
   - Open each INCI page and confirm `first5` and the call.
   - If 2 or more of a pack's sample are wrong, re-run that pack.
5. Import the checked replies:
   - Dry run: `NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-strength-import.mts strength-NN.out.json`
   - Then the same command with `--write`, after the owner's OK.
   - Refresh `tests/fixtures/skin-match-snapshot.json` with `scripts/skin-snapshot.mts`, then run `npm test`.
