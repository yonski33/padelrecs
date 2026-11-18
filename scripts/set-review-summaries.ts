import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { brands, externalReviews, rackets, reviews } from "../db/schema";
import { niche } from "../lib/niche";
import { checkSummary } from "../lib/summary-check";
import { connect } from "./connection";

// Writes the "In short" review summaries from db/summaries/<niche>.json ([{ slug, summary }]) onto products already in
// the database. Only review_summary is written; unknown slugs are listed and skipped. Dry run unless --apply.
// Every changed summary is first checked against its own product's reviews and the other summaries (lib/summary-check.ts:
// names it uses that its reviews never mention, 8+ words shared with another summary, no product name). --apply refuses
// while any flag remains, unless --checked says a person has read the flags and they are fine.
// Usage: NICHE=nails npm run db:set-summaries [-- --apply [--checked]]
const path = `db/summaries/${niche.id}.json`;
const wanted = JSON.parse(await readFile(path, "utf8")) as { slug: string; summary: string }[];
const apply = process.argv.includes("--apply"), checked = process.argv.includes("--checked");
const { db, client } = connect();
try {
  const [stored, brandRows] = await Promise.all([
    db.select({ id: rackets.id, slug: rackets.slug, name: rackets.name, brandId: rackets.brandId, reviewSummary: rackets.reviewSummary }).from(rackets),
    db.select({ id: brands.id, name: brands.name }).from(brands)]);
  const bySlug = new Map(stored.map(r => [r.slug, r])), brandName = new Map(brandRows.map(b => [b.id, b.name]));
  const missing = wanted.filter(w => !bySlug.has(w.slug));
  const changes = wanted.filter(w => { const s = bySlug.get(w.slug); return s && s.reviewSummary !== w.summary.trim(); });
  // The other summaries a new one is compared with: this file's, and the stored ones it doesn't replace.
  const others = [...new Map([...stored.filter(r => r.reviewSummary).map(r => [r.slug, r.reviewSummary!] as const), ...wanted.map(w => [w.slug, w.summary] as const)])]
    .map(([slug, summary]) => ({ slug, summary }));
  let flagged = 0;
  for (const w of changes) {
    const p = bySlug.get(w.slug)!;
    const [own, web] = await Promise.all([
      db.select({ text: reviews.reviewText }).from(reviews).where(eq(reviews.racketId, p.id)),
      db.select({ summary: externalReviews.summary, excerpt: externalReviews.excerpt, translation: externalReviews.excerptTranslation }).from(externalReviews).where(eq(externalReviews.racketId, p.id))]);
    const texts = [...own.map(x => x.text), ...web.flatMap(x => [x.summary, x.excerpt, x.translation]).filter((x): x is string => !!x)];
    const flags = checkSummary({ slug: w.slug, name: p.name, brand: brandName.get(p.brandId), summary: w.summary, reviews: texts }, others);
    console.log(`${w.slug}: ${w.summary.slice(0, 70)}…`);
    for (const f of flags) console.log(`  ! ${f}`);
    if (flags.length) flagged++;
  }
  if (missing.length) console.log(`Not in the database: ${missing.map(w => w.slug).join(", ")}`);
  if (flagged) console.log(`${flagged} changed summaries have flags (!). Read them against the product's reviews before writing.`);
  if (!apply) console.log(`${changes.length} of ${wanted.length} summaries in "${niche.schema}" would change. Add --apply to write them.`);
  else if (flagged && !checked) { console.log("Nothing written: flags remain. Fix them, or add --checked once a person has read them."); process.exitCode = 1; }
  else {
    await db.transaction(async tx => { for (const w of changes) await tx.update(rackets).set({ reviewSummary: w.summary.trim() }).where(eq(rackets.id, bySlug.get(w.slug)!.id)); });
    console.log(`Wrote ${changes.length} summaries in "${niche.schema}".`);
  }
} finally { await client.end(); }
