import { sql } from "drizzle-orm";
import { database } from "../../../db/data";
import { niche } from "../../../lib/niche";
import { sendDigest, type DigestReview, type ReadReviews } from "../../../lib/review-digest";

// The daily review digest (lib/review-digest.ts), called by the Vercel cron in vercel.json. Every project shares
// vercel.json, so only the PadelRecs deployment sends it, and only when Vercel's call carries CRON_SECRET.
const readReviews: ReadReviews = async (schema, since) => {
 const db = await database();
 const s = sql.identifier(schema);
 const { rows } = await db.execute<{ id: string; rating: number; review_text: string; alias: string | null; email: string | null; status: string; created_at: string; name: string; slug: string; shape: string | null; racket_created: string }>(
  sql`select r.id, r.rating, r.review_text, r.alias, r.email, r.status, r.created_at, k.name, k.slug, k.shape, k.created_at as racket_created
   from ${s}.reviews r join ${s}.rackets k on k.id = r.racket_id where r.created_at >= ${since} and r.status <> 'rejected' order by r.created_at`);
 return rows.map((r): DigestReview => ({ id: r.id, rating: r.rating, reviewText: r.review_text, alias: r.alias, email: r.email, status: r.status, createdAt: r.created_at,
  product: { name: r.name, slug: r.slug, shape: r.shape }, newProduct: r.racket_created === r.created_at }));
};

export async function GET(request: Request) {
 const secret = process.env.CRON_SECRET;
 if (niche.id !== "padel") return new Response(null, { status: 404 });
 if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
 try { return Response.json(await sendDigest(readReviews)); }
 catch (error) { console.error("Review digest failed", error); return Response.json({ status: "failed" }, { status: 500 }); }
}
export const dynamic = "force-dynamic";
