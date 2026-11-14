import { test } from "node:test";
import assert from "node:assert/strict";
import { phraseSegments, MAX_HIGHLIGHTS } from "../lib/highlights";

const marks = (text: string, phrases: string[]) => phraseSegments(text, phrases).filter(s => s.tone).map(s => s.text);

test("stored phrases mark where they appear, in reading order, and the text is kept whole", () => {
  const text = "Big sweet spot and little bounce; the firmness hurt some elbows.";
  const segs = phraseSegments(text, ["the firmness hurt some elbows", "Big sweet spot"]);
  assert.equal(segs.map(s => s.text).join(""), text);
  assert.deepEqual(marks(text, ["the firmness hurt some elbows", "Big sweet spot"]), ["Big sweet spot", "the firmness hurt some elbows"]);
});

test("missing, overlapping and extra phrases are skipped", () => {
  const text = "Easy power, small sweet spot, great on volleys.";
  assert.deepEqual(marks(text, ["not in the text"]), []);
  assert.deepEqual(marks(text, ["small sweet spot", "sweet spot, great"]), ["small sweet spot"]);
  assert.equal(marks(text, ["Easy power", "small sweet spot", "great on volleys"]).length, MAX_HIGHLIGHTS);
});
