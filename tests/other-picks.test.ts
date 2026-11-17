import { test } from "node:test";
import assert from "node:assert/strict";
import { distinctEdges } from "../lib/other-picks";

// Owner 2026-11-17 (Metalbone 3.5 page: three cards all said "harder on the arm", none had a gain).
const KEYS = ["forgiveness", "power", "control", "defence", "arm", "speed"];
const me = [3, 5, 3, 3, 3, 3];

test("every card has a gain; no gain or give-up repeats within a section", () => {
  const e = distinctEdges(me, [
    { id: "a", dots: [4, 4, 4, 3, 2, 3] }, { id: "b", dots: [4, 4, 3, 4, 2, 4] }, { id: "c", dots: [3, 3, 3, 3, 2, 3] },
    { id: "d", dots: [3, 4, 3, 3, 2, 5] }, { id: "e", dots: [3, 4, 4, 4, 5, 3] }], KEYS);
  assert.equal(e.length, 3);
  assert.ok(e.every(x => x.gain >= 0), "a gain on every card");
  assert.equal(new Set(e.map(x => x.gain)).size, e.length, "distinct gains");
  const gives = e.map(x => x.give).filter(x => x !== null);
  assert.equal(new Set(gives).size, gives.length, "distinct give-ups");
  assert.ok(!e.some(x => x.id === "c"), "a racket with no gain is passed over");
});

test("an arm gain needs the other racket itself to be kind to the arm (4+ dots)", () => {
  const e = distinctEdges([3, 3, 3, 3, 1, 3], [{ id: "a", dots: [3, 3, 3, 3, 3, 3] }, { id: "b", dots: [3, 3, 3, 3, 4, 3] }], KEYS);
  assert.deepEqual(e.map(x => x.id), ["b"]);
});
