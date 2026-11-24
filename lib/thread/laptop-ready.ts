// Which LaptopRecs pages are ready to list and link (lib/thread/laptop-lines.ts LAPTOP_READY), from what the page shows: its
// creator reviews, a written TL;DR (the creator page's own, db/creators/tldrs.json, or the catalogue's "In short") and its
// owner votes. Server only: it reads the creator pages from the database (or nothing before the import).
import tldrs from "../../db/creators/tldrs.json";
import { creatorPagesAll } from "./creator-data";
import { textSlugs } from "./creator-config";
import { writtenTldr } from "./written-tldr";
import { laptopReady, type Readiness } from "./laptop-lines";

type Item = { id: string; slug: string; reviewSummary?: string | null };
/** Readiness per laptop id, and the ids that are ready. `votes`: each id's loved + mixed + not-for-me count. */
export async function laptopReadiness(items: Item[], votes: (id: string) => number) {
  const pages = await creatorPagesAll("laptop"), texts = (tldrs as Record<string, Record<string, string>>).laptop ?? {};
  const by = new Map<string, Readiness>();
  for (const r of items) {
    const page = pages?.get(r.slug) ?? null;
    const tldr = !!(page?.tldr || textSlugs("laptop", r.slug).some(k => texts[k]) || writtenTldr(r.reviewSummary));
    by.set(r.id, { creator: page?.reviews.length ?? 0, tldr, votes: votes(r.id) });
  }
  return { by, ready: new Set([...by].filter(([, x]) => laptopReady(x)).map(([id]) => id)) };
}
