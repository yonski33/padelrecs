// PickleballRecs: takes the banned review sources out of the live database (pickleball3.com, The Kitchen Pickle: blog
// thekitchenpickle.com and YouTube channel UC8Kri-ozieZq01LLzQSNavQ; PickleTip pickletip.com, PaddleCompare paddlecompare.com and Dash Pickleball dashpickleball.com, AI-written: owner 2026-11-28). Creator reviews are set to 'hidden'; evidence and
// external reviews (no status column) are deleted. Tickle My Pickleball (ticklemypickleball35.com) and Pickleball3en stay.
// Dry run by default; --write --backup <dir> saves every touched row first, then changes all in one transaction.
//   NICHE=pickleball npx tsx --conditions=react-server --env-file=.env.local scripts/remove-banned-pickleball-sources.mts [--write --backup <dir>]
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

const BANNED = "((^|[^a-z0-9])pickleball3\\.com|thekitchenpickle|the kitchen pickle|UC8Kri-ozieZq01LLzQSNavQ|pickletip|paddlecompare|dash ?pickleball)";
if (niche.id !== "pickleball") throw new Error("NICHE=pickleball only");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };

type Row = Record<string, unknown> & { id: string | number };
const reviews = await rows<Row>(sql`select * from ${S}.creator_reviews c where status = 'live' and row_to_json(c)::text ~* ${BANNED}`);
const external = await rows<Row>(sql`select * from ${S}.external_reviews e where row_to_json(e)::text ~* ${BANNED}`);
const evidence = await rows<Row>(sql`select * from ${S}.evidence v where row_to_json(v)::text ~* ${BANNED}`);
console.log(`Creator reviews to hide: ${reviews.length}`);
for (const r of reviews) console.log(`  ${r.creator as string} · ${r.url as string}`);
console.log(`External reviews to delete: ${external.length}`);
for (const e of external) console.log(`  ${e.source_name as string} · ${e.source_url as string}`);
console.log(`Evidence rows to delete: ${evidence.length}`);
for (const e of evidence) console.log(`  ${e.product_id as string} · ${e.attribute as string} · ${e.source_ref as string}`);
if (!write) { console.log("\nDry run: nothing written."); process.exit(0); }

mkdirSync(backupDir!, { recursive: true });
const at = new Date().toISOString();
const file = `${backupDir}/pickleball-banned-sources-${at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ at, schema: niche.schema, creator_reviews: reviews, external_reviews: external, evidence }));
console.log(`Backup: ${file}`);
const ids = (xs: Row[]) => sql.join(xs.map(x => sql`${x.id}`), sql`, `);
await db.transaction(async tx => {
  if (reviews.length) await tx.execute(sql`update ${S}.creator_reviews set status = 'hidden', updated_at = now() where id in (${ids(reviews)})`);
  if (external.length) await tx.execute(sql`delete from ${S}.external_reviews where id in (${ids(external)})`);
  if (evidence.length) await tx.execute(sql`delete from ${S}.evidence where id in (${ids(evidence)})`);
});
console.log(`Hid ${reviews.length} creator reviews, deleted ${external.length} external reviews and ${evidence.length} evidence rows.`);
process.exit(0);
