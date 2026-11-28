// Takes the banned blog domains (db/banned-domains.json, per site schema) off every Recs site: live creator reviews whose
// own link is on a banned domain go to 'hidden'; external reviews and evidence rows sourced from one are deleted. Matches the
// link's host only (a review that merely mentions a site stays). Dry run by default, with counts per site;
// --write --backup <dir> saves every touched row first, then changes each site in one transaction.
//   npx tsx --conditions=react-server --env-file=.env.local scripts/hide-banned-blog-domains.mts [--write --backup <dir>]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { assertSchemaName } from "../db/migrations";

const list = JSON.parse(readFileSync(new URL("../db/banned-domains.json", import.meta.url), "utf8")) as Record<string, string[] | string>;
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");
const db = await database();
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
const esc = (d: string) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
type Row = Record<string, unknown> & { id: string | number };
const at = new Date().toISOString();
let total = 0;
for (const [schema, domains] of Object.entries(list)) {
  if (schema.startsWith("_") || !Array.isArray(domains) || !domains.length) continue;
  const S = sql.identifier(assertSchemaName(schema));
  const host = `^https?://([a-z0-9-]+\\.)*(${domains.map(esc).join("|")})([/?#:]|$)`;
  const has = async (t: string) => (await rows<{ n: number }>(sql`select count(*)::int n from information_schema.tables where table_schema = ${schema} and table_name = ${t}`))[0]!.n > 0;
  const reviews = await has("creator_reviews") ? await rows<Row>(sql`select * from ${S}.creator_reviews where status = 'live' and url ~* ${host}`) : [];
  const external = await has("external_reviews") ? await rows<Row>(sql`select * from ${S}.external_reviews where source_url ~* ${host}`) : [];
  const evidence = await has("evidence") ? await rows<Row>(sql`select * from ${S}.evidence where source_ref ~* ${host}`) : [];
  console.log(`\n${schema}: hide ${reviews.length} creator reviews, delete ${external.length} external reviews, ${evidence.length} evidence rows`);
  const per = new Map<string, number>(); for (const r of reviews) { const h = new URL(String(r.url)).hostname.replace(/^www\./, ""); per.set(h, (per.get(h) ?? 0) + 1); }
  for (const [h, n] of [...per].sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${h}`);
  total += reviews.length + external.length + evidence.length;
  if (!write || !(reviews.length + external.length + evidence.length)) continue;
  mkdirSync(backupDir!, { recursive: true });
  const f = `${backupDir}/banned-blog-domains-${schema}-${at.replace(/[:.]/g, "-")}.json`;
  writeFileSync(f, JSON.stringify({ at, schema, creator_reviews: reviews, external_reviews: external, evidence })); console.log(`  backup: ${f}`);
  const ids = (xs: Row[]) => sql.join(xs.map(x => sql`${x.id}`), sql`, `);
  await db.transaction(async tx => {
    if (reviews.length) await tx.execute(sql`update ${S}.creator_reviews set status = 'hidden', updated_at = now() where id in (${ids(reviews)})`);
    if (external.length) await tx.execute(sql`delete from ${S}.external_reviews where id in (${ids(external)})`);
    if (evidence.length) await tx.execute(sql`delete from ${S}.evidence where id in (${ids(evidence)})`);
  });
  console.log(`  done`);
}
if (!write) console.log(`\nDry run: nothing written (${total} rows would change).`);
process.exit(0);
