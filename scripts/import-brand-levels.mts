// The brand's stated level per racket (owner's sheet, site-jobs/padel-brand-levels.csv, 2026-11-15) into the evidence store as
// maker rows: attribute "level", value = lowest level index, value_text = "from-to" band, quote = the sheet's note (source
// and URL). A weak prior only (lib/level-suits.ts): "advanced / professional" from a brand never excludes a racket on its own.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/import-brand-levels.mts <sheet.csv> [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { EXTRACTORS } from "../lib/evidence";

const [file] = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (!file) throw new Error("Usage: import-brand-levels.mts <sheet.csv> [--write]");
// A small CSV reader (quoted fields with commas and doubled quotes).
const parse = (text: string) => { const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows; };
const [head, ...lines] = parse(readFileSync(file, "utf8"));
const col = (n: string) => head.indexOf(n);
const LV = ["beginner", "intermediate", "advanced"];
const data = await catalog();
const bySlug = new Map(data.rackets.map(r => [r.slug, r.id]));
const rows: { productId: string; ref: string; band: string; from: number; quote: string }[] = [];
const skipped: string[] = [];
for (const l of lines) {
  const slug = l[col("slug")], band = (l[col("brand_level")] ?? "").trim().toLowerCase(), note = (l[col("notes")] ?? "").trim();
  const id = bySlug.get(slug);
  const parts = band.split("-").map(x => LV.indexOf(x));
  if (!id || !band || parts.some(i => i < 0)) { skipped.push(`${slug} (${band || "no level"})`); continue; }
  const url = note.match(/https?:\/\/\S+/)?.[0]?.replace(/[).,]+$/, "") ?? "brand-sheet";
  rows.push({ productId: id, ref: url, band: `${parts[0]}-${parts.at(-1)}`, from: parts[0], quote: note || band });
}
console.log(`${rows.length} brand levels, ${skipped.length} skipped: ${skipped.join(", ")}`);
const count = new Map<string, number>(); for (const r of rows) count.set(r.band, (count.get(r.band) ?? 0) + 1); console.log([...count]);
if (process.argv.includes("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${EXTRACTORS.brandLevel}`);
    await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(rows.map(r =>
      sql`(${r.productId}, ${niche.id}, 'maker', ${r.ref}, ${"brand"}, 'level', ${r.from}, ${r.band}, 1, ${r.quote}, null, ${EXTRACTORS.brandLevel}, ${now})`), sql`, `)}`);
  });
  console.log(`saved ${rows.length} brand level rows`);
}
process.exit(0);
