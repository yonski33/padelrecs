// Following a racket page (drizzle/0034, PadelRecs first). A signed-in player follows or unfollows with one click; a daily
// email (app/api/follow-digest) lists what's new on the rackets they follow: approved reviews, approved posts in the page's
// feed (comments on "racket:<id>") and approved stories that tag the racket. Never their own posts, never anything twice
// (follow_sent), never anything from before they followed. No news, no email.
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { racketFollows, followSent, followSettings, rackets, reviews, comments, stories, accounts, accountPosts } from "./schema";

type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, "select">;
/** How far back a digest looks for posts that were approved late (written earlier, approved since the last email). */
export const LOOKBACK_MS = 14 * 24 * 60 * 60_000;
/** follow_sent rows older than this are pruned (anything that old is outside the lookback anyway). */
export const SENT_KEEP_MS = 30 * 24 * 60 * 60_000;

/** Follow a racket. "ok" (also when already following) or "missing" (no such racket). */
export async function follow(db: Database, userId: string, racketId: string, now = new Date()) {
  const [r] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.id, racketId));
  if (!r) return "missing" as const;
  await db.insert(racketFollows).values({ userId, racketId, createdAt: now.toISOString() }).onConflictDoNothing();
  return "ok" as const;
}
export async function unfollow(db: Database, userId: string, racketId: string) {
  await db.delete(racketFollows).where(and(eq(racketFollows.userId, userId), eq(racketFollows.racketId, racketId)));
}
/** Every follow and the user's digest history (the one-click "unfollow all", and account deletion). */
export async function unfollowAll(db: Database, userId: string) {
  await db.delete(racketFollows).where(eq(racketFollows.userId, userId));
  await db.delete(followSent).where(eq(followSent.userId, userId));
}
/** Account deletion: follows, history and the email setting. */
export async function forgetFollower(db: Database, userId: string) {
  await unfollowAll(db, userId);
  await db.delete(followSettings).where(eq(followSettings.userId, userId));
}
export async function isFollowing(db: Reader, userId: string, racketId: string) {
  const [f] = await db.select({ r: racketFollows.racketId }).from(racketFollows).where(and(eq(racketFollows.userId, userId), eq(racketFollows.racketId, racketId)));
  return !!f;
}
/** The member zone's "Following" list, newest first. */
export async function followList(db: Reader, userId: string) {
  return db.select({ id: rackets.id, name: rackets.name, slug: rackets.slug, shape: rackets.shape, since: racketFollows.createdAt })
    .from(racketFollows).innerJoin(rackets, eq(rackets.id, racketFollows.racketId)).where(eq(racketFollows.userId, userId)).orderBy(desc(racketFollows.createdAt));
}
export async function digestEmails(db: Reader, userId: string) {
  const [s] = await db.select({ on: followSettings.emails }).from(followSettings).where(eq(followSettings.userId, userId));
  return s?.on ?? true;
}
export async function setDigestEmails(db: Database, userId: string, on: boolean, now = new Date()) {
  await db.insert(followSettings).values({ userId, emails: on, updatedAt: now.toISOString() })
    .onConflictDoUpdate({ target: followSettings.userId, set: { emails: on, updatedAt: now.toISOString() } });
}

export type DigestItem = { kind: "review" | "comment" | "story"; id: string; author: string; text: string; at: string; rating?: number; title?: string; slug?: string; reply?: boolean };
export type DigestRacket = { id: string; name: string; slug: string; shape: string | null; items: DigestItem[] };
export type DigestUser = { userId: string; rackets: DigestRacket[] };

const excerpt = (s: string, max = 220) => { const t = s.replace(/\s+/g, " ").trim(); return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : t; };

/** What each follower's digest should list right now (users with the emails paused are left out). Pure reads. */
export async function digestFor(db: Reader, now = new Date()): Promise<DigestUser[]> {
  const follows = await db.select({ userId: racketFollows.userId, racketId: racketFollows.racketId, since: racketFollows.createdAt, name: rackets.name, slug: rackets.slug, shape: rackets.shape })
    .from(racketFollows).innerJoin(rackets, eq(rackets.id, racketFollows.racketId));
  if (!follows.length) return [];
  const users = [...new Set(follows.map(f => f.userId))];
  const paused = new Set((await db.select({ u: followSettings.userId }).from(followSettings).where(and(inArray(followSettings.userId, users), eq(followSettings.emails, false)))).map(r => r.u));
  const live = follows.filter(f => !paused.has(f.userId));
  if (!live.length) return [];
  const ids = [...new Set(live.map(f => f.racketId))], from = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const rv = await db.select({ id: reviews.id, racketId: reviews.racketId, alias: reviews.alias, text: reviews.reviewText, rating: reviews.rating, at: reviews.createdAt })
    .from(reviews).where(and(inArray(reviews.racketId, ids), eq(reviews.status, "approved"), sql`${reviews.createdAt} >= ${from}`));
  const cm = await db.select({ id: comments.id, page: comments.page, alias: comments.alias, text: comments.body, parent: comments.parentId, at: comments.createdAt })
    .from(comments).where(and(inArray(comments.page, ids.map(i => `racket:${i}`)), eq(comments.status, "approved"), sql`${comments.createdAt} >= ${from}`));
  const st = await db.select({ id: stories.id, slug: stories.slug, title: stories.title, text: stories.body, rackets: stories.rackets, accountId: stories.accountId, author: accounts.name, at: stories.createdAt })
    .from(stories).innerJoin(accounts, eq(accounts.id, stories.accountId))
    .where(and(eq(stories.status, "approved"), eq(accounts.status, "active"), sql`${stories.createdAt} >= ${from}`, sql`${stories.rackets} ?| array[${sql.join(ids.map(i => sql`${i}`), sql`, `)}]::text[]`));
  const liveUsers = [...new Set(live.map(f => f.userId))];
  const own = new Set((await db.select({ u: accountPosts.accountId, k: accountPosts.kind, p: accountPosts.postId }).from(accountPosts).where(inArray(accountPosts.accountId, liveUsers))).map(r => `${r.u}|${r.k}|${r.p}`));
  const sent = new Set((await db.select({ u: followSent.userId, k: followSent.kind, p: followSent.postId }).from(followSent).where(inArray(followSent.userId, liveUsers))).map(r => `${r.u}|${r.k}|${r.p}`));
  const out = new Map<string, DigestRacket[]>(), storyOnce = new Set<string>();
  for (const f of live.sort((a, b) => a.name.localeCompare(b.name))) {
    const fresh = (kind: DigestItem["kind"], id: string, at: string) => at >= f.since && !own.has(`${f.userId}|${kind}|${id}`) && !sent.has(`${f.userId}|${kind}|${id}`);
    const items: DigestItem[] = [
      ...rv.filter(r => r.racketId === f.racketId && fresh("review", r.id, r.at)).map(r => ({ kind: "review" as const, id: r.id, author: r.alias?.trim() || "A player", text: excerpt(r.text), at: r.at, rating: r.rating })),
      ...cm.filter(c => c.page === `racket:${f.racketId}` && fresh("comment", c.id, c.at)).map(c => ({ kind: "comment" as const, id: c.id, author: c.alias.trim() || "A player", text: excerpt(c.text), at: c.at, reply: !!c.parent })),
      ...st.filter(s => (s.rackets ?? []).includes(f.racketId) && s.accountId !== f.userId && fresh("story", s.id, s.at) && !storyOnce.has(`${f.userId}|${s.id}`) && storyOnce.add(`${f.userId}|${s.id}`)).map(s => ({ kind: "story" as const, id: s.id, author: s.author, text: excerpt(s.text, 160), at: s.at, title: s.title, slug: s.slug })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    if (!items.length) continue;
    out.set(f.userId, [...(out.get(f.userId) ?? []), { id: f.racketId, name: f.name, slug: f.slug, shape: f.shape, items }]);
  }
  return [...out].map(([userId, list]) => ({ userId, rackets: list.sort((a, b) => a.name.localeCompare(b.name)) }));
}

/** After a digest went out: remember what it listed (a story tagging two followed rackets is listed once), move the
 *  follows' last_notified_at, and prune old history. */
export async function markSent(db: Database, d: DigestUser, now = new Date()) {
  const at = now.toISOString();
  const rows = [...new Map(d.rackets.flatMap(r => r.items).map(i => [`${i.kind}|${i.id}`, { userId: d.userId, kind: i.kind, postId: i.id, sentAt: at }])).values()];
  if (rows.length) await db.insert(followSent).values(rows).onConflictDoNothing();
  await db.update(racketFollows).set({ lastNotifiedAt: at }).where(and(eq(racketFollows.userId, d.userId), inArray(racketFollows.racketId, d.rackets.map(r => r.id))));
}
export async function pruneSent(db: Database, now = new Date()) {
  await db.delete(followSent).where(lt(followSent.sentAt, new Date(now.getTime() - SENT_KEEP_MS).toISOString()));
}
