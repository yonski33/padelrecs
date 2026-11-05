import sharp from "sharp";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { productPhotos, rackets } from "../../../../db/schema";
import { NO_PHOTO, UPLOAD_PATH } from "../../../../lib/shop-photos";
import { adminWriteGuard, adminRedirect } from "../../../funtimes/auth";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel refuses request bodies above about 4.5 MB

/** Sets a product's photo from the admin area: an upload, "show the drawing", or back to the default photo. */
export async function POST(request: Request) {
 const forbidden = await adminWriteGuard(request, "multipart/form-data"); if (forbidden) return forbidden;
 const form = await request.formData().catch(() => null), id = String(form?.get("id") ?? "").slice(0, 100), action = form?.get("action"), file = form?.get("photo");
 const back = (result: string) => adminRedirect(request, `tab=specs&racket=${encodeURIComponent(id)}&result=${result}`);
 if (!form || !id) return adminRedirect(request, "tab=specs&result=spec-invalid");
 try {
  const db = await database(), now = new Date().toISOString();
  const [found] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.id, id));
  if (!found) return back("spec-missing");
  if (action === "remove" || action === "default") {
   await db.delete(productPhotos).where(eq(productPhotos.racketId, id));
   await db.update(rackets).set({ imageUrl: action === "remove" ? NO_PHOTO : null }).where(eq(rackets.id, id));
   return back("photo-saved");
  }
  if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return back("photo-invalid");
  const webp = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer().catch(() => null);
  if (!webp) return back("photo-invalid");
  const data = webp.toString("base64");
  await db.insert(productPhotos).values({ racketId: id, data, updatedAt: now }).onConflictDoUpdate({ target: productPhotos.racketId, set: { data, updatedAt: now } });
  await db.update(rackets).set({ imageUrl: `${UPLOAD_PATH}${encodeURIComponent(id)}?v=${Date.parse(now)}` }).where(eq(rackets.id, id));
  return back("photo-saved");
 } catch { return back("failed"); }
}
