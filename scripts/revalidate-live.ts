import { niche } from "../lib/niche";

/**
 * Asks the live site of the active niche to refresh its cached pages (POST /api/revalidate) after a script changed data.
 * Needs REVALIDATE_SECRET (the same value as in that site's Vercel project). REVALIDATE_ORIGIN overrides the address,
 * e.g. http://localhost:3000 for a local `next start`. Never throws: without it, pages still refresh within 5 minutes.
 */
export async function revalidateLiveSite() {
  const origin = (process.env.REVALIDATE_ORIGIN || `https://${niche.site.domain}`).replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  const later = "Cached pages will refresh on their own within 5 minutes.";
  if (!secret) { console.log(`REVALIDATE_SECRET is not set, so ${origin} was not asked to refresh. ${later}`); return false; }
  try {
    const res = await fetch(`${origin}/api/revalidate`, { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`${origin} refreshed its cached pages; changes show on the next visit.`);
    return true;
  } catch (error) {
    console.log(`Could not ask ${origin} to refresh (${error instanceof Error ? error.message : error}). ${later}`);
    return false;
  }
}
