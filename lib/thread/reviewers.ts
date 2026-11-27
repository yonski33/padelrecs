// Creator (reviewer) pages (owner 2026-11-27, PickleballRecs pilot): one page per creator with REVIEWER_MIN or more live
// reviews, at /creators/<slug>, and an index at /creators. Pure, so the tests see exactly what the pages show. No scores
// anywhere: a creator is described by their takes (Loved it / Mixed / Not for me), how often their take matches the other
// reviewers' take on the same product, their favourites and who shares their taste. Profiles (subscribers, links, bio,
// topics) live in db/creators/reviewer-profiles.json; sites switch on in lib/thread/sites.ts REVIEWER_PAGES.
import type { Stance } from "./creators";

/** A creator needs this many live reviews for a page (owner 2026-11-27); the rest keep their plain channel link. */
export const REVIEWER_MIN = 5;
/** The agreement line needs this many reviews with a clear consensus to compare against. */
export const AGREE_MIN = 5;
/** Similar taste: at least this many products in common, and agreeing on at least this share of them. */
export const SIMILAR_SHARED = 3, SIMILAR_AGREE = 0.6;

/** One live review as the creator page uses it. */
export type ReviewerRow = { id: string; creator: string; kind: "youtube" | "blog" | "tiktok"; url: string; channel: string; lang: string;
  date: string; video: string | null; len: number | null; stance: Stance; productSlug: string; productName: string;
  /** The row's line: the review's short summary, else its key point and trade-off (no new writing per review). */ line: string;
  /** A disclosed tie with the product's brand, or the review's disclosure note (discount code, sponsored), or null. */ tie: string | null; disclosure: string | null;
  /** How many traits their own review rates Excellent or Great (their favourites go by it). */ praise?: number };

export type Reviewer = { slug: string; name: string; kind: ReviewerRow["kind"]; lang: string; channel: string; n: number;
  pos: number; mix: number; neg: number; since: string | null;
  /** Share (0-100) of their reviews whose take matches the other reviewers' consensus on that product; null under AGREE_MIN. */
  agree: number | null; reviews: ReviewerRow[] };

/** "Matt's Pickleball" → "matts-pickleball"; emoji and accents dropped. A name with no Latin letters or digits (Korean
 *  channels) gets "creator-" plus a short stable hash of the name, so two such creators never share a page. */
export function reviewerSlug(name: string): string {
  const s = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s) return s;
  let h = 0x811c9dc5; for (const c of name.trim()) { h ^= c.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return `creator-${h.toString(36)}`;
}
const first = (t: string) => t.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? t;
/** The row's 1-2 sentences from existing fields: summary_short, else key point plus trade-off, else the summary's first sentence. */
export function rowLine(r: { short: string | null; keyPoint: string | null; trade: string | null; summary: string }): string {
  if (r.short?.trim()) return r.short.trim();
  const kp = [r.keyPoint, r.trade].map(x => x?.trim()).filter((x): x is string => !!x).map(x => /[.!?]$/.test(x) ? x : `${x}.`);
  return kp.length ? kp.join(" ") : first(r.summary.trim());
}

const most = <T extends string>(xs: T[]): T | undefined => { const c = new Map<T, number>(); for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]; };

/** Each product's stance counts over every live review. */
export function productTakes(rows: ReviewerRow[]): Map<string, Record<Stance, number>> {
  const m = new Map<string, Record<Stance, number>>();
  for (const r of rows) { const c = m.get(r.productSlug) ?? { pos: 0, mix: 0, neg: 0 }; c[r.stance]++; m.set(r.productSlug, c); }
  return m;
}
/** The other reviewers' consensus on a product, leaving this review out: the take most of them gave, when at least 2 others
 *  reviewed it and one take leads; null otherwise. */
export function consensusWithout(counts: Record<Stance, number>, own: Stance): Stance | null {
  const o = { ...counts, [own]: counts[own] - 1 } as Record<Stance, number>;
  if (o.pos + o.mix + o.neg < 2) return null;
  const sorted = (Object.entries(o) as [Stance, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0]![1] > sorted[1]![1] ? sorted[0]![0] : null;
}

/** Every creator with `min` or more live reviews, most reviews first. */
/** Two channels the owner counts as one creator (owner 2026-11-27: "PADELREVIEW ENG" is the same people as "Padel Review",
 *  shown as @PadelReview): every review under the second name counts on the first one's page. Per site. */
export const REVIEWER_ALIASES: Record<string, Record<string, string>> = { padel: { "PADELREVIEW ENG": "Padel Review" } };

export function reviewersFrom(rows: ReviewerRow[], min = REVIEWER_MIN, aliases: Record<string, string> = {}): Reviewer[] {
  const canon = (n: string) => aliases[n.trim()] ?? n;
  // One creator per slug: name spellings of the same channel ("STS PICKLEBALL" / "STS Pickleball", with or without an emoji)
  // count together, under the spelling most of their reviews use.
  const by = new Map<string, ReviewerRow[]>();
  for (const r of rows) { const k = reviewerSlug(canon(r.creator)); by.set(k, [...(by.get(k) ?? []), r]); }
  const takes = productTakes(rows);
  const out: Reviewer[] = [];
  for (const [slug, rs] of by) {
    if (rs.length < min) continue;
    const name = most(rs.map(r => canon(r.creator).trim()))!;
    const sorted = [...rs].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    const kind = most(rs.map(r => r.kind))!, judged = rs.map(r => consensusWithout(takes.get(r.productSlug)!, r.stance)).map((c, i) => c && c === rs[i]!.stance);
    const comparable = rs.filter(r => consensusWithout(takes.get(r.productSlug)!, r.stance) !== null).length;
    const dates = rs.map(r => r.date).filter(Boolean).sort();
    out.push({ slug, name, kind, lang: most(rs.map(r => r.lang || "en"))!,
      channel: most(rs.filter(r => r.kind === kind && canon(r.creator) === r.creator).map(r => r.channel)) ?? most(rs.filter(r => r.kind === kind).map(r => r.channel))!, n: rs.length,
      pos: rs.filter(r => r.stance === "pos").length, mix: rs.filter(r => r.stance === "mix").length, neg: rs.filter(r => r.stance === "neg").length,
      since: dates[0]?.slice(0, 4) ?? null, agree: comparable >= AGREE_MIN ? Math.round(100 * judged.filter(Boolean).length / comparable) : null, reviews: sorted });
  }
  return out.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/** Their favourites (owner 2026-11-27: from their own words only): the products they loved, the ones their own review praises
 *  most first (traits rated Excellent or Great), newest on a tie. No site-wide counts, no numbered ranking. */
export function favourites(rv: Reviewer, _takes?: unknown, size = 3): ReviewerRow[] {
  const seen = new Set<string>();
  return rv.reviews.filter(r => r.stance === "pos").sort((a, b) => (b.praise ?? 0) - (a.praise ?? 0) || b.date.localeCompare(a.date))
    .filter(r => !seen.has(r.productSlug) && seen.add(r.productSlug)).slice(0, size);
}

/** Creators with a similar taste: the others who reviewed SIMILAR_SHARED+ of the same products and gave the same take on at
 *  least SIMILAR_AGREE of them; the closest first (smoothed, so more products in common count), then the most in common. */
export function similarTaste(rv: Reviewer, all: Reviewer[], size = 4): { reviewer: Reviewer; shared: number; same: number }[] {
  const mine = new Map<string, Stance>(); for (const r of rv.reviews) if (!mine.has(r.productSlug)) mine.set(r.productSlug, r.stance);
  return all.filter(o => o.slug !== rv.slug).map(o => {
    const theirs = new Map<string, Stance>(); for (const r of o.reviews) if (!theirs.has(r.productSlug)) theirs.set(r.productSlug, r.stance);
    const both = [...mine.keys()].filter(k => theirs.has(k));
    return { reviewer: o, shared: both.length, same: both.filter(k => mine.get(k) === theirs.get(k)).length };
  }).filter(x => x.shared >= SIMILAR_SHARED && x.same / x.shared >= SIMILAR_AGREE)
    // Smoothed agreement ((same + 1) / (shared + 2)), so 17 of 20 ranks above 3 of 3.
    .sort((a, b) => (b.same + 1) / (b.shared + 2) - (a.same + 1) / (a.shared + 2) || b.shared - a.shared || a.reviewer.name.localeCompare(b.reviewer.name)).slice(0, size);
}

/** "58.1K subscribers" → "58.1K"; numbers as YouTube writes them. */
export function subsShort(n: number | null | undefined): string | null {
  if (!n || n < 1) return null;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Social and site links from a channel description and the creator's own review URLs: Instagram, TikTok, X, Facebook and
 *  their website. Never email, shop or discount links. */
const SOCIAL: [RegExp, string][] = [[/instagram\.com\//i, "Instagram"], [/tiktok\.com\/@/i, "TikTok"], [/(?:^|\/\/)(?:www\.)?(?:x|twitter)\.com\//i, "X"], [/facebook\.com\//i, "Facebook"]];
export function socialLinks(texts: string[]): { label: string; url: string }[] {
  const out = new Map<string, string>();
  for (const t of texts) for (const m of t.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
    const url = m[0].replace(/[.,;]+$/, "");
    const hit = SOCIAL.find(([re]) => re.test(url));
    if (hit && !out.has(hit[1])) out.set(hit[1], url);
  }
  return [...out].map(([label, url]) => ({ label, url }));
}
