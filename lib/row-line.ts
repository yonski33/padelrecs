// The one line a list row shows (home, catalogue, rankings, finder), in the expert voice (owner 2026-11-16: "Players praise its
// ball speed…" and "players say it does everything well" on live lists). The first of its candidates that reads as a plain
// statement of at most 90 characters: a quick-take hook when the page has one, the short line, the ranking line, the racket
// page's tagline or SkinRecs' bottom line (first sentence), then the "In short" summary's first sentence. The product's
// site-voice tagline (owner 2026-11-18, lib/voice-taglines.ts) comes first of all, at up to 105 characters (the voice limit).
import { hasAttribution } from "./voice";
import { shortLine } from "./short-lines";
import { lines } from "./list-lines";
import { pageContent } from "./racket-page";
import { skinPage } from "./skin-page";
import { niche } from "./niche";
import { voiceTagline } from "./voice-taglines";

const CROWD_LEAD = /^(players|users|people|drivers|throwers|racers|reviewers|owners|most|many)\s+(\w+\s+)?(say|find|describe|praise|report|love|rave|value|expect|see|call|use|rebuy|like|agree)/i;
const CROWD = /\b(a few|a couple|several|some|many|most|players|users|reviewers|owners)\s+(\w+\s+)?(find|say|says|report|got|get|expect|rave|notice|dislike|complain|struggle|had|saw|praise|describe|love|agree)\b/i;
export const MAX_ROW_LINE = 90, MAX_VOICE_LINE = 105;
const first = (t: string | null | undefined) => t?.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t ?? null;

/** A line in the expert voice and short enough for a row. */
export function rowVoiceOk(t: string | null | undefined, max = MAX_ROW_LINE): t is string {
  return !!t && t.length <= max && !CROWD_LEAD.test(t) && !CROWD.test(t) && !hasAttribution(t);
}

/** The row's line, or null when no candidate reads right (better no line than a "players say" one). */
export function rowLine(product: { slug: string; reviewSummary?: string | null }, ...preferred: (string | null | undefined)[]): string | null {
  return rowLineWhere(product, () => true, ...preferred);
}
/** The same, skipping candidates `ok` rejects (a "short on power" line on a power list, audit 2026-11-17 #3). */
export function rowLineWhere(product: { slug: string; reviewSummary?: string | null }, ok: (t: string) => boolean, ...preferred: (string | null | undefined)[]): string | null {
  const site = niche.id;
  const page = pageContent(product.slug, site)?.tagline, skin = site === "skin" ? first(skinPage(product.slug)?.bottom) : null;
  const voiced = voiceTagline(product.slug, site);
  if (rowVoiceOk(voiced, MAX_VOICE_LINE) && ok(voiced)) return voiced;
  return [...preferred, shortLine(product, site), lines[site]?.[product.slug], first(page), skin, first(product.reviewSummary)].find((t): t is string => rowVoiceOk(t) && ok(t)) ?? null;
}
