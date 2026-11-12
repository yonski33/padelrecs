import { test } from "node:test";
import assert from "node:assert/strict";
import { sourceLabel, summaryKind, originalLinkLabel } from "../lib/source-label";

const video = "https://www.youtube.com/watch?v=X5wmRWxlVCs";

test("a viewer's comment is credited as a comment on the channel, not to the channel", () => {
  assert.deepEqual(sourceLabel({ sourcePlatform: "YouTube", sourceName: "Probando Palas", sourceUrl: `${video}&lc=UgzQAnhRrUI0` }), { platform: "YouTube comment", name: "on Probando Palas" });
});

test("a video summary keeps the channel as its source", () => {
  assert.deepEqual(sourceLabel({ sourcePlatform: "YouTube", sourceName: "Padel Review", sourceUrl: video }), { platform: "YouTube", name: "Padel Review" });
});

test("a comment with no channel name still says it's a comment", () => {
  assert.deepEqual(sourceLabel({ sourcePlatform: "YouTube", sourceName: "YouTube", sourceUrl: `${video}&lc=Ugz` }), { platform: "YouTube comment", name: null });
});

test("other platforms are left as they are, whatever the link says", () => {
  assert.deepEqual(sourceLabel({ sourcePlatform: "Reddit", sourceName: "r/padel", sourceUrl: "https://reddit.com/r/padel/1?lc=1" }), { platform: "Reddit", name: "r/padel" });
  assert.deepEqual(sourceLabel({ sourcePlatform: "Reddit", sourceName: "Reddit" }), { platform: "Reddit", name: null });
});

test("a Reddit link to one comment is summarised as a comment, a thread link as a post", () => {
  const r = (sourceUrl: string) => summaryKind({ sourcePlatform: "Reddit", sourceUrl });
  assert.equal(r("https://www.reddit.com/r/SkincareAddiction/comments/1j8alvt/product_question_thick/oyo9km4/"), "Reddit comment");
  assert.equal(r("https://www.reddit.com/r/Pillows/comments/1j8alvt/purple_harmony/oyo9km4"), "Reddit comment");
  assert.equal(r("https://www.reddit.com/r/Pillows/comments/1j8alvt/comment/oyo9km4/"), "Reddit comment");
  assert.equal(r("https://www.reddit.com/r/SkincareAddiction/comments/18a8h47/product_question_about_vaselinecerave_healing/"), "Reddit post");
  assert.equal(r("https://www.reddit.com/r/Pillows/comments/18a8h47/purple_harmony"), "Reddit post");
  assert.equal(summaryKind({ sourcePlatform: "YouTube", sourceUrl: video }), "YouTube video");
  assert.equal(summaryKind({ sourcePlatform: "Other", sourceUrl: "https://example.com/review" }), "blog post");
});

test("the link to the original fits the source", () => {
  assert.equal(originalLinkLabel({ sourcePlatform: "YouTube", sourceUrl: video }), "Watch the original video");
  assert.equal(originalLinkLabel({ sourcePlatform: "Other", sourceUrl: "https://example.com/r" }), "Read the original post");
  assert.equal(originalLinkLabel({ sourcePlatform: "Reddit", sourceUrl: "https://www.reddit.com/r/padel/comments/abc/slug/" }), "View the original discussion");
  assert.equal(originalLinkLabel({ sourcePlatform: "Reddit", sourceUrl: "https://www.reddit.com/r/padel/comments/abc/slug/def/" }), "View the original comment");
});
