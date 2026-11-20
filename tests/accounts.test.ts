import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets, reviews, productVotes, comments } from "../db/schema";
import { memberProfiles, claimAccount, updateAccount, nameOwner, linkDevice, linkPosts, memberPosts, recordPost, recordReviewDevice, setAccountStatus, deleteAccount, adminAccounts, getAccount } from "../db/accounts";
import { addComment } from "../db/comments";
import { ownPosts, editOwnPost, deleteOwnPost, EDIT_WINDOW_MS } from "../db/account-posts";
import { nameKey, accountNameProblem } from "../lib/thread/account-name";
import { profileLine } from "../lib/thread/display-name";
import type { getDb } from "../db/index";

// Optional player accounts (drizzle/0028) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values({ id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-19T00:00:00Z" } as never);
  return { engine, db };
}
const review = (id: string, alias: string, at: string) => ({ id, racketId: "r1", rating: 5, reviewText: "Plays really well from the left side.", alias, status: "approved" as const, tags: [], createdAt: at });

test("names: one key for case, spaces, accents; staff and random names refused", () => {
  assert.equal(nameKey("Padel Pete"), nameKey("padel.pete"));
  assert.equal(nameKey("PádelPete"), "padelpete");
  assert.equal(accountNameProblem("Gali"), null);
  assert.match(accountNameProblem("Admin") ?? "", /kept for the site/);
  assert.match(accountNameProblem("PadelRecs 2") ?? "", /kept for the site/);
  assert.match(accountNameProblem("x") ?? "", /at least 2/);
  assert.match(accountNameProblem("DkJhGfRtYqWz") ?? "", /random/);
  assert.match(accountNameProblem("see www.spam.com/x") ?? "", /link|24/);
});

test("claim: one name per account, unique across spellings; rename rewrites the posts", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await claimAccount(db, { id: "u1", name: "Padel Pete", level: "intermediate", side: "LEFT" }), "ok");
    const a = await getAccount(db, "u1");
    assert.equal(a?.level, "Intermediate"); assert.equal(a?.side, "Left");
    assert.equal(await claimAccount(db, { id: "u2", name: "padelpete" }), "taken");
    assert.equal(await claimAccount(db, { id: "u1", name: "Other" }), "exists");
    assert.equal((await nameOwner(db, "PADEL-PETE"))?.id, "u1");
    assert.equal(await nameOwner(db, "Someone"), null);
    await db.insert(reviews).values(review("rv1", "Padel Pete", "2026-11-19T10:00:00Z") as never);
    await recordPost(db, "review", "rv1", "u1");
    const c = await addComment(db, { page: "racket:r1", parentId: null, alias: "Padel Pete", body: "Does it suit the left side well?", voter: "dev-a", network: "n" });
    await recordPost(db, "comment", c.status === "limited" || c.status === "invalid" ? "" : c.comment.id, "u1");
    assert.equal(await claimAccount(db, { id: "u2", name: "Gali" }), "ok");
    assert.equal(await updateAccount(db, "u1", { name: "gali" }), "taken");
    assert.equal(await updateAccount(db, "u1", { name: "Pete the Wall" }), "ok");
    assert.equal((await db.select().from(reviews))[0].alias, "Pete the Wall");
    assert.equal((await db.select().from(comments))[0].alias, "Pete the Wall");
    assert.equal(await nameOwner(db, "Padel Pete"), null, "the old name is free again");
  } finally { await engine.close(); }
});

test("linking: only this device's posts under the account's name, once per device", async () => {
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Gali" });
    const a = (await getAccount(db, "u1"))!;
    // Comments keep their device. A different name or device is never linked.
    await addComment(db, { page: "racket:r1", parentId: null, alias: "gali", body: "Great racket for the left side.", voter: "dev-a", network: "n" });
    await addComment(db, { page: "racket:r1", parentId: null, alias: "Dad", body: "Too stiff for my elbow though.", voter: "dev-a", network: "n" });
    await addComment(db, { page: "racket:r1", parentId: null, alias: "Gali", body: "Someone else entirely here.", voter: "dev-b", network: "n" });
    // Reviews: the recorded device (new), or a quick vote on the same racket within 30 minutes (old).
    await db.insert(reviews).values([review("new", "Gali", "2026-11-19T10:00:00Z"), review("old", "Gali", "2026-11-01T10:05:00Z"), review("far", "Gali", "2026-10-01T10:00:00Z")] as never);
    await recordReviewDevice(db, "new", "dev-a");
    await db.insert(productVotes).values({ racketId: "r1", voter: "dev-a", network: "n", rating: 5, createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-01T10:00:00Z" } as never);
    assert.equal(await linkDevice(db, a, "dev-a"), 3);
    assert.equal(await linkDevice(db, a, "dev-a"), 0, "once per device");
    assert.equal(await linkPosts(db, a, "dev-a"), 0, "already linked");
    assert.deepEqual([...await memberPosts(db, "review", ["new", "old", "far"])].sort(), ["new", "old"]);
    await setAccountStatus(db, "u1", "blocked");
    assert.equal((await memberPosts(db, "review", ["new"])).size, 0, "blocked: no mark");
    const list = await adminAccounts(db);
    assert.equal(list.total, 1); assert.equal(list.rows[0].reviews, 2); assert.equal(list.rows[0].comments, 1); assert.equal(list.rows[0].email, null);
  } finally { await engine.close(); }
});

test("delete: frees the name; posts stay without the mark, or go with removePosts", async () => {
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Gali" });
    await db.insert(reviews).values(review("rv1", "Gali", "2026-11-19T10:00:00Z") as never);
    await recordPost(db, "review", "rv1", "u1");
    const r = await deleteAccount(db, "u1", { keepAuthUser: true });
    assert.equal(r.result, "deleted");
    assert.equal(await nameOwner(db, "Gali"), null);
    assert.equal((await db.select().from(reviews)).length, 1);
    assert.equal((await memberPosts(db, "review", ["rv1"])).size, 0);
    await claimAccount(db, { id: "u2", name: "Gali" });
    await recordPost(db, "review", "rv1", "u2");
    await deleteAccount(db, "u2", { removePosts: true, keepAuthUser: true });
    assert.equal((await db.select().from(reviews)).length, 0);
    assert.equal((await deleteAccount(db, "nobody")).result, "missing");
  } finally { await engine.close(); }
});

test("member posts carry the account's level and side, read live", async () => {
  assert.equal(profileLine("Intermediate", "Right"), "Intermediate, right side");
  assert.equal(profileLine(null, "Left"), "Left-side player");
  assert.equal(profileLine(null, null), null);
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Alex padel", level: "Intermediate", side: "Right" });
    const c = await addComment(db, { page: "racket:r1", parentId: null, alias: "Alex padel", body: "Great on the right side so far.", voter: "d", network: "n" });
    const cid = c.status === "limited" || c.status === "invalid" ? "" : c.comment.id;
    await recordPost(db, "comment", cid, "u1");
    assert.deepEqual([...(await memberProfiles(db, "comment", [cid, "other"])).entries()], [[cid, { level: "Intermediate", side: "Right" }]]);
    await updateAccount(db, "u1", { side: "Left" });
    assert.equal((await memberProfiles(db, "comment", [cid])).get(cid)?.side, "Left");
  } finally { await engine.close(); }
});

test("your posts: newest first, edit text for 24 hours (re-moderated), delete any time, only your own", async () => {
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Gali" }); await claimAccount(db, { id: "u2", name: "Marta" });
    const now = Date.parse("2026-11-20T12:00:00Z");
    await db.insert(reviews).values([review("fresh", "Gali", "2026-11-20T10:00:00Z"), review("old", "Gali", "2026-11-18T10:00:00Z")] as never);
    await recordPost(db, "review", "fresh", "u1"); await recordPost(db, "review", "old", "u1");
    const c = await addComment(db, { page: "racket:r1", parentId: null, alias: "Gali", body: "Is it good for the left side?", voter: "d", network: "n" }, new Date("2026-11-20T11:00:00Z"));
    const cid = c.status === "limited" || c.status === "invalid" ? "" : c.comment.id;
    await recordPost(db, "comment", cid, "u1");
    const list = await ownPosts(db, "u1", now);
    assert.deepEqual(list.map(p => p.id), [cid, "fresh", "old"]);
    assert.equal(list[1].racket?.name, "Metalbone CTRL"); assert.equal(list[1].status, "live"); assert.equal(list[0].racket?.name, "Metalbone CTRL");
    assert.deepEqual(list.map(p => p.editable), [true, true, false]);
    // A review edit goes back to the queue; a comment edit with a link waits for a person; old posts are locked.
    assert.deepEqual(await editOwnPost(db, "u1", "review", "fresh", "Changed my mind: a bit stiff for my elbow after two weeks.", now), { result: "ok", status: "pending" });
    assert.equal((await db.select().from(reviews)).find(r => r.id === "fresh")?.reviewText.startsWith("Changed"), true);
    assert.deepEqual(await editOwnPost(db, "u1", "comment", cid, "See https://example.com for the specs", now), { result: "ok", status: "pending" });
    assert.equal((await editOwnPost(db, "u1", "review", "old", "Still a great racket after a month of play.", now)).result, "locked");
    assert.equal((await editOwnPost(db, "u1", "review", "fresh", "short", now)).result, "invalid");
    assert.equal((await editOwnPost(db, "u2", "review", "fresh", "Not my review but trying to edit it anyway.", now)).result, "missing");
    assert.equal(await deleteOwnPost(db, "u2", "review", "old"), "missing");
    assert.equal(await deleteOwnPost(db, "u1", "review", "old"), "deleted");
    assert.equal(await deleteOwnPost(db, "u1", "comment", cid), "deleted");
    assert.deepEqual((await ownPosts(db, "u1", now + EDIT_WINDOW_MS)).map(p => [p.id, p.editable]), [["fresh", false]]);
  } finally { await engine.close(); }
});

test("a new level or side shows on the account's reviews; clearing one leaves them", async () => {
  const { engine, db } = await setup();
  try {
    await claimAccount(db, { id: "u1", name: "Gali", level: "Beginner", side: "Right" });
    await db.insert(reviews).values({ ...review("rv1", "Gali", "2026-11-19T10:00:00Z"), playerLevel: "Beginner", playingSide: "Right" } as never);
    await recordPost(db, "review", "rv1", "u1");
    assert.equal(await updateAccount(db, "u1", { level: "Intermediate", side: "left" }), "ok");
    let r = (await db.select().from(reviews))[0];
    assert.equal(r.playerLevel, "Intermediate"); assert.equal(r.playingSide, "Left");
    assert.equal(await updateAccount(db, "u1", { level: null }), "ok");
    r = (await db.select().from(reviews))[0];
    assert.equal(r.playerLevel, "Intermediate", "clearing the account's level leaves the review");
  } finally { await engine.close(); }
});
