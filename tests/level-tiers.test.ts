// The owner's level tiers (2026-11-17): advanced-only padel rackets become intermediate → advanced, the named three always,
// a short list stays truly advanced; beginner never changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { levelTier, applyTier } from "../lib/level-tiers";
import { bestFor, SUITS_OK } from "../lib/fit-verdict";

const adv = { beginner: 20, intermediate: 45, advanced: 85, basis: ["expert"] };
test("tiers: an advanced-only racket becomes intermediate+, the named list stays advanced, other sites untouched", () => {
  assert.equal(levelTier("padel", "Oxdog Ultimate Pro 2026", adv), "plus");
  for (const n of ["Siux Fenix Pro 6 2026", "Bullpadel Hack Advance 2026", "Adidas Metalbone HRD+ 3.5 2026", "Adidas Metalbone HRD+ 3.4 2025", "Head Coello Pro 2026", "Babolat Viper Juan Lebrón 3.0 2026", "Babolat Technical Viper 2025"])
    assert.equal(levelTier("padel", n, adv), "advanced", n);
  assert.equal(levelTier("padel", "Head Coello Motion 2026", { beginner: 20, intermediate: 80, advanced: 80, basis: [] }), "plus");
  assert.equal(levelTier("padel", "Adidas Match 2026", { beginner: 80, intermediate: 80, advanced: 40, basis: [] }), null);
  assert.equal(levelTier("pickleball", "Oxdog Ultimate Pro 2026", adv), null);
});

test("tiers: intermediate+ passes intermediate but under core, advanced full, beginner kept; truly advanced stays out", () => {
  const p = applyTier("plus", adv);
  assert.ok(p.beginner === 20 && p.intermediate >= SUITS_OK && p.intermediate < 75 && p.advanced === 85);
  assert.equal(bestFor({ reports: 30, tags: {}, suits: p } as never)[0], "intermediate → advanced");
  const a = applyTier("advanced", { ...adv, intermediate: 85 });
  assert.ok(a.intermediate < 50 && a.advanced >= SUITS_OK);
  assert.equal(bestFor({ reports: 30, tags: {}, suits: a } as never)[0], "advanced");
});
