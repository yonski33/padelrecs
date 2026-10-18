import { test } from "node:test";
import assert from "node:assert/strict";
import { tagsInput, tagTone } from "../lib/tags";

test("tags accept bank terms only, at most three, from a single value or a list", () => {
  assert.deepEqual(tagsInput.parse(undefined), []);
  assert.deepEqual(tagsInput.parse(""), []);
  assert.deepEqual(tagsInput.parse("firm"), ["firm"]);
  assert.deepEqual(tagsInput.parse(["easy power", "easy power", "forgiving"]), ["easy power", "forgiving"]);
  assert.equal(tagsInput.safeParse(["easy power", "firm", "soft", "forgiving"]).success, false);
  assert.equal(tagsInput.safeParse(["made up tag"]).success, false);
});

test("tags carry a tone for display", () => {
  assert.equal(tagTone("arm-friendly"), "pos");
  assert.equal(tagTone("head-heavy"), "neg");
  assert.equal(tagTone("firm"), "neutral");
});
