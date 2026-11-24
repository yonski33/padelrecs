// Owner 2026-11-17: "Head Gravity Motion (2026)" is the 2024 model and HEAD has not released a newer one. One racket,
// "Head Gravity Motion 2024", year 2024, slug head-gravity-motion-2024; the old addresses (…-2026 and the second row's …-2025)
// 301 to it (racket_slug_redirects, as an admin slug change). The second row (demo-racket-9, "Head Gravity Motion 2025", from the
// seed data) is the same racket: its one report the main row lacks moves over, its two duplicate YouTube rows go, then the row.
// Dry run by default; --write applies it in one transaction.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/fix-gravity-motion-2024.mts [--write]
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { rackets, externalReviews, reviews, racketSlugRedirects } from "../db/schema";
import { changeRacketSlug } from "../db/racket-slugs";

const MAIN = "47c67ac8-91bf-4720-a667-778e935e70a6", DUP = "demo-racket-9";
const NAME = "Head Gravity Motion 2024", YEAR = 2024, SLUG = "head-gravity-motion-2024";
const write = process.argv.includes("--write");
const db = getDb();

const [main] = await db.select().from(rackets).where(eq(rackets.id, MAIN));
const [dup] = await db.select().from(rackets).where(eq(rackets.id, DUP));
if (!main) throw new Error("main row missing");
const mainEx = await db.select({ id: externalReviews.id, url: externalReviews.sourceUrl }).from(externalReviews).where(eq(externalReviews.racketId, MAIN));
const dupEx = dup ? await db.select({ id: externalReviews.id, url: externalReviews.sourceUrl, src: externalReviews.sourceName }).from(externalReviews).where(eq(externalReviews.racketId, DUP)) : [];
const dupReviews = dup ? await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.racketId, DUP)) : [];
const have = new Set(mainEx.map(e => e.url));
const move = dupEx.filter(e => !have.has(e.url)), drop = dupEx.filter(e => have.has(e.url));
const [slugTaken] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.slug, SLUG));

console.log(`${write ? "WRITE" : "DRY RUN"}: Head Gravity Motion → 2024`);
console.log(`- main row ${MAIN}: name "${main.name}" → "${NAME}", year ${main.year} → ${YEAR}, slug ${main.slug} → ${SLUG}${slugTaken ? " (TAKEN: stop)" : ""}`);
console.log(`- redirect: /rackets/${main.slug} → /rackets/${SLUG}`);
if (dup) {
  console.log(`- second row ${DUP} "${dup.name}" (${dup.slug}): ${dupReviews.length} player reviews, ${dupEx.length} web reports`);
  for (const e of move) console.log(`    move to main: ${e.src} ${e.url}`);
  for (const e of drop) console.log(`    delete (already on main): ${e.src} ${e.url}`);
  console.log(`    then delete the row; redirect /rackets/${dup.slug} → /rackets/${SLUG}`);
}
if (slugTaken || dupReviews.length) { console.log("Stopping: slug taken or the second row has player reviews."); process.exit(1); }
if (!write) { console.log("Nothing written. Run with --write after the owner's OK."); process.exit(0); }

await db.transaction(async tx => {
  const r = await changeRacketSlug(tx as never, MAIN, SLUG);
  if (r !== "changed") throw new Error(`slug change: ${r}`);
  await tx.update(rackets).set({ name: NAME, year: YEAR }).where(eq(rackets.id, MAIN));
  if (dup) {
    if (move.length) await tx.update(externalReviews).set({ racketId: MAIN }).where(inArray(externalReviews.id, move.map(e => e.id)));
    if (drop.length) await tx.delete(externalReviews).where(and(eq(externalReviews.racketId, DUP), inArray(externalReviews.id, drop.map(e => e.id))));
    await tx.delete(racketSlugRedirects).where(eq(racketSlugRedirects.racketId, DUP));
    await tx.delete(rackets).where(eq(rackets.id, DUP));
    await tx.insert(racketSlugRedirects).values({ slug: dup.slug, racketId: MAIN, createdAt: new Date().toISOString() })
      .onConflictDoUpdate({ target: racketSlugRedirects.slug, set: { racketId: MAIN } });
  }
});
console.log("Written.");
process.exit(0);
