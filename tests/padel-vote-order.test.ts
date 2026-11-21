import { test } from "node:test";
import assert from "node:assert/strict";
import { voteOrder, listOrder, votesOrdered, VOTE_ORDER, type VoteCandidate } from "../lib/thread/vote-order";

const c = (id: string, power: number, control: number, extra: Partial<VoteCandidate> = {}): VoteCandidate =>
  ({ id, name: id, family: id, year: 2026, reviews: 30, group: { power, control, all_round: 5 }, ...extra });

test("power and control are vote-ordered; other lists keep their own order", () => {
  assert.equal(votesOrdered("padel", "best-power-padel-rackets"), true);
  assert.equal(votesOrdered("padel", "best-control-padel-rackets"), true);
  for (const slug of ["best-padel-rackets", "best-padel-rackets-2025", "best-padel-rackets-for-tennis-elbow", "best-teardrop-padel-rackets", "best-diamond-padel-rackets"])
    assert.equal(listOrder("padel", slug), null);
  assert.equal(listOrder("pickleball", "best-power-pickleball-paddles"), null);
});

test("the pill's count leads, the share breaks ties", () => {
  const ids = voteOrder([c("a", 40, 10), c("b", 63, 10), c("c", 40, 2), c("d", 58, 3)], "power");
  assert.deepEqual(ids, ["b", "d", "c", "a"]);
});

test("floors: reviews, votes, and the answer must lead", () => {
  const ids = voteOrder([c("few-reviews", 50, 1, { reviews: 5 }), c("few-votes", VOTE_ORDER.minVotes - 1, 0), c("control-led", 32, 70), c("ok", 20, 5)], "power");
  assert.deepEqual(ids, ["ok"]);
});

test("one row per model, its newest year that passes", () => {
  const ids = voteOrder([c("v05-2026", 40, 5, { family: "v05" }), c("v05-2027", 18, 5, { family: "v05", reviews: 6 }), c("cm-2025", 40, 5, { family: "cm", year: 2025 }),
    c("cm-2026", 37, 5, { family: "cm" })], "power");
  assert.deepEqual(ids, ["v05-2026", "cm-2026"]);
});
