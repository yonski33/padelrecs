// A spec-based level for TennisRecs rackets with no expert level (owner OK 2026-11-16): evidence rows `level` from
// extractor spec-level-v1 (source = the specs), which app/match-context.ts blends in at half the weight of an expert level.
// An expert level always wins. Rule, checked against the owner's 112 expert levels (97 agree, none two steps off):
//   beginner-intermediate  head ≥ 104 sq in or ≤ 285 g unstrung (not when ≥ 315 g)
//   advanced               ≥ 315 g unstrung, an 18x20 pattern, or ≤ 97 sq in at 300 g+
//   intermediate-advanced  the rest
// Strung weights count 15 g over unstrung. Dry run by default; --write replaces earlier spec-level-v1 rows.
//   NICHE=tennis npx tsx --conditions=react-server --env-file=.env.local scripts/tennis-spec-levels.mts [--write]
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { traitOverrides } from "../db/trait-override";
import { EXTRACTORS } from "../lib/evidence";

if (niche.id !== "tennis") throw new Error("NICHE=tennis");
const head = (s?: string | null) => Number(s?.match(/(\d{2,3})\s*sq/)?.[1] ?? NaN);
const grams = (s?: string | null) => { const g = Number(s?.match(/(\d{3})\s*g/)?.[1] ?? NaN); return /strung/.test(s ?? "") && !/unstrung/.test(s ?? "") ? g - 15 : g; };
export function specLevel(r: { shape?: string | null; weight?: string | null; core?: string | null }): string | null {
  const h = head(r.shape), g = grams(r.weight);
  if (!Number.isFinite(h) || !Number.isFinite(g)) return null;
  if ((h >= 104 || g <= 285) && g < 315) return "beginner-intermediate";
  if ((h <= 97 && g >= 300) || g >= 315 || /18x20/.test(r.core ?? "")) return "advanced";
  return "intermediate-advanced";
}
const BAND: Record<string, string> = { "beginner-intermediate": "0-1", "intermediate-advanced": "1-2", advanced: "2-2" };
const [data, ov] = await Promise.all([catalog(), traitOverrides()]);
const rows = data.listed.filter(r => !ov.get(r.id)?.expert?.suits_beginner).flatMap(r => { const l = specLevel(r); return l ? [{ r, l }] : []; });
const split = new Map<string, number>(); for (const x of rows) split.set(x.l, (split.get(x.l) ?? 0) + 1);
console.log(`${rows.length} rackets get a spec level: ${[...split].map(([k, v]) => `${k} ${v}`).join(", ")}`);
if (process.argv.includes("--write")) {
  const db = await database(), s = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${s}.evidence where niche = ${niche.id} and extracted_by = ${EXTRACTORS.specLevel}`);
    for (const { r, l } of rows) await tx.execute(sql`insert into ${s}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
      values (${r.id}, ${niche.id}, 'maker', 'specs#level-rule', null, 'level', ${Number(BAND[l][0])}, ${l}, 0.5, ${[r.shape, r.weight, r.core].filter(Boolean).join(" · ")}, null, ${EXTRACTORS.specLevel}, ${now})`);
  });
  console.log(`saved ${rows.length} spec-level rows into ${niche.schema}.evidence`);
}
process.exit(0);
