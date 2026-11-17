import { test } from "node:test";
import assert from "node:assert/strict";
import { fitStep, fittingRows, FIT_MIN } from "../lib/verdict-scale";

// Owner 2026-11-17 (Metalbone CTRL 3.5 page: "57% · Decent fit" beside "Probably not for you", unfit cards in "for your game").
test("the pill word and the headline always come from the same step", () => {
  for (let p = 0; p <= 100; p++) {
    const s = fitStep(p);
    assert.equal(s.fits, p >= FIT_MIN, `${p}%`);
    assert.equal(/Probably not/.test(s.head), /Probably not/.test(s.word), `${p}%: ${s.word} / ${s.head}`);
  }
});

test("'Other rackets for your game' never shows a card under 60% or this racket, best match first", () => {
  const rows = [{ id: "me", pct: 99 }, { id: "a", pct: 57 }, { id: "b", pct: 81 }, { id: "c", pct: 60 }, { id: "d", pct: 92 }, { id: "e", pct: null }];
  const out = fittingRows(rows, "me", () => true);
  assert.deepEqual(out.map(r => r.id), ["d", "b", "c"]);
  assert.ok(out.every(r => (r.pct ?? 0) >= 60));
  assert.deepEqual(fittingRows([{ id: "a", pct: 55 }], "me", () => true), [], "fewer cards rather than ones that don't fit");
});
