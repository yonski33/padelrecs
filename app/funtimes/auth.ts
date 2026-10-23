import { getCurrentUser } from "../../lib/supabase/auth";
import { allowedAdmin } from "../../lib/admin-access";
import { siteOrigin } from "../../lib/site-url";
export async function isAdmin() {
 const user=await getCurrentUser();
 return allowedAdmin(user?.id,process.env.ADMIN_USER_IDS);
}
export async function adminWriteGuard(request: Request) {
 if (!(await isAdmin())) return Response.json({error: "Admin access required."}, {status: 403, headers: {"Cache-Control": "no-store"}});
 // All writes originate in same-origin HTML forms; require Origin to prevent CSRF.
 if (request.headers.get("origin") !== siteOrigin(request.url)) return Response.json({error: "Invalid request origin."}, {status: 403});
 if (!(request.headers.get("content-type") || "").startsWith("application/x-www-form-urlencoded")) return Response.json({error: "Use the admin form."}, {status: 415});
 return null;
}
export function adminRedirect(request: Request, query: string) {
 return new Response(null, {status: 303, headers: {Location: new URL(`/funtimes?${query}`, siteOrigin(request.url)).toString(), "Cache-Control": "no-store"}});
}
export async function readAdminForm(request: Request) {
 const text = await request.text();
 const params = new URLSearchParams(text);
 return { ...Object.fromEntries(params), tags: params.getAll("tags") } as Record<string, string> & { tags: string[] };
}
