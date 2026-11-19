// Optional player accounts (PadelRecs Thread, drizzle/0028). GET: who is signed in and their reserved name. POST: reserve a
// name (action "claim") or change name, level, side ("update"). DELETE: remove the account (and its sign-in).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database } from "../../../db/data";
import { claimAccount, updateAccount, deleteAccount, deleteAuthUser, linkDevice, getAccount } from "../../../db/accounts";
import { currentPlayer } from "../../../lib/thread/account-session";
import { accountNameProblem } from "../../../lib/thread/account-name";
import { NAME_MAX } from "../../../lib/thread/display-name";
import { allowedAdmin } from "../../../lib/admin-access";
import { createClient } from "../../../lib/supabase/server";
import { createLimiter, clientIp } from "../../../lib/rate-limit";
import { threadSite } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { device, json, foreign } from "../thread-device";

const off = () => !threadSite(niche.id) || !process.env.DATABASE_URL;
const writes = createLimiter({ limit: 30, windowMs: 60 * 60_000 });
const body = z.object({ action: z.enum(["claim", "update"]), name: z.string().trim().max(NAME_MAX).optional(), level: z.string().max(40).nullish(), side: z.string().max(40).nullish() });
const view = (a: { name: string; level: string | null; side: string | null; status: string } | null) => a && { name: a.name, level: a.level, side: a.side, status: a.status };

/** Cached pages show the new name or member marks on their next view (a rename or linked posts: rare). */
const refresh = () => { try { revalidatePath("/", "layout"); } catch { /* outside a request (tests) */ } };

export async function GET() {
  if (off()) return json({ error: "Not here." }, 404);
  try {
    const me = await currentPlayer(await database());
    return json(me ? { signedIn: true, email: me.user.email, account: view(me.account) } : { signedIn: false });
  } catch (error) { console.error("Account read failed", error); return json({ signedIn: false }); }
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Use the account page, please." }, 403);
  if (!writes.hit(clientIp(request))) return json({ error: "Too many changes. Try again later." }, 429);
  let parsed; try { parsed = body.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Check the name (2 to 24 characters)." }, 400);
  const v = parsed.data, db = await database(), me = await currentPlayer(db);
  if (!me) return json({ error: "Sign in first." }, 401);
  if (me.account?.status === "blocked") return json({ error: "This account can't make changes. Use the contact page if this looks wrong." }, 403);
  if (v.name !== undefined) { const p = accountNameProblem(v.name); if (p) return json({ error: p }, 400); }
  try {
    if (v.action === "claim") {
      if (!v.name) return json({ error: "Pick a name." }, 400);
      const r = await claimAccount(db, { id: me.user.id, name: v.name, level: v.level, side: v.side });
      if (r === "taken") return json({ error: "Someone already has that name. Try another." }, 409);
      if (r === "invalid") return json({ error: "Check the name." }, 400);
      const account = (await getAccount(db, me.user.id))!;
      const voter = await device(false);
      const linked = r === "ok" && voter ? await linkDevice(db, account, voter) : 0;
      if (linked) refresh();
      return json({ account: view(account), linked });
    }
    const renamed = !!v.name && v.name !== me.account?.name;
    const r = await updateAccount(db, me.user.id, { name: v.name, level: v.level, side: v.side });
    if (r === "ok" && renamed) refresh();
    if (r === "missing") return json({ error: "Pick a name first." }, 400);
    if (r === "taken") return json({ error: "Someone already has that name. Try another." }, 409);
    if (r === "invalid") return json({ error: "Check the name." }, 400);
    return json({ account: view(await getAccount(db, me.user.id)) });
  } catch (error) { console.error("Account save failed", error); return json({ error: "Could not save that. Try again?" }, 500); }
}

export async function DELETE(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Use the account page, please." }, 403);
  const removePosts = new URL(request.url).searchParams.get("posts") === "remove";
  const db = await database(), me = await currentPlayer(db);
  if (!me) return json({ error: "Sign in first." }, 401);
  // The owner's own sign-in shares this Auth project: never delete it from here.
  const admin = allowedAdmin(me.user.id, process.env.ADMIN_USER_IDS);
  try {
    if (me.account) await deleteAccount(db, me.user.id, { removePosts, keepAuthUser: admin });
    else if (!admin) await deleteAuthUser(db, me.user.id);
    const client = await createClient(); if (client) await client.auth.signOut({ scope: "local" });
    return json({ ok: true });
  } catch (error) { console.error("Account delete failed", error); return json({ error: "Could not delete the account. Try again, or use the contact page." }, 500); }
}
