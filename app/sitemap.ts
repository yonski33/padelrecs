import type { MetadataRoute } from "next";
import { catalog } from "../db/data";
import { catalogPath, niche } from "../lib/niche";

// Built from the public catalog and cached like the pages (lib/revalidate.ts), so new rackets and brands appear without a deploy.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const data = await catalog();
  const latest = (dates: string[]) => dates.length ? new Date(dates.reduce((a, b) => a > b ? a : b)) : undefined;
  const notesFor = (racketId: string) => [...data.reviews, ...data.external].filter(n => n.racketId === racketId).map(n => n.createdAt);
  const allNotes = [...data.reviews, ...data.external].map(n => n.createdAt);

  return [
    { url: `${base}/`, lastModified: latest(allNotes), changeFrequency: "daily", priority: 1 },
    { url: `${base}${catalogPath}`, lastModified: latest(data.listed.map(r => r.createdAt)), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/brands`, changeFrequency: "weekly", priority: 0.6 },
    ...(niche.typePages ?? []).map(t => ({
      url: `${base}/${t.slug}`,
      lastModified: latest(data.listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase()).flatMap(r => [r.createdAt, ...notesFor(r.id)])),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...data.listed.map(r => ({
      url: `${base}${catalogPath}/${r.slug}`,
      lastModified: latest([r.createdAt, ...notesFor(r.id)]),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...data.listedBrands.map(b => ({
      url: `${base}/brands/${b.slug}`,
      lastModified: latest(data.listed.filter(r => r.brandId === b.id).flatMap(r => [r.createdAt, ...notesFor(r.id)])),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/add-review`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
