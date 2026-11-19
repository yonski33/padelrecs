// Comment moderation (Thread, PadelRecs only): approve, reject or hold, edit the text, or delete one comment from the admin's
// Comments tab. Same admin and origin checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back to
// the tab with its filters; the racket page's own admin links (app/thread/live/comments.tsx) send the same form and ask for
// JSON. Public comments load uncached (/api/comments), so a change shows on the page at once.
import { z } from "zod";
import { database } from "../../../../db/data";
import { setCommentStatus, editComment, deleteComment } from "../../../../db/comments";
import { adminWriteGuard, adminRedirect, readAdminForm, wantsJson, adminJson } from "../../../funtimes/auth";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";

const back = { back: z.enum(["pending", "approved", "rejected", "all"]).default("pending"), q: z.string().max(200).default(""), racket: z.string().max(100).default("") };
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]), ...back }),
  z.object({ action: z.literal("edit"), id: z.string().uuid(), body: z.string().max(4000).optional(), alias: z.string().max(100).optional(), ...back }),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), confirm: z.literal("yes"), ...back }),
]);
export async function POST(request: Request) {
  if (!threadSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let form: Record<string, unknown> = {}, parsed;
  try { form = await readAdminForm(request); parsed = input.safeParse({ action: "status", ...form }); } catch { parsed = null; }
  const to = (result: string) => { if (wantsJson(request)) return adminJson(request, { result }, ["invalid", "confirm", "stale", "failed"].includes(result) ? 400 : 200); const p = new URLSearchParams({ tab: "comments", status: String(form.back ?? "pending") });
    if (form.q) p.set("q", String(form.q)); if (form.racket) p.set("racket", String(form.racket)); p.set("result", result); return adminRedirect(request, p.toString()); };
  if (!parsed?.success) return to(form.action === "delete" ? "confirm" : "invalid");
  const d = parsed.data, db = await database();
  try {
    if (d.action === "status") return to(await setCommentStatus(db, d.id, d.status) ? d.status : "stale");
    if (d.action === "edit") { const r = await editComment(db, d.id, { body: d.body || null, alias: d.alias || null }); return to(r === "ok" ? "edited" : r === "missing" ? "stale" : "invalid"); }
    const r = await deleteComment(db, d.id); return to(r === "missing" ? "stale" : r);
  } catch { return to("failed"); }
}
