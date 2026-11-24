// The daily "New on rackets you follow" email (db/follows.ts, lib/thread/follow-digest.ts), called once a day by the Vercel
// cron in vercel.json. Every project shares vercel.json, so only a follow site's deployment does anything, and only when
// Vercel's call carries CRON_SECRET. Sent through Resend (RESEND_API_KEY, already set) from the site's verified domain.
import { sql } from "drizzle-orm";
import { database } from "../../../db/data";
import { digestFor, markSent, pruneSent } from "../../../db/follows";
import { digestMail } from "../../../lib/thread/follow-digest";
import { sendWithResend } from "../../../lib/contact";
import { followSite } from "../../../lib/thread/sites";
import { niche, productPathIn } from "../../../lib/niche";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET, apiKey = process.env.RESEND_API_KEY;
  if (!followSite(niche.id)) return new Response(null, { status: 404 });
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  if (!apiKey || !process.env.DATABASE_URL) return Response.json({ status: "not set up" }, { status: 503 });
  const db = await database(), now = new Date();
  const site = { name: niche.site.name, origin: `https://www.${niche.site.domain}`, productHref: (r: { slug: string; shape: string | null }) => productPathIn(niche, r) };
  let sent = 0, failed = 0;
  try {
    const due = await digestFor(db, now);
    if (due.length) {
      const ids = due.map(d => d.userId);
      const { rows } = await db.execute<{ id: string; email: string | null }>(sql`select id::text as id, email from auth.users where id::text in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
      const email = new Map(rows.map(r => [r.id, r.email]));
      for (const d of due) {
        const to = email.get(d.userId); if (!to) continue; // the sign-in was removed: nothing to send to
        try { await sendWithResend(digestMail(d, to, site, `no-reply@${niche.site.domain}`), apiKey); await markSent(db, d, now); sent++; }
        catch (error) { failed++; console.error("Follow digest email failed", d.userId, error); }
        await new Promise(r => setTimeout(r, 600)); // Resend's default limit is 2 requests a second
      }
    }
    await pruneSent(db, now);
    return Response.json({ status: "ok", due: due.length, sent, failed });
  } catch (error) { console.error("Follow digest failed", error); return Response.json({ status: "failed", sent, failed }, { status: 500 }); }
}
