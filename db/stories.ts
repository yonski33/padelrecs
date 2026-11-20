// Member stories (drizzle/0031, PadelRecs Thread pilot, owner 2026-11-20): short posts by signed-in members, with optional
// racket tags. Checked like comments (lib/review-spam.ts) plus the story rules (lib/thread/stories.ts): spam is rejected,
// the rest waits in the admin queue (Stories tab). The owner's own stories (signed in to the admin too) go live at once.
import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { stories, accounts, comments } from "./schema";
import { spamScore } from "../lib/review-spam";
import { storyProblem, storySlug } from "../lib/thread/stories";

type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, "select">;
export type StoryStatus = "pending" | "approved" | "rejected";
export type Story = { id: string; slug: string; title: string; body: string; rackets: string[]; status: StoryStatus; at: string; updatedAt: string;
  /** When the live text last changed after publishing (drizzle/0032), null when never edited. */ editedAt: string | null;
  author: { name: string; level: string | null; side: string | null } };
export type PendingEdit = { title: string; body: string; rackets: string[]; at: string };
export const STORIES_PER_DAY = 3;

const pick = { id: stories.id, slug: stories.slug, title: stories.title, body: stories.body, rackets: stories.rackets, status: stories.status,
  at: stories.createdAt, updatedAt: stories.updatedAt, editedAt: stories.editedAt, name: accounts.name, level: accounts.level, side: accounts.side };
type Row = { id: string; slug: string; title: string; body: string; rackets: string[]; status: StoryStatus; at: string; updatedAt: string; editedAt: string | null; name: string; level: string | null; side: string | null };
const story = (r: Row): Story => ({ id: r.id, slug: r.slug, title: r.title, body: r.body, rackets: r.rackets ?? [], status: r.status, at: r.at, updatedAt: r.updatedAt,
  editedAt: r.editedAt ?? null, author: { name: r.name, level: r.level, side: r.side } });

/** Live stories, newest first. */
export async function liveStories(db: Reader, limit = 50): Promise<Story[]> {
  const rows = await db.select(pick).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId))
    .where(and(eq(stories.status, "approved"), eq(accounts.status, "active"))).orderBy(desc(stories.createdAt)).limit(limit);
  return (rows as Row[]).map(story);
}
/** One story by its address (live only, unless `any`, for its author or the owner). */
export async function storyBySlug(db: Reader, slug: string, any = false): Promise<Story | null> {
  const [r] = await db.select(pick).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId)).where(eq(stories.slug, slug));
  return r && (any || (r.status === "approved")) ? story(r as Row) : null;
}
/** Live stories that tag this racket ("Stories mentioning this racket"). */
export async function storiesForRacket(db: Reader, racketId: string, limit = 5): Promise<Story[]> {
  const rows = await db.select(pick).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId))
    .where(and(eq(stories.status, "approved"), eq(accounts.status, "active"), sql`${stories.rackets} @> ${JSON.stringify([racketId])}::jsonb`))
    .orderBy(desc(stories.createdAt)).limit(limit);
  return (rows as Row[]).map(story);
}
/** How many stories are live (the header link and home block show from 1). */
export async function liveStoryCount(db: Reader) {
  const [r] = await db.select({ n: count() }).from(stories).where(eq(stories.status, "approved"));
  return Number(r?.n ?? 0);
}

/** Save a member's story. `live`: the owner (or, with #537, a trusted member) skips the queue; spam is rejected either way. */
export async function addStory(db: Database, s: { accountId: string; title: string; body: string; rackets: string[]; network: string; live: boolean }, now = new Date()) {
  const title = s.title.trim(), body = s.body.trim(), rackets = [...new Set(s.rackets)];
  const problem = storyProblem({ title, body, rackets }); if (problem) return { status: "invalid" as const, problem };
  const [recent] = await db.select({ n: count() }).from(stories).where(and(eq(stories.accountId, s.accountId), gte(stories.createdAt, new Date(now.getTime() - 86_400_000).toISOString())));
  if (Number(recent.n) >= STORIES_PER_DAY) return { status: "limited" as const };
  const spam = spamScore({ reviewText: `${title}\n${body}` });
  const status: StoryStatus = spam.spam ? "rejected" : s.live && spam.score === 0 ? "approved" : "pending";
  const id = crypto.randomUUID(), slug = storySlug(title, id), at = now.toISOString();
  await db.insert(stories).values({ id, slug, accountId: s.accountId, title, body, rackets, status, spamScore: spam.score, network: s.network, createdAt: at, updatedAt: at });
  return { status, id, slug };
}

export type AdminStory = Story & { spamScore: number; pendingEdit: PendingEdit | null };
/** The admin Stories tab: newest first, by status; "edits" = live stories with a member's edit waiting. */
export async function adminStories(db: Reader, status: StoryStatus | "all" | "edits", limit = 50): Promise<AdminStory[]> {
  const rows = await db.select({ ...pick, spamScore: stories.spamScore, pendingEdit: stories.pendingEdit }).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId))
    .where(status === "all" ? undefined : status === "edits" ? isNotNull(stories.pendingEdit) : eq(stories.status, status)).orderBy(desc(stories.createdAt)).limit(limit);
  return (rows as (Row & { spamScore: number; pendingEdit: PendingEdit | null })[]).map(r => ({ ...story(r), spamScore: r.spamScore, pendingEdit: r.pendingEdit ?? null }));
}

/** A story for its author or an admin: any status, with its owner and any waiting edit (the edit page and "Your stories"). */
export async function storyForEditor(db: Reader, slug: string) {
  const [r] = await db.select({ ...pick, accountId: stories.accountId, pendingEdit: stories.pendingEdit }).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId)).where(eq(stories.slug, slug));
  return r ? { ...story(r as Row), accountId: r.accountId, pendingEdit: (r.pendingEdit ?? null) as PendingEdit | null } : null;
}
/** A member's own stories, newest first, for "Your stories" on the account page. */
export async function myStories(db: Reader, accountId: string) {
  const rows = await db.select({ ...pick, pendingEdit: stories.pendingEdit }).from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId))
    .where(eq(stories.accountId, accountId)).orderBy(desc(stories.createdAt)).limit(100);
  return rows.map(r => ({ ...story(r as Row), editWaiting: !!r.pendingEdit }));
}

/** Save an edit (owner 2026-11-20). The address stays the same when the title changes. `live` (an admin, or a trusted member
 *  once #537 is in) publishes it at once; a member's edit to a live story waits for the owner while the live text stays;
 *  a story that isn't live yet is simply updated and stays where it is in the queue. Spam is refused. */
export async function editStory(db: Database, e: { id: string; title: string; body: string; rackets: string[]; live: boolean }, now = new Date()) {
  const title = e.title.trim(), body = e.body.trim(), rackets = [...new Set(e.rackets)];
  const problem = storyProblem({ title, body, rackets }); if (problem) return { status: "invalid" as const, problem };
  const [s] = await db.select({ status: stories.status, slug: stories.slug }).from(stories).where(eq(stories.id, e.id));
  if (!s) return { status: "missing" as const };
  const spam = spamScore({ reviewText: `${title}
${body}` });
  if (spam.spam) return { status: "invalid" as const, problem: "That edit looks like spam. Change it and try again." };
  const at = now.toISOString();
  if (s.status === "approved" && !(e.live && spam.score === 0)) {
    await db.update(stories).set({ pendingEdit: { title, body, rackets, at }, updatedAt: at }).where(eq(stories.id, e.id));
    return { status: "waiting" as const, slug: s.slug };
  }
  await db.update(stories).set({ title, body, rackets, spamScore: spam.score, pendingEdit: null, updatedAt: at, ...(s.status === "approved" ? { editedAt: at } : {}) }).where(eq(stories.id, e.id));
  return { status: s.status === "approved" ? "live" as const : "saved" as const, slug: s.slug };
}
/** The owner approves or turns down a member's waiting edit (admin Stories tab). */
export async function decideEdit(db: Database, id: string, approve: boolean, now = new Date()) {
  const [s] = await db.select({ slug: stories.slug, pendingEdit: stories.pendingEdit }).from(stories).where(eq(stories.id, id));
  if (!s?.pendingEdit) return null;
  const at = now.toISOString(), p = s.pendingEdit as PendingEdit;
  await db.update(stories).set(approve ? { title: p.title, body: p.body, rackets: p.rackets, pendingEdit: null, editedAt: at, updatedAt: at } : { pendingEdit: null, updatedAt: at }).where(eq(stories.id, id));
  return s.slug;
}
export async function setStoryStatus(db: Database, id: string, status: StoryStatus, now = new Date()) {
  const r = await db.update(stories).set({ status, updatedAt: now.toISOString() }).where(eq(stories.id, id)).returning({ slug: stories.slug });
  return r[0]?.slug ?? null;
}
/** Delete a story and the comments under it. */
export async function deleteStory(db: Database, id: string) {
  const [s] = await db.select({ slug: stories.slug }).from(stories).where(eq(stories.id, id));
  if (!s) return null;
  await db.delete(comments).where(eq(comments.page, `story:${s.slug}`));
  await db.delete(stories).where(eq(stories.id, id));
  return s.slug;
}
