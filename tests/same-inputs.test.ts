import test from "node:test";
import assert from "node:assert/strict";
import { sameInputs } from "../db/same-inputs";

test("sameInputs reuses the result while every input is the same object, and rebuilds on a new copy", () => {
  let runs = 0;
  const sum = sameInputs((xs: number[], k: number) => { runs++; return xs.reduce((a, b) => a + b, 0) * k; });
  const a = [1, 2, 3];
  assert.equal(sum(a, 2), 12);
  assert.equal(sum(a, 2), 12);
  assert.equal(runs, 1);
  assert.equal(sum([1, 2, 3], 2), 12);
  assert.equal(runs, 2, "an equal but new array is a new copy");
  assert.equal(sum(a, 3), 18);
  assert.equal(runs, 3);
});
