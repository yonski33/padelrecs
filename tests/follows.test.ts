import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets, reviews, comments, stories, followSent } from "../db/schema";
import { claimAccount, recordPost, deleteAccount } from "../db/accounts";
import { follow, unfollow, unfollowAll, isFollowing, followList, digestFor, markSent, pruneSent, setDigestEmails, digestEmails } from "../db/follows";
import { digestMail, followToken, checkFollowToken, unfollowUrl } from "../lib/thread/follow-digest";
import { followSite } from "../lib/thread/sites";
import type { getDb } from "../db/index";

// Following racket pages (drizzle/0034) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values([
    { id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-01T00:00:00Z" },
    { id: "r2", brandId: "b1", name: "Adipower Light", slug: "adipower-light", year: 2026, createdAt: "2026-11-01T00:00:00Z" },
  ] as never);
  return { engine, db };
}
const rv = (id: string, racketId: string, at: string, status = "approved", alias = "Marta") =>
  ({ id, racketId, rating: 4, reviewText: "Solid control from the back, a bit stiff on cold days.", alias, status, tags: [], createdAt: at });
const cm = (id: string, racketId: string, at: string, status = "approved", alias = "Leo", parentId: string | null = null) =>
  ({ id, page: `racket:${racketId}`, parentId, alias, body: "Anyone tried it with an overgrip? Feels thin to me.", status, voter: "v", network: "n", createdAt: at });

test("follow site flag: padel only", () => {
  assert.equal(followSite("padel"), true);
  assert.equal(followSite("pickleball"), false);
});

test("follow and unfollow: one click each, list newest first, unknown racket refused", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await follow(db, "u1", "r1", new Date("2026-11-20T10:00:00Z")), "ok");
    assert.equal(await follow(db, "u1", "r1"), "ok", "following twice is fine");
    assert.equal(await follow(db, "u1", "r2", new Date("2026-11-21T10:00:00Z")), "ok");
    assert.equal(await follow(db, "u1", "nope"), "missing");
    assert.deepEqual((await followList(db, "u1")).map(r => r.name), ["Adipower Light", "Metalbone CTRL"]);
    assert.equal(await isFollowing(db, "u1", "r1"), true);
    await unfollow(db, "u1", "r1");
    assert.equal(await isFollowing(db, "u1", "r1"), false);
    await unfollowAll(db, "u1");
    assert.equal((await followList(db, "u1")).length, 0);
    assert.equal(await digestEmails(db, "u1"), true);
    await setDigestEmails(db, "u1", false);
    assert.equal(await digestEmails(db, "u1"), false);
  } finally { await engine.close(); }
});

test("digest: approved, new since following, never own, never twice, late approvals still go out once", async () => {
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Gali" }); await claimAccount(db, { id: "u2", name: "Marta" });
    await follow(db, "u1", "r1", new Date("2026-11-20T08:00:00Z"));
    await follow(db, "u1", "r2", new Date("2026-11-20T08:00:00Z"));
    await db.insert(reviews).values([
      rv("old", "r1", "2026-11-19T09:00:00Z"),                       // before following: left out
      rv("new", "r1", "2026-11-20T12:00:00Z"),                       // in
      rv("pend", "r1", "2026-11-20T13:00:00Z", "pending"),           // waiting for a check: left out
      rv("mine", "r1", "2026-11-20T14:00:00Z", "approved", "Gali"),  // their own: left out
    ] as never);
    await recordPost(db, "review", "mine", "u1");
    await db.insert(comments).values([cm("c1", "r1", "2026-11-20T15:00:00Z"), cm("c2", "r1", "2026-11-20T16:00:00Z", "approved", "Leo", "c1"), cm("c3", "r1", "2026-11-20T16:30:00Z", "rejected")] as never);
    await db.insert(stories).values({ id: "s1", slug: "first-year", accountId: "u2", title: "My first year", body: "Ten things I learned, mostly about the wall. ".repeat(12), rackets: ["r1", "r2"], status: "approved", network: "n", createdAt: "2026-11-20T17:00:00Z", updatedAt: "2026-11-20T17:00:00Z" } as never);
    const now = new Date("2026-11-21T07:00:00Z");
    let due = await digestFor(db, now);
    assert.equal(due.length, 1);
    const [d] = due;
    assert.deepEqual(d.rackets.map(r => [r.name, r.items.map(i => `${i.kind}:${i.id}`)]),
      [["Adipower Light", ["story:s1"]], ["Metalbone CTRL", ["review:new", "comment:c1", "comment:c2"]]], "the story tags both rackets but shows once");
    assert.equal(d.rackets[1].items.find(i => i.id === "c2")?.reply, true);
    await markSent(db, d, now);
    // The next day: nothing new, no email. Then a review written before the last email gets approved: it goes out once.
    assert.equal((await digestFor(db, new Date("2026-11-22T07:00:00Z"))).length, 0);
    await db.update(reviews).set({ status: "approved" }).where((await import("drizzle-orm")).eq(reviews.id, "pend"));
    due = await digestFor(db, new Date("2026-11-22T07:00:00Z"));
    assert.deepEqual(due[0].rackets.map(r => r.items.map(i => i.id)), [["pend"]]);
    // Paused emails: nothing.
    await setDigestEmails(db, "u1", false);
    assert.equal((await digestFor(db, new Date("2026-11-22T07:00:00Z"))).length, 0);
    // History is pruned after 30 days; deleting the account removes follows and settings.
    await pruneSent(db, new Date("2026-12-30T00:00:00Z"));
    assert.equal((await db.select().from(followSent)).length, 0);
    await deleteAccount(db, "u1", { keepAuthUser: true });
    assert.equal((await followList(db, "u1")).length, 0);
  } finally { await engine.close(); }
});

test("digest email: subject, links, per-racket and all unfollow, one-click headers, house style", () => {
  const d = { userId: "u-1", rackets: [{ id: "r1", name: "Metalbone CTRL", slug: "metalbone-ctrl", shape: null, items: [
    { kind: "review" as const, id: "a", author: "Marta", text: "Solid control from the back.", at: "2026-11-20T12:00:00Z", rating: 4 },
    { kind: "comment" as const, id: "b", author: "Leo", text: "Anyone tried it with an overgrip?", at: "2026-11-20T15:00:00Z" },
  ] }] };
  const site = { name: "PadelRecs", origin: "https://www.padelrecs.com", productHref: (r: { slug: string }) => `/rackets/${r.slug}` };
  const m = digestMail(d, "p@example.com", site, "no-reply@padelrecs.com");
  assert.equal(m.subject, "New on the Metalbone CTRL");
  assert.equal(m.from, "PadelRecs <no-reply@padelrecs.com>");
  assert.ok(m.text.includes("https://www.padelrecs.com/rackets/metalbone-ctrl#reviews"));
  assert.ok(m.text.includes(unfollowUrl(site.origin, "u-1", "r1")) && m.text.includes(unfollowUrl(site.origin, "u-1", "all")));
  assert.ok(m.text.includes("1 new review, 1 new post"));
  assert.equal(m.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.ok(m.headers["List-Unsubscribe"].includes("/api/account/follows/unfollow?u=u-1&r=all&t="));
  assert.ok(!/—|\bwe\b|\bus\b/i.test(m.text + m.html), "no em dashes, no we/us");
  assert.equal(digestMail({ ...d, rackets: [d.rackets[0], { ...d.rackets[0], id: "r2", name: "Adipower Light" }] }, "p@example.com", site, "x@y.z").subject, "New on 2 rackets you follow");
  assert.equal(checkFollowToken("u-1", "r1", followToken("u-1", "r1")), true);
  assert.equal(checkFollowToken("u-1", "r2", followToken("u-1", "r1")), false);
  assert.equal(checkFollowToken("u-1", "r1", ""), false);
});
