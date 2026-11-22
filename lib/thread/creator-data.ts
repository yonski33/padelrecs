// The creator pages' data. From the database (db/creator-reviews.ts, drizzle/0039, PickleballRecs) once its tables exist;
// until then, and wherever the database is not reachable (CI), from the demo fixtures (db/creators/<site>.json and
// <site>-home.json), so the preview keeps working. Server only: the browser never gets the whole file.
import covers from "../../db/creators/covers.json";
import { cache } from "react";
import pickleball from "../../db/creators/pickleball.json";
import pickleballHome from "../../db/creators/pickleball-home.json";
import type { CreatorPage } from "./creators";
import { homeFromPages, type CreatorHome } from "./creator-home";
import { niche } from "../niche";

type Fixture = { paddles: Record<string, CreatorPage> };
const FIXTURES: Record<string, Fixture> = { pickleball: pickleball as unknown as Fixture };
const HOMES: Record<string, CreatorHome> = { pickleball: pickleballHome as unknown as CreatorHome };
/** The demo fixtures, as they were (tests, and the fallback below). */
export const fixturePage = (site: string, slug: string): CreatorPage | null => FIXTURES[site]?.paddles[slug] ?? null;
export const fixtureHome = (site: string): CreatorHome | null => HOMES[site] ?? null;
const fixtureSlugs = (site: string) => Object.keys(FIXTURES[site]?.paddles ?? {});

const missingTable = (e: unknown) => [(e as { code?: string })?.code, (e as { cause?: { code?: string } })?.cause?.code].includes("42P01");
/** Runs a database read; null when it can't run (no DATABASE_URL, or the 0039 tables not applied yet), so the fixtures stand in. */
async function withDb<T>(site: string, read: (db: Awaited<ReturnType<typeof import("../../db/data").database>>, m: typeof import("../../db/creator-reviews")) => Promise<T>): Promise<{ v: T } | null> {
  if (site !== niche.id || !process.env.DATABASE_URL) return null;
  try {
    const [m, { database }] = await Promise.all([import("../../db/creator-reviews"), import("../../db/data")]);
    return { v: await read(await database(), m) };
  } catch (error) {
    // 42P01 (relation does not exist): the import is not applied yet, quietly use the fixtures.
    if (!missingTable(error)) console.error("[creators] database read failed, using the demo fixtures", error);
    return null;
  }
}
const allPages = cache((site: string) => withDb(site, (db, m) => m.readAllCreatorPages(db, niche.schema)));

/** One product's creator page, or null (per product: the product route asks this for every paddle). */
export const creatorPage = cache(async (site: string, slug: string): Promise<CreatorPage | null> => {
  const r = await withDb(site, (db, m) => m.readCreatorPage(db, niche.schema, slug));
  return withCovers(site, r ? r.v : fixturePage(site, slug));
});
/** Each TikTok take's saved cover (db/creators/covers.json; the stored TikTok links expire), where one is saved. */
const COVERS = covers as unknown as Record<string, string[]>;
function withCovers(site: string, page: CreatorPage | null): CreatorPage | null {
  const have = new Set(COVERS[site] ?? []);
  if (!page?.tiktok || !have.size) return page;
  return { ...page, tiktok: { ...page.tiktok, takes: page.tiktok.takes.map(t => have.has(t.id) ? { ...t, cover: `/creator-covers/${site}/${t.id}.jpg` } : t) } };
}
/** The products with a creator page (generateStaticParams). */
export async function creatorSlugs(site: string): Promise<string[]> {
  const r = await withDb(site, (db, m) => m.readCreatorSlugs(db, niche.schema));
  return r ? r.v : fixtureSlugs(site);
}
/** The creators home's data, or null. */
export async function creatorHome(site: string): Promise<CreatorHome | null> {
  const r = await allPages(site);
  return r ? homeFromPages(r.v) : fixtureHome(site);
}
