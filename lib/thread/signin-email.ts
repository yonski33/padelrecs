// Sign-in emails per site (Supabase Auth "Send Email" hook). Supabase has one sender and one template set for every Recs
// site, so with the hook on, Supabase stops mailing and posts each email here instead: the site comes from the link's own
// address (redirect_to), and the email goes out through Resend with that site's name, from its own domain.
// Covers player sign-in (padel, pickleball) and the admin sign-in on every site. Pure, so tests can run it.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ContactEmail } from "../contact";

/** Every Recs site's domain and name (lib/niche configs; tests/signin-email.test.ts keeps the two in step). A table
 *  rather than an import of every config, so the hook stays small. */
export const SITES: Record<string, string> = {
  "padelrecs.com": "PadelRecs", "pickleballrecs.com": "PickleballRecs", "skinrecs.com": "SkinRecs", "tennisrecs.com": "TennisRecs",
  "runningrecs.com": "RunningRecs", "golfrecs.com": "GolfRecs", "gamingrecs.com": "GamingRecs", "discgolfrecs.com": "DiscGolfRecs",
  "simracingrecs.com": "SimRacingRecs", "cyclingrecs.com": "CyclingRecs", "audiorecs.com": "AudioRecs", "monitorrecs.com": "MonitorRecs",
  "camerarecs.com": "CameraRecs", "ultralightrecs.com": "UltralightRecs", "badmintonrecs.com": "BadmintonRecs",
  "fragrancerecs.com": "FragranceRecs", "coffeerecs.com": "CoffeeRecs", "climbingrecs.com": "ClimbingRecs", "nailsrecs.com": "NailsRecs",
  "kitchenrecs.com": "KitchenRecs", "snowboardrecs.com": "SnowboardRecs", "tabletennisrecs.com": "TableTennisRecs",
  "homegymrecs.com": "HomeGymRecs", "moneyrecs.com": "MoneyRecs", "softwarerecs.com": "SoftwareRecs", "hostingrecs.com": "HostingRecs",
  "keyboardrecs.com": "KeyboardRecs", "travelgearrecs.com": "TravelGearRecs", "babygearrecs.com": "BabyGearRecs",
  "sleeprecs.com": "SleepRecs", "laptoprecs.com": "LaptopRecs", "printrecs.com": "PrintRecs", "tvrecs.com": "TVRecs",
  "toolrecs.com": "ToolRecs", "grillrecs.com": "GrillRecs", "dogrecs.com": "DogRecs", "stackrecs.com": "StackRecs",
};
/** The sender when a site's own domain isn't set up in Resend yet: the domain the contact form already sends from. */
export const FALLBACK_DOMAIN = "redrecs.com";

/** The site a link points at ("https://www.pickleballrecs.com/auth/confirm?…"), or PadelRecs when it can't tell. */
export function siteFor(...urls: (string | undefined)[]) {
  for (const u of urls) {
    let host = ""; try { host = new URL(u ?? "").hostname.toLowerCase().replace(/^www\./, ""); } catch { continue; }
    if (SITES[host]) return { name: SITES[host], domain: host };
  }
  return { name: "PadelRecs", domain: "padelrecs.com" };
}

/** Standard Webhooks signature check (what Supabase signs hooks with). `secret` is the hook's "v1,whsec_…" value. */
export function verifyHook(body: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, secret: string, now = Date.now()) {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret) return false;
  const at = Number(timestamp) * 1000;
  if (!Number.isFinite(at) || Math.abs(now - at) > 5 * 60_000) return false;
  const key = Buffer.from(secret.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  const want = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some(s => {
    const [v, sig] = s.split(","); if (v !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

export type HookPayload = {
  user: { email?: string; new_email?: string };
  email_data: { token?: string; token_hash?: string; redirect_to?: string; email_action_type: string; site_url?: string; token_new?: string; token_hash_new?: string };
};
export type SigninEmail = ContactEmail & { html: string };

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
/** Supabase's own check of the link: it signs the person in, then sends them on to redirect_to (the site's /auth/confirm). */
export const verifyLink = (supabaseUrl: string, tokenHash: string, type: string, redirectTo: string) =>
  `${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;

/** The emails for one hook call, from the site's own domain (`fromDomain` overrides, for the fallback sender). Usually
 *  one; an email change with both tokens sends one to each address. */
export function signinEmails(p: HookPayload, supabaseUrl: string, fromDomain?: string): SigninEmail[] {
  const d = p.email_data, site = siteFor(d.redirect_to, d.site_url), type = d.email_action_type;
  const redirect = d.redirect_to || d.site_url || `https://www.${site.domain}`;
  const from = `${site.name} <no-reply@${fromDomain ?? site.domain}>`;
  const one = (to: string | undefined, hash: string | undefined, code: string | undefined, subject: string, lead: string, action: string): SigninEmail | null => {
    if (!to || !hash) return null;
    const link = verifyLink(supabaseUrl, hash, type, redirect);
    const codeLine = code ? `Or type this code on the sign-in page: ${code}` : "";
    const text = [lead, "", link, ...(codeLine ? ["", codeLine] : []), "", "The link works once, for an hour. If you didn't ask for this, ignore this email.", "", site.name].join("\n");
    const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;max-width:480px">`
      + `<p>${esc(lead)}</p><p><a href="${esc(link)}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${esc(action)}</a></p>`
      + (code ? `<p>Or type this code on the sign-in page:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${esc(code)}</p>` : "")
      + `<p style="color:#666;font-size:14px">The link works once, for an hour. If you didn't ask for this, ignore this email.</p><p style="color:#666;font-size:14px">${esc(site.name)}</p></div>`;
    return { from, to: [to], subject, text, html };
  };
  const signIn = () => one(p.user.email, d.token_hash, d.token, `Your ${site.name} sign-in link`, `Tap the button to sign in to ${site.name}.`, "Sign in");
  let out: (SigninEmail | null)[];
  switch (type) {
    case "magiclink": case "signup": case "email": case "recovery": case "reauthentication": out = [signIn()]; break;
    case "invite": out = [one(p.user.email, d.token_hash, undefined, `You're invited to ${site.name}`, `You have an invite to ${site.name}. Tap the button to accept it.`, "Accept the invite")]; break;
    // Supabase's email change naming is crossed: token_hash goes with the new address, token_hash_new with the current one.
    case "email_change": out = [
      one(p.user.new_email, d.token_hash, d.token_new, `Confirm your new ${site.name} email`, `Tap the button to use this address for ${site.name}.`, "Confirm this email"),
      one(p.user.email, d.token_hash_new, d.token, `Confirm your ${site.name} email change`, `Tap the button to confirm the change of email for ${site.name}.`, "Confirm the change"),
    ]; break;
    default: out = [signIn()];
  }
  return out.filter((e): e is SigninEmail => !!e);
}
