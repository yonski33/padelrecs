import type { MetadataRoute } from "next";
import { catalog } from "../db/data";
import { catalogPath, niche, productHref, isV2 } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";
import { comparePairs, pairHref } from "../lib/compare-pairs";
import { rankList, listTotals, RANKINGS_PATH, rankingHref, withNicheWindow, withModelYears, MIN_LIST_ENTRIES } from "../lib/top-lists";
import { INDEXABLE_CHOICES, choiceHref } from "../lib/quick-match";

// When the about / contact / how-we-make / affiliate pages last changed (their copy is in code): bump with an edit there.
const COPY_UPDATED = new Date("2026-11-15T00:00:00Z");

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
  const lists = withModelYears(withNicheWindow(niche.topLists ?? [], niche.recentMonths)).map(list => ({ list, entries: rankList(list, data, niche.tags) })).filter(x => x.entries.length >= MIN_LIST_ENTRIES).map(x => ({ list: x.list, ...listTotals(x.entries) })).filter(x => x.updated);

  return [
    { url: `${base}/`, lastModified: latest(allNotes), changeFrequency: "daily", priority: 1 },
    { url: `${base}${catalogPath}`, lastModified: latest(listed.map(r => r.createdAt)), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/brands`, lastModified: latest(listed.map(r => r.createdAt)), changeFrequency: "weekly", priority: 0.6 },
    // Quick match pages (PadelRecs): every style × level × sore arm, the indexable ones (app/page.tsx canonical).
    ...(isV2 && niche.finder ? INDEXABLE_CHOICES.map(c => ({ url: `${base}${choiceHref(c, "")}`, lastModified: latest(allNotes), changeFrequency: "daily" as const, priority: 0.7 })) : []),
    { url: `${base}/reviews`, lastModified: latest(allNotes), changeFrequency: "daily", priority: 0.7 },
    ...(niche.finder ? [{ url: `${base}/finder`, lastModified: latest(allNotes), changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...(lists.length ? [{ url: `${base}${RANKINGS_PATH}`, lastModified: latest(lists.map(x => x.updated)), changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...lists.map(x => ({ url: `${base}${rankingHref(x.list.slug)}`, lastModified: new Date(x.updated), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(niche.typePages ?? []).map(t => ({
      url: `${base}/${t.slug}`,
      lastModified: latest(listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase()).flatMap(r => [r.createdAt, ...notesFor(r.id)])),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...listed.map(r => ({
      url: `${base}${productHref(r)}`,
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
    // Curated "X vs Y" pages only (lib/compare-pairs); other mixes of products are not indexed.
    ...comparePairs(data).pairs.filter(p => !moved.has(`${catalogPath}/${p.a.slug}`) && !moved.has(`${catalogPath}/${p.b.slug}`)).map(p => ({
      url: `${base}${pairHref(p.a.slug, p.b.slug)}`,
      lastModified: latest([p.a.createdAt, p.b.createdAt, ...notesFor(p.a.id), ...notesFor(p.b.id)]),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/how-we-make-these`, lastModified: COPY_UPDATED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, lastModified: COPY_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: COPY_UPDATED, changeFrequency: "yearly", priority: 0.2 },
    ...(amazonLinksOn() ? [{ url: `${base}/affiliate-disclosure`, lastModified: COPY_UPDATED, changeFrequency: "yearly" as const, priority: 0.2 }] : []),
  ];
}
