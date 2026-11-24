// The suggestion cards' quality floor (owner 2026-11-17): min(score − 10, 80); 75 for a product without a score.
import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestionFloor } from "../lib/suggestion-floor";

test("suggestion floor: 70 asks 60, 85 asks 75, 90 and up cap at 80, no score asks 75", () => {
  assert.equal(suggestionFloor(85), 75);
  assert.equal(suggestionFloor(96), 80);
  assert.equal(suggestionFloor(70), 60);
  assert.equal(suggestionFloor(100), 80);
  assert.equal(suggestionFloor(null), 75);
});
