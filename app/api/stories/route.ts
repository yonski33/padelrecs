// Member stories (PadelRecs only, drizzle/0031). POST {title, body, rackets[]} saves a signed-in member's story: the owner's
// goes live at once, everyone else's waits in the admin Stories tab (spam is rejected). GET ?token=1 hands out a form token.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database, catalog } from "../../../db/data";
import { addStory } from "../../../db/stories";
import { currentPlayer } from "../../../lib/thread/account-session";
import { allowedAdmin } from "../../../lib/admin-access";
import { storiesSite } from "../../../lib/thread/sites";
import { STORY_BODY, STORY_TITLE, STORY_RACKETS_MAX } from "../../../lib/thread/stories";
import { issueFormToken, checkFormToken, tokenRejects } from "../../../lib/form-token";
import { createLimiter, clientIp } from "../../../lib/rate-limit";
import { niche } from "../../../lib/niche";
import { network, json, foreign } from "../thread-device";

const off = () => !storiesSite(niche.id) || !process.env.DATABASE_URL;
const burst = createLimiter({ limit: 6, windowMs: 60 * 60_000 });
const body = z.object({ title: z.string().trim().min(1).max(STORY_TITLE.max + 20), body: z.string().trim().min(1).max(STORY_BODY.max + 200),
  rackets: z.array(z.string().max(100)).max(STORY_RACKETS_MAX).default([]), formToken: z.string().optional(), website: z.string().optional() });

export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  return json(new URL(request.url).searchParams.get("token") ? { token: issueFormToken() } : {});
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Post from the story page, please." }, 403);
  if (!burst.hit(clientIp(request))) return json({ error: "Too many posts. Try again later." }, 429);
  let parsed; try { parsed = body.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Check the title and the story." }, 400);
  const v = parsed.data;
  if (v.website) return json({ status: "pending" }); // honeypot
  const token = checkFormToken(v.formToken); if (tokenRejects(token)) return json({ error: "The form expired. Reload the page and try again." }, 400);
  try {
    const db = await database(), me = await currentPlayer(db);
    if (!me) return json({ error: "Sign in to post a story." }, 401);
    if (!me.account) return json({ error: "Pick your name on the account page first." }, 403);
    if (me.account.status !== "active") return json({ error: "This account can't post." }, 403);
    // Racket tags: only listed rackets, by id.
    const listed = new Set((await catalog()).listed.map(r => r.id)), rackets = v.rackets.filter(id => listed.has(id));
    // The owner (an admin user) posts straight away; trusted members (#537) can join this once it is merged.
    const live = allowedAdmin(me.user.id, process.env.ADMIN_USER_IDS);
    const r = await addStory(db, { accountId: me.account.id, title: v.title, body: v.body, rackets, network: network(request), live });
    if (r.status === "invalid") return json({ error: r.problem }, 400);
    if (r.status === "limited") return json({ error: "That's a lot of stories for one day. Try again tomorrow." }, 429);
    if (r.status === "approved") { try { revalidatePath("/", "layout"); } catch { /* outside a request */ } }
    return json({ status: r.status === "approved" ? "live" : r.status === "rejected" ? "rejected" : "pending", ...(r.status === "approved" ? { slug: r.slug } : {}) });
  } catch (error) { console.error("Story post failed", error); return json({ error: "Could not post that. Try again?" }, 500); }
}
