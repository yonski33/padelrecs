// Story moderation (PadelRecs pilot): approve, reject or hold a member's story, or delete it with its comments, from the admin
// Stories tab. Same admin and origin checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database } from "../../../../db/data";
import { setStoryStatus, deleteStory } from "../../../../db/stories";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
import { storiesSite } from "../../../../lib/thread/sites";
import { niche } from "../../../../lib/niche";

const back = { back: z.enum(["pending", "approved", "rejected", "all"]).default("pending") };
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]), ...back }),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), confirm: z.literal("yes"), ...back }),
]);
export async function POST(request: Request) {
  if (!storiesSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let form: Record<string, unknown> = {}, parsed;
  try { form = await readAdminForm(request); parsed = input.safeParse({ action: "status", ...form }); } catch { parsed = null; }
  const to = (result: string) => adminRedirect(request, new URLSearchParams({ tab: "stories", status: String(form.back ?? "pending"), result }).toString());
  if (!parsed?.success) return to(form.action === "delete" ? "confirm" : "invalid");
  const d = parsed.data, db = await database();
  try {
    const slug = d.action === "status" ? await setStoryStatus(db, d.id, d.status) : await deleteStory(db, d.id);
    if (!slug) return to("stale");
    try { revalidatePath("/", "layout"); } catch { /* outside a request */ }
    return to(d.action === "status" ? d.status : "deleted");
  } catch (error) { console.error("Story admin failed", error); return to("failed"); }
}
