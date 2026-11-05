import { eq } from "drizzle-orm";
import { database } from "../../../db/data";
import { productPhotos } from "../../../db/schema";

/** Serves a photo uploaded in the admin area. Each upload gets a new ?v=, so the old address can be cached for good. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params, db = await database();
 const [photo] = await db.select({ data: productPhotos.data }).from(productPhotos).where(eq(productPhotos.racketId, id));
 if (!photo) return new Response(null, { status: 404 });
 return new Response(Buffer.from(photo.data, "base64"), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
}
