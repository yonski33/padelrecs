import { revalidatePath } from "next/cache";
import { forgetCatalog } from "../../db/data";
import { getCurrentUser } from "../../lib/supabase/auth";
import { allowedAdmin } from "../../lib/admin-access";
import { siteOrigin } from "../../lib/site-url";
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
export function adminRedirect(request: Request, query: string) {
 if (request.method === "POST") { forgetCatalog(); try { revalidatePath("/", "layout"); } catch { /* outside a request scope (tests) */ } }
 return new Response(null, {status: 303, headers: {Location: new URL(`/funtimes?${query}`, siteOrigin(request.url)).toString(), "Cache-Control": "no-store"}});
}
export async function readAdminForm(request: Request) {
 const text = await request.text();
 const params = new URLSearchParams(text);
 return { ...Object.fromEntries(params), tags: params.getAll("tags") } as Record<string, string> & { tags: string[] };
}
