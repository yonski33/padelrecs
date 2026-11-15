// Tennis reader rows for the two attributes the shared checker doesn't know yet (scripts/evidence-rules-tennis.md):
// `feel` (+1 soft / −1 crisp) and `swing` (+1 rewards full swings / −1 suits compact swings). Kept as evidence until the
// engine scores axes (owner 2026-11-15). Reads <dir>/in and <dir>/out like check-evidence-output.mts, applies the same
// checks (strength, value, verbatim quote, one row per attribute per report) and writes <dir>/extra-rows.jsonl.
// --write replaces earlier rows for the same reports (source_ref "<report>#reader:<attribute>").
//   NICHE=tennis npx tsx --conditions=react-server --env-file=.env.local scripts/tennis-extra-evidence.mts <dir> [--write]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { EXTRACTORS, type EvidenceRow, type Strength } from "../lib/evidence";

if (niche.id !== "tennis") throw new Error("NICHE=tennis");
const dir = process.argv.slice(2).find(a => !a.startsWith("--"));
if (!dir) throw new Error("Usage: tennis-extra-evidence.mts <dir> [--write]");
const EXTRA = new Set(["feel", "swing"]);
const data = await catalog();
const meta = new Map<string, { productId: string; kind: EvidenceRow["sourceKind"]; at: string | null }>([
  ...data.reviews.map(r => [`p:${r.id}`, { productId: r.racketId, kind: "own_review" as const, at: r.createdAt }] as const),
  ...data.external.map(e => [`w:${e.id}`, { productId: e.racketId, kind: e.sourcePlatform === "YouTube" ? "youtube" as const : e.sourcePlatform === "Blog" ? "blog" as const : "player_report" as const, at: e.sourceDate || e.createdAt }] as const),
]);
const rows: EvidenceRow[] = [];
let dropped = 0;
for (const f of readdirSync(join(dir, "in")).filter(x => x.endsWith(".json")).sort()) {
  const outFile = join(dir, "out", f);
  if (!existsSync(outFile)) continue;
  const input = JSON.parse(readFileSync(join(dir, "in", f), "utf8")) as Record<string, string>[];
  const output = JSON.parse(readFileSync(outFile, "utf8")) as Record<string, Record<string, unknown>[]>;
  for (const rep of input) {
    const m = meta.get(rep.id), got = output[rep.id];
    if (!m || !Array.isArray(got)) continue;
    const texts = [rep.review, rep.summary, rep.excerpt, rep.translation].filter((x): x is string => !!x), seen = new Set<string>();
    for (const raw of got) {
      const a = String(raw.attribute ?? ""), q = typeof raw.quote === "string" ? raw.quote : "";
      if (!EXTRA.has(a)) continue;
      if (seen.has(a) || ![0.5, 1, 1.5].includes(Number(raw.strength)) || (raw.value !== 1 && raw.value !== -1) || q.length < 8 || !texts.some(t => t.includes(q))) { dropped++; continue; }
      seen.add(a);
      rows.push({ productId: m.productId, sourceKind: m.kind, sourceRef: `${rep.id}#reader:${a}`, authorKey: null, attribute: a, value: Number(raw.value),
        valueText: a === "feel" ? (raw.value === 1 ? "soft" : "crisp") : (raw.value === 1 ? "full swings" : "compact swings"), strength: Number(raw.strength) as Strength, quote: q, saidAt: m.at, extractedBy: EXTRACTORS.reader });
    }
  }
}
writeFileSync(join(dir, "extra-rows.jsonl"), rows.map(r => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
for (const a of EXTRA) console.log(`  ${a}: +${rows.filter(r => r.attribute === a && r.value! > 0).length} / −${rows.filter(r => r.attribute === a && r.value! < 0).length}`);
console.log(`${rows.length} feel / swing rows kept, ${dropped} dropped → ${join(dir, "extra-rows.jsonl")}`);
if (process.argv.includes("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${EXTRACTORS.reader} and attribute in ('feel', 'swing')`);
    for (let i = 0; i < rows.length; i += 500) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(rows.slice(i, i + 500).map(r =>
      sql`(${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`), sql`, `)}`);
  });
  console.log(`saved ${rows.length} feel / swing rows into ${niche.schema}.evidence`);
}
process.exit(0);
