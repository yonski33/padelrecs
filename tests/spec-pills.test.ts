import { test } from "node:test";
import assert from "node:assert/strict";
import { specPills } from "../lib/thread/spec-pills";

test("padel: shape, core, surface, weight and model year from the catalogue, brackets dropped", () => {
  assert.deepEqual(specPills("padel", { shape: "Teardrop", core: "MLD Black EVA (multilayer)", surface: "18K carbon alum", weight: "360–375 g", year: 2026 }),
    ["Teardrop", "MLD Black EVA", "18K carbon alum", "360–375 g", "2026"]);
});
test("pickleball: shape, core thickness and surface; no year; lists and long values skipped", () => {
  assert.deepEqual(specPills("pickleball", { shape: "Hybrid", core: "16 mm", surface: "Raw Toray T700 carbon fiber", weight: "7.9–8.2 oz", year: 2023 }),
    ["Hybrid", "16 mm core", "Raw Toray T700 carbon fiber"]);
  assert.deepEqual(specPills("pickleball", { shape: "Hybrid, Widebody, or Elongated", core: "14 or 16 mm", surface: "Multi-layer composite with Toray T-700 carbon top layer" }), []);
  assert.deepEqual(specPills("pickleball", { shape: null, core: null, surface: null }), []);
});
test("other sites get no spec pills", () => assert.deepEqual(specPills("skin", { shape: "Serum" }), []));
