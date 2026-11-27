// The creator-centred product page (owner direction 2026-11-22, iemranking-style; PickleballRecs first): what creators said
// about one product, as words. Pure, so the tests see exactly what the page shows. The data is a static fixture for the demo
// (db/creators/<site>.json, read by lib/thread/creator-data.ts, server only); nothing here reads or writes the database.
// Rules (owner): no invented scores (a number only where the creator published one), real quotes only, "players" not
// "owners", never the word "verdict", no claim that the site tested anything.
/** The fixed word scale, best first (the sweep's reader brief). */
export const WORDS = ["Excellent", "Great", "Good", "Okay", "Weak"] as const;
export type Word = (typeof WORDS)[number];
/** The attributes the page shows, in order, with their labels (forgiveness is shown as "Sweet spot"). */
const PICKLEBALL_ATTRS = [["power", "Power"], ["control", "Control"], ["spin", "Spin"], ["pop", "Pop"], ["sweet", "Sweet spot"],
  ["comfort", "Comfort"], ["durability", "Durability"]] as const;
/** SkinRecs' words (the skin sweep, 2026-11-23): each word rates how well the product does on it, so "Great" on irritation
 *  means gentle and on white cast means little or none; the labels say it that way round. */
const SKIN_ATTRS = [["hydration", "Hydration"], ["texture", "Texture"], ["finish", "Finish"], ["absorption", "Absorbs"],
  ["irritation", "Gentleness"], ["results", "Results"], ["scent", "Scent"], ["white_cast", "No white cast"],
  ["sun_protection", "Sun protection"], ["adhesion", "Stays on"], ["packaging", "Packaging"], ["value", "Value"]] as const;
/** PadelRecs' words (the padel sweep, 2026-11-23, the reader brief's padel attribute words). */
const PADEL_ATTRS = [["power", "Power"], ["control", "Control"], ["sweet", "Sweet spot"], ["comfort", "Arm comfort"],
  ["maneuver", "Maneuverability"], ["spin", "Spin"], ["durability", "Durability"]] as const;
/** LaptopRecs' words (the laptop reader brief, 2026-11-24): how the reviewer rated each part of the laptop. */
const LAPTOP_ATTRS = [["performance", "Performance"], ["thermals", "Thermals"], ["battery", "Battery"], ["display", "Display"],
  ["keyboard", "Keyboard"], ["build", "Build"], ["portability", "Portability"], ["value", "Value"]] as const;
/** DiscGolfRecs' words (the disc golf reader brief, 2026-11-22): the traits where a higher word reads plainly as better.
 *  Turn, fade and stability are left out: the cards rate them too, but "Great fade" says nothing about which way the disc
 *  flies, so those stay in the flight notes and the stability label. Value (4 cards) is too thin to show. */
const DISCGOLF_ATTRS = [["glide", "Glide"], ["distance", "Distance"], ["grip", "Grip"], ["accuracy", "Accuracy"],
  ["durability", "Durability"]] as const;
export type AttrKey = (typeof PICKLEBALL_ATTRS)[number][0] | (typeof SKIN_ATTRS)[number][0] | (typeof PADEL_ATTRS)[number][0]
  | (typeof LAPTOP_ATTRS)[number][0] | (typeof DISCGOLF_ATTRS)[number][0];
/** Each site's attribute set (pickleball's paddle words unless a site has its own). */
const SITE_ATTRS: Record<string, readonly (readonly [AttrKey, string])[]> = { skin: SKIN_ATTRS, padel: PADEL_ATTRS, laptop: LAPTOP_ATTRS,
  discgolf: DISCGOLF_ATTRS };
export const attrsFor = (site: string): readonly (readonly [AttrKey, string])[] => SITE_ATTRS[site] ?? PICKLEBALL_ATTRS;
/** The site's own set: NICHE is inlined at build (next.config env), so the browser cards get the same list (padel when unset,
 *  the niche default). */
export const ATTRS: readonly (readonly [AttrKey, string])[] = attrsFor(process.env.NICHE || "padel");
/** The heading over the per-attribute words ("How it plays"), per site. */
const HOW_TITLE: Record<string, string> = { skin: "How it works", laptop: "How it holds up", discgolf: "How it flies" };
export const howTitleFor = (site: string) => HOW_TITLE[site] ?? "How it plays";
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
  /** The config the reviewer tested (LaptopRecs, drizzle/0041): the short label, a note when the source covers two configs,
   *  the source's own words per field and a hand-set group; null on sites without configs. */
  config?: ReviewConfig | null;
};
export type ReviewConfig = { label: string | null; note: string | null; group: string | null; fields: Record<string, string | null> };
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
  /** 40-70 words, rewritten to the copy rules. */ take: string; tags: string[]; disclosure: string; url: string; /** One line for the glance table (creator_reviews.key_point). */ keyPoint?: string | null;
  /** Our saved copy of the TikTok cover (db/creators/covers.json), or none. */ cover?: string | null };

/** The TikTok takes counted the way the sentiment bar counts them: one per channel (the newest take's stance), so a channel
 *  with two takes counts once. They never join the review count or the reviewer table. */
export function tiktokStances(takes: TikTokTake[]) {
  const latest = new Map<string, TikTokTake>();
  for (const t of takes) { const x = latest.get(t.handle); if (!x || t.date > x.date) latest.set(t.handle, t); }
  return stanceCounts([...latest.values()]);
}
export type Offer = { shop: string; url: string; price: number; inStock: boolean; edition: string | null; affiliate: boolean;
  /** When the price was read (ISO); the page shows it for Amazon's price, as Amazon asks. */ checkedAt?: string | null };

/** "$110", "$159.99". */
/** A shop's name short enough for the price box (owner 2026-11-23): no "(brand store)" / "(sold by …)" note, no trailing
 *  "Co", "Company", "Inc" or "LLC" ("Honolulu Pickleball Co (brand store)" → "Honolulu Pickleball"). */
export function shortShop(name: string): string {
  const bare = name.replace(/\s*\([^)]*\)/g, "").trim();
  // The suffix only goes when two words are left ("Pickle Co" stays).
  const cut = bare.replace(/[,\s]+(co|company|inc|llc)\.?$/i, "");
  return (cut.split(/\s+/).length >= 2 ? cut : bare) || name;
}
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
/** LaptopRecs' measurements keep the reviewer's own label ("Battery, looped movie at 200 nits: almost 19 hours"). */
const FREE_MEASURED = new Set(["laptop"]);
/** No prices in review text (owner 2026-11-24: quoted prices go stale; live prices live in the price box only). */
export const PRICE_TEXT = /[€$£]\s?\d|\d[\d.,]*\s?(€|euros?\b|eur\b|dollars?\b|usd\b|bucks\b|gbp\b)|\blist price\b|\bmsrp\b|\bretails? (for|at)\b|\bcosts? (about |around |roughly )?[€$£]?\d/i;
const priceEntry = ([k, v]: [string, unknown]) => /price|cost|msrp|discount|code|deal/i.test(k) || PRICE_TEXT.test(String(v));
export const measuredLine = (m: CreatorReview["measured"], site = process.env.NICHE ?? "") => FREE_MEASURED.has(site)
  ? Object.entries(m).filter(([k, v]) => k.trim() && String(v).trim() && !priceEntry([k, v])).map(([k, v]) => `${k}: ${v}`).join(" · ")
  : Object.entries(m).filter(([k]) => MEASURED[k]).map(([k, v]) => `${MEASURED[k]} ${v}${k === "spin_rpm" ? " rpm" : ""}`).join(" · ");

/** Initials for the creator's avatar ("Pickleball Studio" → "PS"). */
export const initials = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2)
  .map(w => w[0]!.toUpperCase()).join("");

/** Sort orders for the cards: Loved first (default, then newest), or newest. */
export const STANCE_ORDER: Record<Stance, number> = { pos: 0, mix: 1, neg: 2 };
export function sortReviews<T extends Pick<CreatorReview, "stance" | "date">>(rs: T[], by: "stance" | "newest"): T[] {
  return rs.slice().sort((a, b) => (by === "stance" ? STANCE_ORDER[a.stance] - STANCE_ORDER[b.stance] : 0) || b.date.localeCompare(a.date));
}

/** The feed's mix (owner 2026-11-22): three YouTube or blog reviews first, then the TikToks spread evenly through the rest,
 *  so two TikToks only meet when there are not enough others to put between them. Under "Most relevant" each stance group is
 *  mixed on its own, so the order of Loved it, Mixed and Not for me holds. */
export function mixTikToks<T extends Pick<CreatorReview, "kind" | "stance">>(rs: T[], by: "stance" | "newest", lead = 3): T[] {
  const mix = (xs: T[], first: boolean) => {
    const tt = xs.filter(r => r.kind === "tiktok"), other = xs.filter(r => r.kind !== "tiktok");
    if (!tt.length || !other.length) return xs;
    const head = first ? other.slice(0, lead) : [], rest = first ? other.slice(lead) : other;
    // One TikTok after each slot of `gap` others; a group not led by others still opens with one of its others.
    const gap = Math.max(1, rest.length / tt.length), out: T[] = [...head];
    let k = 0;
    rest.forEach((r, i) => { out.push(r); while (k < tt.length && i + 1 >= Math.round((k + 1) * gap)) out.push(tt[k++]!); });
    if (!rest.length && k < tt.length) out.push(tt[k++]!);
    return [...out, ...tt.slice(k)];
  };
  if (by !== "stance") return mix(rs, true);
  const groups = (["pos", "mix", "neg"] as const).map(k => rs.filter(r => r.stance === k)).filter(g => g.length);
  return groups.flatMap((g, i) => mix(g, i === 0));
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
export type ReviewEntry = CreatorReview & { handle?: string; tags?: string[]; cover?: string | null;
  /** The maker turned embedding off: the thumbnail opens the original in a new tab (live/video-overlay.tsx). */ noEmbed?: boolean;
  /** Who this reviewer says the paddle suits, and why (db/creators/best-for.json, 2026-11-23). */ bestFor?: { who: string; why: string } | null;
  /** This outlet's place in its own best-of list ("Best overall · Best laptops 2026", lib/thread/expert-lists.ts). */ badge?: string;
  /** A TikTok channel's older takes on the same product, linked from its newest card (cardList). */ earlier?: { url: string; date: string }[] };
export const takeAsReview = (t: TikTokTake): ReviewEntry => ({
  id: `tt-${t.id}`, creator: t.creator, kind: "tiktok", type: "review", url: t.url, channel: `https://www.tiktok.com/${t.handle}`,
  lang: "en", date: t.date, video: null, len: t.len, chapters: [], quote: t.quote, quoteAt: null, stance: t.stance,
  summary: t.take, more: null, highlights: [], short: t.take, keyPoint: t.keyPoint ?? null, attrs: {}, score: null, measured: {}, alsoUrl: null,
  version: null, note: null, tie: null, stood: null, trade: null, compared: null, handle: t.handle, tags: t.tags, cover: t.cover ?? null });
/** The page's two lists: `feed`, every card (each TikTok video); `counted`, one entry per reviewer (a TikTok channel with two
 *  videos counts once, by its newest take), which every count, the table, How it plays and the sentiment bar use. */
export function reviewLists(page: CreatorPage) {
  const takes = (page.tiktok?.takes ?? []).map(takeAsReview);
  const newest = new Map<string, ReviewEntry>();
  for (const t of takes) { const x = newest.get(t.handle!); if (!x || t.date > x.date) newest.set(t.handle!, t); }
  return { feed: [...page.reviews, ...takes] as ReviewEntry[], counted: [...page.reviews, ...newest.values()] as ReviewEntry[] };
}
/** The paddle page v3 feed (owner handoff 2026-11-26: every review count on a page agrees): one card per counted review, a
 *  TikTok channel's older takes linked from its newest card ("Earlier take ↗") instead of cards of their own. */
export function cardList(page: CreatorPage): ReviewEntry[] {
  const { feed, counted } = reviewLists(page), kept = new Set(counted.map(r => r.id));
  return counted.map(r => { if (r.kind !== "tiktok") return r;
    const earlier = feed.filter(x => x.kind === "tiktok" && x.handle === r.handle && !kept.has(x.id)).sort((a, b) => b.date.localeCompare(a.date))
      .map(x => ({ url: x.url, date: x.date }));
    return earlier.length ? { ...r, earlier } : r; });
}

/** "What reviewers agree on" chips (owner 2026-11-22): short phrases, never counts, each backed by 2 or more reviews that rate
 *  the attribute Excellent or Great (likes) or Okay or Weak (concerns). Most backed first, up to 3 a side. A like needs more
 *  reviews for it than against it. */
const LIKE: Record<AttrKey, string> = { power: "Strong power", control: "Strong control", spin: "Strong spin", pop: "Lively pop",
  sweet: "Forgiving sweet spot", comfort: "Easy on the arm", durability: "Grit that lasts", maneuver: "Quick and manoeuvrable",
  hydration: "Hydrating", texture: "Pleasant texture", finish: "Nice finish", absorption: "Absorbs fast", irritation: "Gentle on skin",
  results: "Visible results", scent: "Pleasant or no scent", white_cast: "No white cast", sun_protection: "Solid sun protection",
  adhesion: "Stays on well", packaging: "Handy packaging", value: "Good value",
  performance: "Fast for its class", thermals: "Runs cool and quiet", battery: "Long battery life", display: "A good screen",
  keyboard: "A good keyboard", build: "Solid build", portability: "Easy to carry",
  glide: "Lots of glide", distance: "Goes far", grip: "Good grip", accuracy: "Hits its lines" };
const CONCERN: Record<AttrKey, string> = { power: "Low on power for some", control: "Harder to control for some", spin: "Less spin than some rivals",
  pop: "Muted pop for some", sweet: "Smaller sweet spot for some", comfort: "Firm on the arm for some", durability: "Durability doubts",
  maneuver: "Heavy or slow to move for some",
  hydration: "Not hydrating enough for some", texture: "Texture not for everyone", finish: "Finish not for everyone",
  absorption: "Slow to absorb for some", irritation: "Irritated some skin", results: "Little change for some", scent: "Scent bothered some",
  white_cast: "Some white cast", sun_protection: "Protection doubts", adhesion: "Comes off for some", packaging: "Packaging gripes",
  value: "Pricey for some", performance: "Slower than rivals for some", thermals: "Hot or loud for some", battery: "Short battery life for some",
  display: "Screen gripes", keyboard: "Keyboard gripes", build: "Build doubts", portability: "Heavy for some",
  glide: "Short on glide for some", distance: "Short on distance for some", grip: "Slick in the hand for some",
  accuracy: "Hard to place for some" };
export function agreeChips(rs: Pick<CreatorReview, "attrs">[], max = 3) {
  const rows = ATTRS.map(([k]) => ({ k, hi: rs.filter(r => r.attrs[k] && HIGH.includes(r.attrs[k]!)).length, lo: rs.filter(r => r.attrs[k] && LOW.includes(r.attrs[k]!)).length }));
  const likes = rows.filter(x => x.hi >= 2 && x.hi > x.lo).sort((a, b) => b.hi - a.hi).slice(0, max).map(x => LIKE[x.k]);
  const concerns = rows.filter(x => x.lo >= 2).sort((a, b) => b.lo - a.lo).slice(0, max).map(x => CONCERN[x.k]);
  return { likes, concerns };
}
/** A stance card's one line when the page has no written group line: one review, its key point; more, the attributes those
 *  reviews rate highest (Loved it) or lowest (Mixed, Not for me); else the newest one's key point. */
export function stanceLine(rs: Pick<CreatorReview, "attrs" | "stance" | "keyPoint" | "short" | "date">[], k: Stance): string {
  const own = rs.filter(r => r.stance === k).sort((a, b) => b.date.localeCompare(a.date));
  if (!own.length) return "None of the reviews.";
  const one = own[0]!.keyPoint || takeaway(own[0]!.short);
  if (own.length === 1) return one;
  const words = k === "pos" ? HIGH : LOW;
  const top = ATTRS.map(([a, l]) => ({ l: l.toLowerCase(), n: own.filter(r => r.attrs[a] && words.includes(r.attrs[a]!)).length }))
    .filter(x => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2).map(x => x.l);
  if (!top.length) return one;
  const list = top.join(" and ");
  return k === "pos" ? `Praise for the ${list}.` : k === "mix" ? `Doubts about the ${list}.` : `Low marks for the ${list}.`;
}
