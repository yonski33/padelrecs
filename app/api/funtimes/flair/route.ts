// The admin's "Edit flair" on the live pages (db/comments.ts setFlair): set a top-level post's flair to Question, Tip or
// none (drizzle/0038), or back to the guess from its words. Admin only (checked here on the server), same-origin JSON, the
// same guard as Edit helpful (/api/funtimes/helpful). Afterwards the post's product page and lists refresh on demand
// (adminJson revalidates the layout; refreshProductPages names the product's own pages). ISR times stay as they are.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, comments, rackets } from "../../../../db/schema";
import { setFlair } from "../../../../db/comments";
import { adminWriteGuard, adminJson, refreshProductPages } from "../../../funtimes/auth";
import { getCurrentUser } from "../../../../lib/supabase/auth";
import { niche } from "../../../../lib/niche";
import { postTypeSite } from "../../../../lib/thread/sites";

/** "auto": no saved type, so the page guesses from the words again. */
const body = z.object({ id: z.string().min(1).max(100), flair: z.enum(["question", "tip", "none", "auto"]) });

/** The Postgres error behind a failed write: a missing column (42703, no 0035) or the old check refusing "none" (23514). */
const code = (e: unknown) => { const x = e as { code?: string; cause?: { code?: string } }; return x?.code ?? x?.cause?.code ?? ""; };

export async function POST(request: Request) {
  const forbidden = await adminWriteGuard(request, "application/json"); if (forbidden) return forbidden;
  if (!postTypeSite(niche.id)) return adminJson(request, { error: "This site has no saved post types yet (migration 0035)." }, 503);
  let v; try { v = body.safeParse(await request.json()); } catch { return adminJson(request, { error: "Invalid request." }, 400); }
  if (!v.success) return adminJson(request, { error: v.error.issues[0]?.message ?? "Invalid request." }, 400);
  const { id, flair } = v.data;
  try {
    const db = await database(), user = await getCurrentUser();
    let changed;
    try { changed = await setFlair(db, id, flair === "auto" ? null : flair); }
    catch (error) {
      const c = code(error) || (/comment_post_type/.test(String(error)) ? "23514" : "");
      if (c === "23514") return adminJson(request, { error: "No flair needs migration 0038 on this site. Question and Tip work." }, 503);
      if (c === "42703") return adminJson(request, { error: "This site has no saved post types yet (migration 0035)." }, 503);
      throw error;
    }
    if (!changed) return adminJson(request, { error: "That post isn't there, or it's a reply (replies carry no flair)." }, 404);
    console.info("[flair] set", { id, flair, by: user?.id ?? "admin" });
    const page = (await db.select({ p: comments.page }).from(comments).where(eq(comments.id, id)))[0]?.p ?? "";
    if (page.startsWith("racket:")) {
      const [p] = await db.select({ slug: rackets.slug, shape: rackets.shape, brandSlug: brands.slug }).from(rackets)
        .leftJoin(brands, eq(brands.id, rackets.brandId)).where(eq(rackets.id, page.slice(7)));
      if (p) refreshProductPages([p]);
    }
    return adminJson(request, { result: "saved", flair });
  } catch (error) { console.error("Flair change failed", error); return adminJson(request, { error: "Saving failed. Try again." }, 500); }
}
