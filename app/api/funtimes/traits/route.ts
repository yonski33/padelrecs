// Traits tab actions (Thread, PadelRecs only; drizzle/0027): fix "How does it play?" for one racket. Same admin and origin
// checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back to the racket. Every change is logged
// (db/trait-admin.ts).
import { z } from "zod";
import { database } from "../../../../db/data";
import { setReviewCounts, setFrozen, removeTraitVote, removeVoter, resetTraitGroup, ALL_GROUPS } from "../../../../db/trait-admin";
import { adminWriteGuard, adminRedirect, readAdminForm, refreshProductPages } from "../../../funtimes/auth";
import { eq } from "drizzle-orm";
import { rackets, brands } from "../../../../db/schema";
import { traitGroupsFor } from "../../../../lib/thread/traits";
import { countsFrom, changedCounts, SENTIMENT_GROUP } from "../../../../lib/thread/trait-view";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";

const GROUPS = traitGroupsFor(niche.id);
// The groups whose counts the owner types in: the trait groups plus the overall tally (Loved it / Mixed / Not for me). The
// tally has no votes to freeze, remove or reset, so those actions keep to the trait groups.
const COUNTED = [...GROUPS, SENTIMENT_GROUP];
const group = z.string().refine(t => GROUPS.some(g => g.key === t), "Unknown group");
const counted = z.string().refine(t => COUNTED.some(g => g.key === t), "Unknown group");
const racket = z.string().min(1).max(100), voter = z.string().min(8).max(200);
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_counts"), racket, trait: counted }).passthrough(),
  z.object({ action: z.literal("set_all_counts"), racket }).passthrough(),
  z.object({ action: z.literal("clear_counts"), racket, trait: counted }),
  z.object({ action: z.enum(["freeze", "unfreeze"]), racket, trait: z.union([group, z.literal(ALL_GROUPS)]) }),
  z.object({ action: z.literal("remove_vote"), racket, trait: group, voter }),
  z.object({ action: z.literal("remove_voter"), racket, voter, everywhere: z.enum(["0", "1"]).default("0") }),
  z.object({ action: z.literal("reset"), racket, trait: group }),
]);

export async function POST(request: Request) {
  if (!threadSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let form: Record<string, unknown> | null = null, parsed;
  try { form = await readAdminForm(request) as Record<string, unknown>; parsed = input.safeParse(form); } catch { parsed = null; }
  const back = (result: string, id?: string) => adminRedirect(request, `tab=traits${id ? `&racket=${encodeURIComponent(id)}` : ""}&result=${result}`);
  if (!parsed?.success || !form) return back("invalid", typeof form?.racket === "string" ? form.racket : undefined);
  const d = parsed.data, db = await database();
  try {
    if (d.action === "set_counts") { const c = countsFrom(d.trait, form, COUNTED); if (!c) return back("invalid", d.racket); await setReviewCounts(db, d.racket, d.trait, c); }
    else if (d.action === "set_all_counts") {
      const all = changedCounts(form, COUNTED); if (!all) return back("invalid", d.racket);
      if (!all.length) return back("unchanged", d.racket);
      for (const x of all) await setReviewCounts(db, d.racket, x.trait, x.counts);
    }
    else if (d.action === "clear_counts") await setReviewCounts(db, d.racket, d.trait, null);
    else if (d.action === "freeze" || d.action === "unfreeze") await setFrozen(db, d.racket, d.trait, d.action === "freeze");
    else if (d.action === "remove_vote") await removeTraitVote(db, d.racket, d.voter, d.trait);
    else if (d.action === "remove_voter") await removeVoter(db, d.racket, d.voter, d.everywhere === "1");
    else await resetTraitGroup(db, d.racket, d.trait);
    // The product's own pages too (as the specs and photo saves since #557), so its page shows the new counts. ISR unchanged.
    const [p] = await db.select({ slug: rackets.slug, shape: rackets.shape, brandSlug: brands.slug }).from(rackets).leftJoin(brands, eq(brands.id, rackets.brandId))
      .where(eq(rackets.id, d.racket)).catch(() => []);
    if (p) refreshProductPages([p]);
    return back(d.action, d.racket);
  } catch (error) { console.error("Traits admin failed", error); return back("failed", d.racket); }
}
