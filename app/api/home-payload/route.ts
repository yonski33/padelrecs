// The quick-match home's ranking payload (app/home-payload.ts: the engine's items and a card per product) for the browser's
// re-rank on a chip tap (app/home-match.tsx). The same for every home view, so it comes from this one cached address instead
// of inside each home's HTML (owner 2026-11-16: homes were 340–950 KB, most of it this payload).
import { homePayload } from "../../home-payload";
import { isV2, niche } from "../../../lib/niche";
import { attrProfileFor } from "../../../lib/attr-profile";

// 6 hours, like the pages; refreshed at once with them (app/api/refresh, admin writes).
export const revalidate = 21600;

export async function GET() {
  // SkinRecs (an attribute profile) has its own home; a build without a database (CI) builds an empty payload.
  if (!isV2 || !niche.finder || attrProfileFor(niche) || !process.env.DATABASE_URL) return Response.json({ items: [], cards: {} });
  return Response.json(await homePayload());
}
