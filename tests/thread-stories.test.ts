import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { storyProblem, storySlug, freeSlug, storyDescription, paragraphs, hasShopLink, STORY_BODY, readMinutes, isStoryTopic, topicLabel, STORY_TOPICS } from "../lib/thread/stories";
import { threadPath } from "../lib/thread/look";
import { storiesSite } from "../lib/thread/sites";
import { PAGE_KEY } from "../db/comments";

// Member stories (PadelRecs pilot, owner 2026-11-20).
const long = "I started padel last spring. ".repeat(20);
test("story rules: title and body lengths, no shop or affiliate links, five rackets at most", () => {
  assert.equal(storyProblem({ title: "10 things I learned", body: long }), null);
  assert.match(storyProblem({ title: "Short", body: long })!, /title/);
  assert.match(storyProblem({ title: "10 things I learned", body: "Too short." })!, new RegExp(`${STORY_BODY.min} characters`));
  assert.match(storyProblem({ title: "10 things I learned", body: `${long} Buy it at https://amzn.to/abc` })!, /Shop and affiliate/);
  assert.match(storyProblem({ title: "10 things I learned", body: `${long} https://example.com/p?tag=me-21` })!, /Shop and affiliate/);
  assert.equal(hasShopLink("see https://www.reddit.com/r/padel/comments/x"), false);
  assert.match(storyProblem({ title: "10 things I learned", body: long, rackets: ["a", "b", "c", "d", "e", "f"] })!, /5 rackets/);
});

test("story addresses, paragraphs and description", () => {
  assert.equal(storySlug("10 Things I Learned in my First Year of Padel!"), "10-things-i-learned-in-my-first-year-of-padel");
  assert.equal(storySlug("¡Pádel!"), "padel");
  assert.equal(storySlug("!!!"), "story");
  assert.equal(freeSlug("my-story", new Set()), "my-story");
  assert.equal(freeSlug("my-story", new Set(["my-story", "my-story-2"])), "my-story-3");
  assert.deepEqual(paragraphs("One.\nStill one.\n\nTwo.\r\n\r\n\r\nThree."), ["One.\nStill one.", "Two.", "Three."]);
  assert.ok(storyDescription(long).length <= 156);
  assert.ok(PAGE_KEY.test("story:10-things-i-learned-3f2a9c"));
});

test("stories are padel only: routing and the gate", () => {
  assert.equal(storiesSite("padel"), true);
  for (const id of ["pickleball", "skin", "discgolf", "stackrecs"]) assert.equal(storiesSite(id), false, id);
  assert.equal(threadPath("/stories", "/rackets", "padel"), "/thread/stories");
  assert.equal(threadPath("/stories/new", "/rackets", "padel"), "/thread/stories/new");
  assert.equal(threadPath("/stories/10-things-3f2a9c", "/rackets", "padel"), "/thread/stories/10-things-3f2a9c");
  assert.equal(threadPath("/stories", "/paddles", "pickleball"), null);
  assert.equal(threadPath("/stories/x/y", "/rackets", "padel"), null);
  assert.equal(threadPath("/stories/10-things-3f2a9c/edit", "/rackets", "padel"), "/thread/stories/10-things-3f2a9c/edit");
  assert.equal(threadPath("/stories/10-things-3f2a9c/edit", "/paddles", "pickleball"), null);
});

test("story redesign helpers: read time and topics (owner design 2026-11-21)", () => {
  assert.equal(readMinutes("Short."), 1);
  assert.equal(readMinutes("word ".repeat(600)), 3);
  assert.equal(readMinutes(`## A heading\n\n**${"word ".repeat(399)}**`), 2);
  assert.equal(isStoryTopic("switch"), true);
  assert.equal(isStoryTopic("video"), false);
  assert.equal(topicLabel("comeback"), "Comeback");
  assert.equal(topicLabel(null), null);
  // The keys match 0033's check constraint.
  const sql = readFileSync(new URL("../drizzle/0033_story_topics_likes.sql", import.meta.url), "utf8");
  for (const [k] of STORY_TOPICS) assert.ok(sql.includes(`'${k}'`), k);
});
