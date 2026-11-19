// Thread "How does it play?" votes (PadelRecs only, drizzle/0024): GET ?racket=<id> returns the counts and this device's
// votes, plus the owner's overrides (admin Traits tab: review counts, frozen groups); POST {racketId, trait, choice|null} casts,
// changes or clears one (not in a frozen group). No moderation (one tap, like the quick vote).
import { z } from "zod";
import { database } from "../../../db/data";
import { traitCounts, myTraitVotes, castTraitVote } from "../../../db/thread-votes";
import { traitOverridesFor } from "../../../db/trait-admin";
import { validTraitVote } from "../../../lib/thread/traits";
import { threadSite } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { device, network, json, foreign } from "../thread-device";

const input = z.object({ racketId: z.string().min(1).max(100), trait: z.string().min(2).max(20), choice: z.string().min(2).max(20).nullable() });
const off = () => !threadSite(niche.id) || !process.env.DATABASE_URL;

export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  const racketId = new URL(request.url).searchParams.get("racket");
  if (!racketId) return json({ error: "Which racket?" }, 400);
  try {
    const db = await database(), voter = await device(false);
    return json({ counts: await traitCounts(db, racketId), mine: voter ? await myTraitVotes(db, racketId, voter) : {}, overrides: await traitOverridesFor(db, racketId) });
  } catch (error) { console.error("Trait votes read failed", error); return json({ error: "Could not load votes." }, 500); }
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Vote from the site, please." }, 403);
  let parsed; try { parsed = input.safeParse(await request.json()); } catch { return json({ error: "Invalid vote." }, 400); }
  if (!parsed.success || !validTraitVote(parsed.data.trait, parsed.data.choice)) return json({ error: "Invalid vote." }, 400);
  const { racketId, trait, choice } = parsed.data;
  try {
    const db = await database(), voter = (await device(true))!;
    const status = await castTraitVote(db, racketId, trait, choice, voter, network(request));
    if (status === "missing") return json({ error: "That racket isn't in the catalog." }, 404);
    if (status === "frozen") return json({ error: "Voting is closed here for now." }, 403);
    if (status === "limited") return json({ error: "That's a lot of votes for one hour. Try again later." }, 429);
    return json({ counts: await traitCounts(db, racketId), mine: await myTraitVotes(db, racketId, voter), overrides: await traitOverridesFor(db, racketId) });
  } catch (error) { console.error("Trait vote failed", error); return json({ error: "Could not save your vote." }, 500); }
}
