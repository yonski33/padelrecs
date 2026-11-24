// Shape chips (owner 2026-11-22): a row listing several shapes shows no chip but still matches each of them in a filter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { oneShape, shapeHas, manyShapes } from "../lib/thread/shape";

test("one shape shows, a list of shapes hides and still filters", () => {
  assert.equal(oneShape("Elongated"), "Elongated");
  assert.equal(oneShape("Shifter / handbrake"), "Shifter / handbrake");
  for (const s of ["Hybrid, Widebody, or Elongated", "Widebody or Elongated", "Standard/Widebody", "Standard (Epic) or Elongated (Invikta)"]) {
    assert.equal(oneShape(s), null, s); assert.ok(manyShapes(s), s); }
  assert.ok(shapeHas("Hybrid, Widebody, or Elongated", "Widebody"));
  assert.ok(!shapeHas("Hybrid, Widebody, or Elongated", "Standard"));
  assert.ok(shapeHas("Teardrop", "Teardrop") && !shapeHas("Teardrop", "Round"));
});
