// DiscGolfRecs site audit fixes (Grok audit 2026-11-17, owner-approved plan via PM): one stability per disc, the beginner and
// slower-arm speed rules, card names, and casing. Pure functions, plain inputs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { stabilityOfFlight } from "../lib/niche/discgolf-guide";
import { discRules } from "../lib/discgolf-hard";
import { clause } from "../lib/fit-reason";
import { refName } from "../lib/compare-names";
import { DISCGOLF_FIT } from "../lib/discgolf-fit";

const fl = (s: string) => { const [speed, glide, turn, fade] = s.split("/").map(Number); return { speed, glide, turn, fade }; };

test("dg site 1: one stability rule, as the makers say it (Scorch understable, MD1 and Tantrum stable, Firebird overstable)", () => {
  assert.equal(stabilityOfFlight(fl("11/6/-2/2")), "understable"); // Discraft Scorch
  assert.equal(stabilityOfFlight(fl("5/5/0/0")), "stable"); // Discmania MD1
  assert.equal(stabilityOfFlight(fl("14.5/5/-1.5/3")), "stable"); // Axiom Tantrum: "stable-understable"
  assert.equal(stabilityOfFlight(fl("12/5/-1/3")), "stable"); // Innova Destroyer: "a fast, stable power driver"
  assert.equal(stabilityOfFlight(fl("9/3/0/4")), "overstable"); // Innova Firebird
  assert.equal(stabilityOfFlight(fl("5/6/-4/1")), "understable"); // Innova Rollo
});

test("dg site 2: speed 11+ is a hard no for beginners and slower arms; 9–10 is a step-up driver; fade 3+ isn't a first disc", () => {
  const r = (w: string, slug = "x") => discRules({ slug, weight: w });
  const wraith = r("11 / 5 / -1 / 3");
  assert.ok(wraith.hard?.beginner && wraith.hard?.arm);
  assert.deepEqual(wraith.dotBounds?.arm, [1, 2]);
  const beast = r("10 / 5 / -2 / 2");
  assert.ok(!beast.hard?.beginner && /step-up/.test(beast.warn?.beginner ?? ""));
  assert.ok(r("4 / 3 / 0 / 3").hard?.beginner, "Harp"); // fade 3: utility, not a first disc
  const leopard = r("7 / 5 / -2 / 1");
  assert.ok(!leopard.hard && !leopard.warn && leopard.slowArm);
  assert.equal(leopard.lean, "control");
  assert.deepEqual(r("1 / 1 / 0 / 2").dotBounds?.arm, [4, 5]); // Berg X: flies as rated for nearly any arm
});

test("dg site 3: the slow-arm chip follows the guide (speed 7 or less with turn + fade ≤ 2, or an understable 8–9)", () => {
  const ok = (w: string) => DISCGOLF_FIT.quick!.armSpecOk!({ weight: w } as never);
  assert.equal(ok("7 / 5 / -2 / 1"), true); // Leopard3
  assert.equal(ok("9 / 5 / -3 / 1"), true); // Sidewinder
  assert.equal(ok("9 / 5 / -1 / 2"), false); // Tesla
  assert.equal(ok("10 / 5 / -2 / 2"), false); // Beast
  assert.equal(ok("9 / 3 / 0 / 4"), false); // Firebird
});

test("dg site 4: plastic names keep their case; articles don't", () => {
  assert.equal(clause("Q-Line runs come up to speed easily."), "Q-Line runs come up to speed easily");
  assert.equal(clause("Z and ESP runs shrug off headwinds."), "Z and ESP runs shrug off headwinds");
  assert.equal(clause("Champion and Halo hold up with a firm finish."), "Champion and Halo hold up with a firm finish");
  assert.equal(clause("Champion, Halo, Duo and glow runs stay steady into headwinds."), "Champion, Halo, Duo and glow runs stay steady into headwinds");
  assert.equal(clause("A pro line, built for advanced players."), "a pro line, built for advanced players");
  assert.equal(clause("The sweet spot covers most of the face."), "the sweet spot covers most of the face");
});

test("dg site 5: a disc golf compare names the mold, never the brand alone", () => {
  const all = [{ brand: "Discraft", model: "Zone" }, { brand: "Innova", model: "Pig" }];
  assert.equal(refName(0, all, true), "Zone");
  assert.equal(refName(0, all), "Discraft");
});
