// Saves player tips to the active niche's reviews (owner 2026-11-15, TIPS-PLAN.md phase 1). Input: one JSON file
// {"p:<id>"|"w:<id>": [{kind, text, quote}, …]} as the Sonnet readers write it (merged); [] means "read, no tips" and is saved
// as [] so the review isn't exported again. Every tip is re-checked against the LIVE stored text (lib/tips.ts checkTips): a tip
// whose quote is not an exact substring, or that breaks the kind/length rules, is dropped and listed. A review whose tips were
// ALL dropped is left unsaved (still null), so the next export hands it to a reader again. Dry run unless --write.
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/save-tips.mts <file.json> [--write]
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { checkTips, tipSources, type Tip, type DroppedTip } from "../lib/tips";
import { connect } from "./connection";

const [file] = process.argv.slice(2).filter(a => !a.startsWith("--"));
const write = process.argv.includes("--write");
if (!file) throw new Error("Usage: save-tips.mts <file.json> [--write]");
const input = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;

const data = await catalog();
const sources = new Map<string, string[]>([
  ...data.reviews.map(r => [`p:${r.id}`, tipSources(r)] as [string, string[]]),
  ...data.external.map(e => [`w:${e.id}`, tipSources(e)] as [string, string[]]),
]);

const player: { id: string; t: Tip[] }[] = [], web: { id: string; t: Tip[] }[] = [];
const dropped: ({ id: string } & DroppedTip)[] = [], unknown: string[] = [], unsaved: string[] = [];
let tips = 0;
for (const [key, value] of Object.entries(input)) {
  const src = sources.get(key);
  if (!src?.length || !/^[pw]:/.test(key)) { unknown.push(key); continue; }
  const { kept, dropped: gone } = checkTips(value ?? [], src);
  dropped.push(...gone.map(d => ({ id: key, ...d })));
  if (gone.length && !kept.length) { unsaved.push(key); continue; }
  tips += kept.length;
  (key.startsWith("p:") ? player : web).push({ id: key.slice(2), t: kept });
}

const withTips = [...player, ...web].filter(r => r.t.length).length;
console.log(`${niche.id}: ${player.length} player + ${web.length} web reviews ready (${withTips} with ${tips} tips, the rest none).`);
console.log(`Dropped ${dropped.length} tips; ${unsaved.length} reviews left unsaved (every tip dropped); ${unknown.length} unknown ids${unknown.length ? ` (e.g. ${unknown.slice(0, 5).join(", ")})` : ""}.`);
if (dropped.length) {
  const byReason = new Map<string, number>();
  for (const d of dropped) byReason.set(d.reason, (byReason.get(d.reason) ?? 0) + 1);
  console.log("  by reason: " + [...byReason].map(([r, n]) => `${r} ${n}`).join(", "));
  for (const d of dropped.slice(0, 10)) console.log(`  ${d.id}: ${d.reason}: ${JSON.stringify(d.tip).slice(0, 160)}`);
  const report = file.replace(/\.json$/, "") + ".dropped.json";
  writeFileSync(report, JSON.stringify(dropped, null, 1));
  console.log(`  full list: ${report}`);
}
if (!write) { console.log("Dry run: pass --write to save."); process.exit(0); }

const { db, client } = connect();
try {
  const table = (name: string) => sql.raw(`"${niche.schema}"."${name}"`);
  for (const [name, rows] of [["reviews", player], ["external_reviews", web]] as const) {
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = JSON.stringify(rows.slice(i, i + 500));
      await db.execute(sql`update ${table(name)} t set tips = x.j
        from jsonb_to_recordset(${chunk}::jsonb) as x(id text, j jsonb) where t.id = x.id`);
    }
  }
  console.log("Saved.");
} finally { await client.end(); }
