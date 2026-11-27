// Server data for the creator (reviewer) pages (lib/thread/reviewers.ts): every live creator review read once per render
// (react cache), the creators with a page, each product's takes, links and price, and the profiles file.
import { cache } from "react";
import { niche, catalogPath } from "../../lib/niche";
import { reviewerRows, creatorHome } from "../../lib/thread/creator-data";
import { productTakes, reviewersFrom, type Reviewer, type ReviewerRow } from "../../lib/thread/reviewers";
import { reviewerPagesOn } from "../../lib/thread/sites";
import { oneShape } from "../../lib/thread/shape";
import { threadRows } from "./data";
import { affiliateTag, amazonSearchLink } from "../../lib/amazon";
import { withoutYear } from "../../lib/brand-name";
import profiles from "../../db/creators/reviewer-profiles.json";

export type ReviewerProfile = { name: string; subs: number | null; channel: string | null; joined: string | null; site: string | null;
  links: { label: string; url: string }[]; bio: string | null; topics: string[]; avatar?: string | null };
const PROFILES = profiles as unknown as Record<string, Record<string, ReviewerProfile>>;
export const profileOf = (slug: string): ReviewerProfile | null => PROFILES[niche.id]?.[slug] ?? null;

export const reviewersData = cache(async () => {
  if (!reviewerPagesOn(niche.id)) return { rows: [] as ReviewerRow[], list: [] as Reviewer[], takes: new Map(), product: () => null, price: () => null };
  const [rows, { bySlug }, home] = await Promise.all([reviewerRows(niche.id), threadRows(), creatorHome(niche.id)]);
  const list = reviewersFrom(rows), takes = productTakes(rows);
  /** The product's page, photo and shape (the catalogue's row), or its plain address. */
  const product = (slug: string) => { const r = bySlug.get(slug), s = oneShape(r?.shape ?? null);
    return { href: r?.href ?? `${catalogPath}/${slug}`, pic: r?.pic ?? null, shape: s ? s[0]!.toUpperCase() + s.slice(1) : null }; };
  /** The product's current lowest price link (the creator pages' offers, lib/thread/creator-home.ts); without one, an Amazon
   *  search for its name with the site's tag (owner 2026-11-27), where the site has Amazon links. No amount shown. */
  const tag = niche.amazon ? affiliateTag() : "";
  const price = (slug: string, name: string) => { const p = home?.paddles[slug]?.price;
    if (p) return { url: p.url, rel: p.affiliate ? "sponsored nofollow noopener" : "nofollow noopener" };
    return tag ? { url: amazonSearchLink(withoutYear(name), tag, niche.amazon!.marketplace), rel: "sponsored nofollow noopener" } : null; };
  return { rows, list, takes, product, price };
});

/** A review's creator name → their page and profile picture, for creators with a page (the rest keep the channel link). */
export const reviewerHrefs = cache(async (): Promise<Map<string, { href: string; avatar: string | null }>> => {
  const { list } = await reviewersData();
  return new Map(list.flatMap(r => r.reviews.map(x => [x.creator, { href: `/creators/${r.slug}`, avatar: profileOf(r.slug)?.avatar ?? null }] as const)));
});
