import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { adminEditStory, storyRevisions, revisionsOn } from "../db/story-revisions";
import { storyExtras, storyFeatures } from "../db/story-extras";
import type { getDb } from "../db/index";

// Admin story edits (owner 2026-11-22): live at once with the member rules, the old version kept as an admin revision.
type Database = ReturnType<typeof getDb>;
const body = "I started padel last spring. ".repeat(20), at = "2026-11-20T10:00:00.000Z", id = "00000000-0000-4000-8000-000000000001";
async function fresh(withRevisions = true) {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) if (withRevisions || !s.includes("story_revisions")) await engine.exec(s);
  await engine.exec(`insert into padelrecs.accounts (id, name, name_key, created_at, updated_at) values ('a1', 'Marta T', 'marta t', '${at}', '${at}');
    insert into padelrecs.stories (id, slug, account_id, title, body, status, network, created_at, updated_at, pending_edit) values
    ('${id}', 'first-story', 'a1', 'My first story here', '${body}', 'approved', 'n', '${at}', '${at}', '{"title":"Waiting title here","body":"x","rackets":[],"at":"${at}"}');`);
  return { engine, db: drizzle(engine) as unknown as Database };
}

test("admin story edit: live at once, topic and featured saved, the old version kept", async () => {
  const { db } = await fresh();
  assert.equal(await revisionsOn(db), true);
  const r = await adminEditStory(db, { id, title: "My first year of padel", body: `${body} One more line.`, rackets: [], topic: "first", featured: true, editorId: "u-admin" }, new Date("2026-11-22T09:00:00.000Z"));
  assert.deepEqual(r, { status: "saved", slug: "first-story", live: true, kept: true });
  const [s] = (await db.execute(`select title, edited_at, pending_edit from padelrecs.stories where id = '${id}'` as never) as unknown as { rows: { title: string; edited_at: string; pending_edit: unknown }[] }).rows;
  assert.equal(s.title, "My first year of padel");
  assert.equal(s.edited_at, "2026-11-22T09:00:00.000Z");
  assert.ok(s.pending_edit, "a member's waiting edit stays for the owner to decide");
  const x = (await storyExtras(db, [{ id, slug: "first-story" }], await storyFeatures(db))).get(id)!;
  assert.equal(x.topic, "first"); assert.ok(x.featured);
  const h = await storyRevisions(db, id);
  assert.equal(h.length, 1);
  assert.deepEqual([h[0].title, h[0].by, h[0].topic], ["My first story here", "admin", null]);
  assert.equal(h[0].body, body);
});

test("admin story edit: the member rules apply, and a missing story is reported", async () => {
  const { db } = await fresh();
  assert.equal((await adminEditStory(db, { id, title: "Hi", body: "short", rackets: [], editorId: "u" })).status, "invalid");
  assert.equal((await adminEditStory(db, { id: "00000000-0000-4000-8000-000000000009", title: "My first year of padel", body, rackets: [], editorId: "u" })).status, "missing");
  assert.equal((await storyRevisions(db, id)).length, 0);
});

test("admin story edit before drizzle/0037: still saves, no history yet", async () => {
  const { db } = await fresh(false);
  assert.equal(await revisionsOn(db), false);
  const r = await adminEditStory(db, { id, title: "My first year of padel", body, rackets: [], editorId: "u" });
  assert.deepEqual(r, { status: "saved", slug: "first-story", live: true, kept: false });
  assert.deepEqual(await storyRevisions(db, id), []);
});
