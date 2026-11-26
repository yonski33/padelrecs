// Expert "best X" lists (owner OK 2026-11-26): outlets' own best-of lists (PCMag best laptops, Notebookcheck top 10s, a
// YouTuber's best-laptops video), used two ways and never as review cards:
//  - product pages: a small "Picked in expert lists" box (outlet, its award or place, one line in our own words, link out);
//    where that outlet's full review is already a card on the page, the card carries the placement as a badge instead.
//  - ranking pages: "Picked by N expert lists" on each row, N counting outlets (an outlet with several lists counts once).
// Data: db/creators/expert-lists.json, per site: `lists` (outlet, title, url, date, when it was checked) and `picks` per
// product slug (list id, position, award label, reason). Built by scripts/expert-lists.ts from checked list files; every
// entry was opened and matched to the exact model and generation. Shared by every site: a site with no data shows nothing.
import data from "../../db/creators/expert-lists.json";

export type ExpertList = { outlet: string; title: string; url: string; platform: "blog" | "youtube"; topic?: string | null;
  /** The list's own date (updated, else published), YYYY-MM-DD or YYYY-MM. */ date: string;
  /** When we last opened it and checked the picks (recheck monthly). */ checked: string };
export type ExpertPick = { list: string; position: number; label: string | null; reason: string };
type SiteData = { lists: Record<string, ExpertList>; picks: Record<string, ExpertPick[]> };

const SITES = data as unknown as Record<string, SiteData>;
/** A list older than this is left out (stale "best of" pages). */
const MAX_AGE_DAYS = 400;

function fresh(l: ExpertList, now = Date.now()): boolean {
  const t = Date.parse(l.date.length === 7 ? `${l.date}-01` : l.date);
  return Number.isFinite(t) && now - t <= MAX_AGE_DAYS * 86_400_000;
}

export type ShownPick = ExpertPick & { l: ExpertList };

/** A product's picks, one per outlet (its best place, then its newest list): labelled awards first, then by place. */
export function expertPicks(site: string, slug: string): ShownPick[] {
  const d = SITES[site]; if (!d) return [];
  const all = (d.picks[slug] ?? []).flatMap(p => { const l = d.lists[p.list]; return l && fresh(l) ? [{ ...p, l }] : []; });
  const best = new Map<string, ShownPick>();
  for (const p of all) { const k = outletKey(p.l.outlet), o = best.get(k);
    if (!o || p.position < o.position || (p.position === o.position && p.l.date > o.l.date)) best.set(k, p); }
  return [...best.values()].sort((a, b) => Number(!a.label) - Number(!b.label) || a.position - b.position || b.l.date.localeCompare(a.l.date));
}

/** How many outlets' lists pick this product (the ranking pages' agreement line). */
export const expertCount = (site: string, slug: string) => expertPicks(site, slug).length;

/** "Picked by 3 expert lists", or null under one. */
export const expertLine = (site: string, slug: string) => { const n = expertCount(site, slug);
  return n ? `Picked by ${n} expert ${n === 1 ? "list" : "lists"}` : null; };

/** The pick's place in words: its award ("Best overall"), else "#2 in Best gaming laptops". */
export const placeText = (p: ShownPick) => p.label ?? `#${p.position} in ${p.l.title}`;

/** Outlet names compared loosely, to find a creator card from the same outlet ("Notebookcheck.com" = "Notebookcheck"). */
export const outletKey = (s: string) => s.toLowerCase().replace(/\.(com|net|org|de|fr|co\.uk)\b/g, "").replace(/reviews?(_de)?$/, "").replace(/[^a-z0-9]/g, "");

/** The square badge on a "Picked in expert lists" card (owner mockup 2026-11-26): the place in two or three characters ("#1",
 *  "S") or one short word for an award ("Top pick", "Spin", "Budget"). `top` (yellow) marks first places, S tiers and
 *  best-overall awards; `soft` (pale) the other awards; `plain` (outline) lower places, lower tiers and mentions. */
export type Badge = { text: string; tone: "top" | "soft" | "plain" };
const AWARD_WORDS: [RegExp, string][] = [[/budget|cheap|value/, "Value"], [/spin|grit/, "Spin"], [/power/, "Power"], [/control/, "Control"],
  [/forgiv/, "Forgiving"], [/beginner/, "Beginner"], [/widebody|wide body/, "Wide"], [/elongated/, "Long"], [/portable|travel|ultraportable/, "Portable"],
  [/battery/, "Battery"], [/gaming/, "Gaming"], [/student/, "Students"], [/2-in-1|touch/, "2-in-1"], [/fast hands/, "Hands"]];
export function badgeOf(p: Pick<ShownPick, "label" | "position">): Badge {
  const l = (p.label ?? "").trim(), low = l.toLowerCase();
  if (!l) return { text: `#${p.position}`, tone: p.position === 1 ? "top" : "plain" };
  const tier = /^([sabcd])\s*-?\s*tier\b/i.exec(l);
  if (tier) { const t = tier[1]!.toUpperCase(); return { text: t, tone: t === "S" ? "top" : t === "A" ? "soft" : "plain" }; }
  const place = /^#(\d+)/.exec(l) ?? /\b(?:tied|joint)\s+(\d+)(?:st|nd|rd|th)\b/i.exec(l);
  if (place) { const n = Number(place[1]); return { text: `#${n}`, tone: n === 1 ? "top" : "plain" }; }
  if (/honou?rable mention/.test(low)) return { text: "Mention", tone: "plain" };
  if (/overall|of the year|editors|most people|best all|current main/.test(low)) return { text: "Top pick", tone: "top" };
  const word = AWARD_WORDS.find(([re]) => re.test(low));
  return { text: word ? word[1] : "Top pick", tone: "soft" };
}
/** The box's summary line: "#1 in 2 lists · picked in 4 more", or "Picked in 3 lists". */
export function picksSummary(picks: Pick<ShownPick, "label" | "position">[]): string {
  const first = picks.filter(p => badgeOf(p).text === "#1").length, rest = picks.length - first, ls = (n: number) => n === 1 ? "list" : "lists";
  return first ? `#1 in ${first} ${ls(first)}${rest ? ` · picked in ${rest} more` : ""}` : `Picked in ${picks.length} ${ls(picks.length)}`;
}
