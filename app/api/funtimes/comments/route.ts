// Comment moderation (Thread sites): approve, reject (hide) or hold, edit the text or the name, or delete comments from the
// admin's Latest comments page (app/funtimes/comments), one at a time or in bulk. Same admin and origin checks as the review
// queue (app/funtimes/auth.ts); plain form posts redirect back to the list with its filters; the racket page's own admin
// links (app/thread/live/comments.tsx) send the same single-comment form and ask for JSON. Afterwards every page that
// showed an affected comment refreshes (adminChanged revalidates the layout; the pages are also named outright).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, comments, rackets } from "../../../../db/schema";
import { setCommentStatus, editComment, deleteComment, commentsByIds } from "../../../../db/comments";
import { ownerSetStatus, ownerDeleted, postStatus } from "../../../../db/trust";
import { accountSite } from "../../../../lib/thread/sites";
import { adminWriteGuard, adminRedirect, wantsJson, adminJson, refreshProductPages } from "../../../funtimes/auth";
import { GUIDE_PATHS, threadSite, type GuideKey } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";
import { BULK_MAX, bulkOrder, commentsHref, type CommentsQuery } from "../../../../lib/admin-comments";

const status = z.enum(["pending", "approved", "rejected"]);
const back = { back: z.enum(["pending", "approved", "rejected", "all"]).default("all"), q: z.string().max(200).default(""), racket: z.string().max(100).default(""),
  p: z.coerce.number().int().min(1).max(10_000).default(1) };
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string().uuid(), status, ...back }),
  z.object({ action: z.literal("edit"), id: z.string().uuid(), body: z.string().max(4000).optional(), alias: z.string().max(100).optional(), ...back }),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), confirm: z.literal("yes"), withReplies: z.literal("yes").optional(), ...back }),
  z.object({ action: z.literal("bulk"), ids: z.array(z.string().uuid()).min(1).max(BULK_MAX), op: z.enum(["approved", "rejected", "pending", "delete"]),
    confirm: z.literal("yes").optional(), withReplies: z.literal("yes").optional(), ...back }),
]);
const FAILED = ["invalid", "confirm", "stale", "failed", "none"];

/** The public pages behind these comment page keys: a racket's own pages, a ranking, a guide or a story. */
async function refreshCommentPages(db: Awaited<ReturnType<typeof database>>, pages: string[]) {
  const keys = [...new Set(pages)], racketIds = keys.filter(k => k.startsWith("racket:")).map(k => k.slice(7));
  if (racketIds.length) refreshProductPages(await db.select({ slug: rackets.slug, shape: rackets.shape, brandSlug: brands.slug }).from(rackets)
    .leftJoin(brands, eq(brands.id, rackets.brandId)).where(inArray(rackets.id, racketIds)));
  const paths: string[] = [];
  for (const k of keys) {
    const [kind, key] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if (kind === "ranking") paths.push(`/rankings/${key}`, `/thread/rankings/${key}`);
    if (kind === "story") paths.push(`/stories/${key}`, `/thread/stories/${key}`);
    if (kind === "guide" && key in GUIDE_PATHS) { const g = GUIDE_PATHS[key as GuideKey]; paths.push(g, `/thread${g}`); }
  }
  try { for (const p of paths) revalidatePath(p); } catch { /* outside a request scope (tests) */ }
}

export async function POST(request: Request) {
  if (!threadSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let form: Record<string, unknown> = {}, parsed;
  try {
    const params = new URLSearchParams(await request.text());
    form = { ...Object.fromEntries(params), ids: params.getAll("ids") };
    parsed = input.safeParse({ action: "status", ...form });
  } catch { parsed = null; }
  const to = (result: string, n?: number) => {
    if (wantsJson(request)) return adminJson(request, { result, ...(n != null ? { count: n } : {}) }, FAILED.includes(result) ? 400 : 200);
    const b = String(form.back ?? "all"), keep: Partial<CommentsQuery> = { status: (["pending", "approved", "rejected"].includes(b) ? b : "all") as CommentsQuery["status"],
      q: String(form.q ?? "").slice(0, 200), racket: String(form.racket ?? "").slice(0, 100), page: Math.max(1, parseInt(String(form.p ?? "1"), 10) || 1) };
    const query = new URL(commentsHref(keep), "http://x").searchParams; query.set("result", result); if (n != null) query.set("n", String(n));
    return adminRedirect(request, query.toString(), "/funtimes/comments");
  };
  if (!parsed?.success) return to(form.action === "delete" || (form.action === "bulk" && form.op === "delete") ? "confirm" : form.action === "bulk" && !(form.ids as string[] | undefined)?.length ? "none" : "invalid");
  const d = parsed.data, db = await database();
  try {
    // Trusted members (db/trust.ts): approving a member's comment earns trust; hiding a live one or deleting one takes it away.
    const members = accountSite(niche.id);
    if (d.action === "bulk") {
      if (d.op === "delete" && d.confirm !== "yes") return to("confirm");
      const rows = await commentsByIds(db, d.ids), order = bulkOrder(d.ids, rows);
      if (!order.length) return to("stale");
      let done = 0;
      for (const id of order) {
        if (d.op === "delete") {
          if (members) await ownerDeleted(db, "comment", id).catch(e => console.error("Trust update failed", e));
          if ((await deleteComment(db, id, { withReplies: d.withReplies === "yes" })) !== "missing") done++;
        } else {
          const before = members ? await postStatus(db, "comment", id) : null;
          if (await setCommentStatus(db, id, d.op)) { done++; if (members) await ownerSetStatus(db, "comment", id, before, d.op).catch(e => console.error("Trust update failed", e)); }
        }
      }
      await refreshCommentPages(db, rows.map(r => r.page));
      return to(d.op === "delete" ? "bulk-deleted" : `bulk-${d.op}`, done);
    }
    const [row] = await db.select({ page: comments.page }).from(comments).where(eq(comments.id, d.id));
    if (!row) return to("stale");
    let result: string;
    if (d.action === "status") {
      const before = members ? await postStatus(db, "comment", d.id) : null;
      if (!(await setCommentStatus(db, d.id, d.status))) return to("stale");
      if (members) await ownerSetStatus(db, "comment", d.id, before, d.status).catch(e => console.error("Trust update failed", e));
      result = d.status;
    } else if (d.action === "edit") {
      const r = await editComment(db, d.id, { body: d.body || null, alias: d.alias || null });
      result = r === "ok" ? "edited" : r === "missing" ? "stale" : "invalid";
    } else {
      if (members) await ownerDeleted(db, "comment", d.id).catch(e => console.error("Trust update failed", e));
      const r = await deleteComment(db, d.id, { withReplies: d.withReplies === "yes" }); result = r === "missing" ? "stale" : r;
    }
    if (!FAILED.includes(result)) await refreshCommentPages(db, [row.page]);
    return to(result);
  } catch (error) { console.error("Comment moderation failed", error); return to("failed"); }
}
