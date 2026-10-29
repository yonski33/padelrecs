import type { MetadataRoute } from "next";
import { catalog } from "../db/data";
import { catalogPath, niche } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";
import { rankList, listTotals, RANKINGS_PATH, rankingHref, withNicheWindow } from "../lib/top-lists";

// Built per request from the public catalog, so new rackets and brands appear without a deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const data = await catalog();
  const latest = (dates: string[]) => dates.length ? new Date(dates.reduce((a, b) => a > b ? a : b)) : undefined;
  const notesFor = (racketId: string) => [...data.reviews, ...data.external].filter(n => n.racketId === racketId).map(n => n.createdAt);
  const allNotes = [...data.reviews, ...data.external].map(n => n.createdAt);
  // Rankings pages, dated by their newest ranked review. Lists nobody qualifies for yet are left out (they're noindex).
  // Pages that moved to another Recs site 301 there (GamingRecs monitors), so they are left out even while their rows remain.
  const moved = new Set((niche.movedAway ?? []).filter(m => !m.query).map(m => m.source));
  const listed = data.listed.filter(r => !moved.has(`${catalogPath}/${r.slug}`));
  const listedBrands = data.listedBrands.filter(b => !moved.has(`/brands/${b.slug}`));
  const lists = withNicheWindow(niche.topLists ?? [], niche.recentMonths).map(list => ({ list, ...listTotals(rankList(list, data, niche.tags)) })).filter(x => x.updated);

  return [
    { url: `${base}/`, lastModified: latest(allNotes), changeFrequency: "daily", priority: 1 },
    { url: `${base}${catalogPath}`, lastModified: latest(listed.map(r => r.createdAt)), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/brands`, changeFrequency: "weekly", priority: 0.6 },
    ...(lists.length ? [{ url: `${base}${RANKINGS_PATH}`, lastModified: latest(lists.map(x => x.updated)), changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...lists.map(x => ({ url: `${base}${rankingHref(x.list.slug)}`, lastModified: new Date(x.updated), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(niche.typePages ?? []).map(t => ({
      url: `${base}/${t.slug}`,
      lastModified: latest(listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase()).flatMap(r => [r.createdAt, ...notesFor(r.id)])),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...listed.map(r => ({
      url: `${base}${catalogPath}/${r.slug}`,
      lastModified: latest([r.createdAt, ...notesFor(r.id)]),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...listedBrands.map(b => ({
      url: `${base}/brands/${b.slug}`,
      lastModified: latest(listed.filter(r => r.brandId === b.id).flatMap(r => [r.createdAt, ...notesFor(r.id)])),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/add-review`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.2 },
    ...(amazonLinksOn() ? [{ url: `${base}/affiliate-disclosure`, changeFrequency: "yearly" as const, priority: 0.2 }] : []),
  ];
}
