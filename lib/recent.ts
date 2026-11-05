import { niche } from "./niche";

/**
 * The niche's recent window (recentMonths), shared by every score on the site: the rankings, the product page's
 * sentiment bar, its "% positive" and tag counts, and the "% positive" on type, brand and similar-product rows. Older
 * reviews stay listed (after the recent ones, marked as older) but no longer move the scores, so a product's score
 * reflects how it is now, not a 2019 version (owner choice, 2026-11-05: stale fees and perks on MoneyRecs).
 */
export function isRecent(date: string, now = new Date()) {
  if (niche.recentMonths === undefined) return true;
  const since = new Date(now); since.setUTCMonth(since.getUTCMonth() - niche.recentMonths);
  return Date.parse(date) >= since.getTime();
}

/** A web review is dated by its source (an old Reddit thread quoted today is old); a site review by when it was written. */
export const webDate = (e: { sourceDate: string | null; createdAt: string }) => e.sourceDate || e.createdAt;

/** Fewer than this many recent judged reviews: a score falls back to every review, rather than showing nothing. */
export const MIN_RECENT = 10;
