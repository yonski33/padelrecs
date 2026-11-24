import { test } from "node:test";
import assert from "node:assert/strict";
import { PRIMARY_SHAPE, shapesOf, inShape } from "../lib/thread/primary-shape";

test("a product with a primary shape sits on that shape's list only", () => {
  for (const [id, shape] of Object.entries(PRIMARY_SHAPE.pickleball)) {
    assert.deepEqual(shapesOf("pickleball", id, "Hybrid, Widebody, or Elongated"), [shape.toLowerCase()], id);
    assert.ok(["elongated", "hybrid", "widebody", "standard"].includes(shape.toLowerCase()), `${id}: ${shape}`);
  }
});

test("without a primary shape, every shape the text names counts (the catalog text is kept as is)", () => {
  assert.deepEqual(shapesOf("pickleball", "no-such-paddle", "Hybrid, Widebody, or Elongated"), ["hybrid", "widebody", "elongated"]);
  assert.ok(inShape("pickleball", "x", "Elongated", "elongated"));
  assert.ok(inShape("pickleball", "x", "Hybrid, Widebody, Elongated or Extra-Elongated", "elongated"));
  assert.ok(!inShape("pickleball", "x", "Widebody", "hybrid"));
  assert.ok(!inShape("pickleball", "x", null, "hybrid"));
});
