// Gives every review without a name a generated nickname (owner 2026-11-16: "go back to assigning nicknames to all reviewers",
// never "A <Site> player"). Same words as the one-tap card (niche.form.quickVote.nicknames). Dry run by default.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/backfill-nicknames.mts [--write]
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { makeNickname } from "../lib/nickname";

const write = process.argv.includes("--write");
const db = await database(), table = sql`${sql.identifier(assertSchemaName(niche.schema))}.reviews`;
const res = await db.execute(sql`select id from ${table} where alias is null or btrim(alias) = ''`);
const rows = ((res as unknown as { rows?: { id: string }[] }).rows ?? (res as unknown as { id: string }[]));
const used = new Set<string>();
let n = 0;
for (const r of rows) {
  let nick = makeNickname(niche.form.quickVote?.nicknames);
  while (used.has(nick)) nick = makeNickname(niche.form.quickVote?.nicknames);
  used.add(nick); n++;
  if (write) await db.execute(sql`update ${table} set alias = ${nick} where id = ${r.id} and (alias is null or btrim(alias) = '')`);
}
console.log(`${niche.schema}: ${write ? "named" : "would name"} ${n} reviews without a name.`);
process.exit(0);
