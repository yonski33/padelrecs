// SkinRecs data fixes from the match audit (skinrecs-match-audit.md "Spec and data errors"; owner OK needed before --write).
// Dry run by default: prints what each row is now and what it would become.
//   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-tuning-fixes.mts [--write]
// - fragrance_free → oils (owner rows, which win over maker rows): Dr. Jart+ Cicapair Tiger Grass Cream (lavender, grapefruit-peel,
//   rosemary oils), Sunday Riley Pink Drink (lemon-peel oil), Haruharu Wonder Black Rice Hyaluronic Toner (the original we list:
//   lavender oil, linalool). Sources: incidecoder.com/products/… in the audit.
// - The Ordinary Glycolic Acid 7% Exfoliating Toner: shape Toner → Exfoliant, and use = body-first (×0.85 on face lists).
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

const TAG = "owner-tuning-2026-11-17";
const FACTS: { id: string; attribute: string; value: number; valueText: string; why: string }[] = [
  { id: "dr-jart-cicapair-tiger-grass-cream", attribute: "fragrance_free", value: 0, valueText: "oils", why: "lavender oil #38, grapefruit-peel oil #42, rosemary-leaf oil #45 (incidecoder.com/products/dr-jart-cicapair-tiger-grass-cream)" },
  { id: "sunday-riley-pink-drink-firming-resurfacing-essence", attribute: "fragrance_free", value: 0, valueText: "oils", why: "lemon-peel oil #29 (incidecoder.com/products/sunday-riley-pink-drink-2)" },
  { id: "haruharu-wonder-black-rice-hyaluronic-toner", attribute: "fragrance_free", value: 0, valueText: "oils", why: "original SKU: lavender oil #29, linalool #30 (incidecoder.com/products/haruharu-wonder-black-rice-hyaluronic-toner)" },
  { id: "the-ordinary-glycolic-acid-7-exfoliating-toner", attribute: "use", value: 0, valueText: "body-first", why: "own line 'Popular for body use; can sting on facial skin'; page 'Too strong for many faces'" },
];
const SHAPES = [{ id: "the-ordinary-glycolic-acid-7-exfoliating-toner", shape: "Exfoliant", why: "glycolic acid is ingredient #2; leave-on 7% AHA" }];

const data = await catalog(), ev = await evidenceRows();
const byId = new Map(data.rackets.map(r => [r.id, r]));
for (const f of FACTS) {
  const r = byId.get(f.id); if (!r) throw new Error(`no product ${f.id}`);
  const now = ev.filter(e => e.productId === f.id && e.attribute === f.attribute).map(e => `${e.sourceKind}:${e.valueText ?? e.value}`).join(", ") || "none";
  console.log(`${r.name}: ${f.attribute} ${now} → owner:${f.valueText} (${f.why})`);
}
for (const s of SHAPES) { const r = byId.get(s.id); if (!r) throw new Error(`no product ${s.id}`); console.log(`${r.name}: shape ${r.shape} → ${s.shape} (${s.why})`); }
if (!process.argv.includes("--write")) { console.log("dry run: nothing written (add --write after the owner's OK)"); process.exit(0); }
const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), at = new Date().toISOString();
await db.transaction(async tx => {
  await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${TAG}`);
  for (const f of FACTS) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
    values (${f.id}, ${niche.id}, 'owner', ${`tuning:${f.id}`}, 'owner', ${f.attribute}, ${f.value}, ${f.valueText}, 1, null, ${at}, ${TAG}, ${at})`);
  for (const s of SHAPES) await tx.execute(sql`update ${schema}.rackets set shape = ${s.shape} where id = ${s.id}`);
});
console.log(`wrote ${FACTS.length} owner facts and ${SHAPES.length} shape change`);
process.exit(0);
