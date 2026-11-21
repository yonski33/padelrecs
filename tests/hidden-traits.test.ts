// Per-product hidden vote groups (owner 2026-11-21, SimRacingRecs audit): the boxes go, the votes stay.
import { test } from "node:test";
import assert from "node:assert/strict";
import { traitGroupsForType, hiddenTraits } from "../lib/thread/traits";

test("the T80 hides torque, detail, heat and noise; the Forte GT hides grip and size; others keep their type's groups", () => {
  const keys = (id: string, shape: string) => traitGroupsForType("simracing", shape, id).map(g => g.key);
  const t80 = keys("thrustmaster-t80-ferrari-488-gtb-edition", "Wheelbase");
  for (const k of ["torque", "detail", "heat", "noise"]) assert.ok(!t80.includes(k), k);
  assert.ok(t80.includes("best_in") && t80.includes("level"));
  const forte = keys("asetek-forte-gt", "Wheel");
  assert.ok(!forte.includes("grip") && !forte.includes("size"));
  assert.ok(forte.includes("best_in"), "a GT button box keeps Best in (the discipline)");
  // The Invicta Formula is the full wheel (photo, reviews): it keeps grip and size.
  assert.deepEqual(hiddenTraits("simracing", "asetek-invicta-formula"), []);
  assert.ok(keys("asetek-invicta-formula", "Wheel").includes("grip"));
  assert.equal(traitGroupsForType("simracing", "Wheelbase").length, traitGroupsForType("simracing", "Wheelbase", "fanatec-csl-dd-8-nm").length);
});
