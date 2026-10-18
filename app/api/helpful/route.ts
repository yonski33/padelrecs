import { z } from "zod";
import { database } from "../../../db/data";
import { setVote, voterId } from "../../../db/votes";
import { siteOrigin } from "../../../lib/site-url";

const input = z.object({ type: z.enum(["player", "web"]), id: z.string().min(1).max(100), on: z.boolean() });
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== siteOrigin(request.url)) return json({ error: "Vote from the site, please." }, 403);
  let parsed;
  try { parsed = input.safeParse(await request.json()); } catch { return json({ error: "Invalid vote." }, 400); }
  if (!parsed.success) return json({ error: "Invalid vote." }, 400);

  // Keyed with a server secret so the stored fingerprint can't be reversed into an IP address.
  const secret = process.env.VOTE_SECRET || process.env.DATABASE_URL || "local-development";
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const voter = voterId(ip, request.headers.get("user-agent") || "", secret);
  try {
    const result = await setVote(await database(), parsed.data, voter, parsed.data.on);
    if (result.status === "missing") return json({ error: "That review isn't available." }, 404);
    if (result.status === "limited") return json({ error: "That's a lot of votes — try again later." }, 429);
    return json({ count: result.count });
  } catch (error) {
    console.error("Vote failed", error);
    return json({ error: "Could not save your vote." }, 500);
  }
}
