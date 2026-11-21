import type { MetadataRoute } from "next";
import { v3Site } from "../lib/thread/sites";
import { catalog } from "../db/data";
import { catalogPath, niche, productHref } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";
import { threadStories } from "./thread/stories-data";
import { comparePairs, pairHref } from "../lib/compare-pairs";
import { threadSite, THREAD_DEFAULT, GUIDE_PATHS, GUIDE_KEYS } from "../lib/thread/look";
import { rankList, listTotals, RANKINGS_PATH, rankingHref, withNicheWindow, withModelYears, MIN_LIST_ENTRIES } from "../lib/top-lists";

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
    // No quick-match views (?style= / ?level= / ?arm= / ?kind= / ?type= / ?skin= …): they are views of the home and canonical to
    // it (Grok SEO audit, owner 2026-11-18), so only the plain home is listed.
    { url: `${base}/reviews`, lastModified: latest(allNotes), changeFrequency: "daily", priority: 0.7 },
    ...(niche.guide ? [{ url: `${base}/guide`, lastModified: latest(listed.map(r => r.createdAt)), changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...(niche.finder ? [{ url: `${base}/finder`, lastModified: latest(allNotes), changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...(lists.length ? [{ url: `${base}${RANKINGS_PATH}`, lastModified: latest(lists.map(x => x.updated)), changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...lists.map(x => ({ url: `${base}${rankingHref(x.list.slug)}`, lastModified: new Date(x.updated), changeFrequency: "weekly" as const, priority: 0.8 })),
    // PadelRecs on the Thread look (lib/thread/look.ts): its four new guides and its rankings that only Thread has.
    ...(await threadExtras(base, latest(allNotes))),
    // Member stories (PadelRecs pilot): the list and each live story, once one is live.
    ...(await storyEntries(base)),
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
    // The v3 sites list "How rankings work"; their old score page 308s there (next.config.ts), so it isn't listed.
    ...(v3Site(niche.id) ? [{ url: `${base}/how-rankings-work`, lastModified: COPY_UPDATED, changeFrequency: "monthly" as const, priority: 0.4 }]
      : [{ url: `${base}/how-we-make-these`, lastModified: COPY_UPDATED, changeFrequency: "monthly" as const, priority: 0.4 }]),
    { url: `${base}/about`, lastModified: COPY_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: COPY_UPDATED, changeFrequency: "yearly", priority: 0.2 },
    ...(amazonLinksOn() ? [{ url: `${base}/affiliate-disclosure`, lastModified: COPY_UPDATED, changeFrequency: "yearly" as const, priority: 0.2 }] : []),
  ];
}

async function threadExtras(base: string, updated: Date | undefined): Promise<MetadataRoute.Sitemap> {
  if (niche.id !== "padel" || !threadSite(niche.id) || !THREAD_DEFAULT) return [];
  const { threadRankings } = await import("./thread/rankings-data");
  const extra = (await threadRankings()).filter(l => !l.own);
  return [
    { url: `${base}/guides`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.6 },
    ...GUIDE_KEYS.filter(k => k !== "racket").map(k => ({ url: `${base}${GUIDE_PATHS[k]}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...extra.map(l => ({ url: `${base}${l.href}`, lastModified: updated, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}

async function storyEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const list = await threadStories(1000);
  if (!list.length) return [];
  const newest = new Date(list.map(s => s.updatedAt).reduce((a, b) => a > b ? a : b));
  return [{ url: `${base}/stories`, lastModified: newest, changeFrequency: "daily", priority: 0.6 },
    ...list.map(s => ({ url: `${base}/stories/${s.slug}`, lastModified: new Date(s.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 }))];
}
