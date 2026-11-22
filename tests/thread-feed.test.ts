import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { activity, feedLine, guessedFlair, postFlair, REPLIES_SHOWN } from "../lib/thread/feed";

test("a post is a QUESTION when it ends with ? or starts with a question word, else it has no flair", () => {
  assert.equal(postFlair("Does the Extreme Motion feel too harsh for a touchy elbow?"), "question");
  assert.equal(postFlair("Is it ok for a 4.0 player"), "question");
  assert.equal(postFlair("Anyone tried it with an overgrip"), "question");
  assert.equal(postFlair("@Daniel how heavy is yours?"), "question");
  // Never a guessed TIP on padel (owner 2026-11-21): TIP is a saved type (drizzle/0035); anything else is a plain post.
  assert.equal(postFlair("Two overgrips and it is fine on the arm."), null);
  assert.equal(postFlair("Whatever you do, demo it first."), null); // "whatever" is not "what"
});

test("the composer: nothing picked by default, types toggle off, a placeholder per choice", () => {
  const f = readFileSync("app/thread/live/feed-v7b.tsx", "utf8");
  assert.match(f, /useState<Flair \| null>\(null\)/);
  assert.match(f, /const toggle = \(k: Flair\) => start\(PADEL && kind === k \? null : k\)/);
  assert.match(f, /onClick=\{\(\) => start\(PADEL \? null : "review"\)\}><span aria-hidden="true">\+<\/span>Share a review/);
  // The picked Question or Tip saves with the post; a saved type wins over the words.
  assert.match(f, /t\.post\(x, null, TYPED && \(kind === "question" \|\| kind === "tip"\) \? kind : undefined\)/);
  assert.match(f, /TYPED \? flairFor\(c\.type, c\.body\) : guessedFlair\(c\.body\)/);
  for (const t of ["What do you want to know?", "Share something that helped", "Say something about the ${model}…", "How did it play for you?"])
    assert.ok(f.includes(t), t);
});

test("a reply bumps its thread; the header line names only what is there", () => {
  assert.equal(activity("2026-11-01", [{ at: "2026-11-05" }, { at: "2026-11-03" }]), "2026-11-05");
  assert.equal(activity("2026-11-01", []), "2026-11-01");
  assert.equal(REPLIES_SHOWN, 2);
  assert.equal(feedLine({ review: 2, question: 4, tip: 1 }, 13), "2 reviews · 4 questions · 1 tip · 13 from around the web");
  assert.equal(feedLine({ review: 1, question: 0, tip: 0 }, 0), "1 review");
  assert.equal(feedLine({ review: 0, question: 0, tip: 0 }, 0), "No posts yet");
});

test("the feed: one section, flair chips, filters and sort in the browser, thin rule over all posts, no score", () => {
  const f = readFileSync("app/thread/live/feed-v7b.tsx", "utf8");
  assert.match(f, /\{`\$\{W\.People\} on the \$\{model\}`\}/); // "Players on the …" on padel, "Listeners on the …" on AudioRecs
  // No counts above the lists (owner 2026-11-21): no number in the title, no mix line, no web count line.
  assert.doesNotMatch(f, /feedLine|th7-count/);
  assert.doesNotMatch(readFileSync("app/thread/live/racket-v7b.tsx", "utf8"), /webLine\(|th-web-n/);
  assert.match(f, /\["all", "All"\], \["review", "Reviews"\], \["question", "Questions"\], \["tip", "Tips"\]/);
  assert.match(f, /\["new", "Newest activity"\], \["top", "Top"\]/);
  assert.match(f, /const thin = isThin\(items\.length\)/);
  assert.match(f, /Share a review, ask a question or a tip/);
  assert.match(f, /<PendingReviews racketId=\{id\} compact\/>/);
  assert.match(f, /addEventListener\(OPEN_REVIEW/); // the poll's "add a line" opens this composer
  assert.doesNotMatch(f, /—|\bowners\b|stars?\b|Badge/);
  // Posts never reach the poll or score: the feed only reads /api/comments through useComments.
  assert.doesNotMatch(f, /racket-votes|thread-poll/);
});

test("post_type (drizzle/0035): one nullable column, padel only in the API, kept out of the shared table definition", () => {
  const sql = readFileSync("drizzle/0035_comment_post_type.sql", "utf8");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "post_type" text;/);
  assert.match(sql, /CHECK \("post_type" IS NULL OR "post_type" IN \('question', 'tip'\)\)/);
  assert.doesNotMatch(sql, /DROP|NOT NULL|UPDATE|DELETE/i); // additive only
  const j = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { idx: number; tag: string; when: number }[] };
  // 0035 comes right after 0034 (later migrations, such as 0036, follow it).
  const at = j.entries.findIndex(e => e.tag === "0035_comment_post_type"), [a, b] = [j.entries[at - 1], j.entries[at]];
  assert.deepEqual([b.idx, b.tag], [35, "0035_comment_post_type"]);
  assert.ok(b.when > a.when);
  // Other sites' schemas don't have the column: every select() of comments must keep working there.
  assert.doesNotMatch(readFileSync("db/schema.ts", "utf8"), /post_type|postType/);
  const api = readFileSync("app/api/comments/route.ts", "utf8");
  assert.match(api, /const TYPED = postTypeSite\(niche\.id\);/);
  assert.match(api, /TYPED && v\.postType && !v\.parentId/);
  // AudioRecs (same feed) keeps the earlier guessed QUESTION / TIP.
  assert.equal(guessedFlair("Two overgrips helped."), "tip");
  assert.equal(guessedFlair("Is it heavy?"), "question");
});

test("saved post types run on the sites whose schema has post_type (site config), not the others", async () => {
  const { postTypeSite } = await import("../lib/thread/sites");
  assert.deepEqual(["padel", "pickleball", "tennis", "simracing", "skin", "audio"].map(postTypeSite), [true, true, true, false, true, false]); // skin: 0035 applied 2026-11-22
  assert.match(readFileSync("app/thread/live/feed-v7b.tsx", "utf8"), /const TYPED = postTypeSite\(niche\.id\);/);
});
