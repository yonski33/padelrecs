// The owner's expert sheet (filled-in scripts/expert-gaps.mts CSV: slug, expert_<trait> on 1–10 or 0–100, expert_level as a
// word or range, notes) into rackets.trait_override as expert values, the same store and log as the admin grid
// (app/api/funtimes/expert). Expert values win on the site; the calculated ones stay in admin. Dry run by default.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/import-expert-sheet.mts <sheet.csv> "<note>" [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { readTraitOverride, editExpert, readExpertValue, levelToSuits, type ExpertKey } from "../db/trait-override";
import { traitDefsFor } from "../lib/fit-config";

const TRAITS = traitDefsFor(niche).map(t => t.key) as ExpertKey[];

const args = process.argv.slice(2), write = args.includes("--write");
const [file, prefix] = args.filter(a => !a.startsWith("--"));
if (!file || !prefix) throw new Error('Usage: import-expert-sheet.mts <sheet.csv> "<note>" [--write]');
const parse = (text: string) => { const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const [head, ...lines] = parse(readFileSync(file, "utf8"));
const col = (n: string) => head.map(h => h.trim().toLowerCase()).indexOf(n);
const data = await catalog();
const bySlug = new Map(data.rackets.map(r => [r.slug, r.id]));
const db = await database(), table = sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`;
const at = new Date().toISOString(), by = "owner expert sheet";
let rackets = 0, values = 0; const missing: string[] = [], bad: string[] = [];
for (const l of lines) {
  const slug = (l[col("slug")] ?? "").trim(), id = bySlug.get(slug);
  if (!id) { missing.push(slug); continue; }
  const rowNote = (l[col("notes")] ?? "").trim(), note = rowNote ? `${prefix} · ${rowNote}` : prefix;
  const next: Partial<Record<ExpertKey, { value: number | null; note: string }>> = {};
  for (const t of TRAITS) { const v = readExpertValue(l[col(`expert_${t}`)]); if (v !== null) next[t] = { value: v, note }; else if ((l[col(`expert_${t}`)] ?? "").trim()) bad.push(`${slug} ${t}`); }
  const suits = levelToSuits(l[col("expert_level")], niche.fit?.expertAdjacentSuits);
  if (suits) for (const [k, v] of Object.entries(suits)) next[k as ExpertKey] = { value: v, note }; else if ((l[col("expert_level")] ?? "").trim()) bad.push(`${slug} level "${l[col("expert_level")]}"`);
  const res = await db.execute(sql`select trait_override from ${table} where id = ${id}`);
  const list = (res as unknown as { rows?: { trait_override: unknown }[] }).rows ?? (res as unknown as { trait_override: unknown }[]);
  const cur = readTraitOverride(list[0]?.trait_override), out = editExpert(cur, next, by, at);
  const changed = (out.expertLog?.length ?? 0) - (cur.expertLog?.length ?? 0);
  if (!changed) continue;
  rackets++; values += changed;
  if (write) await db.execute(sql`update ${table} set trait_override = ${JSON.stringify(out)}::jsonb where id = ${id}`);
}
console.log(`${write ? "Wrote" : "Dry run:"} ${values} values on ${rackets} ${niche.words.many}. Missing slugs: ${missing.length}${missing.length ? ` (${missing.join(", ")})` : ""}. Unreadable: ${bad.length}${bad.length ? ` (${bad.slice(0, 10).join("; ")})` : ""}.`);
process.exit(0);
