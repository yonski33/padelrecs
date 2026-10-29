import { getDb } from "../db/index";
import { rackets, racketSlugRedirects } from "../db/schema";
import type { ProductRef } from "./product-redirect";

// Every product's current slug and shape, keyed by current and former slugs. A few hundred short rows per niche, read
// at most once a minute per instance; only proxy.ts uses it, for product addresses on categoryPaths niches.
const TTL_MS = 60_000;
let cached: { at: number; map: Promise<Map<string, ProductRef>> } | undefined;

export function productLookup() {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const map = load();
    cached = { at: Date.now(), map };
    map.catch(() => { if (cached?.map === map) cached = undefined; });
  }
  return cached.map;
}

async function load() {
  const db = getDb();
  const [rows, former] = await Promise.all([
    db.select({ id: rackets.id, slug: rackets.slug, shape: rackets.shape }).from(rackets),
    db.select({ slug: racketSlugRedirects.slug, racketId: racketSlugRedirects.racketId }).from(racketSlugRedirects),
  ]);
  const byId = new Map(rows.map(r => [r.id, { slug: r.slug, shape: r.shape }]));
  const map = new Map<string, ProductRef>();
  for (const f of former) { const p = byId.get(f.racketId); if (p) map.set(f.slug, p); }
  for (const r of rows) map.set(r.slug, byId.get(r.id)!);
  return map;
}
