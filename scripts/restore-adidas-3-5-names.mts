// PadelRecs: puts "3.5" back in the 2026 Adidas names that the Grok catalog fixes (2026-11-18) dropped. Owner 2026-11-25:
// the page showed "Adidas Metalbone" for the Metalbone 3.5; every page should show the full model name. Names come from the
// backup that run saved (backups/catalog-fixes-2026-11-19). Slugs never changed, so no redirects.
// Dry run by default; --write --backup <dir> saves the rows first, then renames in one transaction.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/restore-adidas-3-5-names.mts [--write --backup <dir>]
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

export const RESTORE: [slug: string, from: string, to: string][] = [
  ["adidas-metalbone-3-5-2026", "Adidas Metalbone 2026", "Adidas Metalbone 3.5 2026"],
  ["adidas-metalbone-ctrl-2026", "Adidas Metalbone CTRL 2026", "Adidas Metalbone CTRL 3.5 2026"],
  ["adidas-metalbone-hrd-plus-3-5-2026", "Adidas Metalbone HRD+ 2026", "Adidas Metalbone HRD+ 3.5 2026"],
  ["adidas-metalbone-carbon-3-5-2026", "Adidas Metalbone Carbon 2026", "Adidas Metalbone Carbon 3.5 2026"],
  ["adidas-metalbone-carbon-ctrl-3-5-2026", "Adidas Metalbone Carbon CTRL 2026", "Adidas Metalbone Carbon CTRL 3.5 2026"],
  ["adidas-metalbone-team-3-5-2026", "Adidas Metalbone Team 2026", "Adidas Metalbone Team 3.5 2026"],
  ["adidas-metalbone-team-light-3-5-2026", "Adidas Metalbone Team Light 2026", "Adidas Metalbone Team Light 3.5 2026"],
  ["adidas-cross-it-ctrl-3-5-2026", "Adidas Cross It CTRL 2026", "Adidas Cross It CTRL 3.5 2026"],
  ["adidas-cross-it-carbon-3-5-2026", "Adidas Cross It Carbon 2026", "Adidas Cross It Carbon 3.5 2026"],
  ["adidas-cross-it-carbon-ctrl-3-5-2026", "Adidas Cross It Carbon CTRL 2026", "Adidas Cross It Carbon CTRL 3.5 2026"],
  ["adidas-cross-it-light-3-5-2026", "Adidas Cross It Light 2026", "Adidas Cross It Light 3.5 2026"],
];

if (niche.id !== "padel") throw new Error("NICHE=padel only");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
const found = await rows<{ id: string; slug: string; name: string }>(sql`select id, slug, name from ${S}.rackets where slug in (${sql.join(RESTORE.map(([s]) => sql`${s}`), sql`, `)})`);
const bySlug = new Map(found.map(r => [r.slug, r]));
const todo = RESTORE.flatMap(([slug, from, to]) => {
  const r = bySlug.get(slug);
  if (!r) { console.log(`not found: ${slug}`); return []; }
  if (r.name === to) { console.log(`already right: ${to}`); return []; }
  if (r.name !== from) { console.log(`skipped, name changed since: ${slug} is "${r.name}"`); return []; }
  console.log(`${slug}: "${from}" → "${to}"`);
  return [{ id: r.id, to }];
});
if (!write || !todo.length) { console.log(write ? "Nothing to write." : "\nDry run: nothing written."); process.exit(0); }
mkdirSync(backupDir, { recursive: true });
const backup = { at: new Date().toISOString(), schema: niche.schema, rackets: await rows(sql`select * from ${S}.rackets where id in (${sql.join(todo.map(t => sql`${t.id}`), sql`, `)})`) };
const file = `${backupDir}/padel-adidas-3-5-names-${backup.at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Backup: ${file}`);
await db.transaction(async tx => { for (const t of todo) await tx.execute(sql`update ${S}.rackets set name = ${t.to} where id = ${t.id}`); });
console.log(`Renamed ${todo.length} products.`);
process.exit(0);
