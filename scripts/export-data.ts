import { writeFile } from "node:fs/promises";
import { asc } from "drizzle-orm";
import { brands, rackets, reviews, externalReviews } from "../db/schema";
import { parseSnapshot } from "../db/transfer";
import { connect } from "./connection";

// Writes the configured PadelRecs database to a snapshot that db:import / db:verify understand.
// Includes private emails and pending reviews: keep the file in the ignored backups/ folder.
const path = process.argv[2];
if (!path) throw new Error("Usage: npm run db:export -- backups/export.json");
const snake = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), v]));
const { db, client } = connect();
try {
  const [b, r, rv, ex] = await Promise.all([
    db.select().from(brands).orderBy(asc(brands.id)),
    db.select().from(rackets).orderBy(asc(rackets.id)),
    db.select().from(reviews).orderBy(asc(reviews.id)),
    db.select().from(externalReviews).orderBy(asc(externalReviews.id)),
  ]);
  const snapshot = parseSnapshot({
    formatVersion: 1,
    source: `supabase:${process.env.SUPABASE_PROJECT_REF}`,
    exportedAt: new Date().toISOString(),
    tables: { brands: b.map(snake), rackets: r.map(snake), reviews: rv.map(snake), external_reviews: ex.map(snake) },
  });
  await writeFile(path, JSON.stringify(snapshot, null, 1), { mode: 0o600 });
  console.log("Exported", Object.fromEntries(Object.entries(snapshot.tables).map(([k, rows]) => [k, rows.length])), "to", path);
} finally { await client.end(); }
