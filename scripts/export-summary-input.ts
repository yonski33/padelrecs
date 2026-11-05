import { mkdir, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { brands, rackets, reviews, externalReviews } from "../db/schema";
import { niche } from "../lib/niche";
import { tagTone } from "../lib/tags";
import { displayName } from "../lib/brand-name";
import { helpfulnessScore, nicheTerms } from "../lib/review-order";
import { ratingVerdict } from "../lib/top-lists";
import { connect } from "./connection";

// Read-only. Writes one text file per product for drafting "In short" summaries: the product's tag counts (all its
// reviews) and its most helpful reviews, one line each as "[p|m|n] text {tags}". Picks the most-reviewed products with
// at least --min reviews and no summary yet, up to --top.
// Usage: NICHE=nails npm run -s db:summary-input -- --out <dir> [--top 20] [--min 10]
const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const out = arg("out", ""), top = Number(arg("top", "20")), min = Number(arg("min", "10"));
if (!out) throw new Error("--out <dir> is required");
const { db, client } = connect();
try {
  // The same rows the site shows (db/data.ts catalog, which can't be imported outside Next): approved user reviews, all web reviews.
  const [allBrands, allRackets, userRows, webRows] = await Promise.all([db.select().from(brands), db.select().from(rackets),
    db.select({ racketId: reviews.racketId, rating: reviews.rating, reviewText: reviews.reviewText, tags: reviews.tags }).from(reviews).where(eq(reviews.status, "approved")),
    db.select().from(externalReviews)]);
  const reviewed = new Set([...userRows, ...webRows].map(x => x.racketId));
  const data = { brands: allBrands, listed: allRackets.filter(r => reviewed.has(r.id)), reviews: userRows, external: webRows.map(e => ({ ...e, helpful: 0 })) };
  const terms = nicheTerms(niche);
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name;
  const picked = data.listed.filter(r => !r.reviewSummary)
    .map(r => ({ r, user: data.reviews.filter(x => x.racketId === r.id), web: data.external.filter(e => e.racketId === r.id) }))
    .map(x => ({ ...x, total: x.user.length + x.web.length })).filter(x => x.total >= min)
    .sort((a, b) => b.total - a.total).slice(0, top);
  await mkdir(out, { recursive: true });
  const index: { slug: string; name: string; total: number }[] = [];
  for (const { r, user, web, total } of picked) {
    const name = displayName(r.name, brandOf(r.brandId));
    const counts = new Map<string, number>();
    for (const t of [...user, ...web].flatMap(x => x.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
    const row = (tone: string) => [...counts].filter(([t]) => tagTone(t) === tone).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(", ");
    const lines = [
      ...user.map(x => ({ v: ratingVerdict(x.rating), text: x.reviewText, tags: x.tags, s: helpfulnessScore({ text: x.reviewText, tags: x.tags }, terms) })),
      ...web.map(e => { const text = e.summary || e.excerptTranslation || e.excerpt || ""; return { v: e.sentiment, text, tags: e.tags, s: helpfulnessScore({ text, tags: e.tags, sentiment: e.sentiment }, terms) + (e.helpful ?? 0) * 3 }; }),
    ].filter(x => x.text.trim()).sort((a, b) => b.s - a.s).slice(0, 100)
      .map(x => `[${x.v ? x.v[0] : "?"}] ${x.text.replace(/\s+/g, " ").trim()} {${x.tags.join(", ")}}`);
    await writeFile(`${out}/${r.slug}.txt`, `# ${name} (${total} reviews)\ntags: Loved for: ${row("pos")} | Complaints: ${row("neg")} | Also mentioned: ${row("neutral")}\n${lines.join("\n")}\n`);
    index.push({ slug: r.slug, name, total });
  }
  await writeFile(`${out}/index.json`, JSON.stringify(index, null, 2));
  console.log(`${niche.id}: ${index.length} products (${top} max, ${min}+ reviews, no summary yet)`);
} finally { await client.end(); }
