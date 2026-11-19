// Thread comments (PadelRecs only, drizzle/0025). GET ?page=<key> lists the shown comments with ▲▼ totals and this device's
// votes (?token=1 also returns a form token). POST adds a comment or reply (form token, honeypot, rate limits, spam check:
// db/comments.ts commentStatus). PATCH {commentId, value} casts or clears a ▲▼.
import { z } from "zod";
import { database } from "../../../db/data";
import { listComments, addComment, voteComment, PAGE_KEY } from "../../../db/comments";
import { issueFormToken, checkFormToken, tokenRejects } from "../../../lib/form-token";
import { createLimiter, clientIp } from "../../../lib/rate-limit";
import { threadSite } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { device, network, json, foreign } from "../thread-device";

const off = () => !threadSite(niche.id) || !process.env.DATABASE_URL;
const burst = createLimiter({ limit: 6, windowMs: 10 * 60_000 }), votes = createLimiter({ limit: 120, windowMs: 60 * 60_000 });
const post = z.object({ page: z.string().regex(PAGE_KEY), parentId: z.string().uuid().nullish(), alias: z.string().trim().min(1).max(50),
  body: z.string().trim().min(2).max(2000), formToken: z.string().optional(), website: z.string().optional() });
const vote = z.object({ commentId: z.string().uuid(), value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });

export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  const q = new URL(request.url).searchParams, page = q.get("page") ?? "";
  if (!PAGE_KEY.test(page)) return json({ error: "Which page?" }, 400);
  try {
    const db = await database();
    return json({ comments: await listComments(db, page, await device(false)), ...(q.get("token") ? { token: issueFormToken() } : {}) });
  } catch (error) { console.error("Comments read failed", error); return json({ error: "Could not load comments." }, 500); }
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Post from the site, please." }, 403);
  let parsed; try { parsed = post.safeParse(await request.json()); } catch { return json({ error: "Invalid comment." }, 400); }
  if (!parsed.success) return json({ error: "Write at least a couple of words (up to 2,000 characters)." }, 400);
  const v = parsed.data;
  // Bots: the honeypot and bad tokens get a quiet "thanks" and nothing is saved.
  if (v.website?.trim() || tokenRejects(checkFormToken(v.formToken))) return json({ status: "pending" }, 202);
  if (!burst.hit(clientIp(request))) return json({ error: "That's a lot of comments in a few minutes. Try again soon." }, 429);
  try {
    const db = await database(), voter = (await device(true))!;
    const r = await addComment(db, { page: v.page, parentId: v.parentId ?? null, alias: v.alias, body: v.body, voter, network: network(request) });
    if (r.status === "limited") return json({ error: "That's a lot of comments for one hour. Try again later." }, 429);
    if (r.status === "invalid") return json({ error: "That conversation can't take replies." }, 400);
    return json(r.status === "approved" ? { status: "approved", comment: r.comment } : { status: "pending" }, 201);
  } catch (error) { console.error("Comment save failed", error); return json({ error: "Could not post that. Try again?" }, 500); }
}

export async function PATCH(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Vote from the site, please." }, 403);
  let parsed; try { parsed = vote.safeParse(await request.json()); } catch { return json({ error: "Invalid vote." }, 400); }
  if (!parsed.success) return json({ error: "Invalid vote." }, 400);
  if (!votes.hit(clientIp(request))) return json({ error: "Too many votes. Try again later." }, 429);
  try {
    const ok = await voteComment(await database(), parsed.data.commentId, (await device(true))!, parsed.data.value);
    return ok ? json({ ok: true }) : json({ error: "That comment isn't here." }, 404);
  } catch (error) { console.error("Comment vote failed", error); return json({ error: "Could not save your vote." }, 500); }
}
