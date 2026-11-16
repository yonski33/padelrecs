// On-demand refresh (owner 2026-11-16, Vercel cost): cached pages now refresh every 6–24 hours instead of every 5 minutes,
// so data written outside the admin (imports, the publish and review jobs: scripts/refresh-sites.mjs) refreshes the site here.
// POST with "Authorization: Bearer <REFRESH_SECRET>" (CRON_SECRET where no REFRESH_SECRET is set): this instance drops its
// kept catalog copies and every cached page and view is rebuilt on its next visit. Admin writes do the same (app/funtimes/auth.ts).
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forgetCatalog } from "../../../db/data";

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export async function POST(request: Request) {
  const secret = process.env.REFRESH_SECRET || process.env.CRON_SECRET;
  if (!secret || !same(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  forgetCatalog();
  revalidatePath("/", "layout");
  return Response.json({ refreshed: true }, { headers: { "Cache-Control": "no-store" } });
}
export const dynamic = "force-dynamic";
