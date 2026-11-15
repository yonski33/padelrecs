// Forum voices in TennisRecs' evidence store (2026-11-15): the shared backfill keys author_key on the stored source name,
// which for forum reports is the forum or subreddit ("r/10s", "Passione Tennis"), not the writer, so every forum row would
// share a handful of voices. A forum report has no writer handle stored, so its voice is the report itself (`w:<id>`), the
// same voice app/match-context.ts already uses. Dry run by default: prints the before / after voice counts. --write re-keys.
//   NICHE=tennis npx tsx --conditions=react-server --env-file=.env.local scripts/tennis-forum-voices.mts [--write]
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

if (niche.id !== "tennis") throw new Error("NICHE=tennis");
const db = await database(), s = sql.identifier(assertSchemaName(niche.schema));
const rowsOf = (r: unknown) => ((r as { rows?: Record<string, string>[] }).rows ?? (r as Record<string, string>[]));
// Forum rows that carry a voice key (lab rows keep their shared key: it groups readings, it isn't a voice).
const forum = sql`from ${s}.evidence e join ${s}.external_reviews x on 'w:' || x.id::text = split_part(e.source_ref, '#', 1)
  where e.niche = ${niche.id} and x.source_platform in ('Reddit', 'Forum') and e.author_key is not null and e.attribute not like 'lab:%'`;
const before = rowsOf(await db.execute(sql`select e.extracted_by, count(*) as rows, count(distinct e.author_key) as voices,
  count(distinct 'w:' || x.id::text) as reports ${forum} group by 1 order by 1`));
for (const b of before) console.log(`${b.extracted_by}: ${b.rows} rows · voices before ${b.voices} → after ${b.reports}`);
if (process.argv.includes("--write")) {
  const res = await db.execute(sql`update ${s}.evidence e set author_key = 'w:' || x.id::text from ${s}.external_reviews x
    where 'w:' || x.id::text = split_part(e.source_ref, '#', 1) and e.niche = ${niche.id} and x.source_platform in ('Reddit', 'Forum')
    and e.author_key is not null and e.attribute not like 'lab:%'`);
  console.log(`re-keyed ${(res as unknown as { rowCount?: number }).rowCount ?? "?"} rows`);
}
process.exit(0);
