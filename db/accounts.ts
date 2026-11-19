// Optional player accounts (drizzle/0028, PadelRecs Thread). An account is a Supabase Auth user (email magic link) with a
// reserved name; guests still post with a typed name, but not a reserved one. Posts are tied to an account in account_posts
// (the small member mark). Earlier guest posts are linked when the account signs in on the device that wrote them and the
// post's name is the account's name (both, so a shared family device never hands one person's posts to another).
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { accounts, accountPosts, accountDevices, reviewDevices, comments, reviews, productVotes } from "./schema";
import { nameKey, accountNameProblem } from "../lib/thread/account-name";
import { deleteComment } from "./comments";
import { deleteRejectedReviews } from "./review-editing";
import { profileValues } from "../lib/review-options";

type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, "select">;
export type Account = typeof accounts.$inferSelect;
export type PostKind = "review" | "comment";
/** An old review counts as this device's when the device's quick vote on the same racket is this close in time (the Thread
 *  composer sends the vote and the review together). */
export const VOTE_WINDOW_MS = 30 * 60_000;
/** Level and side: the review form's own values (niche.profile: "Intermediate", "Left"), anything else is "not given". */
const pick = (field: "playerLevel" | "playingSide") => (v: unknown) => typeof v === "string" ? profileValues(field).find(x => x.toLowerCase() === v.trim().toLowerCase()) ?? null : null;
export const cleanLevel = pick("playerLevel"), cleanSide = pick("playingSide");

export async function getAccount(db: Reader, id: string) {
  const [a] = await db.select().from(accounts).where(eq(accounts.id, id));
  return a ?? null;
}
/** The account that reserved this name (any case, spacing or accents), or null. */
export async function nameOwner(db: Reader, name: string) {
  const key = nameKey(name); if (!key) return null;
  const [a] = await db.select({ id: accounts.id, status: accounts.status }).from(accounts).where(eq(accounts.nameKey, key));
  return a ?? null;
}

/** Reserve a name for a signed-in user. One account per user, one account per name. */
export async function claimAccount(db: Database, c: { id: string; name: string; level?: string | null; side?: string | null }, now = new Date()) {
  if (accountNameProblem(c.name)) return "invalid" as const;
  if (await getAccount(db, c.id)) return "exists" as const;
  if (await nameOwner(db, c.name)) return "taken" as const;
  const at = now.toISOString();
  const done = await db.insert(accounts).values({ id: c.id, name: c.name.trim(), nameKey: nameKey(c.name), level: cleanLevel(c.level), side: cleanSide(c.side), status: "active", createdAt: at, updatedAt: at })
    .onConflictDoNothing().returning({ id: accounts.id });
  return done.length ? "ok" as const : "taken" as const;
}

/** Change the name, level or side. A new name shows on every post the account owns (their alias is rewritten). */
export async function updateAccount(db: Database, id: string, change: { name?: string | null; level?: string | null; side?: string | null }, now = new Date()) {
  const a = await getAccount(db, id); if (!a) return "missing" as const;
  const set: Partial<Account> = { updatedAt: now.toISOString() };
  if (change.level !== undefined) set.level = cleanLevel(change.level);
  if (change.side !== undefined) set.side = cleanSide(change.side);
  const name = change.name?.trim();
  if (name && name !== a.name) {
    if (accountNameProblem(name)) return "invalid" as const;
    const owner = await nameOwner(db, name);
    if (owner && owner.id !== id) return "taken" as const;
    set.name = name; set.nameKey = nameKey(name);
  }
  try { await db.update(accounts).set(set).where(eq(accounts.id, id)); } catch { return "taken" as const; } // unique key race
  if (set.name) await renamePosts(db, id, set.name);
  return "ok" as const;
}
async function renamePosts(db: Database, id: string, name: string) {
  const owned = await db.select({ kind: accountPosts.kind, id: accountPosts.postId }).from(accountPosts).where(eq(accountPosts.accountId, id));
  const ids = (k: PostKind) => owned.filter(p => p.kind === k).map(p => p.id);
  for (let i = 0; i < ids("comment").length; i += 500) await db.update(comments).set({ alias: name }).where(and(inArray(comments.id, ids("comment").slice(i, i + 500)), sql`${comments.alias} <> '[removed]'`));
  for (let i = 0; i < ids("review").length; i += 500) await db.update(reviews).set({ alias: name }).where(inArray(reviews.id, ids("review").slice(i, i + 500)));
}

export async function recordPost(db: Pick<Database, "insert">, kind: PostKind, postId: string, accountId: string, now = new Date()) {
  await db.insert(accountPosts).values({ kind, postId, accountId, createdAt: now.toISOString() }).onConflictDoNothing();
}
/** A guest review's device, so a later sign-in on it can claim the review. */
export async function recordReviewDevice(db: Pick<Database, "insert">, reviewId: string, voter: string) {
  await db.insert(reviewDevices).values({ reviewId, voter }).onConflictDoNothing();
}

/** Link this device's earlier guest posts under the account's name. Runs once per device per account. */
export async function linkDevice(db: Database, account: Pick<Account, "id" | "nameKey">, voter: string, now = new Date()) {
  const done = await db.insert(accountDevices).values({ accountId: account.id, voter, linkedAt: now.toISOString() }).onConflictDoNothing().returning({ v: accountDevices.voter });
  if (!done.length) return 0;
  return linkPosts(db, account, voter, now);
}
/** Posts from `voter` whose name is the account's name and that no account owns yet. Exported for tests. */
export async function linkPosts(db: Database, account: Pick<Account, "id" | "nameKey">, voter: string, now = new Date()) {
  const mine = (alias: string | null) => !!alias && nameKey(alias) === account.nameKey;
  const cm = (await db.select({ id: comments.id, alias: comments.alias }).from(comments).where(eq(comments.voter, voter))).filter(c => mine(c.alias)).map(c => c.id);
  // Reviews: the device recorded with the review (since 0028), else the device's quick vote on the same racket near the time.
  const tagged = await db.select({ id: reviews.id, alias: reviews.alias }).from(reviewDevices).innerJoin(reviews, eq(reviews.id, reviewDevices.reviewId)).where(eq(reviewDevices.voter, voter));
  const votes = await db.select({ racketId: productVotes.racketId, at: productVotes.createdAt, up: productVotes.updatedAt }).from(productVotes).where(eq(productVotes.voter, voter));
  const near = votes.length ? (await db.select({ id: reviews.id, alias: reviews.alias, racketId: reviews.racketId, at: reviews.createdAt }).from(reviews).where(inArray(reviews.racketId, [...new Set(votes.map(v => v.racketId))])))
    .filter(r => votes.some(v => v.racketId === r.racketId && [v.at, v.up].some(t => Math.abs(Date.parse(t) - Date.parse(r.at)) <= VOTE_WINDOW_MS))) : [];
  const rv = [...new Set([...tagged, ...near].filter(r => mine(r.alias)).map(r => r.id))];
  const rows = [...cm.map(id => ({ kind: "comment" as const, postId: id })), ...rv.map(id => ({ kind: "review" as const, postId: id }))];
  if (!rows.length) return 0;
  const at = now.toISOString();
  const linked = await db.insert(accountPosts).values(rows.map(r => ({ ...r, accountId: account.id, createdAt: at }))).onConflictDoNothing().returning({ id: accountPosts.postId });
  return linked.length;
}

/** Which of these posts belong to an active account (the member mark). */
export async function memberPosts(db: Reader, kind: PostKind, ids: string[]) {
  return new Set((await memberProfiles(db, kind, ids)).keys());
}
export type MemberProfile = { level: string | null; side: string | null };
/** The same, with the account's level and side, read live, so a change on /account shows on every post at once. */
export async function memberProfiles(db: Reader, kind: PostKind, ids: string[]) {
  const out = new Map<string, MemberProfile>();
  for (let i = 0; i < ids.length; i += 500) {
    const rows = await db.select({ id: accountPosts.postId, level: accounts.level, side: accounts.side }).from(accountPosts).innerJoin(accounts, eq(accounts.id, accountPosts.accountId))
      .where(and(eq(accountPosts.kind, kind), inArray(accountPosts.postId, ids.slice(i, i + 500)), eq(accounts.status, "active")));
    rows.forEach(r => out.set(r.id, { level: r.level, side: r.side }));
  }
  return out;
}

export async function setAccountStatus(db: Database, id: string, status: Account["status"], now = new Date()) {
  return (await db.update(accounts).set({ status, updatedAt: now.toISOString() }).where(eq(accounts.id, id)).returning({ id: accounts.id })).length > 0;
}

/** Delete an account: the name is free again, the posts stay under their name without the mark (or go too, with
 *  `removePosts`), and the sign-in (Supabase Auth user, with the email) is removed. Never an admin's sign-in. */
export async function deleteAccount(db: Database, id: string, o: { removePosts?: boolean; keepAuthUser?: boolean } = {}) {
  const a = await getAccount(db, id); if (!a) return { result: "missing" as const, authRemoved: false };
  if (o.removePosts) {
    const owned = await db.select({ kind: accountPosts.kind, id: accountPosts.postId }).from(accountPosts).where(eq(accountPosts.accountId, id));
    for (const c of owned.filter(p => p.kind === "comment")) await deleteComment(db, c.id);
    const rv = owned.filter(p => p.kind === "review").map(p => p.id);
    for (let i = 0; i < rv.length; i += 500) await db.update(reviews).set({ status: "rejected" }).where(inArray(reviews.id, rv.slice(i, i + 500)));
    if (rv.length) await deleteRejectedReviews(db, rv);
  }
  await db.delete(accounts).where(eq(accounts.id, id)); // account_posts and account_devices go with it (cascade)
  return { result: "deleted" as const, authRemoved: o.keepAuthUser ? false : await deleteAuthUser(db, id) };
}
/** Remove a Supabase Auth user (the email and sign-in). Callers make sure it is never an admin. */
export async function deleteAuthUser(db: Pick<Database, "execute">, id: string) {
  try { await db.execute(sql`delete from auth.users where id = ${id}::uuid`); return true; }
  catch (error) { console.error("Account sign-in delete failed (remove it in Supabase Auth)", id, error); return false; }
}

export type AdminAccount = Account & { email: string | null; reviews: number; comments: number };
/** The admin's account list (/funtimes?tab=accounts), newest first; `q` matches the name. Emails come from Supabase Auth. */
export async function adminAccounts(db: Database, q: string | null = null, limit = 100): Promise<{ rows: AdminAccount[]; total: number }> {
  const w = (q ?? "").trim(), esc = w.replace(/[%_\\]/g, m => `\\${m}`);
  const where = w ? or(ilike(accounts.name, `%${esc}%`), eq(accounts.nameKey, nameKey(w))) : undefined;
  const [rows, [t]] = await Promise.all([db.select().from(accounts).where(where).orderBy(desc(accounts.createdAt)).limit(limit), db.select({ n: count() }).from(accounts)]);
  if (!rows.length) return { rows: [], total: Number(t.n) };
  const ids = rows.map(r => r.id);
  const posts = await db.select({ id: accountPosts.accountId, kind: accountPosts.kind, n: count() }).from(accountPosts).where(inArray(accountPosts.accountId, ids)).groupBy(accountPosts.accountId, accountPosts.kind);
  let emails = new Map<string, string>();
  try {
    const r = await db.execute(sql`select id::text as id, email from auth.users where id::text in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
    emails = new Map((r.rows as { id: string; email: string | null }[]).map(x => [x.id, x.email ?? ""]));
  } catch { /* no auth schema (tests) or no access: emails stay hidden */ }
  const n = (id: string, k: PostKind) => Number(posts.find(p => p.id === id && p.kind === k)?.n ?? 0);
  return { rows: rows.map(r => ({ ...r, email: emails.get(r.id) || null, reviews: n(r.id, "review"), comments: n(r.id, "comment") })), total: Number(t.n) };
}
