import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryRatings, cautiousShare, priorShare, ratingCategory, RATING_HOW } from "../lib/category-rating";

const power = ratingCategory("best-power-padel-rackets", "padel")!;
// The curated power 10's "Plays like" counts from the Power score test (power, all-round, control), with made-up bars.
const groups: [number, number, number][] = [[28, 3, 4], [25, 4, 5], [19, 13, 23], [25, 5, 5], [39, 2, 0], [22, 10, 21], [20, 5, 4], [11, 4, 4], [15, 8, 7], [17, 12, 30]];
const list = groups.map(([p, a, c], i) => ({ group: { power: p, all_round: a, control: c }, dots: 5 - (i % 4), shape: i % 2 ? "diamond" : "teardrop" }));

test("labels: padel category lists only; filter lists and other sites keep the player score", () => {
  assert.equal(power.label, "Power rating");
  assert.equal(ratingCategory("best-control-padel-rackets", "padel")?.label, "Control rating");
  assert.equal(ratingCategory("best-padel-rackets-for-tennis-elbow", "padel")?.label, "Arm comfort rating");
  for (const slug of ["best-padel-rackets", "best-padel-rackets-2026", "best-diamond-padel-rackets", "best-teardrop-padel-rackets"])
    assert.equal(ratingCategory(slug, "padel"), null, slug);
  assert.equal(ratingCategory("best-power-padel-rackets", "pickleball"), null);
  assert.equal(ratingCategory("best-power-pickleball-paddles", "pickleball"), null);
});

test("copy: short, no score or measuring words", () => {
  for (const t of [RATING_HOW, power.label]) {
    assert.ok(t.length <= 105, t);
    assert.doesNotMatch(t, /score|measur|test|verdict|—|\bwe\b|\bus\b/i, t);
  }
});

test("scale: #1 in 95-97, top 10 roughly 80-97, never rising, 1-3 a place", () => {
  const prior = priorShare(power, list.map(x => x.group));
  const r = categoryRatings(power, list, prior);
  assert.equal(r.length, 10);
  assert.ok(r[0] >= 95 && r[0] <= 97, String(r));
  assert.ok(r[9] >= 78 && r[9] <= 84, String(r));
  for (let i = 1; i < r.length; i++) { const d = r[i - 1] - r[i]; assert.ok(d >= 1 && d <= 3, `${i}: ${r}`); }
});

test("deterministic: same data, same numbers", () => {
  const prior = priorShare(power, list.map(x => x.group));
  assert.deepEqual(categoryRatings(power, list, prior), categoryRatings(power, structuredClone(list), prior));
});

test("evidence nudges within a step: more power mentions earn the higher end", () => {
  const strong = [{ group: { power: 39, all_round: 2, control: 0 }, dots: 5 }, { group: { power: 5, all_round: 0, control: 30 }, dots: 2 }];
  const weak = [{ group: { power: 5, all_round: 0, control: 30 }, dots: 2 }, { group: { power: 39, all_round: 2, control: 0 }, dots: 5 }];
  assert.equal(categoryRatings(power, strong, 0.48)[0], 97);
  assert.equal(categoryRatings(power, weak, 0.48)[0], 95);
});

test("no evidence: mid-step, still ordered", () => {
  const r = categoryRatings(power, [{ group: null }, { group: {} }, { group: null }], 0.5);
  assert.deepEqual(r, [96, 94, 93]);
  assert.equal(cautiousShare(power, { group: {} }, 0.5), null);
});

test("few opinions are held lower than many at the same share", () => {
  const few = cautiousShare(power, { group: { power: 3, control: 0 } }, 0.48)!, many = cautiousShare(power, { group: { power: 30, control: 0 } }, 0.48)!;
  assert.ok(many > few);
});
