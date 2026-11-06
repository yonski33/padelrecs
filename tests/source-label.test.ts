import { test } from "node:test";
import assert from "node:assert/strict";
import { sourceLabel } from "../lib/source-label";

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
