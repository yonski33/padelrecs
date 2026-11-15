// An expert's rating sheet into the admin expert grid's store (rackets.trait_override, migration 0022), the same way the
// grid's CSV import does (app/api/funtimes/expert/route.ts): expert_<trait> 1–10 (×10) or 0–100, expert_level → the three
// suits scores, one note on each, logged. The expert value wins on the site; the calculated score stays in the grid.
// Without --write it only prints what would change.
//   NICHE=pickleball npx tsx --conditions=react-server --env-file=.env.local scripts/import-expert-sheet.mts <sheet.csv> "<note>" [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { readTraitOverride, editExpert, readExpertValue, levelToSuits, type ExpertKey } from "../db/trait-override";
import { traitDefsFor } from "../lib/fit-config";

const [file, note] = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (!file || !note) throw new Error('Usage: import-expert-sheet.mts <sheet.csv> "<note>" [--write]');
const write = process.argv.includes("--write");
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
const [head, ...lines] = parseCsv(readFileSync(file, "utf8"));
const col = (n: string) => head.map(h => h.trim().toLowerCase()).indexOf(n);
const traits = traitDefsFor(niche).map(t => t.key).filter(t => col(`expert_${t}`) >= 0);
const db = await database(), table = sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`;
const res = await db.execute(sql`select id, slug, trait_override from ${table}`);
const all = (res as unknown as { rows?: { id: string; slug: string; trait_override: unknown }[] }).rows ?? (res as unknown as { id: string; slug: string; trait_override: unknown }[]);
const bySlug = new Map(all.map(r => [r.slug, r]));
const at = new Date().toISOString(), by = "expert sheet import";
let products = 0, values = 0;
for (const l of lines) {
  const slug = (l[col("slug")] ?? "").trim(), r = bySlug.get(slug);
  if (!r) { console.log(`MISSING ${slug}`); continue; }
  const next: Partial<Record<ExpertKey, { value: number | null; note: string }>> = {};
  for (const t of traits) { const v = readExpertValue(l[col(`expert_${t}`)]); if (v !== null) next[t as ExpertKey] = { value: v, note }; }
  const suits = levelToSuits(l[col("expert_level")]);
  if (suits) for (const [k, v] of Object.entries(suits)) next[k as ExpertKey] = { value: v, note };
  else console.log(`  ${slug}: level "${l[col("expert_level")]}" not read`);
  const cur = readTraitOverride(r.trait_override), out = editExpert(cur, next, by, at);
  const changed = (out.expertLog?.length ?? 0) - (cur.expertLog?.length ?? 0);
  if (!changed) continue;
  products++; values += changed;
  console.log(`${slug}: ${Object.entries(next).map(([k, v]) => `${k} ${v!.value}`).join(", ")}`);
  if (write) await db.execute(sql`update ${table} set trait_override = ${JSON.stringify(out)}::jsonb where id = ${r.id}`);
}
console.log(`${write ? "saved" : "would save"} ${values} expert values on ${products} ${niche.id} products`);
process.exit(0);
