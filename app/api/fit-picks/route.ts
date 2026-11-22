// The fit check's better-picks data (lib/thread/fit-core.ts pickData): each racket's strengths and the tags its downsides
// matter for, from its page content (db/racket-page/*.json). Static, so the browser fetches it once and the racket pages
// stay small; only sites with the fit check (lib/thread/sites.ts fitCoreSite) serve it.
import { niche } from "../../../lib/niche";
import { allPageContent } from "../../../lib/racket-page";
import { pickData } from "../../../lib/thread/fit-core";
import { easierPicksSite, fitCoreSite } from "../../../lib/thread/sites";

export const revalidate = 21600;

export async function GET() {
  if (!fitCoreSite(niche.id) && !easierPicksSite(niche.id)) return Response.json({});
  return Response.json(pickData(allPageContent()));
}
