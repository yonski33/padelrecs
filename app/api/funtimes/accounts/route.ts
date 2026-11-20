// Account moderation (Thread, PadelRecs only): rename, block, unblock or delete a player account from the admin's Accounts
// tab. Same admin and origin checks as the review queue (app/funtimes/auth.ts); plain form posts redirect back to the tab.
import { z } from "zod";
import { database } from "../../../../db/data";
import { updateAccount, setAccountStatus, deleteAccount } from "../../../../db/accounts";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
import { setTrust } from "../../../../db/trust";
import { allowedAdmin } from "../../../../lib/admin-access";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";

const id = z.string().min(1).max(100), q = z.string().max(100).default("");
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rename"), id, name: z.string().max(100), q }),
  z.object({ action: z.literal("block"), id, q }),
  z.object({ action: z.literal("unblock"), id, q }),
  z.object({ action: z.literal("trust"), id, q }),
  z.object({ action: z.literal("untrust"), id, q }),
  z.object({ action: z.literal("delete"), id, confirm: z.literal("yes"), posts: z.string().optional(), q }),
]);
export async function POST(request: Request) {
  if (!threadSite(niche.id)) return Response.json({ error: "Not here." }, { status: 404 });
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let form: Record<string, unknown> = {}, parsed;
  try { form = await readAdminForm(request); parsed = input.safeParse(form); } catch { parsed = null; }
  const to = (result: string) => { const p = new URLSearchParams({ tab: "accounts", result }); if (form.q) p.set("q", String(form.q)); return adminRedirect(request, p.toString()); };
  if (!parsed?.success) return to(form.action === "delete" ? "confirm" : "invalid");
  const d = parsed.data, db = await database();
  try {
    if (d.action === "rename") { const r = await updateAccount(db, d.id, { name: d.name }); return to(r === "ok" ? "renamed" : r === "missing" ? "stale" : r); }
    if (d.action === "trust" || d.action === "untrust") return to(await setTrust(db, d.id, d.action === "trust" ? "on" : "off") ? `${d.action}ed` : "stale");
    if (d.action === "block" || d.action === "unblock") return to(await setAccountStatus(db, d.id, d.action === "block" ? "blocked" : "active") ? `${d.action}ed` : "stale");
    if (allowedAdmin(d.id, process.env.ADMIN_USER_IDS)) return to("admin");
    const r = await deleteAccount(db, d.id, { removePosts: d.posts === "remove" });
    return to(r.result === "missing" ? "stale" : r.authRemoved ? "deleted" : "deleted-keep-auth");
  } catch (error) { console.error("Account admin failed", error); return to("failed"); }
}
