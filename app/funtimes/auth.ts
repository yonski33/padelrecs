import { revalidatePath } from "next/cache";
import { forgetCatalog } from "../../db/data";
import { getCurrentUser } from "../../lib/supabase/auth";
import { allowedAdmin } from "../../lib/admin-access";
import { siteOrigin } from "../../lib/site-url";
import { niche, catalogPath, productHref } from "../../lib/niche";
export async function isAdmin() {
 const user=await getCurrentUser();
 return allowedAdmin(user?.id,process.env.ADMIN_USER_IDS);
}
export async function adminWriteGuard(request: Request, contentType = "application/x-www-form-urlencoded") {
 if (!(await isAdmin())) return Response.json({error: "Admin access required."}, {status: 403, headers: {"Cache-Control": "no-store"}});
 // All writes originate in same-origin HTML forms; require Origin to prevent CSRF.
 if (request.headers.get("origin") !== siteOrigin(request.url)) return Response.json({error: "Invalid request origin."}, {status: 403});
 if (!(request.headers.get("content-type") || "").startsWith(contentType)) return Response.json({error: "Use the admin form."}, {status: 415});
 return null;
}
/** Every admin write ends here (publish, reject, edit, specs, photos, expert values): the site shows the change at once
 *  on this instance (the kept catalog copy is dropped) and Next's cached pages refresh (audit 2026-11-15, #9). */
function adminChanged(request: Request) {
 if (request.method === "POST") { forgetCatalog(); try { revalidatePath("/", "layout"); } catch { /* outside a request scope (tests) */ } }
}
/** A product's own pages after an admin save (DiscGolfRecs audit 2026-11-20): its page (the public address and the Thread
 *  page proxy.ts serves it from), the catalogue, the rankings, its type page and its brand page, for its old and new slug,
 *  type and brand. adminChanged below already refreshes every page; these name the affected ones outright. The pages'
 *  ISR and edge times stay as they are (owner cost rule). */
export function refreshProductPages(items: { slug: string; shape: string | null; brandSlug?: string | null }[]) {
 const paths = new Set<string>([catalogPath, "/rankings", "/thread/rackets", "/thread/rankings"]);
 for (const p of items) {
  paths.add(productHref(p)); paths.add(`/thread/rackets/${p.slug}`);
  const type = (niche.typePages ?? []).find(t => t.shape === p.shape);
  if (type) { paths.add(`/${type.slug}`); paths.add(`/thread/types/${type.slug}`); }
  if (p.brandSlug) { paths.add(`/brands/${p.brandSlug}`); paths.add(`/thread/brands/${p.brandSlug}`); }
 }
 try { for (const path of paths) revalidatePath(path); revalidatePath("/rankings", "layout"); revalidatePath("/thread/rankings", "layout"); } catch { /* outside a request scope (tests) */ }
}
export function adminRedirect(request: Request, query: string, path = "/funtimes") {
 adminChanged(request);
 return new Response(null, {status: 303, headers: {Location: new URL(`${path}?${query}`, siteOrigin(request.url)).toString(), "Cache-Control": "no-store"}});
}
/** The in-place variant (owner 2026-11-17: approve without a reload): the same write, the same refresh, a JSON answer
 *  instead of the redirect. Only for a request that asks for JSON; the guard before it is unchanged. */
export const wantsJson = (request: Request) => (request.headers.get("accept") || "").includes("application/json");
export function adminJson(request: Request, body: Record<string, unknown>, status = 200) {
 if (status < 300) adminChanged(request);
 return Response.json(body, {status, headers: {"Cache-Control": "no-store"}});
}
export async function readAdminForm(request: Request) {
 const text = await request.text();
 const params = new URLSearchParams(text);
 return { ...Object.fromEntries(params), tags: params.getAll("tags") } as Record<string, string> & { tags: string[] };
}
