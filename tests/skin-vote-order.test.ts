// SkinRecs on the PickleballRecs template (2026-11-26): type lists by most loved, need lists keep their order with a tag from
// their own answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { listOrder, listPill, lovedOrdered } from "../lib/thread/vote-order";

test("skin type lists are loved-ordered; need lists keep their order", () => {
  for (const slug of ["best-face-moisturizers", "best-face-cleansers", "best-face-sunscreens", "best-skincare-treatments", "best-balms-ointments"])
    assert.equal(lovedOrdered("skin", slug), true, slug);
  for (const slug of ["best-skincare-for-sensitive-skin", "best-moisturizers-for-dry-skin", "best-serums-for-oily-skin", "best-sunscreens-for-sensitive-skin"])
    assert.equal(listOrder("skin", slug)?.order, "keep", slug);
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
