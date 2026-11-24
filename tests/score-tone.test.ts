import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTone, scoreBox, matchTone, matchBox } from "../lib/score-tone";
import { fitStep } from "../lib/verdict-scale";

const COLOUR: Record<string, string> = { "Strong fit": "g", "Worth a look": "y", "Probably not": "w" };
const BOX: Record<string, string> = { g: "hi", y: "mid", w: "" };

test("a match pill's colour always follows its own word", () => {
  for (let pct = 0; pct <= 100; pct++) {
    const word = fitStep(pct).word;
    assert.equal(matchTone(pct), COLOUR[word], `${pct}% ${word}`);
    assert.equal(matchBox(pct), BOX[COLOUR[word]], `${pct}% ${word}`);
  }
});

test("player score boxes: green 85+, yellow 70–84, white below", () => {
  assert.deepEqual([96, 85, 84, 70, 69, 12].map(scoreTone), ["g", "g", "y", "y", "w", "w"]);
  assert.deepEqual([96, 85, 84, 70, 69].map(scoreBox), ["hi", "hi", "mid", "mid", ""]);
  assert.equal(scoreTone(null), ""); assert.equal(matchTone(null), "");
});
