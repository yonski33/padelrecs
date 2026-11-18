// SimRacingRecs: catalogue corrections from a maker-page data check (Grok, 2026-11-17, simracingrecs-data-check.md).
// Input: a JSON array of { name, set: { balance?, weight?, core?, surface? }, note?, source }. Each set value replaces the
// column (type, torque / brake force, platforms); `note` is added to the Notes column (surface) unless already there. A
// platforms change also updates the product's owner-sheet platform row (owner-sheet-v1), which wins over the column on the
// v2 pages, so both say the same. The maker URL goes into db/catalogs/simracing.json's sources with the same values.
// Dry run by default (prints old → new per field, with the source); --check rolls the DB write back; --write writes.
//   NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-data-fix.mts <fixes.json> [--check|--write]
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { platformsOf } from "../lib/attr-profile-simracing";

if (niche.id !== "simracing") throw new Error("Run with NICHE=simracing.");
const args = process.argv.slice(2), check = args.includes("--check"), write = args.includes("--write") || check;
const [file] = args.filter(a => !a.startsWith("--"));
if (!file) throw new Error("Usage: simracing-data-fix.mts <fixes.json> [--check|--write]");
type Col = "balance" | "weight" | "core" | "surface" | "review_summary";
/** The catalogue file holds the spec columns only; the review summary lives in the database alone. */
const CATALOG_COLS = new Set<Col>(["balance", "weight", "core", "surface"]);
type Fix = { name: string; set?: Partial<Record<Col, string | null>>; note?: string; source: string };
const fixes = JSON.parse(readFileSync(file, "utf8")) as Fix[];
const LABEL: Record<Col, string> = { balance: "type", weight: "torque/force", core: "platforms", surface: "notes", review_summary: "summary" };
const R = <T,>(x: unknown) => (Array.isArray(x) ? x : (x as { rows: T[] }).rows) as T[];
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = R<{ id: string; name: string; shape: string; balance: string | null; weight: string | null; core: string | null; surface: string | null; review_summary: string | null }>(await db.execute(sql`select id, name, shape, balance, weight, core, surface, review_summary from ${S}.rackets`));
const owner = R<{ product_id: string; value_text: string }>(await db.execute(sql`select product_id, value_text from ${S}.evidence where niche = ${niche.id} and extracted_by = 'owner-sheet-v1' and attribute = 'platform'`));
const ownerPlat = new Map(owner.map(o => [o.product_id, o.value_text]));
const plan: { id: string; name: string; cols: Partial<Record<Col, string | null>>; ownerPlat?: string; source: string }[] = [], bad: string[] = [];
for (const f of fixes) {
  const r = rows.filter(x => x.name === f.name);
  if (r.length !== 1) { bad.push(`${f.name}: ${r.length} matches`); continue; }
  const p = r[0], cols: Partial<Record<Col, string | null>> = {};
  for (const [k, v] of Object.entries(f.set ?? {}) as [Col, string | null][]) if ((p[k] ?? null) !== v) cols[k] = v;
  if (f.note) { const cur = cols.surface ?? p.surface; if (!cur?.toLowerCase().includes(f.note.toLowerCase())) cols.surface = cur ? `${cur}; ${f.note[0].toLowerCase()}${f.note.slice(1)}` : f.note; }
  if ((cols.surface?.length ?? 0) > 200) { bad.push(`${f.name}: notes over 200 chars`); continue; }
  // The owner row holds the plain platform list ("PC, Xbox"), so it gets the new column's platforms in that form.
  const norm = cols.core === undefined ? undefined : platformsOf(cols.core)?.join(", ");
  const op = norm && ownerPlat.has(p.id) && ownerPlat.get(p.id) !== norm ? norm : undefined;
  if (!Object.keys(cols).length) { bad.push(`${f.name}: already right`); continue; }
  plan.push({ id: p.id, name: p.name, cols, ownerPlat: op, source: f.source });
  console.log(`\n${p.name} (${p.shape})   ${f.source}`);
  for (const [k, v] of Object.entries(cols) as [Col, string | null][]) console.log(`  ${LABEL[k].padEnd(13)} ${JSON.stringify(p[k] ?? "")} → ${JSON.stringify(v ?? "")}`);
  if (ownerPlat.has(p.id) && cols.core !== undefined) console.log(`  owner sheet   ${JSON.stringify(ownerPlat.get(p.id))} → ${op === undefined ? "(same)" : JSON.stringify(op)}`);
}
console.log(`\n${plan.length} products to change; ${bad.length} skipped${bad.length ? `:\n  ${bad.join("\n  ")}` : ""}`);
if (write) {
  await db.transaction(async tx => {
    for (const p of plan) {
      for (const [k, v] of Object.entries(p.cols) as [Col, string | null][]) await tx.execute(sql`update ${S}.rackets set ${sql.identifier(k)} = ${v} where id = ${p.id}`);
      if (p.ownerPlat !== undefined) await tx.execute(sql`update ${S}.evidence set value_text = ${p.ownerPlat} where niche = ${niche.id} and extracted_by = 'owner-sheet-v1' and attribute = 'platform' and product_id = ${p.id}`);
    }
    console.log(`${check ? "checked (rolled back)" : "updated"} ${plan.length} products`);
    if (check) throw new Error("ROLLBACK (--check)");
  }).catch(e => { if (check && String(e?.message).includes("ROLLBACK (--check)")) return; console.error("FAILED:", e?.message, e?.cause?.message ?? ""); process.exit(1); });
  if (!check) {
    const path = new URL("../db/catalogs/simracing.json", import.meta.url);
    const cat = JSON.parse(readFileSync(path, "utf8")) as { products: ({ name: string; sources?: string[] } & Partial<Record<Col, string | null>>)[] };
    for (const p of plan) { const c = cat.products.find(x => x.name === p.name); if (!c) continue;
      Object.assign(c, Object.fromEntries(Object.entries(p.cols).filter(([k]) => CATALOG_COLS.has(k as Col)))); c.sources = [...new Set([...(c.sources ?? []), p.source])]; }
    writeFileSync(path, JSON.stringify(cat, null, 1) + "\n");
    console.log("db/catalogs/simracing.json updated");
  }
}
process.exit(0);
