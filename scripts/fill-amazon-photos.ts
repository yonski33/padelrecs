import { eq, isNull, and } from "drizzle-orm";
import { brands, rackets, reviews, externalReviews } from "../db/schema";
import { isAsin, matchesProduct, words } from "../lib/amazon";
import { niche } from "../lib/niche";
import { connect } from "./connection";

// Finds each reviewed product's Amazon ASIN and photo through SerpApi, most reviewed first, one search per product. The
// Amazon API throttles a search per product after about 20 calls (owner choice 2026-11-05: SerpApi instead).
// A dry run prints the matches and saves nothing. A product with no match is stamped so a later run skips it for a while.
// Usage: NICHE=skin npm run -s db:fill-amazon-photos -- [--limit 20] [--apply]
const RETRY_NO_MATCH_MS = 30 * 24 * 60 * 60 * 1000, PAUSE_MS = 1500;
type Result = { asin?: string; title?: string; thumbnail?: string; sponsored?: boolean };

/** SerpApi's thumbnail is about 320px; the same image exists larger under Amazon's size token. */
export const largerImage = (url: string) => url.replace(/\._[A-Z0-9_,]+_\.(jpg|png)$/i, "._SL500_.$1");

function modelOnly(product: { name: string; brand: string }, title: string) {
  const brand = new Set(words(product.brand)), model = words(product.name).filter(w => !brand.has(w)), found = words(title);
  return model.length > 0 && found[0] === model[0] && model.every(w => found.includes(w));
}

/**
 * The first unsponsored result that really is this product, among the top ten. SerpApi's titles usually leave the brand
 * out. Then the search carries the brand, and the title must open with the model and hold every word of it, which keeps
 * out another brand's lookalike ("Toleriane Hydrating Gentle Facial Cleanser" for Vanicream's). Packs are a last resort.
 */
export function pickResult(product: { name: string; brand: string }, results: Result[]) {
  const usable = results.filter(r => !r.sponsored && r.asin && isAsin(r.asin) && r.thumbnail && r.title).slice(0, 10)
    .filter(r => matchesProduct(product, { title: r.title! }) || modelOnly(product, r.title!));
  const bundle = /\b(set|bundle|kit|duo|trio|pack of|\d+[- ]pack)\b/i;
  return usable.find(r => !bundle.test(r.title!)) ?? usable.find(r => !/\b(set|bundle|kit)\b/i.test(r.title!)) ?? null;
}

async function search(query: string, key: string) {
  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({ engine: "amazon", k: query, amazon_domain: "amazon.com", api_key: key }).toString();
  const response = await fetch(url);
  const data = await response.json().catch(() => ({})) as { organic_results?: Result[]; error?: string };
  // "No results" is an answer; anything else (quota, bad key) ends the run. The URL holds the key, so it's never printed.
  if (!response.ok && !/no results|hasn't returned/i.test(data.error ?? "")) throw new Error(`SerpApi ${response.status}: ${data.error ?? "no detail"}`);
  return data.organic_results ?? [];
}

async function main() {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) throw new Error("Set SERPAPI_API_KEY in .env.local");
  if (!niche.amazon) throw new Error(`${niche.id} has no Amazon links`);
  const apply = process.argv.includes("--apply"), limitAt = process.argv.indexOf("--limit"), limit = limitAt > 0 ? Number(process.argv[limitAt + 1]) : Infinity;
  const { client, db } = connect();
  const [allBrands, products, userRows, webRows] = await Promise.all([db.select().from(brands),
    db.select({ id: rackets.id, name: rackets.name, brandId: rackets.brandId, checkedAt: rackets.amazonCheckedAt }).from(rackets).where(isNull(rackets.amazonImage)),
    db.select({ id: reviews.racketId }).from(reviews).where(and(eq(reviews.status, "approved"))), db.select({ id: externalReviews.racketId }).from(externalReviews)]);
  const counts = new Map<string, number>();
  for (const { id } of [...userRows, ...webRows]) counts.set(id, (counts.get(id) ?? 0) + 1);
  const todo = products.filter(p => counts.has(p.id) && (!p.checkedAt || Date.now() - Date.parse(p.checkedAt) >= RETRY_NO_MATCH_MS))
    .sort((a, b) => counts.get(b.id)! - counts.get(a.id)!).slice(0, limit);
  let matched = 0;
  for (const p of todo) {
    const brand = allBrands.find(b => b.id === p.brandId)?.name ?? "";
    const query = p.name.toLowerCase().startsWith(brand.toLowerCase()) ? p.name : `${brand} ${p.name}`;
    const results = await search(query, key), found = pickResult({ name: p.name, brand }, results);
    if (found) matched++;
    console.log(found ? `MATCH  ${p.name}  ->  ${found.asin}  ${found.title!.slice(0, 80)}` : `none   ${p.name}  (${results.length} results)`);
    if (apply) await db.update(rackets).set(found
      ? { amazonAsin: found.asin, amazonImage: largerImage(found.thumbnail!), amazonCheckedAt: new Date().toISOString() }
      : { amazonCheckedAt: new Date().toISOString() }).where(eq(rackets.id, p.id));
    await new Promise(r => setTimeout(r, PAUSE_MS));
  }
  console.log(`${niche.id}: ${matched} of ${todo.length} matched${apply ? ", saved" : " (dry run, nothing saved)"}`);
  await client.end();
}

if (process.argv[1]?.includes("fill-amazon-photos")) main().catch(error => { console.error(String(error).slice(0, 300)); process.exit(1); });
