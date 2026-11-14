import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { database, catalog } from "../../../db/data";
import { alsoLoved, castVote, myVotes, voteHash, voteStats } from "../../../db/product-votes";
import { niche, productHref } from "../../../lib/niche";
import { displayName } from "../../../lib/brand-name";
import { siteOrigin } from "../../../lib/site-url";

// Quick ratings: POST casts or changes this device's 1–5 rating of one product; GET returns a product's totals, this device's
// votes, or "players who loved these also loved". The device is a random cookie, stored only as a keyed hash.

const COOKIE = "rv", YEAR = 60 * 60 * 24 * 365;
const options = (o: readonly { value: string }[]) => o.map(x => x.value) as [string, ...string[]];
const profile = niche.profile;
const input = z.object({
  racketId: z.string().min(1).max(100), rating: z.number().int().min(1).max(5),
  level: z.enum(options(profile.playerLevel.options)).nullish(), style: z.enum(options(profile.playingStyle.options)).nullish(),
  side: z.enum(options(profile.playingSide.options)).nullish(),
});
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const secret = () => process.env.VOTE_SECRET || process.env.DATABASE_URL || "local-development";

async function device(create: boolean) {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id && create) { id = randomUUID(); jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" }); }
  return id ? voteHash(`device|${id}`, secret()) : null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== siteOrigin(request.url)) return json({ error: "Vote from the site, please." }, 403);
  let parsed;
  try { parsed = input.safeParse(await request.json()); } catch { return json({ error: "Invalid vote." }, 400); }
  if (!parsed.success) return json({ error: "Invalid vote." }, 400);
  const { racketId, rating, level, style, side } = parsed.data;
  const voter = (await device(true))!;
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const network = voteHash(`network|${ip}|${request.headers.get("user-agent") || ""}`, secret());
  try {
    const result = await castVote(await database(), racketId, rating, { level, style, side }, voter, network);
    if (result.status === "invalid") return json({ error: "Invalid vote." }, 400);
    if (result.status === "missing") return json({ error: `That ${niche.words.one} isn't in the catalog.` }, 404);
    if (result.status === "limited") return json({ error: "That's a lot of votes for one hour. Try again later." }, 429);
    return json({ stats: result.stats });
  } catch (error) {
    console.error("Product vote failed", error);
    return json({ error: "Could not save your vote." }, 500);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const racketId = url.searchParams.get("racket"), level = url.searchParams.get("level"), loved = url.searchParams.get("loved");
  try {
    const db = await database(), voter = await device(false);
    const mine = voter ? await myVotes(db, voter) : {};
    if (loved !== null) {
      const ids = loved.split(",").filter(Boolean).slice(0, 50);
      const picks = await alsoLoved(db, ids, Object.keys(mine), voter ?? "");
      const data = await catalog();
      return json({ picks: picks.flatMap(p => {
        const r = data.rackets.find(x => x.id === p.racketId);
        if (!r) return [];
        return [{ id: r.id, name: displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name), href: productHref(r), fans: p.fans }];
      }) });
    }
    if (!racketId) return json({ mine });
    return json({ stats: await voteStats(db, racketId, level), mine: mine[racketId] ?? null });
  } catch (error) {
    console.error("Product votes read failed", error);
    return json({ error: "Could not load votes." }, 500);
  }
}
