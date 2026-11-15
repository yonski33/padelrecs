// SkinRecs gaps for the owner (like pickleball-expert-gaps.csv): facts we can't read from reviews (price band, missing SPF,
// fragrance where the catalog column is unclear) and the skin-type scores with too few voices, as a sheet to fill.
//   export: NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-gaps.mts export <out.csv>
//   import: NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-gaps.mts import <filled.csv> [--write]
// Import saves the facts as owner rows in the evidence store (owner rows win over the maker's), and the expert columns to
// db/known-dots/skin.json as the known-correct set (ENGINE-PLAN §2F): calibration targets, not overrides.
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { attrProfileFor, applies } from "../lib/attr-profile";
import { scoreAll } from "../lib/attr-score";

const profile = attrProfileFor(niche);
if (!profile) throw new Error("NICHE=skin");
const [step, file] = process.argv.slice(2);
const data = await catalog();
const GROUPS = ["dry", "oily", "combination", "sensitive", "acne"];
const COLS = ["name", "slug", "type", "reports", "missing", "price_band", "spf", "fragrance", ...GROUPS.map(g => `expert_${g}`), "expert_finish", "expert_texture", "notes"];
const csvCell = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function parseCsv(text: string): string[][] {
  const out: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); out.push(row); row = []; cell = ""; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out;
}

if (step === "export") {
  const rows = await evidenceRows();
  const counts = new Map(data.listed.map(r => [r.id, { n: 0, p: 0, neg: 0, j: 0 }]));
  for (const x of data.reviews) { const c = counts.get(x.racketId); if (c) { c.n++; c.j++; if (x.rating >= 4) c.p++; else if (x.rating <= 2) c.neg++; } }
  for (const e of data.external) { const c = counts.get(e.racketId); if (c) { c.n++; if (e.sentiment) { c.j++; if (e.sentiment === "positive") c.p++; if (e.sentiment === "negative") c.neg++; } } }
  const attrs = scoreAll(profile, data.listed.map(r => { const c = counts.get(r.id)!; return { id: r.id, shape: r.shape, reports: c.n, verdict: c.j ? (c.p - c.neg) / c.j : null }; }), rows);
  const spfDef = profile.attrs.find(a => a.key === "spf")!, finish = profile.attrs.find(a => a.key === "finish")!, texture = profile.attrs.find(a => a.key === "texture")!;
  const lines = data.listed.map(r => {
    const a = attrs.get(r.id)!, c = counts.get(r.id)!;
    const missing = ["price",
      ...(applies(spfDef, r.shape) && !a.facts.spf ? ["spf"] : []),
      ...(a.facts.fragrance_free === null || a.facts.fragrance_free === "oils" ? ["fragrance unclear"] : []),
      ...GROUPS.filter(g => !a.scores[`suits_${g}`]).map(g => `${g} thin`),
      ...(applies(finish, r.shape) && !a.scores.finish ? ["finish thin"] : []), ...(applies(texture, r.shape) && !a.scores.texture ? ["texture thin"] : [])];
    return { r, c, a, missing };
  }).sort((x, y) => y.c.n - x.c.n);
  writeFileSync(file, [COLS.join(","), ...lines.map(({ r, c, a, missing }) => [r.name, r.slug, r.shape, c.n, missing.join("; "), "", a.facts.spf ?? "", a.facts.fragrance_free ?? "",
    ...GROUPS.map(() => ""), "", "", ""].map(csvCell).join(","))].join("\n") + "\n");
  console.log(`${lines.length} products → ${file}. Fill price_band ($ under ~$15, $$ to ~$40, $$$ above), spf where empty, fragrance (free / oils / fragrance) where unclear; expert_* (1–10, finish/texture: matte|between|dewy, light|between|rich) only where you know the product.`);
} else if (step === "import") {
  const [head, ...body] = parseCsv(readFileSync(file, "utf8")).filter(r => r.some(x => x.trim()));
  const col = (k: string) => head.indexOf(k);
  const bySlug = new Map(data.listed.map(r => [r.slug, r]));
  const facts: { productId: string; attribute: string; value: number | null; valueText: string | null }[] = [];
  const known: Record<string, Record<string, string | number>> = {};
  const bad: string[] = [];
  for (const line of body) {
    const r = bySlug.get(line[col("slug")]?.trim()); if (!r) { bad.push(`unknown slug ${line[col("slug")]}`); continue; }
    const price = line[col("price_band")]?.trim(), spf = line[col("spf")]?.trim(), fr = line[col("fragrance")]?.trim().toLowerCase();
    if (price) { if (/^\${1,3}$/.test(price)) facts.push({ productId: r.id, attribute: "price", value: price.length, valueText: price }); else bad.push(`${r.slug}: price_band "${price}"`); }
    if (spf) { if (/^\d{2,3}$/.test(spf)) facts.push({ productId: r.id, attribute: "spf", value: Number(spf), valueText: null }); else bad.push(`${r.slug}: spf "${spf}"`); }
    if (fr && ["free", "oils", "fragrance"].includes(fr)) facts.push({ productId: r.id, attribute: "fragrance_free", value: fr === "free" ? 1 : 0, valueText: fr });
    for (const k of [...GROUPS.map(g => `expert_${g}`), "expert_finish", "expert_texture", "notes"]) {
      const v = line[col(k)]?.trim(); if (!v) continue;
      (known[r.slug] ??= {})[k.replace(/^expert_/, "")] = /^\d+$/.test(v) ? Number(v) : v;
    }
  }
  console.log(`facts ${facts.length}, expert products ${Object.keys(known).length}, problems ${bad.length}${bad.length ? `:\n  ${bad.join("\n  ")}` : ""}`);
  if (process.argv.includes("--write")) {
    writeFileSync(new URL("../db/known-dots/skin.json", import.meta.url), JSON.stringify(known, null, 1) + "\n");
    const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
    await db.transaction(async tx => {
      await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = 'owner-sheet-v1'`);
      for (const f of facts) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
        values (${f.productId}, ${niche.id}, 'owner', ${`sheet:${f.productId}`}, 'owner', ${f.attribute}, ${f.value}, ${f.valueText}, 1, null, ${now}, 'owner-sheet-v1', ${now})`);
    });
    console.log(`saved ${facts.length} owner facts and db/known-dots/skin.json`);
  }
} else throw new Error("step: export <out.csv> | import <filled.csv> [--write]");
process.exit(0);
