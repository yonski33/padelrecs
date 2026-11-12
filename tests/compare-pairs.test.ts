import assert from "node:assert/strict";
import test from "node:test";
import { pairKey, pairHref } from "../lib/compare-pairs";

test("a pair has one address whatever the order", () => {
  assert.equal(pairKey("nox-at10", "adidas-metalbone"), "adidas-metalbone-vs-nox-at10");
  assert.equal(pairKey("adidas-metalbone", "nox-at10"), "adidas-metalbone-vs-nox-at10");
  assert.equal(pairHref("b", "a"), "/compare/a-vs-b");
});
