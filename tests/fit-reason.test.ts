import { test } from "node:test";
import assert from "node:assert/strict";
import { butLevel, clause, fitReason, type ReasonItem } from "../lib/fit-reason";

const yes: ReasonItem[] = [
  { title: "Forgives your mishits", t: "The sweet spot covers most of the face, so ==mishits still go deep==.", for: ["beginner", "intermediate"] },
  { title: "Easy in defence", t: "Lobs, chiquitas and low balls from the back feel ==safe under pressure==.", for: ["control"] },
];
const no: ReasonItem[] = [
  { title: "Bouncy at the net", t: "The soft face launches fast blocks, so ==volleys can fly long==.", for: ["advanced", "balance"] },
  { title: "Smashes need help", t: "Out of the box ==flat smashes lack pop==; players move the weights up top.", for: ["power"] },
];
const pick = (style: "control" | "power" | "balance" | "any", level: "beginner" | "intermediate" | "advanced" | null, arm = false) => ({ style, level: level ?? undefined, arm });

test("match box: strong fit: built for the picks, then the one thing to know", () => {
    assert.equal(fitReason("good", yes, no, pick("control", "intermediate")), 
      "Built for what you picked: lobs, chiquitas and low balls from the back feel safe under pressure. "
      + "One thing to know: the soft face launches fast blocks, so volleys can fly long.");
});
test("match box: leads each side with the item that matters for the picks", () => {
    assert.equal(fitReason("maybe", yes, no, pick("power", "intermediate")), 
      "What suits your game: the sweet spot covers most of the face, so mishits still go deep. "
      + "The catch: out of the box flat smashes lack pop; players move the weights up top.");
});
test("match box: weak fit: the level reason when the catch doesn't speak to the picks", () => {
    assert.equal(fitReason("no", yes, no, pick("control", "beginner"), ["Level: players say advanced. Not aimed at beginners."]), 
      "It has one thing going for you: lobs, chiquitas and low balls from the back feel safe under pressure. "
      + "Holding it back: it isn't aimed at beginners.");
});
test("match box: weak fit names one thing holding it back: the level when it decides, else the catch on the picks", () => {
  assert.equal(fitReason("no", yes, no, pick("power", "beginner"), ["Level: the brand says professional. A pro line, built for advanced players."]),
    "It has one thing going for you: the sweet spot covers most of the face, so mishits still go deep. Holding it back: it's a pro line, built for advanced players.");
  assert.equal(fitReason("no", yes, no, pick("power", "beginner"), ["You want power, but players call it a control racket.", "A pro line, built for advanced players."]),
    "It has one thing going for you: the sweet spot covers most of the face, so mishits still go deep. "
    + "Holding it back: out of the box flat smashes lack pop; players move the weights up top.");
});
test("match box: never 'owners'", () => {
  assert.equal(fitReason("maybe", [{ title: "x", t: "One owner says it's great; owners agree." }], [], pick("any", null)), "Its strength: one player says it's great; players agree.");
});
test("match box: every sentence stays within 105 characters", () => {
    const long: ReasonItem[] = [{ title: "Huge sweet spot", t: "Almost the whole racket is sweet spot, and even the edges send the ball deep with very little effort from you." }];
    assert.equal(fitReason("good", long, [], pick("any", null)), "Its strength: huge sweet spot.");
});
test("match box: words", () => {
    assert.equal(clause("AT10 players say ==x==."), "AT10 players say x");
    assert.equal(butLevel("A pro line, built for advanced players."), "it's a pro line, built for advanced players");
    assert.equal(fitReason("good", [], [], pick("any", null)), null);
});
test("match box: an untagged strength is just 'its strength'", () => {
  assert.equal(fitReason("no", [no[0]], [], pick("control", "beginner"), ["A pro line, built for advanced players."]),
    "Its strength: the soft face launches fast blocks, so volleys can fly long. Holding it back: it's a pro line, built for advanced players.");
});
