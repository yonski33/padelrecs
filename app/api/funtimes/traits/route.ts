// Traits tab actions (Thread, PadelRecs only; drizzle/0027): fix "How does it play?" for one racket. Same admin and origin
// checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back to the racket. Every change is logged
// (db/trait-admin.ts).
import { z } from "zod";
import { database } from "../../../../db/data";
import { setReviewCounts, setFrozen, removeTraitVote, removeVoter, resetTraitGroup, ALL_GROUPS } from "../../../../db/trait-admin";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
import { TRAIT_GROUPS } from "../../../../lib/thread/traits";
import { countsFrom } from "../../../../lib/thread/trait-view";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";

const group = z.string().refine(t => TRAIT_GROUPS.some(g => g.key === t), "Unknown group");
const racket = z.string().min(1).max(100), voter = z.string().min(8).max(200);
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_counts"), racket, trait: group }).passthrough(),
  z.object({ action: z.literal("clear_counts"), racket, trait: group }),
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
    if (d.action === "set_counts") { const c = countsFrom(d.trait, form); if (!c) return back("invalid", d.racket); await setReviewCounts(db, d.racket, d.trait, c); }
    else if (d.action === "clear_counts") await setReviewCounts(db, d.racket, d.trait, null);
    else if (d.action === "freeze" || d.action === "unfreeze") await setFrozen(db, d.racket, d.trait, d.action === "freeze");
    else if (d.action === "remove_vote") await removeTraitVote(db, d.racket, d.voter, d.trait);
    else if (d.action === "remove_voter") await removeVoter(db, d.racket, d.voter, d.everywhere === "1");
    else await resetTraitGroup(db, d.racket, d.trait);
    return back(d.action, d.racket);
  } catch (error) { console.error("Traits admin failed", error); return back("failed", d.racket); }
}
