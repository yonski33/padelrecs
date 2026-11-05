import { eq } from "drizzle-orm";
import { brands, rackets, reviews, externalReviews } from "../db/schema";
import { amazonImages, findAmazonAsin, type AmazonCredentials, type AmazonSettings } from "./amazon";
import type { getDb } from "../db/index";

type Db = Awaited<ReturnType<typeof getDb>>;
const REFRESH_AFTER_MS = 11 * 60 * 60 * 1000;      // two runs a day keep every link under Amazon's 24 hours
const RETRY_NO_MATCH_MS = 14 * 24 * 60 * 60 * 1000; // a product Amazon didn't match is searched again after two weeks
const BATCH = 10;
const THROTTLE_WAITS_MS = [20_000, 40_000]; // Amazon's limit is a short-term rate: wait it out before giving up

export type PhotoJobOptions = { now?: () => number; budgetMs?: number; pauseMs?: number; fetcher?: typeof fetch; sleep?: (ms: number) => Promise<void> };

/**
 * Refreshes image links older than 11 hours, then finds ASINs for reviewed products that have none. Every write lands as
 * it happens and work is chosen by timestamps, so an interrupted run resumes where it stopped and an extra run does nothing.
 * Calls are spaced out and a throttled call is retried after a wait. If it stays throttled, or another call fails, the run
 * ends and the next one carries on; pages fall back to drawings past 24 hours.
 */
export async function refreshAmazonPhotos(db: Db, settings: AmazonSettings, credentials: AmazonCredentials, options: PhotoJobOptions = {}) {
  const { now = Date.now, budgetMs = 240_000, pauseMs = 3000, fetcher = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)) } = options;
  const started = now(), inBudget = (share: number) => now() - started < budgetMs * share, stamp = () => new Date(now()).toISOString();
  const [allBrands, products, userRows, webRows] = await Promise.all([db.select().from(brands),
    db.select({ id: rackets.id, name: rackets.name, brandId: rackets.brandId, asin: rackets.amazonAsin, checkedAt: rackets.amazonCheckedAt }).from(rackets),
    db.select({ id: reviews.racketId }).from(reviews).where(eq(reviews.status, "approved")), db.select({ id: externalReviews.racketId }).from(externalReviews)]);
  const reviewed = new Set([...userRows, ...webRows].map(x => x.id));
  const patiently = async <T>(call: () => Promise<T>) => {
    for (const wait of THROTTLE_WAITS_MS) {
      try { return await call(); }
      catch (error) { if (!/\(429/.test(String(error))) throw error; await sleep(wait); }
    }
    return call();
  };
  const age = (at: string | null) => at ? now() - Date.parse(at) : Infinity;
  const done = { searched: 0, matched: 0, refreshed: 0, stopped: null as string | null };
  // Refreshing is cheap and keeps live photos showing, so it goes first and the slower search can't starve it.
  const refresh = async () => {
    const stale = products.filter(x => x.asin && age(x.checkedAt) >= REFRESH_AFTER_MS);
    for (let i = 0; i < stale.length && inBudget(1); i += BATCH) {
      const batch = stale.slice(i, i + BATCH), images = await patiently(() => amazonImages(batch.map(x => x.asin!), settings, credentials, fetcher));
      for (const p of batch) {
        p.checkedAt = stamp();
        await db.update(rackets).set({ amazonImage: images.get(p.asin!) ?? null, amazonCheckedAt: p.checkedAt }).where(eq(rackets.id, p.id));
      }
      done.refreshed += batch.length;
      await sleep(pauseMs);
    }
  };
  try {
    await refresh();
    for (const p of products.filter(x => reviewed.has(x.id) && !x.asin && age(x.checkedAt) >= RETRY_NO_MATCH_MS)) {
      if (!inBudget(0.8)) break;
      const brand = allBrands.find(b => b.id === p.brandId)?.name ?? "";
      const asin = await patiently(() => findAmazonAsin({ name: p.name, brand }, settings, credentials, fetcher));
      done.searched++;
      if (asin) { done.matched++; p.asin = asin; p.checkedAt = null; }
      await db.update(rackets).set({ amazonAsin: asin, amazonCheckedAt: asin ? null : stamp() }).where(eq(rackets.id, p.id));
      await sleep(pauseMs);
    }
    await refresh(); // the photos of what the search just matched
  } catch (error) { done.stopped = error instanceof Error ? error.message : String(error); }
  return done;
}
