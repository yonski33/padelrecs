import { test } from "node:test";
import assert from "node:assert/strict";
import { voteOrder, lovedOrder, listOrder, listPill, votesOrdered, lovedOrdered, VOTE_ORDER, type VoteCandidate, type LovedCandidate } from "../lib/thread/vote-order";

const c = (id: string, power: number, control: number, extra: Partial<VoteCandidate> = {}): VoteCandidate =>
  ({ id, name: id, family: id, year: 2026, reviews: 30, group: { power, control, all_round: 5 }, ...extra });

test("power and control are vote-ordered, Best overall by loved; other lists keep their own order", () => {
  assert.equal(votesOrdered("padel", "best-power-padel-rackets"), true);
  assert.equal(votesOrdered("padel", "best-control-padel-rackets"), true);
  assert.equal(lovedOrdered("padel", "best-padel-rackets"), true);
  for (const slug of ["best-padel-rackets-2025", "best-teardrop-padel-rackets", "best-diamond-padel-rackets"])
    assert.equal(listOrder("padel", slug), null);
  // Tennis elbow and beginners keep their own order; only the row tag follows the list (2026-11-24).
  for (const slug of ["best-padel-rackets-for-tennis-elbow", "best-padel-rackets-for-beginners"]) {
    assert.equal(listOrder("padel", slug)?.order, "keep");
    assert.equal(votesOrdered("padel", slug) || lovedOrdered("padel", slug), false);
  }
  assert.equal(listOrder("audio", "best-power-pickleball-paddles"), null);
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

const lv = (id: string, loved: number, extra: Partial<LovedCandidate> = {}): LovedCandidate =>
  ({ id, name: id, family: id, year: 2026, reviews: 30, loved, mixed: 20, notForMe: 10, ...extra });
test("loved: the count leads, this season only, the review floor, one row per model", () => {
  const ids = lovedOrder([lv("a", 80), lv("b", 142), lv("c", 80, { mixed: 5 }), lv("old", 200, { year: 2025 }), lv("new", 150, { year: 2027 }),
    lv("thin", 90, { reviews: 4 }), lv("fam-1", 60, { family: "f" }), lv("fam-2", 70, { family: "f" })], 2026);
  assert.deepEqual(ids, ["b", "c", "a", "fam-2"]);
});

test("PickleballRecs: each list counts its own answer and tags rows with it, never another trait", () => {
  const power = listOrder("pickleball", "best-power-pickleball-paddles"), spin = listOrder("pickleball", "best-spin-pickleball-paddles");
  assert.deepEqual([power?.trait, power?.option, spin?.trait, spin?.option], ["plays_like", "power", "spin", "lots"]);
  const groups = { plays_like: { power: 112, control: 20, all_round: 30 }, spin: { lots: 157, some: 20 }, arm: { very: 4, somewhat: 30 }, level: { beginner: 81, advanced: 39, intermediate: 90 } };
  assert.equal(listPill(power, groups, 200), "Most picked for power · 112 players");
  assert.equal(listPill(spin, groups, 200), "Most picked for spin · 157 players");
  assert.equal(listPill(listOrder("pickleball", "best-pickleball-paddles-for-tennis-elbow"), groups, 200), null, "arm comfort doesn't lead: no tag, not another trait's");
  assert.equal(listPill(listOrder("pickleball", "best-pickleball-paddles-for-beginners"), groups, 200), "Picked for beginners · 81 players");
  assert.equal(listPill(listOrder("pickleball", "best-pickleball-paddles"), groups, 266), "Loved by 266 players");
  assert.equal(listPill(listOrder("pickleball", "best-elongated-pickleball-paddles"), groups, 263), "Loved by 263 players");
  assert.equal(listPill(null, groups, 1), undefined, "no rule: the site's usual pill");
  // "current" loved lists keep every year (pickleball's catalogue mixes 2024-2026).
  assert.deepEqual(lovedOrder([{ id: "a", name: "a", family: "a", year: 2025, reviews: 20, loved: 90, mixed: 5, notForMe: 5 },
    { id: "b", name: "b", family: "b", year: 2026, reviews: 20, loved: 80, mixed: 5, notForMe: 5 }], null), ["a", "b"]);
});

test("padel rows are tagged by their own list (pickleball's rule)", () => {
  const groups = { plays_like: { power: 30, control: 8 }, arm: { very: 12, somewhat: 3 }, level: { beginner: 6, advanced: 20 } };
  assert.equal(listPill(listOrder("padel", "best-padel-rackets"), groups, 41), "Loved by 41 players");
  assert.equal(listPill(listOrder("padel", "best-power-padel-rackets"), groups, 41), "Most picked for power · 30 players");
  assert.equal(listPill(listOrder("padel", "best-padel-rackets-for-tennis-elbow"), groups, 41), "Picked for arm comfort · 12 players");
  assert.equal(listPill(listOrder("padel", "best-padel-rackets-for-beginners"), groups, 41), "Picked for beginners · 6 players");
  assert.equal(listPill(listOrder("padel", "best-diamond-padel-rackets"), groups, 41), undefined, "no rule: padel's usual line");
});
