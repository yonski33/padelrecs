import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceOf, faceOf, shapeWord } from "../lib/guide";

test("balanceOf reads words first, then a lone length", () => {
  assert.equal(balanceOf("Medium-high (~25.4 cm)"), "high");
  assert.equal(balanceOf("High (272 mm)"), "high");
  assert.equal(balanceOf("Low/Medium"), "medium");
  assert.equal(balanceOf("Low"), "low");
  assert.equal(balanceOf("Balanced"), "medium");
  assert.equal(balanceOf("270 mm"), "high");
  assert.equal(balanceOf("250 mm"), "low");
  assert.equal(balanceOf("26 cm"), "medium");
  assert.equal(balanceOf(""), null);
  assert.equal(balanceOf(null), null);
});

test("faceOf sorts face materials", () => {
  assert.equal(faceOf("3K carbon"), "carbon");
  assert.equal(faceOf("18K"), "carbon");
  assert.equal(faceOf("Fiberglass"), "fibreglass");
  assert.equal(faceOf("Fibrix (fiberglass + carbon)"), "mixed");
  assert.equal(faceOf("Glaphite"), null);
  assert.equal(faceOf(undefined), null);
});

test("shapeWord falls back to hybrid", () => {
  assert.equal(shapeWord("Diamond (oversized)"), "diamond");
  assert.equal(shapeWord("Teardrop"), "teardrop");
  assert.equal(shapeWord("Round"), "round");
  assert.equal(shapeWord("Hybrid"), "hybrid");
  assert.equal(shapeWord(""), null);
});
