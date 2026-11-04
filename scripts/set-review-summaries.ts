import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { rackets } from "../db/schema";
import { niche } from "../lib/niche";
import { connect } from "./connection";

// Writes the "In short" review summaries from db/summaries/<niche>.json ([{ slug, summary }]) onto products already in
// the database. Only review_summary is written; unknown slugs are listed and skipped. Dry run unless --apply.
// Usage: NICHE=nails npm run db:set-summaries [-- --apply]
const path = `db/summaries/${niche.id}.json`;
const wanted = JSON.parse(await readFile(path, "utf8")) as { slug: string; summary: string }[];
const apply = process.argv.includes("--apply");
const { db, client } = connect();
try {
  const stored = new Map((await db.select({ id: rackets.id, slug: rackets.slug, reviewSummary: rackets.reviewSummary }).from(rackets)).map(r => [r.slug, r]));
  const missing = wanted.filter(w => !stored.has(w.slug));
  const changes = wanted.filter(w => { const s = stored.get(w.slug); return s && s.reviewSummary !== w.summary.trim(); });
  for (const w of changes) console.log(`${w.slug}: ${w.summary.slice(0, 70)}…`);
  if (missing.length) console.log(`Not in the database: ${missing.map(w => w.slug).join(", ")}`);
  if (!apply) console.log(`${changes.length} of ${wanted.length} summaries in "${niche.schema}" would change. Add --apply to write them.`);
  else {
    await db.transaction(async tx => { for (const w of changes) await tx.update(rackets).set({ reviewSummary: w.summary.trim() }).where(eq(rackets.id, stored.get(w.slug)!.id)); });
    console.log(`Wrote ${changes.length} summaries in "${niche.schema}".`);
  }
} finally { await client.end(); }
