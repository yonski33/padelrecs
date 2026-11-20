// ▲ on member stories (PadelRecs, owner design 2026-11-21, drizzle/0033): signed-in members only, one per account.
// GET: the stories this member has ▲'d (the cached pages ask in the browser). POST {id, on}: add or take back.
// Counts on the pages refresh with the pages themselves; nothing is revalidated per tap.
import { z } from "zod";
import { database } from "../../../../db/data";
import { likeStory, likedBy, storyFeatures } from "../../../../db/story-extras";
import { currentPlayer } from "../../../../lib/thread/account-session";
import { storiesSite } from "../../../../lib/thread/sites";
import { createLimiter, clientIp } from "../../../../lib/rate-limit";
import { niche } from "../../../../lib/niche";
import { json, foreign } from "../../thread-device";

const off = () => !storiesSite(niche.id) || !process.env.DATABASE_URL;
const burst = createLimiter({ limit: 120, windowMs: 60 * 60_000 });
const input = z.object({ id: z.string().uuid(), on: z.boolean() });

export async function GET() {
  if (off()) return json({ error: "Not here." }, 404);
  try {
    const db = await database(), me = await currentPlayer(db);
    if (!me?.account || !(await storyFeatures(db)).likes) return json({ liked: [] });
    return json({ liked: await likedBy(db, me.account.id) });
  } catch (error) { console.error("Story likes read failed", error); return json({ liked: [] }); }
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Like from the story page, please." }, 403);
  if (!burst.hit(clientIp(request))) return json({ error: "Too many taps. Try again later." }, 429);
  let parsed; try { parsed = input.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Which story?" }, 400);
  try {
    const db = await database(), me = await currentPlayer(db);
    if (!me) return json({ error: "Sign in to like stories." }, 401);
    if (!me.account || me.account.status !== "active") return json({ error: "Pick your name on the account page first." }, 403);
    if (!(await storyFeatures(db)).likes) return json({ error: "Likes aren't on yet." }, 503);
    if (!(await likeStory(db, parsed.data.id, me.account.id, parsed.data.on))) return json({ error: "That story is gone." }, 404);
    return json({ status: parsed.data.on ? "liked" : "unliked" });
  } catch (error) { console.error("Story like failed", error); return json({ error: "Could not save that. Try again?" }, 500); }
}
