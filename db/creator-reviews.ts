// Creator reviews from the database (drizzle/0039_creator_reviews.sql, PickleballRecs, SkinRecs; LaptopRecs adds 0041's config; see the creator-db session's
// CREATOR-DB-SCHEMA.md): creator_pages, creator_reviews, creator_prices. Read only, with plain SQL in the niche's own
// schema (the tables are not in db/schema.ts on purpose). The row mappers are pure, so the tests check them without a DB.
// Owner rules kept here: TikTok rows become short takes (counted once per channel by lib/thread/creators.ts), a hidden
// score never leaves this file, the disclosure and internal notes are never read.
import { sql } from "drizzle-orm";
import type { getDb } from "./index";
import type { AttrKey, CreatorPage, CreatorReview, Offer, ReviewConfig, Stance, TikTokTake, Word } from "../lib/thread/creators";
import { ATTRS, WORDS } from "../lib/thread/creators";

type Database = ReturnType<typeof getDb>;
const SCHEMA = /^[a-z_][a-z0-9_]*$/;
const rowsOf = (r: unknown) => (Array.isArray(r) ? r : (r as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
const str = (v: unknown) => v == null ? null : String(v);
const num = (v: unknown) => v == null || v === "" ? null : Number(v);
const json = <T>(v: unknown, fallback: T): T => { if (v == null) return fallback; if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return fallback; } } return v as T; };
const list = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("{") ? v.slice(1, -1).split(",").filter(Boolean).map(x => x.replace(/^"|"$/g, "")) : [];
/** The site's own attribute keys (lib/thread/creators.ts ATTRS: pickleball's seven, or SkinRecs' words). */
const ATTR_KEYS: AttrKey[] = ATTRS.map(([k]) => k);

/** One creator_reviews row (YouTube or blog) as the page's review. */
export function reviewFromRow(r: Record<string, unknown>): CreatorReview {
  const attrsIn = json<Record<string, string>>(r.attributes, {});
  const attrs: Partial<Record<AttrKey, Word>> = {};
  for (const k of ATTR_KEYS) { const w = attrsIn[k] ?? (k === "sweet" ? attrsIn.forgiveness : undefined); if (w && (WORDS as readonly string[]).includes(w)) attrs[k] = w as Word; }
  const hidden = r.score_hidden === true || r.score_hidden === "t";
  const sv = num(r.score_value), ss = num(r.score_scale);
  const type = String(r.review_type);
  return {
    id: String(r.id), creator: String(r.creator), kind: String(r.platform) as CreatorReview["kind"],
    type: (type === "comparison" || type === "long-term" ? type : "review") as CreatorReview["type"],
    url: String(r.url), channel: str(r.channel_url) ?? String(r.url), lang: str(r.language) ?? "en", date: str(r.published_on) ?? "",
    video: str(r.video_id), len: num(r.duration_s), chapters: json<[number, string][]>(r.chapters, []),
    quote: str(r.quote), quoteAt: num(r.quote_at_s), stance: String(r.stance) as Stance,
    summary: String(r.summary), more: str(r.summary_more), highlights: list(r.highlights).filter(h => String(r.summary).includes(h)),
    short: str(r.summary_short) ?? String(r.summary), keyPoint: str(r.key_point), attrs,
    score: !hidden && sv != null && ss != null ? { value: sv, scale: ss, label: str(r.score_label) } : null,
    measured: json<Record<string, number | string>>(r.measured, {}), alsoUrl: str(r.also_url), version: str(r.version),
    note: str(r.note), tie: str(r.brand_tie), stood: str(r.stood_out), trade: str(r.trade_off), compared: str(r.compared_to),
    // The tested config (drizzle/0041, LaptopRecs): only on schemas that have the columns.
    ...("config_label" in r || "config" in r ? { config: configFromRow(r) } : {}),
  };
}
/** The config columns (drizzle/0041) as the card's config: the source's own words per field, nulls kept out. */
export function configFromRow(r: Record<string, unknown>): ReviewConfig {
  const f = json<Record<string, unknown>>(r.config, {});
  const fields = Object.fromEntries(Object.entries(f).filter(([, v]) => v != null && String(v).trim()).map(([k, v]) => [k, String(v)]));
  return { label: str(r.config_label), note: str(r.config_note), group: str(r.config_group), fields };
}
/** One TikTok creator_reviews row as a short take (its summary is the take). */
export function takeFromRow(r: Record<string, unknown>): TikTokTake {
  return { id: String(r.id), creator: String(r.creator), handle: str(r.handle) ?? String(r.creator), date: str(r.published_on) ?? "",
    len: num(r.duration_s) ?? 0, stance: String(r.stance) as Stance, quote: str(r.quote) ?? "", take: String(r.summary),
    tags: list(r.tags).slice(0, 3), disclosure: "", url: String(r.url), keyPoint: str(r.key_point) };
}
/** creator_prices rows as offers, in stock first then cheapest, and the newest check date. */
/** Amazon's rule for shown prices (owner 2026-11-23, scripts/amazon-prices.mts): an Amazon row counts only while its price is
 *  under 24 hours old; after that the page shows Amazon as a plain link again. Other shops keep their weekly checks. */
const AMAZON_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const freshEnough = (r: Record<string, unknown>, now: number) => String(r.shop) !== "Amazon" || now - Date.parse(String(r.checked_at)) < AMAZON_MAX_AGE_MS;
export function offersFromRows(rows: Record<string, unknown>[], now = Date.now()): { checked: string; offers: Offer[] } | null {
  rows = rows.filter(r => freshEnough(r, now));
  const offers = rows.filter(r => (str(r.currency) ?? "USD") === "USD").map(r => ({ shop: String(r.shop), url: String(r.url), price: Number(r.price),
    inStock: r.in_stock === true || r.in_stock === "t", edition: str(r.edition), affiliate: r.affiliate === true || r.affiliate === "t", checkedAt: str(r.checked_at) }))
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.price - b.price);
  if (!offers.length) return null;
  const checked = rows.map(r => str(r.checked_at) ?? "").sort().pop()!.slice(0, 10);
  return { checked, offers };
}
/** A creator_pages row plus its reviews and prices as the page model. */
export function pageFromRows(page: Record<string, unknown>, reviews: Record<string, unknown>[], prices: Record<string, unknown>[], name: string): CreatorPage {
  const tt = reviews.filter(r => r.platform === "tiktok");
  return { paddle: name, tldr: str(page.tldr) ?? "",
    groups: { pos: str(page.group_pos) ?? "", mix: str(page.group_mix) ?? "", neg: str(page.group_neg) ?? "" },
    prices: offersFromRows(prices),
    ...(tt.length ? { tiktok: { unverified: true, note: "from creator_reviews", takes: tt.map(takeFromRow) } } : {}),
    reviews: reviews.filter(r => r.platform !== "tiktok").map(reviewFromRow) };
}

/** One product's creator page from the database: null when it has none (no live creator_pages row); throws when the tables
 *  are not there yet (the caller falls back to the demo fixture). */
export async function readCreatorPage(db: Pick<Database, "execute">, schema: string, slug: string): Promise<CreatorPage | null> {
  if (!SCHEMA.test(schema)) throw new Error("bad schema");
  const s = sql.raw(`"${schema}"`);
  const pages = rowsOf(await db.execute(sql`select cp.*, p.name as product_name from ${s}.creator_pages cp join ${s}.rackets p on p.id = cp.racket_id where p.slug = ${slug} and cp.status = 'live'`));
  if (!pages.length) return null;
  const id = String(pages[0]!.racket_id);
  const [reviews, prices] = await Promise.all([
    db.execute(sql`select * from ${s}.creator_reviews where racket_id = ${id} and status = 'live' order by published_on desc nulls last`),
    db.execute(sql`select * from ${s}.creator_prices where racket_id = ${id} and status = 'live'`),
  ]);
  return pageFromRows(pages[0]!, rowsOf(reviews), rowsOf(prices), String(pages[0]!.product_name));
}
/** Every live creator page's slug. */
export async function readCreatorSlugs(db: Pick<Database, "execute">, schema: string): Promise<string[]> {
  if (!SCHEMA.test(schema)) throw new Error("bad schema");
  const s = sql.raw(`"${schema}"`);
  return rowsOf(await db.execute(sql`select p.slug from ${s}.creator_pages cp join ${s}.rackets p on p.id = cp.racket_id where cp.status = 'live'`)).map(r => String(r.slug));
}
/** Every live creator page with its reviews and prices, by slug (the creators home). */
export async function readAllCreatorPages(db: Pick<Database, "execute">, schema: string): Promise<Map<string, CreatorPage>> {
  if (!SCHEMA.test(schema)) throw new Error("bad schema");
  const s = sql.raw(`"${schema}"`);
  const [pages, reviews, prices] = await Promise.all([
    db.execute(sql`select cp.*, p.slug as product_slug, p.name as product_name from ${s}.creator_pages cp join ${s}.rackets p on p.id = cp.racket_id where cp.status = 'live'`),
    db.execute(sql`select r.* from ${s}.creator_reviews r join ${s}.creator_pages cp on cp.racket_id = r.racket_id and cp.status = 'live' where r.status = 'live' order by r.published_on desc nulls last`),
    db.execute(sql`select c.* from ${s}.creator_prices c join ${s}.creator_pages cp on cp.racket_id = c.racket_id and cp.status = 'live' where c.status = 'live'`),
  ]);
  const by = <T extends Record<string, unknown>>(xs: T[]) => { const m = new Map<string, T[]>(); for (const x of xs) { const k = String(x.racket_id); m.set(k, [...(m.get(k) ?? []), x]); } return m; };
  const rv = by(rowsOf(reviews)), pr = by(rowsOf(prices));
  return new Map(rowsOf(pages).map(p => [String(p.product_slug), pageFromRows(p, rv.get(String(p.racket_id)) ?? [], pr.get(String(p.racket_id)) ?? [], String(p.product_name))]));
}
