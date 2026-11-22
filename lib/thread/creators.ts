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
  id: string; creator: string; kind: "youtube" | "blog"; type: "review" | "comparison" | "long-term";
  url: string; channel: string; lang: string; date: string; video: string | null; len: number | null;
  /** The creator's own chapters (start second, title), intro, outro and discount-code lines left out. */ chapters: [number, string][];
  /** A real quote (verbatim; plain caption spellings fixed), or null. */ quote: string | null; quoteAt: number | null;
  stance: Stance; summary: string; attrs: Partial<Record<AttrKey, Word>>;
  /** Only where the creator published a number (Pickleheads' are hidden until their scale is confirmed). */
  score: { value: number; scale: number; label: string | null } | null;
  measured: Record<string, number | string>; alsoUrl: string | null;
  /** The version or unit the review covered ("Pre-production unit"), shown as a tag. */ version: string | null;
  /** "Long-term" or "First impressions", or null. */ note: string | null;
  /** A disclosed tie with this product's brand: "Works with <tie>". */ tie: string | null;
  stood: string | null; trade: string | null; compared: string | null;
};
export type CreatorPage = { paddle: string; tldr: string; reviews: CreatorReview[] };
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
export const platform = (r: Pick<CreatorReview, "kind">) => r.kind === "youtube" ? "YouTube" : "Blog";
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
