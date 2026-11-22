// The creators home preview (owner handoff "PickleballRecs Home Thread v6", 2026-11-22): a review aggregator home. What the
// staged creator reviews say per paddle (takes, the attribute most praised, words per attribute) and the latest YouTube
// summaries, from a static demo fixture (db/creators/<site>-home.json, built by the sweep's home-fixture.py). Pure, so the
// tests see what the page shows. No scores: a paddle is described by its reviews' words and takes only.
import { ATTRS, lowestOffer, reviewLists, stanceCounts, type AttrKey, type CreatorPage, type Stance } from "./creators";

export type HomePaddle = { pos: number; mix: number; neg: number; reviews: number;
  /** The attribute most reviews call Excellent or Great, with that count; null under 2. */ praise: { key: AttrKey; words: string; n: number } | null;
  /** Per attribute, how many reviews call it Excellent or Great (the Top picks boards). */ high: Record<AttrKey, number>;
  /** The lowest in-stock price from the price sweep (USD), or null. */ price: { usd: number; shop: string; url: string; affiliate: boolean } | null };
export type HomeSummary = { slug: string; creator: string; stance: Stance; date: string; url: string; text: string };
export type CreatorHome = { generated: string; pricesChecked: string; total: number; paddles: Record<string, HomePaddle>; latest: HomeSummary[] };

/** "Praised for spin in 14 reviews". */
export const praiseLine = (p: HomePaddle) => p.praise ? `Praised for ${p.praise.words} in ${p.praise.n} reviews` : null;

/** The six Top picks boards (the mock's six, mapped onto what the reviews rate: no level or kitchen data exists, so spin and
 *  durability take those two places). Each: the three paddles most reviews call Excellent or Great at it. */
export const BOARDS: { key: AttrKey; title: string; icon: "target" | "arm" | "ctrl" | "bolt" | "spin" | "shield" }[] = [
  { key: "sweet", title: "Biggest sweet spot", icon: "target" }, { key: "comfort", title: "Most arm friendly", icon: "arm" },
  { key: "control", title: "Most control", icon: "ctrl" }, { key: "power", title: "Most power", icon: "bolt" },
  { key: "spin", title: "Most spin", icon: "spin" }, { key: "durability", title: "Longest lasting", icon: "shield" },
];
export function boards(paddles: Record<string, HomePaddle>, size = 3) {
  return BOARDS.map(b => ({ ...b, rows: Object.entries(paddles).map(([slug, p]) => ({ slug, n: p.high[b.key] ?? 0, reviews: p.reviews }))
    .filter(x => x.n > 0).sort((a, c) => c.n - a.n || c.reviews - a.reviews || a.slug.localeCompare(c.slug)).slice(0, size) }))
    .filter(b => b.rows.length > 0);
}

/** "$110". */
export const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** The home's data from the creator pages themselves (the database path): the same counts as each page (one per reviewer,
 *  TikTok channels once), the most praised attribute, every attribute's Excellent-or-Great count, the lowest in-stock price,
 *  and the newest YouTube summaries. */
const PRAISE: Record<AttrKey, string> = { power: "power", control: "control", spin: "spin", pop: "pop", sweet: "its sweet spot", comfort: "arm comfort", durability: "durability" };
export function homeFromPages(pages: Map<string, CreatorPage>, latestN = 4): CreatorHome {
  const paddles: Record<string, HomePaddle> = {}, yt: HomeSummary[] = [];
  let checked = "";
  for (const [slug, page] of pages) {
    const { counted } = reviewLists(page);
    const high = Object.fromEntries(ATTRS.map(([k]) => [k, counted.filter(r => r.attrs[k] === "Excellent" || r.attrs[k] === "Great").length])) as Record<AttrKey, number>;
    const top = ATTRS.map(([k]) => k).reduce((a, k) => high[k] > high[a] ? k : a, "power" as AttrKey);
    const low = page.prices ? lowestOffer(page.prices.offers) : null, shop = low?.shops[0];
    if (page.prices && page.prices.checked > checked) checked = page.prices.checked;
    paddles[slug] = { ...stanceCounts(counted), reviews: counted.length, high,
      praise: high[top] >= 2 ? { key: top, words: PRAISE[top], n: high[top] } : null,
      price: low && shop ? { usd: low.price, shop: shop.shop, url: shop.url, affiliate: shop.affiliate } : null };
    for (const r of page.reviews) if (r.kind === "youtube") yt.push({ slug, creator: r.creator, stance: r.stance, date: r.date, url: r.url, text: r.short });
  }
  yt.sort((a, b) => b.date.localeCompare(a.date));
  return { generated: "", pricesChecked: checked, total: Object.values(paddles).reduce((a, p) => a + p.reviews, 0), paddles, latest: yt.slice(0, latestN) };
}
