// Comment moderation (Thread, PadelRecs only): approve, reject or hold one comment from the admin's Comments tab. Same admin
// and origin checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back to the tab.
import { z } from "zod";
import { database } from "../../../../db/data";
import { setCommentStatus } from "../../../../db/comments";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";

const input = z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]), back: z.enum(["pending", "approved", "rejected"]).default("pending") });
export async function POST(request: Request) {
  if (!threadSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let parsed; try { parsed = input.safeParse(await readAdminForm(request)); } catch { parsed = null; }
  if (!parsed?.success) return adminRedirect(request, "tab=comments&result=invalid");
  const { id, status, back } = parsed.data;
  try {
    const ok = await setCommentStatus(await database(), id, status);
    return adminRedirect(request, `tab=comments&status=${back}&result=${ok ? status : "stale"}`);
  } catch { return adminRedirect(request, `tab=comments&status=${back}&result=failed`); }
}
