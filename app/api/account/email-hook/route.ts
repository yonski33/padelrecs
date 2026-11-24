// Supabase Auth "Send Email" hook (lib/thread/signin-email.ts): Supabase posts every auth email here instead of mailing
// it, and this sends it through Resend under the right site's name and domain. Set up once in Supabase (Authentication >
// Hooks > Send Email > HTTPS, https://www.padelrecs.com/api/account/email-hook) with its secret in SEND_EMAIL_HOOK_SECRET.
import { verifyHook, signinEmails, FALLBACK_DOMAIN, type HookPayload } from "../../../../lib/thread/signin-email";
import { sendWithResend } from "../../../../lib/contact";

export const dynamic = "force-dynamic";
// Supabase shows `message` to the person signing in when the hook fails.
const fail = (status: number, message: string) => Response.json({ error: { http_code: status, message } }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET ?? "", apiKey = process.env.RESEND_API_KEY ?? "", supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!secret || !apiKey || !supabaseUrl) return fail(503, "Sign-in email isn't set up.");
  const body = await request.text(), h = request.headers;
  if (!verifyHook(body, { id: h.get("webhook-id"), timestamp: h.get("webhook-timestamp"), signature: h.get("webhook-signature") }, secret)) return fail(401, "Bad signature.");
  let payload: HookPayload; try { payload = JSON.parse(body); } catch { return fail(400, "Invalid request."); }
  if (!payload?.email_data?.email_action_type) return fail(400, "Invalid request.");
  const emails = signinEmails(payload, supabaseUrl);
  if (!emails.length) return fail(400, "Nothing to send.");
  try {
    for (const [i, email] of emails.entries()) {
      try { await sendWithResend(email, apiKey); }
      catch (error) {
        // The site's own domain isn't verified in Resend yet: send it anyway, still under the site's name.
        if (!/Resend 4(03|22)/.test(String(error))) throw error;
        console.warn("Sign-in email: own domain refused, sending from the fallback", email.from, String(error));
        await sendWithResend(signinEmails(payload, supabaseUrl, FALLBACK_DOMAIN)[i], apiKey);
      }
    }
  } catch (error) {
    console.error("Sign-in email failed", error);
    return fail(500, "Could not send the email. Try again?");
  }
  return Response.json({}, { headers: { "Cache-Control": "no-store" } });
}
