import { test } from "node:test";
import assert from "node:assert/strict";
import { guideListPicks, ELBOW_SLUG, THREAD_MOVED } from "../lib/thread/look";

// The guides' racket lists (#524 follow-up): the elbow guide showed none after its ranking moved to the tennis elbow slug.
const lists: Record<string, string[]> = {
  [ELBOW_SLUG]: ["a", "b", "c", "d", "e"], "best-control-padel-rackets": ["c1", "c2", "c3", "c4"], "best-power-padel-rackets": ["p1", "p2", "p3"],
  "best-padel-rackets-for-sore-arms": ["old"],
};
const picks = (key: string) => guideListPicks(key, s => lists[s], id => ({ id }));

test("the tennis elbow guide lists the tennis elbow ranking's top 4", () => {
  assert.deepEqual(picks("elbow"), [{ rows: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] }]);
});
test("the court-side guide lists control for the right and power for the left; others pick their own", () => {
  assert.deepEqual(picks("side")?.map(g => [g.title, g.rows.length]), [["Right side", 3], ["Left side", 3]]);
  assert.equal(picks("racket"), null);
});
test("the old sore-arms address points at the slug the ranking uses", () => {
  assert.deepEqual(THREAD_MOVED, [{ from: "/rankings/best-padel-rackets-for-sore-arms", to: `/rankings/${ELBOW_SLUG}` }]);
});
