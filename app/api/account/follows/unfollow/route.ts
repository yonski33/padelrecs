// Unfollow from a digest email without signing in (lib/thread/follow-digest.ts signed links). POST only: the button on
// /account/unfollow, and mail apps' one-click unsubscribe (List-Unsubscribe-Post). r = a racket id or "all".
import { database } from "../../../../../db/data";
import { unfollow, unfollowAll } from "../../../../../db/follows";
import { checkFollowToken } from "../../../../../lib/thread/follow-digest";
import { followSite } from "../../../../../lib/thread/sites";
import { niche } from "../../../../../lib/niche";
import { siteOrigin } from "../../../../../lib/site-url";

export async function POST(request: Request) {
  if (!followSite(niche.id) || !process.env.DATABASE_URL) return new Response("Not here.", { status: 404 });
  const q = new URL(request.url).searchParams, u = q.get("u") ?? "", r = q.get("r") ?? "", t = q.get("t") ?? "";
  if (!u || !r || !checkFollowToken(u, r, t)) return new Response("That link didn't work.", { status: 400 });
  try { const db = await database(); if (r === "all") await unfollowAll(db, u); else await unfollow(db, u, r); }
  catch (error) { console.error("Email unfollow failed", error); return new Response("Could not unfollow. Try again?", { status: 500 }); }
  // The page's form wants the page back; a mail app's one-click POST just wants a 200.
  if ((request.headers.get("content-type") ?? "").includes("form") && !(await request.clone().text()).includes("List-Unsubscribe"))
    return Response.redirect(`${siteOrigin(request.url)}/account/unfollow?done=${r === "all" ? "all" : "one"}`, 303);
  return new Response("Unfollowed.", { status: 200, headers: { "Cache-Control": "no-store" } });
}
