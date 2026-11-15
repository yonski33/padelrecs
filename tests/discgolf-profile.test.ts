import { test } from "node:test";
import assert from "node:assert/strict";
import { DISCGOLF, flightOf, flightPrior, beginnerGated } from "../lib/discgolf-profile";
import { attrProfileFor } from "../lib/attr-profile";

const MID = { tf: 1, glide: 5 };
test("disc golf: reads flight numbers", () => {
  assert.deepEqual(flightOf("12 / 5 / -1 / 3"), { speed: 12, glide: 5, turn: -1, fade: 3 });
  assert.deepEqual(flightOf("14.5 / 5 / -1.5 / 3"), { speed: 14.5, glide: 5, turn: -1.5, fade: 3 });
  assert.equal(flightOf(null), null);
  assert.equal(flightOf("12/5"), null);
});
test("disc golf: starts stability and glide from the numbers", () => {
  const firebird = flightPrior(flightOf("9 / 3 / 0 / 4"), MID), leopard = flightPrior(flightOf("6 / 5 / -2 / 1"), MID);
  assert.ok(firebird.stability > 70);
  assert.ok(leopard.stability < 45);
  assert.ok(firebird.glide < leopard.glide);
});
test("disc golf: leans fast overstable drivers away from beginners and slower arms", () => {
  const zeus = flightPrior(flightOf("12 / 5 / -1 / 3"), MID), leopard = flightPrior(flightOf("6 / 5 / -2 / 1"), MID);
  assert.ok(zeus.suits_beginner < 30);
  assert.ok(leopard.suits_beginner > 55);
  assert.ok(zeus.suits_arm_fast > leopard.suits_arm_fast);
});
test("disc golf: gates only when the numbers and the evidence agree", () => {
  assert.equal(beginnerGated(25, { score: 40, n: 4 }), true);
  assert.equal(beginnerGated(25, { score: 70, n: 4 }), false);
  assert.equal(beginnerGated(25, null), false);
  assert.equal(beginnerGated(60, { score: 30, n: 5 }), false);
});
test("disc golf: is not registered for the v2 skin layouts (design waits for the padel template)", () => {
  assert.equal(attrProfileFor({ id: "discgolf" }), undefined);
  assert.equal(DISCGOLF.attrs.filter(a => a.kind === "suits").length, 6);
});
