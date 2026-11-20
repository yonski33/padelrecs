import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { storyFeatures, storyExtras, likeStory, likedBy, likedThisMonth, authorStats, setStoryTopic, storyTopic } from "../db/story-extras";
import type { getDb } from "../db/index";

// Stories redesign (owner design 2026-11-21): topic and ▲ likes (drizzle/0033) and comment counts, on a fresh database.
type Database = ReturnType<typeof getDb>;
const body = "I started padel last spring. ".repeat(20), at = "2026-11-20T10:00:00.000Z";
test("story extras: features, topic, likes, comment counts and author stats", async () => {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await engine.exec(`insert into padelrecs.accounts (id, name, name_key, created_at, updated_at) values ('a1', 'Marta T', 'marta t', '${at}', '${at}'), ('a2', 'Iker', 'iker', '${at}', '${at}');
    insert into padelrecs.stories (id, slug, account_id, title, body, status, network, created_at, updated_at) values
    ('00000000-0000-4000-8000-000000000001', 'first-story', 'a1', 'My first story here', '${body}', 'approved', 'n', '${at}', '${at}'),
    ('00000000-0000-4000-8000-000000000002', 'second-story', 'a1', 'My second story here', '${body}', 'pending', 'n', '${at}', '${at}');
    insert into padelrecs.comments (id, page, alias, body, status, voter, network, created_at) values
    ('c1', 'story:first-story', 'Iker', 'Nice one', 'approved', 'v', 'n', '${at}'), ('c2', 'story:first-story', 'Iker', 'Held', 'pending', 'v', 'n', '${at}');`);
  const [one, two] = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
  const f = await storyFeatures(db);
  assert.deepEqual(f, { topics: true, likes: true });
  await setStoryTopic(db, one, "switch");
  assert.equal(await storyTopic(db, one), "switch");
  await assert.rejects(engine.exec(`update padelrecs.stories set topic = 'video' where id = '${one}'`));
  assert.equal(await likeStory(db, one, "a2", true), true);
  assert.equal(await likeStory(db, one, "a2", true), true); // once per account
  assert.equal(await likeStory(db, two, "a2", true), false); // not live
  assert.deepEqual(await likedBy(db, "a2"), [one]);
  const x = await storyExtras(db, [{ id: one, slug: "first-story" }, { id: two, slug: "second-story" }], f);
  assert.deepEqual(x.get(one), { topic: "switch", likes: 1, comments: 1 });
  assert.deepEqual(x.get(two), { topic: null, likes: 0, comments: 0 });
  assert.deepEqual(await likedThisMonth(db), [{ id: one, likes: 1 }]);
  assert.deepEqual(await likedThisMonth(db, 4, new Date(Date.now() + 40 * 86_400_000)), []); // older than 30 days
  assert.deepEqual(await authorStats(db, one, f), { stories: 1, likes: 1 });
  await likeStory(db, one, "a2", false);
  assert.deepEqual(await likedBy(db, "a2"), []);
  // Off before 0033: comment counts only.
  const off = await storyExtras(db, [{ id: one, slug: "first-story" }], { topics: false, likes: false });
  assert.deepEqual(off.get(one), { topic: null, likes: 0, comments: 1 });
});
