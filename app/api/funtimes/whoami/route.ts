// Is this browser the site owner's? For the on-page admin tools (Thread comments): the page asks only when a sign-in cookie
// is present, so ordinary visitors never call it and the cached pages stay the same for everyone. Never cached; the private
// /api/funtimes path (proxy.ts). Every write still checks the session on the server (app/funtimes/auth.ts adminWriteGuard).
import { isAdmin } from "../../../funtimes/auth";
export async function GET() {
  return Response.json({ admin: await isAdmin().catch(() => false) }, { headers: { "Cache-Control": "no-store, private" } });
}
