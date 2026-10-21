import { revalidateSite } from "../../../lib/revalidate";
import { revalidationAuthorized } from "../../../lib/revalidate-secret";

// Refreshes every cached public page of this site after a change made outside it (scripts/revalidate-live.ts).
// Requires "Authorization: Bearer <REVALIDATE_SECRET>"; without that variable configured it refuses everything.
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!revalidationAuthorized(request.headers.get("authorization"), process.env.REVALIDATE_SECRET)) return Response.json({ error: "Not allowed." }, { status: 401, headers });
  revalidateSite();
  return Response.json({ revalidated: true, at: new Date().toISOString() }, { headers });
}
