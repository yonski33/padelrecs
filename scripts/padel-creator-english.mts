// PadelRecs creator cards (owner 2026-11-25): video chapters like PickleballRecs ("▸ N chapters", titles in English), the
// video length on the thumbnail, and the quote headline in English (the ES/IT/FR language box stays, so readers know it is
// translated). The changes live in db/fixes/padel-creator-english-2026-11-25.json, one entry per card; quote_was is the
// creator's own words, so a card whose quote changed since is skipped.
// Dry run by default; --write --backup <dir> saves every touched row first, then updates them in one transaction.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/padel-creator-english.mts [--write --backup <dir>]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

type Fix = { duration_s?: number; chapters?: [number, string][]; quote?: string; quote_was?: string | null };
const FILE = "db/fixes/padel-creator-english-2026-11-25.json";

if (niche.id !== "padel") throw new Error("NICHE=padel only");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");
const cards = (JSON.parse(readFileSync(FILE, "utf8")) as { cards: Record<string, Fix> }).cards;
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
const ids = Object.keys(cards);
const now = await rows<{ id: string; quote: string | null; duration_s: number | null; chapters: unknown }>(
  sql`select id, quote, duration_s, chapters from ${S}.creator_reviews where id in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
const byId = new Map(now.map(r => [r.id, r]));
const todo: { id: string; set: Fix }[] = [];
let missing = 0, changedSince = 0;
for (const id of ids) {
  const r = byId.get(id), f = cards[id]!;
  if (!r) { missing++; continue; }
  const set: Fix = {};
  if (f.duration_s && r.duration_s !== f.duration_s) set.duration_s = f.duration_s;
  if (f.chapters?.length && JSON.stringify(r.chapters ?? []) !== JSON.stringify(f.chapters)) set.chapters = f.chapters;
  if (f.quote && r.quote !== f.quote) { if (r.quote === f.quote_was) set.quote = f.quote; else changedSince++; }
  if (Object.keys(set).length) todo.push({ id, set });
}
const count = (k: keyof Fix) => todo.filter(t => t.set[k] !== undefined).length;
console.log(`${todo.length} cards to update: ${count("quote")} quotes, ${count("chapters")} chapter lists, ${count("duration_s")} lengths` +
  `${missing ? `; ${missing} not found` : ""}${changedSince ? `; ${changedSince} quotes changed since, skipped` : ""}`);
for (const t of todo.filter(t => t.set.quote).slice(0, 5)) console.log(`  ${t.id}: "${byId.get(t.id)!.quote}" → "${t.set.quote}"`);
if (!write || !todo.length) { console.log(write ? "Nothing to write." : "\nDry run: nothing written."); process.exit(0); }

mkdirSync(backupDir, { recursive: true });
const backup = { at: new Date().toISOString(), schema: niche.schema,
  creator_reviews: await rows(sql`select * from ${S}.creator_reviews where id in (${sql.join(todo.map(t => sql`${t.id}`), sql`, `)})`) };
const file = `${backupDir}/padel-creator-english-${backup.at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Backup: ${file} (${backup.creator_reviews.length} rows)`);
await db.transaction(async tx => {
  for (const { id, set } of todo) {
    if (set.quote !== undefined) await tx.execute(sql`update ${S}.creator_reviews set quote = ${set.quote} where id = ${id}`);
    if (set.chapters !== undefined) await tx.execute(sql`update ${S}.creator_reviews set chapters = ${JSON.stringify(set.chapters)}::jsonb where id = ${id}`);
    if (set.duration_s !== undefined) await tx.execute(sql`update ${S}.creator_reviews set duration_s = ${set.duration_s} where id = ${id}`);
  }
});
console.log(`Updated ${todo.length} cards.`);
process.exit(0);
