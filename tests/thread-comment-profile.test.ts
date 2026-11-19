import { test } from "node:test";
import assert from "node:assert/strict";
import { listComments, addComment } from "../db/comments";

// Comment level and side (owner 2026-11-19, drizzle/0028): until the migration runs, comments list and post as before.
const missing = Object.assign(new Error('column "player_level" does not exist'), { code: "42703" });
/** A stand-in db: every query chain resolves to `rows`, except one that names the new columns while they don't exist. */
function fakeDb(hasColumns: boolean, rows: Record<string, unknown>[]) {
  const inserts: Record<string, unknown>[] = [];
  const chain = (result: () => Promise<unknown>) => { const c: Record<string, unknown> = {};
    for (const k of ["from", "where", "orderBy", "limit", "groupBy"]) c[k] = () => c;
    c.then = (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => result().then(ok, bad); return c; };
  return { inserts, db: {
    select: (cols?: Record<string, unknown>) => chain(async () => {
      if (cols && "playerLevel" in cols && !hasColumns) throw missing;
      return cols && "n" in cols ? [{ n: 0 }] : cols && "s" in cols ? [] : rows;
    }),
    insert: () => ({ values: async (v: Record<string, unknown>) => { if ("playerLevel" in v && !hasColumns) throw missing; inserts.push(v); } }),
  } };
}
const row = { id: "c1", parentId: null, alias: "Gali A", body: "Is the sweet spot big?", createdAt: "2026-11-19T10:00:00.000Z" };

test("before the migration: comments list with no level or side", async () => {
  const { db } = fakeDb(false, [row]);
  const [c] = await listComments(db as never, "racket:x", null);
  assert.equal(c.alias, "Gali A"); assert.equal(c.level, null); assert.equal(c.side, null);
});
test("after it: level and side come back", async () => {
  const { db } = fakeDb(true, [{ ...row, playerLevel: "Intermediate", playingSide: "Left" }]);
  const [c] = await listComments(db as never, "racket:x", null);
  assert.equal(c.level, "Intermediate"); assert.equal(c.side, "Left");
});
test("posting works either way; the columns are written only when they exist", async () => {
  const before = fakeDb(false, []), after = fakeDb(true, []);
  const c = { page: "racket:x", parentId: null, alias: "", level: "Beginner", side: "Right", body: "Great for a first racket, very easy to play.", voter: "v", network: "n" };
  assert.notEqual((await addComment(before.db as never, c)).status, "limited");
  assert.ok(!("playerLevel" in before.inserts[0]));
  await addComment(after.db as never, c);
  assert.equal(after.inserts[0].playerLevel, "Beginner"); assert.equal(after.inserts[0].playingSide, "Right");
});
