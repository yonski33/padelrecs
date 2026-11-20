// The magic link from a player's sign-in email lands here (PadelRecs Thread accounts). Supabase sends either a PKCE code
// (default email template, same browser) or a token hash (a template using {{ .TokenHash }}, any browser).
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
import { safeNext } from "../../../lib/thread/account-session";
import { afterSignIn } from "../../../lib/thread/account-signin";

const TYPES = new Set(["email", "magiclink", "signup"]);
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams, origin = siteOrigin(request.url), next = safeNext(q.get("next"));
  const client = await createClient();
  let userId: string | null = null;
  if (client) {
    const code = q.get("code"), hash = q.get("token_hash"), type = q.get("type") ?? "email";
    if (code) { const { data, error } = await client.auth.exchangeCodeForSession(code); if (!error) userId = data.user?.id ?? null; }
    else if (hash && TYPES.has(type)) { const { data, error } = await client.auth.verifyOtp({ token_hash: hash, type: type as EmailOtpType }); if (!error) userId = data.user?.id ?? null; }
  }
  if (!userId) return Response.redirect(`${origin}/account?signin=failed`, 303);
  await afterSignIn(userId);
  return new Response(null, { status: 303, headers: { Location: `${origin}${next}`, "Cache-Control": "no-store" } });
}
