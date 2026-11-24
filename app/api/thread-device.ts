// The Thread votes' and comments' device (the same "rv" cookie and keyed hash as /api/racket-votes) and network hash, so one
// device has one trait vote per group and one ▲▼ per comment, and floods are cut per network. Never stored in the clear.
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { voteHash } from "../../db/product-votes";
import { siteOrigin } from "../../lib/site-url";
import { clientIp } from "../../lib/rate-limit";

const COOKIE = "rv", YEAR = 60 * 60 * 24 * 365;
const secret = () => process.env.VOTE_SECRET || process.env.DATABASE_URL || "local-development";
export async function device(create: boolean) {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id && create) { id = randomUUID(); jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" }); }
  return id ? voteHash(`device|${id}`, secret()) : null;
}
export const network = (request: Request) => voteHash(`network|${clientIp(request)}|${request.headers.get("user-agent") || ""}`, secret());
export const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
/** Writes come from the site's own pages. */
export const foreign = (request: Request) => { const o = request.headers.get("origin"); return !!o && o !== siteOrigin(request.url); };
