import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets } from "../db/schema";
import { addComment, adminComments, commentExtras, commentsByIds, deleteComment, voteComment } from "../db/comments";
import { bulkOrder, commentPageTarget, commentsHref, parseCommentsQuery, COMMENTS_PER_PAGE } from "../lib/admin-comments";
import type { getDb } from "../db/index";

// The admin's Latest comments page (app/funtimes/comments): its address, page links, bulk order, and the reads and the
// delete it adds, on a throwaway database (never the live one).

test("address: defaults to all statuses, page 1; odd values fall back; links leave defaults out", () => {
  assert.deepEqual(parseCommentsQuery({}), { status: "all", q: "", page: 1, racket: "" });
  assert.deepEqual(parseCommentsQuery({ status: "pending", q: "  elbow ", p: "3", racket: "r1" }), { status: "pending", q: "elbow", page: 3, racket: "r1" });
  assert.deepEqual(parseCommentsQuery({ status: "deleted", p: "-2", racket: "a b" }), { status: "all", q: "", page: 1, racket: "" });
  assert.equal(parseCommentsQuery({ p: "999999" }).page, 10_000);
  assert.equal(parseCommentsQuery({ status: ["rejected", "approved"] }).status, "rejected");
  assert.equal(commentsHref({ status: "all", page: 1 }), "/funtimes/comments");
  assert.equal(commentsHref({ status: "approved", q: "soft core", page: 2 }), "/funtimes/comments?status=approved&q=soft+core&p=2");
  assert.equal(COMMENTS_PER_PAGE, 50);
});

test("page links: racket, ranking, guide and story keys resolve to the site's addresses", () => {
  const look = { racket: (id: string) => id === "r1" ? { name: "Metalbone CTRL", href: "/rackets/metalbone-ctrl" } : null,
    guide: (k: string) => k === "elbow" ? "/guide/tennis-elbow" : null, th: (h: string) => `${h}?look=thread` };
  assert.deepEqual(commentPageTarget("racket:r1", look), { kind: "racket", label: "Metalbone CTRL", href: "/rackets/metalbone-ctrl?look=thread" });
  assert.deepEqual(commentPageTarget("racket:gone", look), { kind: "racket", label: "A removed product", href: null });
  assert.equal(commentPageTarget("ranking:best-for-power", look).href, "/rankings/best-for-power?look=thread");
  assert.equal(commentPageTarget("guide:elbow", look).href, "/guide/tennis-elbow?look=thread");
  assert.equal(commentPageTarget("guide:nope", look).href, null);
  assert.deepEqual(commentPageTarget("story:my-first-year", { ...look, th: undefined }), { kind: "story", label: "Story: my first year", href: "/stories/my-first-year" });
  assert.equal(commentPageTarget("weird", look).href, null);
});

test("bulk order: replies first, unknown and repeated ids dropped", () => {
  const rows = [{ id: "a", parentId: null }, { id: "b", parentId: "a" }, { id: "c", parentId: null }];
  assert.deepEqual(bulkOrder(["a", "b", "x", "c", "b"], rows), ["b", "a", "c"]);
  assert.deepEqual(bulkOrder([], rows), []);
});

type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values({ id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-19T00:00:00Z" } as never);
  return { engine, db };
}

test("list extras, paging, and delete with replies", async () => {
  const { engine, db } = await setup();
  try {
    const base = { page: "racket:r1", voter: "dev-a", network: "net-1" }, t = (m: number) => new Date(Date.UTC(2026, 10, 24, 10, m));
    const a = (await addComment(db, { ...base, parentId: null, alias: "Gali", body: "Torn between this and the Genius 18K?" }, t(0))).comment!;
    const r = (await addComment(db, { ...base, parentId: a.id, alias: "Marta", body: "Go CTRL, the sweet spot is huge." }, t(1))).comment!;
    const g = (await addComment(db, { ...base, page: "story:first-year", parentId: null, alias: "Ana", body: "Same here, my first year was rough." }, t(2))).comment!;
    await voteComment(db, a.id, "dev-b", 1); await voteComment(db, a.id, "dev-c", -1); await voteComment(db, a.id, "dev-d", 1);

    // Newest first, with offset paging.
    assert.deepEqual((await adminComments(db, "all", 2)).rows.map(c => c.id), [g.id, r.id]);
    assert.deepEqual((await adminComments(db, "all", 2, { offset: 2 })).rows.map(c => c.id), [a.id]);

    const x = await commentExtras(db, (await adminComments(db, "all", 50)).rows);
    assert.deepEqual(x.get(a.id), { votes: 2, shown: null, replyTo: null, replies: 1 });
    assert.deepEqual(x.get(r.id), { votes: 1, shown: null, replyTo: "Gali", replies: 0 });
    assert.equal((await commentExtras(db, [])).size, 0);
    assert.deepEqual((await commentsByIds(db, [a.id, "nope"])).map(c => c.page), ["racket:r1"]);

    // With replies: the comment and its replies go, with every vote.
    assert.equal(await deleteComment(db, a.id, { withReplies: true }), "deleted");
    assert.deepEqual((await adminComments(db, "all", 50)).rows.map(c => c.id), [g.id]);
    const left = await engine.query<{ n: number }>(`select count(*)::int n from padelrecs.comment_votes where comment_id in ('${a.id}', '${r.id}')`);
    assert.equal(left.rows[0].n, 0);
  } finally { await engine.close(); }
});

test("quick edit: a comment's name and text go to the comments route's edit action; reviews keep review-quick", async () => {
  const { quickEditRequest } = await import("../lib/review-quick");
  const name = quickEditRequest("comment", "c1", "alias", "Marta G.");
  assert.equal(name.url, "/api/funtimes/comments"); assert.equal(name.body.toString(), "action=edit&id=c1&alias=Marta+G.");
  assert.equal(quickEditRequest("comment", "c1", "text", "Soft core").body.toString(), "action=edit&id=c1&body=Soft+core");
  const review = quickEditRequest("review", "r1", "date", "2026-11-01");
  assert.equal(review.url, "/api/funtimes/review-quick"); assert.equal(review.body.toString(), "id=r1&field=date&value=2026-11-01");
});
