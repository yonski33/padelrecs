import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets, reviews } from "../db/schema";
import { claimAccount, getAccount, recordPost, setAccountStatus, adminAccounts } from "../db/accounts";
import { addComment } from "../db/comments";
import { isTrusted, ownerSetStatus, ownerDeleted, setTrust } from "../db/trust";
import type { getDb } from "../db/index";

// Trusted members (drizzle/0030) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values({ id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-19T00:00:00Z" } as never);
  await claimAccount(db, { id: "u1", name: "Gali" });
  return { engine, db, me: async () => (await getAccount(db, "u1"))! };
}
const review = (id: string, status: string) => ({ id, racketId: "r1", rating: 5, reviewText: "Plays really well from the left side.", alias: "Gali", status, tags: [], createdAt: "2026-11-20T10:00:00Z" });

test("trust: earned when the owner approves a post, lost when a live one is hidden or deleted, by hand either way", async () => {
  const { engine, db, me } = await setup();
  try {
    assert.equal(await isTrusted(db, await me()), false, "a new member waits in the queue");
    // An approved review earns it even before 0030 knew (trust null + approved review).
    await db.insert(reviews).values(review("rv1", "approved") as never); await recordPost(db, "review", "rv1", "u1");
    assert.equal(await isTrusted(db, await me()), true);
    // The owner hides that live review: trust goes and stays gone.
    assert.equal(await ownerSetStatus(db, "review", "rv1", "approved", "rejected"), "off");
    assert.equal(await isTrusted(db, await me()), false);
    await db.insert(reviews).values(review("rv2", "pending") as never); await recordPost(db, "review", "rv2", "u1");
    assert.equal(await ownerSetStatus(db, "review", "rv2", "pending", "approved"), null, "a removal outweighs a later approval");
    assert.equal(await isTrusted(db, await me()), false);
    // By hand.
    assert.equal(await setTrust(db, "u1", "on"), true);
    assert.equal(await isTrusted(db, await me()), true);
    // Approving a comment earns trust for a member who had none decided.
    await setTrust(db, "u1", "off"); await db.execute("update padelrecs.accounts set trust = null" as never);
    await db.delete(reviews);
    const c = await addComment(db, { page: "racket:r1", parentId: null, alias: "Gali", body: "Agreed", voter: "d", network: "n" });
    const cid = c.status === "limited" || c.status === "invalid" ? "" : c.comment.id;
    await recordPost(db, "comment", cid, "u1");
    assert.equal(await ownerSetStatus(db, "comment", cid, "pending", "approved"), "earned");
    assert.equal(await isTrusted(db, await me()), true);
    assert.equal((await adminAccounts(db)).rows[0].trusted, true);
    // Deleting any member post takes trust away; blocked members are never trusted.
    assert.equal(await ownerDeleted(db, "comment", cid), "off");
    assert.equal(await isTrusted(db, await me()), false);
    await setTrust(db, "u1", "on"); await setAccountStatus(db, "u1", "blocked");
    assert.equal(await isTrusted(db, await me()), false);
    assert.equal((await adminAccounts(db)).rows[0].trusted, false);
    // A guest's post (no account) changes nothing.
    assert.equal(await ownerSetStatus(db, "review", "nobody", "pending", "approved"), null);
  } finally { await engine.close(); }
});
