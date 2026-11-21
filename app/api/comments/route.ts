// Thread comments (PadelRecs only, drizzle/0025). GET ?page=<key> lists the shown comments with ▲▼ totals and this device's
// votes (?token=1 also returns a form token). POST adds a comment or reply (form token, honeypot, rate limits, spam check:
// db/comments.ts commentStatus). PATCH {commentId, value} casts or clears a ▲▼.
import { NAME_MAX, nameProblem } from "../../../lib/thread/display-name";
import { z } from "zod";
import { database } from "../../../db/data";
import { listComments, addComment, voteComment, PAGE_KEY, postTypes, setPostType, type PostType } from "../../../db/comments";
import { issueFormToken, checkFormToken, tokenRejects } from "../../../lib/form-token";
import { createLimiter, clientIp } from "../../../lib/rate-limit";
import { threadSite } from "../../../lib/thread/look";
import { postTypeSite } from "../../../lib/thread/sites";
import { niche } from "../../../lib/niche";
import { device, network, json, foreign } from "../thread-device";
import { postingAs, afterPost, memberMap, RESERVED, BLOCKED } from "../../../lib/thread/account-post";

const off = () => !threadSite(niche.id) || !process.env.DATABASE_URL;
/** Post types (drizzle/0035): only the sites whose schema has the column (lib/thread/sites.ts postTypeSite) read or write it. */
const TYPED = postTypeSite(niche.id);
const burst = createLimiter({ limit: 6, windowMs: 10 * 60_000 }), votes = createLimiter({ limit: 120, windowMs: 60 * 60_000 });
const post = z.object({ page: z.string().regex(PAGE_KEY), parentId: z.string().uuid().nullish(), alias: z.string().trim().max(NAME_MAX).refine(a => !nameProblem(a), a => ({ message: nameProblem(a) ?? "Check the name." })),
  body: z.string().trim().min(2).max(2000), formToken: z.string().optional(), website: z.string().optional(),
  /** PadelRecs community feed (drizzle/0035): an optional Question or Tip on a top-level post. */ postType: z.enum(["question", "tip"]).nullish() });
const vote = z.object({ commentId: z.string().uuid(), value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });

export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  const q = new URL(request.url).searchParams, page = q.get("page") ?? "";
  if (!PAGE_KEY.test(page)) return json({ error: "Which page?" }, 400);
  try {
    const db = await database(), list = await listComments(db, page, await device(false));
    // The member mark (optional accounts): a comment by a signed-in member, with the account's level and side read live.
    const members = await memberMap(db, "comment", list.map(c => c.id));
    // PadelRecs: each post's saved type (drizzle/0035), where it has one.
    const types = TYPED ? await postTypes(db, list.map(c => c.id)) : new Map<string, PostType>();
    return json({ comments: list.map(c => { const m = members.get(c.id), t = types.get(c.id), x = t ? { ...c, type: t } : c; return m ? { ...x, member: true, level: m.level, side: m.side } : x; }), ...(q.get("token") ? { token: issueFormToken() } : {}) });
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
    // Optional accounts: a member posts under their reserved name; a guest can't take one.
    const poster = await postingAs(db, v.alias);
    if (poster.kind === "reserved") return json({ error: RESERVED, reserved: true }, 409);
    if (poster.kind === "blocked") return json({ error: BLOCKED }, 403);
    const alias = poster.kind === "member" ? poster.account.name : v.alias;
    const r = await addComment(db, { page: v.page, parentId: v.parentId ?? null, alias, body: v.body, voter, network: network(request) });
    if (r.status !== "limited" && r.status !== "invalid") await afterPost(db, "comment", r.comment.id, poster, voter);
    // PadelRecs: a top-level post's Question or Tip (drizzle/0035); replies never carry one.
    const type = TYPED && v.postType && !v.parentId && r.status !== "limited" && r.status !== "invalid" && await setPostType(db, r.comment.id, v.postType) ? v.postType : null;
    if (r.status === "limited") return json({ error: "That's a lot of comments for one hour. Try again later." }, 429);
    if (r.status === "invalid") return json({ error: "That conversation can't take replies." }, 400);
    const comment = type ? { ...r.comment, type } : r.comment;
    return json(r.status === "approved" ? { status: "approved", comment: poster.kind === "member" ? { ...comment, member: true, level: poster.account.level, side: poster.account.side } : comment } : { status: "pending" }, 201);
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
