// Imports the Reddit owner votes for LaptopRecs (owner 2026-11-24): one row per Reddit author per laptop, built by
// scripts/batch-reddit-laptop.ts build-votes (<file>-rows.json). They go into the same tables as site votes, so the vote box
// shows one merged count, but every row keeps its source: network = "reddit" and voter = "reddit:<hash of the Reddit name>"
// (site votes have a hashed device and network). Recount or remove them with `where network = 'reddit'`.
// Insert only: a row already there (same laptop, voter and trait) is left alone. Dry run by default (reads only).
//   NICHE=laptop npx tsx --env-file=.env.local scripts/import-reddit-votes.mts <rows.json> [--apply]
import { readFile } from "node:fs/promises";
import { and, eq, inArray, sql } from "drizzle-orm";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { productVotes, rackets, traitVotes } from "../db/schema";
import { traitGroupsFor } from "../lib/thread/traits";

type Row = { racket: string; voter: string; rating: number | null; traits: Record<string, string> };
const [file] = process.argv.slice(2).filter(a => !a.startsWith("--")), apply = process.argv.includes("--apply");
if (niche.id !== "laptop") throw new Error("Run with NICHE=laptop.");
if (!file) throw new Error("Usage: import-reddit-votes.mts <rows.json> [--apply]");
const data = JSON.parse(await readFile(file, "utf8")) as { source: string; network: string; rows: Row[] };
if (data.source !== "reddit" || data.network !== "reddit") throw new Error("Expected a reddit rows file.");

// Code check: only the laptop boards' groups and options, ratings 1, 3 or 5, voters marked reddit.
const groups = new Map(traitGroupsFor(niche.id).map(g => [g.key, new Set(g.options.map(([k]) => k))]));
const bad: string[] = [];
for (const r of data.rows) {
  if (!/^reddit:[0-9a-f]{24}$/.test(r.voter)) bad.push(`voter ${r.voter}`);
  if (r.rating !== null && ![1, 3, 5].includes(r.rating)) bad.push(`rating ${r.rating}`);
  for (const [g, o] of Object.entries(r.traits)) if (!groups.get(g)?.has(o)) bad.push(`${r.racket} ${g}=${o}`);
}
if (bad.length) throw new Error(`Code check failed: ${bad.slice(0, 10).join(", ")}`);

const { db, client } = connect();
try {
  const ids = new Set((await db.select({ id: rackets.id }).from(rackets).where(inArray(rackets.id, [...new Set(data.rows.map(r => r.racket))]))).map(r => r.id));
  const rows = data.rows.filter(r => ids.has(r.racket)), missing = [...new Set(data.rows.filter(r => !ids.has(r.racket)).map(r => r.racket))];
  const at = new Date().toISOString();
  const pv = rows.filter(r => r.rating !== null).map(r => ({ racketId: r.racket, voter: r.voter, network: "reddit", rating: r.rating!, createdAt: at, updatedAt: at }));
  const tv = rows.flatMap(r => Object.entries(r.traits).map(([trait, choice]) => ({ racketId: r.racket, voter: r.voter, network: "reddit", trait, choice, createdAt: at, updatedAt: at })));
  const [before] = await db.select({ pv: sql<number>`(select count(*) from ${productVotes} where ${productVotes.network} = 'reddit')::int`,
    tv: sql<number>`(select count(*) from ${traitVotes} where ${traitVotes.network} = 'reddit')::int`,
    pvAll: sql<number>`(select count(*) from ${productVotes})::int`, tvAll: sql<number>`(select count(*) from ${traitVotes})::int` }).from(rackets).limit(1);
  const lap = new Set(rows.map(r => r.racket)).size;
  console.log(`${apply ? "APPLY" : "DRY RUN"} on ${niche.schema}: ${rows.length} Reddit authors on ${lap} laptops -> ${pv.length} poll rows, ${tv.length} trait rows`);
  console.log(`In DB now: product_votes ${before?.pvAll ?? 0} (reddit ${before?.pv ?? 0}), trait_votes ${before?.tvAll ?? 0} (reddit ${before?.tv ?? 0})`);
  if (missing.length) console.log(`Not in the catalogue (skipped): ${missing.join(", ")}`);
  if (!apply) { console.log("Dry run only: nothing written."); process.exit(0); }
  await db.transaction(async tx => {
    for (let k = 0; k < pv.length; k += 500) await tx.insert(productVotes).values(pv.slice(k, k + 500)).onConflictDoNothing();
    for (let k = 0; k < tv.length; k += 500) await tx.insert(traitVotes).values(tv.slice(k, k + 500)).onConflictDoNothing();
  });
  const [after] = await db.select({ pv: sql<number>`count(*)::int` }).from(productVotes).where(eq(productVotes.network, "reddit"));
  const [afterT] = await db.select({ tv: sql<number>`count(*)::int` }).from(traitVotes).where(and(eq(traitVotes.network, "reddit")));
  console.log(`Written. Reddit rows now: product_votes ${after.pv}, trait_votes ${afterT.tv}`);
} finally { await client.end(); }
