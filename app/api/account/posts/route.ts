// "Your posts" (PadelRecs member zone): GET lists the signed-in member's reviews and comments; PATCH edits one's text within
// 24 hours; DELETE removes one. Only the member's own posts (db/account-posts.ts checks account_posts).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database } from "../../../../db/data";
import { ownPosts, editOwnPost, deleteOwnPost, TEXT_MAX, type OwnPost } from "../../../../db/account-posts";
import { currentPlayer } from "../../../../lib/thread/account-session";
import { th, GUIDE_PATHS, type GuideKey } from "../../../../lib/thread/look";
import { accountSite } from "../../../../lib/thread/sites";
import { niche, productHref } from "../../../../lib/niche";
import { createLimiter, clientIp } from "../../../../lib/rate-limit";
import { json, foreign } from "../../thread-device";

const off = () => !accountSite(niche.id) || !process.env.DATABASE_URL;
const writes = createLimiter({ limit: 60, windowMs: 60 * 60_000 });
const target = z.object({ kind: z.enum(["review", "comment"]), id: z.string().min(1).max(100) });
const edit = target.extend({ text: z.string().max(TEXT_MAX + 200) });

/** Where a post lives: its racket page (#reviews or #comments), its ranking or its guide. */
function where(p: OwnPost) {
  const [kind, key] = p.page.split(":"), hash = p.kind === "review" ? "#reviews" : "#comments";
  if (kind === "racket") return p.racket ? { title: p.racket.name, href: th(productHref(p.racket)) + hash } : { title: "A racket that left the catalogue", href: null };
  if (kind === "ranking") return { title: `Ranking: ${key.replace(/-/g, " ")}`, href: th(`/rankings/${key}`) + hash };
  if (kind === "guide" && key in GUIDE_PATHS) return { title: `Guide: ${key}`, href: th(GUIDE_PATHS[key as GuideKey]) + hash };
  return { title: "A page", href: null };
}
const view = (p: OwnPost) => ({ kind: p.kind, id: p.id, at: p.at, text: p.text, status: p.status, editable: p.editable, ...where(p) });
const refresh = () => { try { revalidatePath("/", "layout"); } catch { /* outside a request */ } };

async function member() {
  const db = await database(), me = await currentPlayer(db);
  return { db, account: me?.account ?? null, signedIn: !!me };
}

export async function GET() {
  if (off()) return json({ error: "Not here." }, 404);
  try {
    const { db, account, signedIn } = await member();
    if (!account) return json({ error: signedIn ? "Pick a name first." : "Sign in first." }, 401);
    return json({ posts: (await ownPosts(db, account.id)).map(view) });
  } catch (error) { console.error("Own posts read failed", error); return json({ error: "Could not load your posts." }, 500); }
}

export async function PATCH(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Use the account page, please." }, 403);
  if (!writes.hit(clientIp(request))) return json({ error: "Too many changes. Try again later." }, 429);
  let parsed; try { parsed = edit.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Invalid request." }, 400);
  const { db, account } = await member();
  if (!account) return json({ error: "Sign in first." }, 401);
  if (account.status === "blocked") return json({ error: "This account can't make changes right now." }, 403);
  try {
    const r = await editOwnPost(db, account.id, parsed.data.kind, parsed.data.id, parsed.data.text);
    if (r.result === "missing") return json({ error: "That post isn't here any more." }, 404);
    if (r.result === "locked") return json({ error: "Posts can be edited for 24 hours. You can still delete it." }, 409);
    if (r.result === "invalid") return json({ error: parsed.data.kind === "review" ? "A review needs 20 to 2,000 characters." : "Write 2 to 2,000 characters." }, 400);
    if (r.result === "spam") return json({ error: "That text looks like spam to the filter. Try rewording it." }, 400);
    if (parsed.data.kind === "review") refresh();
    return json({ status: r.status });
  } catch (error) { console.error("Own post edit failed", error); return json({ error: "Could not save that. Try again?" }, 500); }
}

export async function DELETE(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Use the account page, please." }, 403);
  if (!writes.hit(clientIp(request))) return json({ error: "Too many changes. Try again later." }, 429);
  const q = new URL(request.url).searchParams, parsed = target.safeParse({ kind: q.get("kind"), id: q.get("id") });
  if (!parsed.success) return json({ error: "Invalid request." }, 400);
  const { db, account } = await member();
  if (!account) return json({ error: "Sign in first." }, 401);
  try {
    if (await deleteOwnPost(db, account.id, parsed.data.kind, parsed.data.id) === "missing") return json({ error: "That post isn't here any more." }, 404);
    if (parsed.data.kind === "review") refresh();
    return json({ ok: true });
  } catch (error) { console.error("Own post delete failed", error); return json({ error: "Could not delete it. Try again?" }, 500); }
}
