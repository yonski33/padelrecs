// The creator page's demo data (db/creators/<site>.json, built from the staged creator sweep of 2026-11-22), kept out of
// lib/thread/creators.ts so the page's browser code never ships the whole file. Read only: no database.
import pickleball from "../../db/creators/pickleball.json";
import type { CreatorPage } from "./creators";

type Fixture = { paddles: Record<string, CreatorPage> };
const FIXTURES: Record<string, Fixture> = { pickleball: pickleball as unknown as Fixture };

/** One product's creator page, or null (no fixture for the site, or none for the product). */
export const creatorPage = (site: string, slug: string): CreatorPage | null => FIXTURES[site]?.paddles[slug] ?? null;
/** The products with a creator page on the site (generateStaticParams). */
export const creatorSlugs = (site: string): string[] => Object.keys(FIXTURES[site]?.paddles ?? {});
