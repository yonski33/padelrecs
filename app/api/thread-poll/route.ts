// The Thread poll's counts (PadelRecs only): quick votes that aren't already counted as the same person's approved review
// (db/thread-votes.ts pollVotes), and this device's vote. Votes are still cast through /api/racket-votes.
import { database } from "../../../db/data";
import { pollVotes } from "../../../db/thread-votes";
import { myVotes } from "../../../db/product-votes";
import { threadSite } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { device, json } from "../thread-device";

export async function GET(request: Request) {
  if (!threadSite(niche.id) || !process.env.DATABASE_URL) return json({ error: "Not here." }, 404);
  const racketId = new URL(request.url).searchParams.get("racket");
  if (!racketId) return json({ error: "Which racket?" }, 400);
  try {
    const db = await database(), voter = await device(false);
    return json({ votes: await pollVotes(db, racketId), mine: voter ? (await myVotes(db, voter))[racketId] ?? null : null });
  } catch (error) { console.error("Poll read failed", error); return json({ error: "Could not load votes." }, 500); }
}
