import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStory, plainText, inline } from "../lib/thread/story-markdown";
import { wrap, prefix } from "../lib/thread/story-format";
import { storyProblem, storyDescription, paragraphs } from "../lib/thread/stories";

// Story formatting (owner 2026-11-20): a safe Markdown subset in the plain body field.
test("blocks: paragraphs, subheadings, lists, quotes; old plain text reads as before", () => {
  const md = "## My first year\nIt was **hard** and *fun*.\nSecond line.\n\n- one\n- two\n\n1. first\n2. second\n\n> a quote\n> goes on";
  assert.deepEqual(parseStory(md).map(b => b.t), ["h", "p", "ul", "ol", "q"]);
  const p = parseStory(md)[1] as { inl: { t: string; s: string }[] };
  assert.deepEqual(p.inl, [{ t: "text", s: "It was " }, { t: "b", s: "hard" }, { t: "text", s: " and " }, { t: "i", s: "fun" }, { t: "text", s: ".\nSecond line." }]);
  const plain = "One.\nStill one.\n\nTwo.";
  assert.deepEqual(parseStory(plain).map(b => "inl" in b ? b.inl.map(x => x.s).join("") : ""), paragraphs(plain));
});

test("no raw HTML, images or links become markup: they stay plain text", () => {
  for (const s of ["<b>x</b>", "![img](https://x.y/a.png)", "[shop](https://example.com)", "<script>alert(1)</script>"])
    assert.deepEqual(inline(s), [{ t: "text", s }], s);
  assert.deepEqual(inline("snake_case_word and 2*3*4"), [{ t: "text", s: "snake_case_word and 2" }, { t: "i", s: "3" }, { t: "text", s: "4" }]);
});

test("the minimum length counts the text, not the marks; the description is plain", () => {
  const words = "I learned to wait for the ball. ".repeat(12).trim(); // 383 characters
  assert.ok(words.length < 400);
  assert.match(storyProblem({ title: "My first year of padel", body: `## ${words}\n\n- **${words.slice(0, 5)}**` })!, /400 characters/);
  assert.equal(storyProblem({ title: "My first year of padel", body: `## Start\n\n${words} And then more.` }), null);
  assert.equal(plainText("## Hi\n\n**bold** and *it*"), "Hi\n\nbold and it");
  assert.equal(storyDescription("**Bold** start of the story."), "Bold start of the story.");
});

test("toolbar: bold and italic wrap and unwrap; line prefixes toggle; numbered lists count", () => {
  assert.deepEqual(wrap({ text: "a word b", start: 2, end: 6 }, "**"), { text: "a **word** b", start: 4, end: 8 });
  assert.deepEqual(wrap({ text: "a **word** b", start: 4, end: 8 }, "**"), { text: "a word b", start: 2, end: 6 });
  assert.deepEqual(wrap({ text: "ab", start: 1, end: 1 }, "*"), { text: "a**b", start: 2, end: 2 });
  assert.equal(prefix({ text: "one\ntwo\n\nthree", start: 0, end: 7 }, "ol").text, "1. one\n2. two\n\nthree");
  assert.equal(prefix({ text: "1. one\n2. two", start: 0, end: 13 }, "ol").text, "one\ntwo");
  assert.equal(prefix({ text: "- a\n- b", start: 0, end: 7 }, "q").text, "> a\n> b");
  assert.equal(prefix({ text: "intro\nTitle", start: 8, end: 8 }, "h").text, "intro\n## Title");
});
