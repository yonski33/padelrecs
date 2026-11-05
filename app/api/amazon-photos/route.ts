import { database } from "../../../db/data";
import { niche } from "../../../lib/niche";
import { amazonCredentials } from "../../../lib/amazon";
import { refreshAmazonPhotos } from "../../../lib/amazon-photo-job";

// Refreshes Amazon photos twice a day (lib/amazon-photo-job.ts), called by the Vercel crons in vercel.json. Every project
// shares vercel.json, so sites without amazon.photos answer 404. Projects with CRON_SECRET need it; the others take Vercel's
// cron user agent, which is safe here because the work is chosen by timestamps: an extra call finds nothing to do.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
 const settings = niche.amazon, credentials = amazonCredentials(), secret = process.env.CRON_SECRET;
 if (!settings?.photos || !credentials) return new Response(null, { status: 404 });
 const allowed = secret ? request.headers.get("authorization") === `Bearer ${secret}` : request.headers.get("user-agent")?.startsWith("vercel-cron/");
 if (!allowed) return new Response(null, { status: 401 });
 const result = await refreshAmazonPhotos(await database(), settings, credentials);
 console.log("[amazon-photos]", JSON.stringify(result));
 return Response.json(result);
}
