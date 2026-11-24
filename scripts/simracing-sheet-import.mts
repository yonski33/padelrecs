// The owner's filled SimRacingRecs sheet (simracing_filled.csv, 2026-11-16) into the stores the v2 pages read (PM 2026-11-16):
//   facts         platform, torque (wheelbases) and the per-type price third → owner evidence rows (owner-sheet-v1), which win
//                 over the catalogue columns in the hard filters (lib/simracing-fit.ts simracingFacts);
//   expert values the ten qualities (1–10 → 0–100) and the two suits → the shared expert store (rackets.trait_override expert,
//                 db/trait-override.ts), the same store and log as the admin grid, counting as E = 8 voices in lib/engine:
//                 "first sim rig" → suits_beginner (new); "upgrade" → suits_intermediate (serious) and suits_advanced (all-in).
// "n/a" and blank cells are skipped. Dry run by default; --check runs the writes in a transaction and always rolls it back.
//   NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-sheet-import.mts <sheet.csv> [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { readTraitOverride, editExpert, type ExpertKey } from "../db/trait-override";
import { SIMRACING_FIT } from "../lib/simracing-fit";

if (niche.id !== "simracing") throw new Error("Run with NICHE=simracing.");
const args = process.argv.slice(2), check = args.includes("--check"), write = args.includes("--write") || check;
const [file] = args.filter(a => !a.startsWith("--"));
if (!file) throw new Error("Usage: simracing-sheet-import.mts <sheet.csv> [--write]");
const parse = (text: string) => { const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const [head, ...lines] = parse(readFileSync(file, "utf8"));
const col = (n: string) => head.indexOf(n), cell = (l: string[], n: string) => (l[col(n)] ?? "").trim();
const data = await catalog();
const bySlug = new Map(data.rackets.map(r => [r.slug, r]));
const SUITS: Record<string, ExpertKey[]> = { suits_new: ["suits_beginner"], suits_upgrade: ["suits_intermediate", "suits_advanced"] };
const now = new Date().toISOString(), by = "owner expert sheet", note = "owner sheet 2026-11-16";
const facts: { productId: string; attribute: string; value: number | null; valueText: string | null }[] = [];
const experts = new Map<string, Partial<Record<ExpertKey, { value: number; note: string }>>>();
const bad: string[] = [], tally = new Map<string, number>(), count = (k: string) => tally.set(k, (tally.get(k) ?? 0) + 1);
for (const l of lines) {
  const r = bySlug.get(cell(l, "slug")); if (!r) { bad.push(`unknown slug ${cell(l, "slug")}`); continue; }
  const plat = cell(l, "platform"), nm = cell(l, "torque_nm"), price = cell(l, "price_band");
  if (plat) { facts.push({ productId: r.id, attribute: "platform", value: null, valueText: plat }); count("platform"); }
  if (nm && r.shape === "Wheelbase") { if (/^\d+(\.\d+)?$/.test(nm)) { facts.push({ productId: r.id, attribute: "torque_nm", value: Number(nm), valueText: null }); count("torque_nm"); } else bad.push(`${r.slug}: torque "${nm}"`); }
  if (price) { if (/^\${1,3}$/.test(price)) { facts.push({ productId: r.id, attribute: "price", value: price.length, valueText: price }); count(`price ${price}`); } else bad.push(`${r.slug}: price "${price}"`); }
  const ex: Partial<Record<ExpertKey, { value: number; note: string }>> = {};
  const rowNote = cell(l, "notes"), n = rowNote ? `${note} · ${rowNote}` : note;
  for (const key of [...SIMRACING_FIT.traits.map(t => t.key), "suits_new", "suits_upgrade"]) {
    const v = cell(l, `expert_${key}`); if (!v || v === "n/a") continue;
    if (!/^(10|[1-9])$/.test(v)) { bad.push(`${r.slug}: ${key} "${v}"`); continue; }
    const def = SIMRACING_FIT.traits.find(t => t.key === key);
    if (def?.appliesTo && !def.appliesTo.includes(r.shape ?? "")) { bad.push(`${r.slug}: ${key} doesn't apply to ${r.shape}`); continue; }
    for (const k of SUITS[key] ?? [key as ExpertKey]) { ex[k] = { value: Number(v) * 10, note: n }; count(k); }
  }
  if (Object.keys(ex).length) experts.set(r.id, ex);
}
console.log(`facts ${facts.length}, expert values ${[...experts.values()].reduce((a, x) => a + Object.keys(x).length, 0)} on ${experts.size} products; problems ${bad.length}${bad.length ? `:\n  ${bad.join("\n  ")}` : ""}`);
console.log(JSON.stringify(Object.fromEntries([...tally].sort((a, b) => b[1] - a[1]))));
if (write) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), table = sql`${schema}.rackets`;
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = 'owner-sheet-v1'`);
    for (let i = 0; i < facts.length; i += 500) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(facts.slice(i, i + 500).map(f =>
      sql`(${f.productId}, ${niche.id}, 'owner', ${`sheet:${f.productId}`}, 'owner', ${f.attribute}, ${f.value}, ${f.valueText}, 1, null, ${now}, 'owner-sheet-v1', ${now})`), sql`, `)}`);
    let changed = 0;
    for (const [id, next] of experts) {
      const res = await tx.execute(sql`select trait_override from ${table} where id = ${id}`);
      const list = (res as unknown as { rows?: { trait_override: unknown }[] }).rows ?? (res as unknown as { trait_override: unknown }[]);
      const cur = readTraitOverride(list[0]?.trait_override), out = editExpert(cur, next, by, now);
      if ((out.expertLog?.length ?? 0) === (cur.expertLog?.length ?? 0)) continue;
      changed++;
      await tx.execute(sql`update ${table} set trait_override = ${JSON.stringify(out)}::jsonb where id = ${id}`);
    }
    console.log(`${check ? "checked (rolled back)" : "saved"} ${facts.length} owner fact rows and expert values on ${changed} products`);
    if (check) throw new Error("ROLLBACK (--check)");
  }).catch(e => { if (check && String(e?.message).includes("ROLLBACK (--check)")) return; console.error("IMPORT FAILED:", e?.message, e?.cause?.message ?? ""); process.exit(1); });
}
process.exit(0);
