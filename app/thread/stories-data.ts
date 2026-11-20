// Member stories for the Thread pages (PadelRecs pilot, drizzle/0031). Every read is empty without a database, off padel, or
// while the table isn't there yet (the migration waits for the owner), so the pages and the nav simply don't show stories.
import { cache } from "react";
import { database } from "../../db/data";
import { liveStories, storyBySlug, storiesForRacket, liveStoryCount, type Story } from "../../db/stories";
import { storiesSite } from "../../lib/thread/sites";
import { niche } from "../../lib/niche";

const on = () => !!process.env.DATABASE_URL && storiesSite(niche.id);
async function safe<T>(what: string, empty: T, read: () => Promise<T>): Promise<T> {
  if (!on()) return empty;
  try { return await read(); } catch (error) { console.error(`[thread] stories ${what} failed`, error); return empty; }
}
export const threadStories = cache((limit = 50) => safe<Story[]>("list", [], async () => liveStories(await database(), limit)));
export const threadStory = cache((slug: string) => safe<Story | null>("read", null, async () => storyBySlug(await database(), slug)));
export const racketStories = cache((racketId: string) => safe<Story[]>("racket", [], async () => storiesForRacket(await database(), racketId)));
/** How many stories are live: the header link and the home block show from 1. */
export const liveStoryTotal = cache(() => safe<number>("count", 0, async () => liveStoryCount(await database())));
