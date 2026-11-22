// The creator-centred product page (owner direction 2026-11-22, iemranking-style; PickleballRecs first): what creators said
// about one product, as words. Pure, so the tests see exactly what the page shows. The data is a static fixture for the demo
// (db/creators/<site>.json, read by lib/thread/creator-data.ts, server only); nothing here reads or writes the database.
// Rules (owner): no invented scores (a number only where the creator published one), real quotes only, "players" not
// "owners", never the word "verdict", no claim that the site tested anything.
/** The fixed word scale, best first (the sweep's reader brief). */
export const WORDS = ["Excellent", "Great", "Good", "Okay", "Weak"] as const;
export type Word = (typeof WORDS)[number];
/** The attributes the page shows, in order, with their labels (forgiveness is shown as "Sweet spot"). */
export const ATTRS = [["power", "Power"], ["control", "Control"], ["spin", "Spin"], ["pop", "Pop"], ["sweet", "Sweet spot"],
  ["comfort", "Comfort"], ["durability", "Durability"]] as const;
export type AttrKey = (typeof ATTRS)[number][0];
export type Stance = "pos" | "mix" | "neg";
export const STANCE_LABEL: Record<Stance, string> = { pos: "Loved it", mix: "Mixed", neg: "Not for me" };

export type CreatorReview = {
  id: string; creator: string; kind: "youtube" | "blog" | "tiktok"; type: "review" | "comparison" | "long-term";
  url: string; channel: string; lang: string; date: string; video: string | null; len: number | null;
  /** The creator's own chapters (start second, title), intro, outro and discount-code lines left out. */ chapters: [number, string][];
  /** A real quote (verbatim; plain caption spellings fixed), or null. */ quote: string | null; quoteAt: number | null;
  stance: Stance;
  /** The summary shown on the card (80-120 words, the sweep's fuller pass), the rest for Read more, 3-5 exact substrings of
   *  `summary` to mark, and a 2-3 sentence version for one-line spots (the table's key point). */
  summary: string; more: string | null; highlights: string[]; short: string;
  /** The glance table's one-line bottom line (creator_reviews.key_point, one sentence, 70 characters or fewer), when written. */
  keyPoint?: string | null;
  attrs: Partial<Record<AttrKey, Word>>;
  /** Only where the creator published a number (Pickleheads' are hidden until their scale is confirmed). */
  score: { value: number; scale: number; label: string | null } | null;
  measured: Record<string, number | string>; alsoUrl: string | null;
  /** The version or unit the review covered ("Pre-production unit"), shown as a tag. */ version: string | null;
  /** "Long-term" or "First impressions", or null. */ note: string | null;
  /** A disclosed tie with this product's brand: "Works with <tie>". */ tie: string | null;
  stood: string | null; trade: string | null; compared: string | null;
};
export type CreatorPage = { paddle: string; tldr: string;
  /** One line per take for the sentiment boxes (written from the reviews' own summaries; "" when none). */
  groups: Record<Stance, string>;
  /** Shop prices from the price sweep (USD, new, US shops, hand-checked), lowest first with in-stock rows first; null when
   *  none were collected. A static snapshot for the demo, dated by `checked`. */
  prices: { checked: string; offers: Offer[] } | null;
  /** "Short takes on TikTok" (owner 2026-11-22, Coral Pro demo only). UNVERIFIED: Grok's cards, the quotes still need a
   *  caption check before anything goes live (`unverified` stays true until then). */
  tiktok?: { unverified: boolean; note: string; takes: TikTokTake[] };
  reviews: CreatorReview[] };
export type TikTokTake = { id: string; creator: string; handle: string; date: string; len: number; stance: Stance; quote: string;
  /** 40-70 words, rewritten to the copy rules. */ take: string; tags: string[]; disclosure: string; url: string };

/** The TikTok takes counted the way the sentiment bar counts them: one per channel (the newest take's stance), so a channel
 *  with two takes counts once. They never join the review count or the reviewer table. */
export function tiktokStances(takes: TikTokTake[]) {
  const latest = new Map<string, TikTokTake>();
  for (const t of takes) { const x = latest.get(t.handle); if (!x || t.date > x.date) latest.set(t.handle, t); }
  return stanceCounts([...latest.values()]);
}
export type Offer = { shop: string; url: string; price: number; inStock: boolean; edition: string | null; affiliate: boolean };

/** "$110", "$159.99". */
export const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
/** The lowest in-stock price and the shops at it ("Lowest today" goes on each); sold-out rows never count. */
export function lowestOffer(offers: Offer[]) {
  const live = offers.filter(o => o.inStock);
  if (!live.length) return null;
  const price = Math.min(...live.map(o => o.price));
  return { price, shops: live.filter(o => o.price === price) };
}
/** "2026-11-22" to "Nov 22, 2026". */
export const checkedDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
/** Loved / Mixed / Not for me counts. */
export function stanceCounts(rs: Pick<CreatorReview, "stance">[]) {
  const n = { pos: 0, mix: 0, neg: 0 };
  for (const r of rs) n[r.stance]++;
  return n;
}

/** One attribute across creators: how many used each word, the most used word (ties go to the lower word, the cautious
 *  read), and how many creators spoke about it. Null when fewer than 2 creators did. */
export function attrSummary(rs: Pick<CreatorReview, "attrs">[], key: AttrKey) {
  const counts = WORDS.map(w => rs.filter(r => r.attrs[key] === w).length);
  const n = counts.reduce((a, b) => a + b, 0);
  if (n < 2) return null;
  let top = 0;
  counts.forEach((c, i) => { if (c >= counts[top]!) top = i; });
  return { counts, n, word: WORDS[top]!, share: counts[top]! };
}

/** The word's tone class (green for Excellent and Great, through to red for Weak). */
export const wordTone = (w: Word | undefined) => !w ? "" : w === "Excellent" ? "w1" : w === "Great" ? "w2" : w === "Good" ? "w3" : w === "Okay" ? "w4" : "w5";

/** The table's one-line takeaway: the summary's first sentence. */
export const takeaway = (summary: string) => summary.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? summary;
/** The card's short summary (2 sentences) and the rest, for Read more. */
export function splitSummary(summary: string): [string, string] {
  const parts = summary.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.map(s => s.trim()) ?? [summary];
  return [parts.slice(0, 2).join(" "), parts.slice(2).join(" ")];
}

/** "YouTube", "Blog"; and the language as a short code. */
export const platform = (r: Pick<CreatorReview, "kind">) => r.kind === "youtube" ? "YouTube" : r.kind === "tiktok" ? "TikTok" : "Blog";
export const langCode = (l: string) => l.slice(0, 2).toUpperCase();
/** The creator's own number as they gave it: "9/10", with its label. */
export const scoreText = (s: NonNullable<CreatorReview["score"]>) => `${s.value}/${s.scale}`;

/** Measured numbers the creator gave (lab-style, not scores): "Swing weight 111 · Twist weight 6.57". */
const MEASURED: Record<string, string> = { spin_rpm: "Spin", swing_weight: "Swing weight", twist_weight: "Twist weight" };
export const measuredLine = (m: CreatorReview["measured"]) => Object.entries(m).filter(([k]) => MEASURED[k])
  .map(([k, v]) => `${MEASURED[k]} ${v}${k === "spin_rpm" ? " rpm" : ""}`).join(" · ");

/** Initials for the creator's avatar ("Pickleball Studio" → "PS"). */
export const initials = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2)
  .map(w => w[0]!.toUpperCase()).join("");

/** Sort orders for the cards: Loved first (default, then newest), or newest. */
export const STANCE_ORDER: Record<Stance, number> = { pos: 0, mix: 1, neg: 2 };
export function sortReviews<T extends Pick<CreatorReview, "stance" | "date">>(rs: T[], by: "stance" | "newest"): T[] {
  return rs.slice().sort((a, b) => (by === "stance" ? STANCE_ORDER[a.stance] - STANCE_ORDER[b.stance] : 0) || b.date.localeCompare(a.date));
}

/** The table's word columns (owner mock: a few, so the table fits without a scrollbar). */
export const TABLE_ATTRS: AttrKey[] = ["control", "power"];
const label = (k: AttrKey) => ATTRS.find(a => a[0] === k)![1];
const HIGH: Word[] = ["Excellent", "Great"], LOW: Word[] = ["Okay", "Weak"];

/** "How it plays": per attribute, the middle word of all the creators' words (the lower one on an even count, the
 *  cautious read) and one plain line with the counts ("12 of 15 call it Excellent or Great; 2 Okay or weaker."). */
export function howItPlays(rs: Pick<CreatorReview, "attrs">[]) {
  return ATTRS.flatMap(([k, l]) => {
    const s = attrSummary(rs, k);
    if (!s) return [];
    const words = WORDS.flatMap((w, i) => Array<Word>(s.counts[i]!).fill(w)), word = words[Math.floor(words.length / 2)]!;
    const high = s.counts[0]! + s.counts[1]!, low = s.counts[3]! + s.counts[4]!;
    const line = [high ? `${high} of ${s.n} call it Excellent or Great` : `None of ${s.n} call it Excellent or Great`,
      low ? `${low} Okay or weaker` : null].filter(Boolean).join("; ") + ".";
    return [{ k, label: l, word, line }];
  });
}

/** "The big picture": what creators like (attributes most call Excellent or Great) and common concerns (attributes at
 *  least a third call Okay or Weak), as short chips. */
export function bigPicture(rs: Pick<CreatorReview, "attrs">[]) {
  const likes: string[] = [], concerns: string[] = [];
  for (const [k] of ATTRS) {
    const s = attrSummary(rs, k);
    if (!s || s.n < 3) continue;
    const high = s.counts[0]! + s.counts[1]!, low = s.counts[3]! + s.counts[4]!;
    if (high * 2 > s.n) likes.push(`${high >= s.n * 0.75 && s.counts[0]! * 2 > s.n ? "Excellent" : "Strong"} ${label(k).toLowerCase()}`);
    if (low * 3 >= s.n) concerns.push(`${label(k)} Okay or weaker for ${low} of ${s.n}`);
  }
  return { likes, concerns };
}

/** A card's +/- chips: the attributes this creator called Excellent or Great (+), and Okay or Weak (-). */
export const cardChips = (attrs: CreatorReview["attrs"]) => ATTRS.flatMap(([k, l]): { tone: "pos" | "neg"; text: string }[] => {
  const w = attrs[k];
  return !w ? [] : HIGH.includes(w) ? [{ tone: "pos", text: `${w} ${l.toLowerCase()}` }]
    : LOW.includes(w) ? [{ tone: "neg", text: `${w} ${l.toLowerCase()}` }] : [];
}).sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "pos" ? -1 : 1));

/** The owner mock's avatar colour, by source: YouTube coral, blog blue. */
export const SOURCE_COLOR = { youtube: "#F0796A", blog: "#3D5A99", tiktok: "#111111" } as const;

/** The summary cut into plain and marked pieces, in order (the mock's yellow marker); overlapping marks keep the first. */
export function marks(text: string, hs: string[]): { t: string; on: boolean }[] {
  const spans: [number, number][] = [];
  for (const h of hs) { const i = text.indexOf(h); if (i >= 0 && !spans.some(([a, b]) => i < b && i + h.length > a)) spans.push([i, i + h.length]); }
  spans.sort((a, b) => a[0] - b[0]);
  const out: { t: string; on: boolean }[] = []; let at = 0;
  for (const [a, b] of spans) { if (a > at) out.push({ t: text.slice(at, a), on: false }); out.push({ t: text.slice(a, b), on: true }); at = b; }
  if (at < text.length) out.push({ t: text.slice(at), on: false });
  return out;
}

/** TikTok takes as reviews (owner 2026-11-22: "tiktok is part of the reviews"): each take becomes a short review card (its
 *  quote, its take as the summary, its own tags, no Stood out / Trade-off / Compared to, no chapters, no attribute words).
 *  `handle` and `tags` ride along for the card. UNVERIFIED like the takes themselves (page.tiktok.unverified). */
export type ReviewEntry = CreatorReview & { handle?: string; tags?: string[] };
export const takeAsReview = (t: TikTokTake): ReviewEntry => ({
  id: `tt-${t.id}`, creator: t.creator, kind: "tiktok", type: "review", url: t.url, channel: `https://www.tiktok.com/${t.handle}`,
  lang: "en", date: t.date, video: null, len: t.len, chapters: [], quote: t.quote, quoteAt: null, stance: t.stance,
  summary: t.take, more: null, highlights: [], short: t.take, attrs: {}, score: null, measured: {}, alsoUrl: null,
  version: null, note: null, tie: null, stood: null, trade: null, compared: null, handle: t.handle, tags: t.tags });
/** The page's two lists: `feed`, every card (each TikTok video); `counted`, one entry per reviewer (a TikTok channel with two
 *  videos counts once, by its newest take), which every count, the table, How it plays and the sentiment bar use. */
export function reviewLists(page: CreatorPage) {
  const takes = (page.tiktok?.takes ?? []).map(takeAsReview);
  const newest = new Map<string, ReviewEntry>();
  for (const t of takes) { const x = newest.get(t.handle!); if (!x || t.date > x.date) newest.set(t.handle!, t); }
  return { feed: [...page.reviews, ...takes] as ReviewEntry[], counted: [...page.reviews, ...newest.values()] as ReviewEntry[] };
}
