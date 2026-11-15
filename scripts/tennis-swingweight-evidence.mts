// Swingweights quoted in TennisRecs reports (playtests, blogs, YouTube summaries, players) into the evidence store as
// `lab:swing_weight` rows (ENGINE-PLAN step 2; the tennis profile maps it to maneuverability, lower = quicker). No model:
// a row needs "swingweight" and a number from 270 to 380 in the same sentence of the stored text, and the sentence is kept
// verbatim as the quote. Swingweight is one standard unit everywhere, so all readings rank together (one author key).
// One row per report; a report that quotes several swingweights (a comparison) gives none. --write replaces earlier rows.
//   NICHE=tennis npx tsx --conditions=react-server --env-file=.env.local scripts/tennis-swingweight-evidence.mts <out.jsonl> [--write]
import { writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { EXTRACTORS, type EvidenceRow } from "../lib/evidence";

if (niche.id !== "tennis") throw new Error("NICHE=tennis");
const [out] = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (!out) throw new Error("Usage: tennis-swingweight-evidence.mts <out.jsonl> [--write]");
const data = await catalog();
const SW = /swing ?weight/i;
const N = "(2[7-9]\\d|3[0-7]\\d|380)(?!\\s*(?:g\\b|grams|mm|cm|sq))";
const NEAR = new RegExp(`swing ?weight\\s*(?:of|is|at|around|about|near|=|:|\\(|measured|was|just|only|roughly|~)?\\s*(?:a |an |about |around |roughly |~)?${N}\\b|\\b${N}\\s*(?:\\)\\s*)?swing ?weight`, "gi");
const rows: EvidenceRow[] = [];
let multi = 0;
const texts = [
  ...data.reviews.map(r => ({ id: r.racketId, ref: `p:${r.id}`, kind: "own_review" as const, at: r.createdAt, texts: [r.reviewText] })),
  ...data.external.map(e => ({ id: e.racketId, ref: `w:${e.id}`, kind: e.sourcePlatform === "YouTube" ? "youtube" as const : e.sourcePlatform === "Blog" ? "blog" as const : "player_report" as const,
    at: e.sourceDate || e.createdAt, texts: [e.summary, e.excerptTranslation ?? e.excerpt] })),
];
for (const x of texts) {
  const hits: { v: number; q: string }[] = [];
  for (const t of x.texts) for (const s of (t ?? "").match(/[^.!?\n]+[.!?]*/g) ?? []) {
    const q = s.trim();
    if (!SW.test(q) || !(t ?? "").includes(q)) continue;
    // A customised frame (lead, weighted up, "feels like") isn't the stock racket.
    if (/\b(weighted|lead|leaded|tungsten|customi[sz]|added|adding|feels? like|after)\b/i.test(q)) continue;
    // The number must sit right next to the word: "swingweight of 321", "swing weight: 321", "(measured 329 swingweight)",
    // "321 SW" is not enough (SW alone is too loose). Grams ("320 g") never count.
    const all = [...q.matchAll(NEAR)].map(m => Number(m[1] ?? m[2]));
    for (const v of new Set(all)) hits.push({ v, q });
  }
  const vals = new Set(hits.map(h => h.v));
  if (vals.size > 1) { multi++; continue; }
  if (vals.size === 1) rows.push({ productId: x.id, sourceKind: x.kind, sourceRef: `${x.ref}#lab:swing_weight`, authorKey: "lab:swing_weight", attribute: "lab:swing_weight",
    value: hits[0].v, valueText: null, strength: 1.5, quote: hits[0].q.slice(0, 300), saidAt: x.at, extractedBy: EXTRACTORS.lab });
}
writeFileSync(out, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
console.log(`${rows.length} swingweight rows on ${new Set(rows.map(r => r.productId)).size} rackets → ${out} (${multi} reports with several numbers skipped)`);
if (process.argv.includes("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${EXTRACTORS.lab} and attribute = 'lab:swing_weight'`);
    for (const r of rows) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
      values (${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`);
  });
  console.log(`saved ${rows.length} rows into ${niche.schema}.evidence`);
}
process.exit(0);
