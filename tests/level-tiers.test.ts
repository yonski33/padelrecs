// The owner's intermediate+ tier (2026-11-17): every year of the three models, beginner not a fit, intermediate a fit below
// core intermediates, advanced a full fit; "Generally best for intermediate → advanced".
import { test } from "node:test";
import assert from "node:assert/strict";
import { isIntermediatePlus, intermediatePlus } from "../lib/level-tiers";
import { bestFor, SUITS_OK } from "../lib/fit-verdict";

test("intermediate+: the three models in every year, nothing else", () => {
  for (const n of ["Siux Electra Pro ST4 2025", "Siux Electra Pro ST4 2026", "Head Coello Motion 2026", "Head Coello Motion 2025", "Kuikma Hybrid Pro 2026"]) assert.ok(isIntermediatePlus("padel", n), n);
  for (const n of ["Head Coello Pro 2026", "Kuikma Hybrid Soft 2026", "Siux Electra Pro ST3 2024"]) assert.ok(!isIntermediatePlus("padel", n), n);
  assert.ok(!isIntermediatePlus("pickleball", "Head Coello Motion 2026"));
});

test("intermediate+: beginner out, intermediate in but under core, advanced full; best for reads both levels", () => {
  const su = intermediatePlus({ beginner: 40, intermediate: 35, advanced: 95, basis: ["12 players", "the brand"] });
  assert.ok(su.beginner < SUITS_OK && su.intermediate >= SUITS_OK && su.intermediate < 75 && su.advanced === 95);
  assert.equal(bestFor({ reports: 30, tags: {}, suits: su } as never)[0], "intermediate → advanced");
});
