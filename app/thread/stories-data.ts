// Member stories for the Thread pages (PadelRecs pilot, drizzle/0031). Every read is empty without a database, off padel, or
// while the table isn't there yet (the migration waits for the owner), so the pages and the nav simply don't show stories.
import { cache } from "react";
import { database } from "../../db/data";
import { liveStories, storyBySlug, storiesForRacket, liveStoryCount, movedStory, type Story } from "../../db/stories";
import { storyFeatures, storyExtras, likedThisMonth, authorStats, type StoryFeatures, type StoryExtra } from "../../db/story-extras";
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
/** A story's current address when this is one it had before (clean slugs: the old address 301s), else null. */
export const threadMovedStory = cache((slug: string) => safe<string | null>("moved", null, async () => movedStory(await database(), slug)));

// The redesign's extras (owner design 2026-11-21): topic and ▲ likes once drizzle/0033 is in, comment counts always.
const OFF: StoryFeatures = { topics: false, likes: false };
export const threadStoryFeatures = cache(() => safe<StoryFeatures>("features", OFF, async () => storyFeatures(await database())));
export async function threadStoryExtras(list: Story[]) {
  const f = await threadStoryFeatures();
  return safe<Map<string, StoryExtra>>("extras", new Map(), async () => storyExtras(await database(), list, f));
}
export const threadLikedThisMonth = cache(async () => (await threadStoryFeatures()).likes
  ? safe<{ id: string; likes: number }[]>("liked", [], async () => likedThisMonth(await database())) : []);
export const threadAuthorStats = cache(async (storyId: string) => {
  const f = await threadStoryFeatures();
  return safe("author", { stories: 0, likes: 0, reviews: 0 }, async () => authorStats(await database(), storyId, f));
});
/** More from this story's author (live, newest first, without this one). */
export const threadAuthorStories = cache(async (storyId: string) => {
  const all = await threadStories();
  const me = all.find(s => s.id === storyId);
  return me ? all.filter(s => s.id !== storyId && s.author.name === me.author.name) : [];
});
