// The match engine's slim items (app/home-payload.ts) for the racket pages' fit check in the browser (app/rackets/[slug]/
// fit-live.tsx). They are the same on every racket page, so they come from this one cached address instead of inside each
// page's HTML (owner 2026-11-16: racket pages were ~380 KB, 270 KB of it these items). Refreshed like the pages, every 5 minutes.
import { homePayload } from "../../home-payload";
import { isV2, niche } from "../../../lib/niche";
import { attrProfileFor } from "../../../lib/attr-profile";

export const revalidate = 300;

export async function GET() {
  // A build without a database (CI) builds an empty list; the browser ignores it and keeps the server's answer.
  // SkinRecs (an attribute profile) has its own product page and no engine items.
  if (!isV2 || !niche.finder || attrProfileFor(niche) || !process.env.DATABASE_URL) return Response.json([]);
  return Response.json((await homePayload()).items);
}
