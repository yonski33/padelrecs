// The owner's "Edit helpful" box on the live pages (db/helpful.ts, drizzle/0036): GET the post's real count, override,
// voters and history; POST set / reset / remove-voter. Admin only (checked here on the server), same-origin JSON, and every
// change lands in helpful_audit. Afterwards the post's product page and lists refresh on demand (adminJson revalidates the
// layout; refreshProductPages names the product's own pages). ISR times stay as they are.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, comments, externalReviews, rackets, reviews } from "../../../../db/schema";
import { helpfulState, helpfulHistory, setHelpful, resetHelpful, removeVoter, HELPFUL_MAX, type HelpfulKind } from "../../../../db/helpful";
import { adminWriteGuard, adminJson, isAdmin, refreshProductPages } from "../../../funtimes/auth";
import { getCurrentUser } from "../../../../lib/supabase/auth";

const kind = z.enum(["player", "web", "comment"]), id = z.string().min(1).max(100);
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set"), kind, id, value: z.number().int().min(-HELPFUL_MAX).max(HELPFUL_MAX) }),
  z.object({ action: z.literal("reset"), kind, id }),
  z.object({ action: z.literal("remove-voter"), kind, id, voter: z.string().min(8).max(100), everywhere: z.boolean().default(false) }),
]);
const noStore = { "Cache-Control": "no-store" };

/** The product a post sits on, so its pages refresh. */
async function productOf(db: Awaited<ReturnType<typeof database>>, k: HelpfulKind, postId: string) {
  let racketId: string | null = null;
  if (k === "player") racketId = (await db.select({ r: reviews.racketId }).from(reviews).where(eq(reviews.id, postId)))[0]?.r ?? null;
  else if (k === "web") racketId = (await db.select({ r: externalReviews.racketId }).from(externalReviews).where(eq(externalReviews.id, postId)))[0]?.r ?? null;
  else { const page = (await db.select({ p: comments.page }).from(comments).where(eq(comments.id, postId)))[0]?.p ?? ""; racketId = page.startsWith("racket:") ? page.slice(7) : null; }
  if (!racketId) return null;
  const [p] = await db.select({ slug: rackets.slug, shape: rackets.shape, brandSlug: brands.slug }).from(rackets).leftJoin(brands, eq(brands.id, rackets.brandId)).where(eq(rackets.id, racketId));
  return p ?? null;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Admin access required." }, { status: 403, headers: noStore });
  const q = new URL(request.url).searchParams, k = kind.safeParse(q.get("kind")), i = id.safeParse(q.get("id"));
  if (!k.success || !i.success) return Response.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  try {
    const db = await database();
    const [state, history] = await Promise.all([helpfulState(db, k.data, i.data), helpfulHistory(db, k.data, i.data)]);
    return Response.json({ ...state, voters: state.voters.map(v => ({ ...v, short: v.key.slice(0, 8) })), history }, { headers: noStore });
  } catch (error) { console.error("Helpful read failed", error); return Response.json({ error: "Could not load the votes." }, { status: 500, headers: noStore }); }
}

export async function POST(request: Request) {
  const forbidden = await adminWriteGuard(request, "application/json"); if (forbidden) return forbidden;
  let v; try { v = body.safeParse(await request.json()); } catch { return adminJson(request, { error: "Invalid request." }, 400); }
  if (!v.success) return adminJson(request, { error: v.error.issues[0]?.message ?? "Invalid request." }, 400);
  const a = v.data;
  try {
    const db = await database(), user = await getCurrentUser(), by = user?.email || user?.id || "admin";
    if (a.kind !== "comment" && a.action === "set" && a.value < 0) return adminJson(request, { error: "A review's helpful count can't go below 0." }, 400);
    let result;
    try {
      result = a.action === "set" ? await setHelpful(db, a.kind, a.id, a.value, by)
        : a.action === "reset" ? await resetHelpful(db, a.kind, a.id, by)
        : await removeVoter(db, a.kind, a.id, a.voter, a.everywhere, by);
    } catch (error) {
      if (/helpful_(overrides|audit)/.test(String(error))) return adminJson(request, { error: "The helpful tables aren't on this site yet (migration 0036 not run)." }, 503);
      throw error;
    }
    const product = await productOf(db, a.kind, a.id);
    if (product) refreshProductPages([product]);
    return adminJson(request, { result: "saved", ...result });
  } catch (error) { console.error("Helpful change failed", error); return adminJson(request, { error: "Saving failed. Try again." }, 500); }
}
