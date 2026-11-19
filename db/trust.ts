// Trusted members (PadelRecs accounts, drizzle/0030). A member whose review or comment the owner has approved posts straight
// to the page (after the usual spam checks); guests and new members still go through the queue. The owner hiding or
// deleting a member's live post takes the trust away; the admin Accounts tab can trust or untrust by hand.
//   accounts.trust: "earned" (the owner approved one), "on" / "off" (by hand), null (trusted once a review is approved).
import { and, count, eq, inArray } from "drizzle-orm";
import type { getDb } from "./index";
import { accounts, accountPosts, reviews, comments } from "./schema";
import type { Account, PostKind } from "./accounts";

type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, "select">;

/** Whether this account's posts skip the pending queue. A blocked account never does. */
export async function isTrusted(db: Reader, a: Pick<Account, "id" | "status" | "trust">) {
  if (a.status !== "active" || a.trust === "off") return false;
  if (a.trust === "on" || a.trust === "earned") return true;
  return (await approvedReviews(db, [a.id])).has(a.id);
}
/** Accounts with at least one approved review (the owner's queue, or its auto-review run, approved it). */
export async function approvedReviews(db: Reader, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const rows = await db.select({ id: accountPosts.accountId, n: count() }).from(accountPosts).innerJoin(reviews, eq(reviews.id, accountPosts.postId))
    .where(and(eq(accountPosts.kind, "review"), inArray(accountPosts.accountId, ids), eq(reviews.status, "approved"))).groupBy(accountPosts.accountId);
  return new Set(rows.filter(r => Number(r.n) > 0).map(r => r.id));
}

async function ownerOf(db: Reader, kind: PostKind, id: string) {
  const [p] = await db.select({ id: accounts.id, trust: accounts.trust }).from(accountPosts).innerJoin(accounts, eq(accounts.id, accountPosts.accountId))
    .where(and(eq(accountPosts.kind, kind), eq(accountPosts.postId, id)));
  return p ?? null;
}
/** The live status of a post, before the owner changes it. */
export async function postStatus(db: Reader, kind: PostKind, id: string) {
  const [r] = kind === "review" ? await db.select({ s: reviews.status }).from(reviews).where(eq(reviews.id, id)) : await db.select({ s: comments.status }).from(comments).where(eq(comments.id, id));
  return r?.s ?? null;
}

/** The owner changed a post's status (admin queue, page tools). Approving a member's post earns trust (unless it was set by
 *  hand); hiding or rejecting one that was live takes it away. Returns the new trust, or null when nothing changed. */
export async function ownerSetStatus(db: Database, kind: PostKind, id: string, before: string | null, after: string) {
  const owner = await ownerOf(db, kind, id); if (!owner) return null;
  const next = after === "approved" && before !== "approved" ? (owner.trust === null ? "earned" as const : null)
    : before === "approved" && after !== "approved" ? "off" as const : null;
  if (!next || next === owner.trust) return null;
  await db.update(accounts).set({ trust: next, updatedAt: new Date().toISOString() }).where(eq(accounts.id, owner.id));
  return next;
}
/** The owner deleted a member's post: trust goes, whatever it was. Call before the delete (the link row may go with it). */
export async function ownerDeleted(db: Database, kind: PostKind, id: string) {
  const owner = await ownerOf(db, kind, id); if (!owner || owner.trust === "off") return null;
  await db.update(accounts).set({ trust: "off", updatedAt: new Date().toISOString() }).where(eq(accounts.id, owner.id));
  return "off" as const;
}
/** Trust or untrust by hand (admin Accounts tab). */
export async function setTrust(db: Database, id: string, trust: "on" | "off") {
  return (await db.update(accounts).set({ trust, updatedAt: new Date().toISOString() }).where(eq(accounts.id, id)).returning({ id: accounts.id })).length > 0;
}
