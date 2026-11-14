// Saves players' own stated levels on web reports (owner 2026-11-15, pilot rackets only). Input: a JSON list of
// {id, level, quote}: level is Beginner / Intermediate / Advanced / Competitive, quote is the exact text that states it.
// Each quote is checked against the stored summary, excerpt or translation; a report whose quote doesn't match is skipped.
// Needs migration 0021 (external_reviews.player_level + level_quote). Dry run unless --write.
//   NICHE=padel npx tsx --env-file=.env.local scripts/save-report-levels.mts <file.json> [--write]
import { readFileSync } from "node:fs";
import { niche } from "../lib/niche";
import { connect } from "./connection";

const LEVELS = new Set(["Beginner", "Intermediate", "Advanced", "Competitive"]);
const [file] = process.argv.slice(2).filter(a => !a.startsWith("--"));
const write = process.argv.includes("--write");
if (!file) throw new Error("Usage: save-report-levels.mts <file.json> [--write]");
const input = JSON.parse(readFileSync(file, "utf8")) as { id: string; level: string; quote: string }[];
const schema = `${niche.id}recs`;

const { client } = connect();
try {
  const rows = await client.unsafe<{ id: string; summary: string | null; excerpt: string | null; excerpt_translation: string | null }[]>(
    `select id::text, summary, excerpt, excerpt_translation from "${schema}".external_reviews where id::text = any($1)`, [input.map(x => x.id)]);
  const byId = new Map(rows.map(r => [r.id, r]));
  const ok: typeof input = [], skipped: string[] = [];
  for (const x of input) {
    const r = byId.get(x.id);
    const found = r && [r.summary, r.excerpt, r.excerpt_translation].some(t => t?.includes(x.quote));
    if (!LEVELS.has(x.level) || !found) { skipped.push(`${x.id} (${!r ? "no report" : !found ? "quote not found" : "bad level"})`); continue; }
    ok.push(x);
  }
  const per: Record<string, number> = {};
  for (const x of ok) per[x.level] = (per[x.level] ?? 0) + 1;
  console.log(`${niche.id}: ${ok.length} ready ${JSON.stringify(per)}, ${skipped.length} skipped${skipped.length ? `: ${skipped.join(", ")}` : ""}`);
  if (!write) { console.log("Dry run: pass --write to save."); process.exit(0); }
  for (const x of ok)
    await client.unsafe(`update "${schema}".external_reviews set player_level = $1, level_quote = $2 where id::text = $3`, [x.level, x.quote, x.id]);
  console.log(`Saved ${ok.length}.`);
} finally {
  await client.end();
}
