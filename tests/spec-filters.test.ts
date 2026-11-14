import {test} from "node:test";
import assert from "node:assert/strict";
import padel from "../lib/spec-filters/padel";
import {range, numbers} from "../lib/spec-filters/parse";

const weight = padel.find(f => f.id === "weight")!;
const w = (v: string) => weight.classify({weight: v});

test("padel weight follows the makers' stated ranges (owner, 2026-11-14)", () => {
  assert.deepEqual(w("360–375 g"), ["360-375"]);
  assert.deepEqual(w("365–375 g ±10 g"), ["365-375"]);
  assert.deepEqual(w("355–375 g"), ["355-375"]);
  assert.deepEqual(w("350–370 g"), ["355-375"]);
  assert.deepEqual(w("345–360 g"), ["light"]);
  assert.deepEqual(w("350–360 g"), ["light"]);
  assert.deepEqual(w("370 g (361–375 g)"), ["360-375"]);
  assert.deepEqual(w("365 g (± 10 g)"), ["365-375"]);
  assert.deepEqual(w("373 g"), ["370"]);
  assert.deepEqual(w(""), []);
});

test("spec text readers", () => {
  assert.deepEqual(range("360 - 375g"), [360, 375]);
  assert.deepEqual(range("365g–370g"), [365, 370]);
  assert.deepEqual(numbers('55/65/75"'), [55, 65, 75]);
});
