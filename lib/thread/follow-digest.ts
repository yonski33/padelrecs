// The daily "New on rackets you follow" email (db/follows.ts digestFor, app/api/follow-digest). Pure, so tests and the
// sample in the PR render it the same way. Plain words, no "we", "players". Every email carries a one-click unfollow for
// each racket and for all of them (signed links, see followToken), plus the List-Unsubscribe headers mail apps show.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { DigestUser, DigestItem } from "../../db/follows";

/** One signed link per (user, racket) or (user, "all"): no sign-in needed to unfollow from an email. */
const key = () => `follow-unfollow|${process.env.VOTE_SECRET || process.env.DATABASE_URL || "local-development"}`;
export const followToken = (userId: string, racket: string) => createHmac("sha256", key()).update(`${userId}|${racket}`).digest("base64url").slice(0, 32);
export function checkFollowToken(userId: string, racket: string, token: string) {
  const want = Buffer.from(followToken(userId, racket)), got = Buffer.from(token || "");
  return got.length === want.length && timingSafeEqual(got, want);
}
/** The page that unfollows (a button, so mail scanners opening the link change nothing) and the one-click POST target. */
export const unfollowUrl = (origin: string, userId: string, racket: string, api = false) =>
  `${origin}${api ? "/api/account/follows/unfollow" : "/account/unfollow"}?u=${encodeURIComponent(userId)}&r=${encodeURIComponent(racket)}&t=${followToken(userId, racket)}`;

export type DigestSite = { name: string; origin: string; productHref: (r: { slug: string; shape: string | null }) => string };
export type DigestMail = { from: string; to: string[]; subject: string; text: string; html: string; headers: Record<string, string> };

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const stars = (n: number) => `${"★".repeat(Math.max(0, Math.min(5, n)))}${"☆".repeat(Math.max(0, 5 - n))}`;
const what = (i: DigestItem) => i.kind === "review" ? `Review by ${i.author}${i.rating ? ` ${stars(i.rating)}` : ""}`
  : i.kind === "story" ? `Story by ${i.author}: ${i.title ?? ""}` : `${i.reply ? "Reply" : "Post"} by ${i.author}`;
const count = (n: number, one: string) => `${n} new ${n === 1 ? one : `${one}s`}`;
const summary = (items: DigestItem[]) => {
  const rv = items.filter(i => i.kind === "review").length, cm = items.filter(i => i.kind === "comment").length, st = items.filter(i => i.kind === "story").length;
  return [rv && count(rv, "review"), cm && count(cm, "post"), st && count(st, "story")].filter(Boolean).join(", ");
};

export function digestMail(d: DigestUser, to: string, site: DigestSite, fromAddress: string): DigestMail {
  const n = d.rackets.length, all = unfollowUrl(site.origin, d.userId, "all"), oneClick = unfollowUrl(site.origin, d.userId, "all", true);
  const subject = n === 1 ? `New on the ${d.rackets[0].name}` : `New on ${n} rackets you follow`;
  const link = (r: DigestUser["rackets"][number], i: DigestItem) => i.kind === "story" && i.slug ? `${site.origin}/stories/${encodeURIComponent(i.slug)}` : `${site.origin}${site.productHref(r)}#reviews`;
  const text = [
    `New on rackets you follow on ${site.name}`, "",
    ...d.rackets.flatMap(r => [
      `${r.name}: ${summary(r.items)}`,
      ...r.items.flatMap(i => [`- ${what(i)}`, `  "${i.text}"`, `  ${link(r, i)}`]),
      `Unfollow the ${r.name}: ${unfollowUrl(site.origin, d.userId, r.id)}`, ""]),
    `You get this email because you follow these rackets on ${site.name}. One email a day at most, only when there's something new.`,
    `Unfollow all rackets: ${all}`,
    `Manage what you follow: ${site.origin}/account`,
  ].join("\n");
  const card = "border:1px solid #e6e2d8;border-radius:10px;padding:14px 16px;margin:0 0 14px";
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px">`
    + `<p style="font-size:18px;font-weight:700;margin:0 0 4px">New on rackets you follow</p><p style="color:#666;margin:0 0 16px">${esc(site.name)}</p>`
    + d.rackets.map(r => `<div style="${card}"><p style="margin:0 0 2px;font-weight:700"><a href="${esc(`${site.origin}${site.productHref(r)}`)}" style="color:#1a1a1a">${esc(r.name)}</a></p>`
      + `<p style="margin:0 0 10px;color:#666;font-size:13px">${esc(summary(r.items))}</p>`
      + r.items.map(i => `<p style="margin:0 0 10px"><span style="font-weight:600">${esc(what(i))}</span><br><span style="color:#333">${esc(i.text)}</span><br>`
        + `<a href="${esc(link(r, i))}" style="color:#3c6e00;font-size:13px">${i.kind === "story" ? "Read the story" : "Read it on the page"}</a></p>`).join("")
      + `<p style="margin:6px 0 0;font-size:12px"><a href="${esc(unfollowUrl(site.origin, d.userId, r.id))}" style="color:#888">Unfollow the ${esc(r.name)}</a></p></div>`).join("")
    + `<p style="color:#888;font-size:12px;margin:18px 0 0">You get this email because you follow these rackets on ${esc(site.name)}. One email a day at most, only when there's something new.<br>`
    + `<a href="${esc(all)}" style="color:#888">Unfollow all rackets</a> · <a href="${esc(`${site.origin}/account`)}" style="color:#888">Manage what you follow</a></p></div>`;
  return { from: `${site.name} <${fromAddress}>`, to: [to], subject, text, html,
    headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
}
