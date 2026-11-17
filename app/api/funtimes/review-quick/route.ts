// Quick inline edits on the admin review queue (owner 2026-11-17): name, date or text of one player review, in place (JSON).
// The same admin + same-origin guard as every admin write, then the server's own validation (lib/review-quick.ts). Only that
// one column changes; tags and any quick-take content stay as they are.
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { reviews } from "../../../../db/schema";
import { adminWriteGuard, adminJson, readAdminForm } from "../../../funtimes/auth";
import { quickEditInput, withDate } from "../../../../lib/review-quick";

export async function POST(request: Request) {
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let raw; try { raw = await readAdminForm(request); } catch { return adminJson(request, { error: "Could not read that request." }, 400); }
  const parsed = quickEditInput.safeParse(raw);
  if (!parsed.success || parsed.data.id.startsWith("demo-")) return adminJson(request, { error: parsed.success ? "That review can't be changed here." : parsed.error.issues[0]?.message ?? "Not a valid value." }, 400);
  const v = parsed.data;
  try {
    const db = await database();
    const [row] = await db.select({ createdAt: reviews.createdAt }).from(reviews).where(eq(reviews.id, v.id)).limit(1);
    if (!row) return adminJson(request, { error: "That review no longer exists." }, 404);
    const set = v.field === "alias" ? { alias: v.value || null } : v.field === "date" ? { createdAt: withDate(row.createdAt, v.value) } : { reviewText: v.value };
    await db.update(reviews).set(set).where(eq(reviews.id, v.id));
    return adminJson(request, { result: "saved", value: v.field === "date" ? withDate(row.createdAt, v.value) : v.value });
  } catch { return adminJson(request, { error: "Saving failed. Try again." }, 500); }
}
