import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationsFor } from "../db/migrations";
import { comments } from "../db/schema";
import { postTypes, setFlair } from "../db/comments";
import { flairFor, postFlair } from "../lib/thread/feed";
import { questionsOf } from "../lib/thread/questions";
import type { getDb } from "../db/index";

// The admin's "Edit flair" (drizzle/0038, /api/funtimes/flair) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
const TARIQ = "would love a smaller travel size of this, 100 ml is a lot to carry around. red bean and peptides combo sounds interesting for the price";
const WHEN_0038 = (JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string; when: number }[] })
  .entries.find(e => e.tag === "0038_comment_flair_none")!.when;

async function setup(with0038 = true) {
  const engine = new PGlite();
  for (const m of migrationsFor("padelrecs")) if (with0038 || m.folderMillis !== WHEN_0038) await engine.exec(m.sql.join("\n"));
  const db = drizzle(engine) as unknown as Database;
  await db.insert(comments).values([
    { id: "t1", page: "racket:r1", parentId: null, alias: "Tariq", body: TARIQ },
    { id: "q1", page: "racket:r1", parentId: null, alias: "Leo", body: "Anyone tried it with an overgrip?" },
    { id: "re1", page: "racket:r1", parentId: "q1", alias: "Marta", body: "Yes, two of them." },
  ].map(c => ({ ...c, status: "approved", voter: "v", network: "n", createdAt: "2026-11-22T10:00:00Z" })) as never);
  return { engine, db };
}

test("the owner's example: the words guess says Question, an admin's none beats it", () => {
  assert.equal(postFlair(TARIQ), "question"); // starts with "would": the guess the owner saw
  assert.equal(flairFor(undefined, TARIQ), "question");
  assert.equal(flairFor("none", TARIQ), null);
  assert.equal(flairFor("tip", TARIQ), "tip");
  assert.equal(flairFor("question", "Two overgrips helped."), "question");
  assert.equal(flairFor(undefined, "Two overgrips helped."), null);
});

test("setFlair saves Question, Tip, none and back to auto on a top-level post; replies are refused", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await setFlair(db, "t1", "none"), true);
    assert.equal(await setFlair(db, "q1", "tip"), true);
    assert.deepEqual([...(await postTypes(db, ["t1", "q1", "re1"]))].sort(), [["q1", "tip"], ["t1", "none"]]);
    assert.equal(await setFlair(db, "re1", "question"), false, "replies carry no flair");
    assert.equal(await setFlair(db, "missing", "tip"), false);
    assert.equal(await setFlair(db, "q1", null), true);
    assert.deepEqual([...(await postTypes(db, ["q1"]))], [], "auto: no saved type, the words decide again");
    await assert.rejects(engine.exec(`update "padelrecs"."comments" set "post_type" = 'review' where id = 't1'`), /comment_post_type/);
  } finally { await engine.close(); }
});

test("/questions and the home's latest questions drop a post the admin set to none", async () => {
  const { engine, db } = await setup();
  try {
    await setFlair(db, "t1", "none");
    const types = await postTypes(db, ["t1", "q1"]);
    const list = (await db.select().from(comments)).map(c => ({ id: c.id, page: c.page, parentId: c.parentId, alias: c.alias, body: c.body, at: c.createdAt, score: 1, type: types.get(c.id) }));
    const rackets = new Map([["r1", { id: "r1", name: "Metalbone", href: "/r1", pic: null }]]);
    assert.deepEqual(questionsOf(list, rackets).map(q => q.id), ["q1"]);
  } finally { await engine.close(); }
});

test("a site without 0038: Question and Tip save, none is refused by the old check (the route says so)", async () => {
  const { engine, db } = await setup(false);
  try {
    assert.equal(await setFlair(db, "t1", "tip"), true);
    await assert.rejects(setFlair(db, "t1", "none"), (e: unknown) => /23514|comment_post_type/.test(JSON.stringify(e, Object.getOwnPropertyNames(e)) + String(e) + String((e as { cause?: unknown }).cause)));
  } finally { await engine.close(); }
});

test("0038 only swaps the check; the route and menu use the Edit helpful admin guard", () => {
  const sql = readFileSync("drizzle/0038_comment_flair_none.sql", "utf8");
  assert.match(sql, /CHECK \("post_type" IS NULL OR "post_type" IN \('question', 'tip', 'none'\)\)/);
  assert.doesNotMatch(sql, /UPDATE|DELETE|DROP COLUMN|DROP TABLE/i);
  const route = readFileSync("app/api/funtimes/flair/route.ts", "utf8");
  assert.match(route, /await adminWriteGuard\(request, "application\/json"\)/);
  assert.match(route, /postTypeSite\(niche\.id\)/);
  assert.match(route, /refreshProductPages/);
  const feed = readFileSync("app/thread/live/feed-v7b.tsx", "utf8");
  // Owner items only (t.admin), top-level posts only, and only where post types are saved.
  assert.match(feed, /owner=\{t\.admin && [^]*?TYPED && !c\.parentId \? \[\{ label: "Edit flair"/);
  // Visitors still can't post "none": the public API takes Question or Tip only.
  assert.match(readFileSync("app/api/comments/route.ts", "utf8"), /postType: z\.enum\(\["question", "tip"\]\)/);
});
