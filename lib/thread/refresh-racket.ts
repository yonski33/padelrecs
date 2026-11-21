// One racket page after a vote (audit 2026-11-21): its public address and the Thread page proxy.ts serves it from, so the
// server HTML's vote boxes, poll and opinions count catch up on the next visit. The pages' ISR time stays as it is (owner
// cost rule); this only marks the one page stale. The owner's Traits fixes refresh it through refreshProductPages.
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { rackets } from "../../db/schema";
import { productHref } from "../niche";
import type { getDb } from "../../db/index";

type Database = ReturnType<typeof getDb>;

export async function refreshRacketPage(db: Pick<Database, "select">, racketId: string) {
  try {
    const [p] = await db.select({ slug: rackets.slug, shape: rackets.shape }).from(rackets).where(eq(rackets.id, racketId));
    if (!p) return;
    revalidatePath(productHref(p)); revalidatePath(`/thread/rackets/${p.slug}`);
  } catch (error) { console.error("[thread] racket page refresh failed", error); }
}
