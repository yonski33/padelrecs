// SkinRecs on the PickleballRecs template (2026-11-26): type lists by most loved; need lists by their own vote since
// 2026-11-27 (owner "Yes, order by picks"), with the same tag from their own answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { listOrder, listPill, lovedOrdered, voteSort } from "../lib/thread/vote-order";

test("skin type lists are loved-ordered; need lists are vote-ordered (acne keeps the match)", () => {
  for (const slug of ["best-face-moisturizers", "best-face-cleansers", "best-face-sunscreens", "best-skincare-treatments", "best-balms-ointments"])
    assert.equal(lovedOrdered("skin", slug), true, slug);
  for (const slug of ["best-skincare-for-sensitive-skin", "best-moisturizers-for-dry-skin", "best-serums-for-oily-skin", "best-sunscreens-for-sensitive-skin"])
    assert.equal(listOrder("skin", slug)?.order, "votes", slug);
  assert.equal(listOrder("skin", "best-acne-treatments"), null);
});

test("skin rows are tagged by their own list", () => {
  const groups = { irritation: { none: 14, some: 2 }, skin_type: { dry: 9, oily: 3, combination: 6 } };
  assert.equal(listPill(listOrder("skin", "best-face-moisturizers"), groups, 22, "people"), "Loved by 22 people");
  assert.equal(listPill(listOrder("skin", "best-skincare-for-sensitive-skin"), groups, 22, "people"), "No irritation · 14 people");
  assert.equal(listPill(listOrder("skin", "best-moisturizers-for-dry-skin"), groups, 22, "people"), "Picked for dry skin · 9 people");
  assert.equal(listPill(listOrder("skin", "best-serums-for-oily-skin"), groups, 22, "people"), null, "under 5: no tag");
  assert.equal(listPill(listOrder("skin", "best-acne-treatments"), groups, 22, "people"), undefined, "no rule: skin's usual pill");
});

test("skin need lists: by votes, ties by loved, no-vote products stay below in match order", () => {
  const votes: Record<string, number> = { a: 0, b: 5, c: 9, d: 5, e: 0 }, loved: Record<string, number> = { a: 99, b: 10, c: 1, d: 20, e: 50 };
  assert.deepEqual(voteSort(["a", "b", "c", "d", "e"], id => votes[id]!, id => loved[id]!), ["c", "d", "b", "a", "e"]);
});
