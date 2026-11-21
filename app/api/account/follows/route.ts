// Following racket pages (drizzle/0034, db/follows.ts). GET ?racket=<id>: is the signed-in player following it (the Follow
// button asks only when a Supabase session cookie is present, so cached pages stay the same for everyone). GET without
// ?racket: the member zone's list and the email setting. POST { racketId }: follow. DELETE { racketId }: unfollow.
// PATCH { emails }: pause or resume the daily email.
import { z } from "zod";
import { database } from "../../../../db/data";
import { follow, unfollow, isFollowing, followList, digestEmails, setDigestEmails } from "../../../../db/follows";
import { currentPlayer } from "../../../../lib/thread/account-session";
import { followSite } from "../../../../lib/thread/sites";
import { createLimiter, clientIp } from "../../../../lib/rate-limit";
import { niche, productPathIn } from "../../../../lib/niche";
import { json, foreign } from "../../thread-device";

const off = () => !followSite(niche.id) || !process.env.DATABASE_URL;
const writes = createLimiter({ limit: 120, windowMs: 60 * 60_000 });
const one = z.object({ racketId: z.string().min(1).max(80) });
const prefs = z.object({ emails: z.boolean() });

async function who() { const db = await database(); return { db, me: await currentPlayer(db) }; }
async function guard(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Use the site, please." }, 403);
  if (!writes.hit(clientIp(request))) return json({ error: "Too many changes. Try again later." }, 429);
  return null;
}

export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  try {
    const { db, me } = await who(); if (!me) return json({ signedIn: false });
    const racket = new URL(request.url).searchParams.get("racket");
    if (racket) return json({ signedIn: true, following: await isFollowing(db, me.user.id, racket) });
    const list = await followList(db, me.user.id);
    return json({ signedIn: true, emails: await digestEmails(db, me.user.id), rackets: list.map(r => ({ id: r.id, name: r.name, href: productPathIn(niche, r), since: r.since })) });
  } catch (error) { console.error("Follows read failed", error); return json({ error: "Could not load that." }, 500); }
}

export async function POST(request: Request) {
  const no = await guard(request); if (no) return no;
  let v; try { v = one.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!v.success) return json({ error: "Invalid request." }, 400);
  try {
    const { db, me } = await who(); if (!me) return json({ error: "Sign in to follow." }, 401);
    return (await follow(db, me.user.id, v.data.racketId)) === "ok" ? json({ following: true }) : json({ error: "That racket wasn't found." }, 404);
  } catch (error) { console.error("Follow failed", error); return json({ error: "Could not follow. Try again?" }, 500); }
}

export async function DELETE(request: Request) {
  const no = await guard(request); if (no) return no;
  let v; try { v = one.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!v.success) return json({ error: "Invalid request." }, 400);
  try {
    const { db, me } = await who(); if (!me) return json({ error: "Sign in first." }, 401);
    await unfollow(db, me.user.id, v.data.racketId); return json({ following: false });
  } catch (error) { console.error("Unfollow failed", error); return json({ error: "Could not unfollow. Try again?" }, 500); }
}

export async function PATCH(request: Request) {
  const no = await guard(request); if (no) return no;
  let v; try { v = prefs.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!v.success) return json({ error: "Invalid request." }, 400);
  try {
    const { db, me } = await who(); if (!me) return json({ error: "Sign in first." }, 401);
    await setDigestEmails(db, me.user.id, v.data.emails); return json({ emails: v.data.emails });
  } catch (error) { console.error("Follow email setting failed", error); return json({ error: "Could not save that." }, 500); }
}
