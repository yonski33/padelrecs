// The catalog's edit stamp (DiscGolfRecs audit 2026-11-20): when an admin save or /api/refresh last changed the data, kept in
// Next's data cache, which every server instance shares. Each instance keeps its own catalog copy in memory (db/keep.ts), and
// an admin save used to drop only the copy on the instance that took the save. Another instance then rebuilt a revalidated
// page from its older copy and the edge kept that page for hours (Westside Harp still showed "Midrange" after its type was
// changed to Putter). The kept loaders compare their copy's age with this stamp and reload when the stamp is newer.
// The pages' ISR and edge times are unchanged (owner cost rule).
import { unstable_cache, revalidateTag } from "next/cache";
import { niche } from "../lib/niche";

const TAG = `catalog-edit-${niche.id}`;
const cachedStamp = unstable_cache(async () => Date.now(), ["catalog-edit-stamp", niche.id], { tags: [TAG] });

/** The last edit's time (ms), or 0 outside Next (scripts, tests) or when the data cache can't be read. */
export async function editStamp(): Promise<number> {
  try { return await cachedStamp(); } catch { return 0; }
}

/** Marks the catalog as changed for every instance (admin writes, /api/refresh). Expires at once, not stale-while-revalidate. */
export function bumpEditStamp() {
  try { revalidateTag(TAG, { expire: 0 }); } catch { /* outside a request scope (tests) */ }
}
