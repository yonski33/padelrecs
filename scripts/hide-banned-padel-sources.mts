// PadelRecs: takes the banned review sources off the live site (owner: padel.how 2026-11-24, Padelful 2026-11-25, both
// AI-generated reviews). Creator reviews from them are set to 'hidden' (kept, not deleted); a creator page left with no
// live review goes back to 'draft'; Padelful player reviews in external_reviews (no status column) are deleted.
// Dry run by default; --write --backup <dir> saves every touched row first, then changes all in one transaction.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/hide-banned-padel-sources.mts [--write --backup <dir>]
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

const BANNED = "(padel\\.how|padelful)";
if (niche.id !== "padel") throw new Error("NICHE=padel only");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };

type Rev = { id: string; racket_id: string; creator: string; url: string };
const reviews = await rows<Rev & Record<string, unknown>>(sql`select * from ${S}.creator_reviews where status = 'live' and (url ~* ${BANNED} or creator ~* ${BANNED})`);
const racketIds = [...new Set(reviews.map(r => r.racket_id))];
const left = racketIds.length ? await rows<{ racket_id: string; n: number }>(sql`select racket_id, count(*)::int as n from ${S}.creator_reviews
  where status = 'live' and racket_id in (${sql.join(racketIds.map(i => sql`${i}`), sql`, `)}) and not (url ~* ${BANNED} or creator ~* ${BANNED}) group by 1`) : [];
const empty = racketIds.filter(id => !left.some(l => l.racket_id === id && l.n > 0));
const pages = empty.length ? await rows<Record<string, unknown>>(sql`select * from ${S}.creator_pages where status = 'live' and racket_id in (${sql.join(empty.map(i => sql`${i}`), sql`, `)})`) : [];
const external = await rows<Record<string, unknown> & { id: string }>(sql`select * from ${S}.external_reviews where source_url ~* ${BANNED} or source_name ~* ${BANNED}`);

console.log(`Creator reviews to hide: ${reviews.length}`);
for (const r of reviews) console.log(`  ${r.creator} · ${r.url}`);
console.log(`Creator pages left with no live review, back to draft: ${pages.length}`);
console.log(`Padelful player reviews to delete (external_reviews): ${external.length}`);
for (const e of external) console.log(`  ${e.id} · ${e.source_url as string}`);
if (!write) { console.log("\nDry run: nothing written."); process.exit(0); }

mkdirSync(backupDir!, { recursive: true });
const at = new Date().toISOString();
const file = `${backupDir}/padel-banned-sources-${at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ at, schema: niche.schema, creator_reviews: reviews, creator_pages: pages, external_reviews: external }));
console.log(`Backup: ${file}`);
await db.transaction(async tx => {
  if (reviews.length) await tx.execute(sql`update ${S}.creator_reviews set status = 'hidden', updated_at = now() where id in (${sql.join(reviews.map(r => sql`${r.id}`), sql`, `)})`);
  if (pages.length) await tx.execute(sql`update ${S}.creator_pages set status = 'draft', updated_at = now() where racket_id in (${sql.join(empty.map(i => sql`${i}`), sql`, `)})`);
  if (external.length) await tx.execute(sql`delete from ${S}.external_reviews where id in (${sql.join(external.map(e => sql`${e.id}`), sql`, `)})`);
});
console.log(`Hid ${reviews.length} creator reviews, ${pages.length} creator page(s) to draft, deleted ${external.length} external reviews.`);
process.exit(0);
