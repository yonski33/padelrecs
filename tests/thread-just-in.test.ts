import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { justIn, JUST_IN_MIN, JUST_IN_THIN } from "../lib/thread/just-in";

const r = (id: string, year: number, pic: string | null = "/p.webp", current?: boolean) => ({ id, year, pic, ...(current === false ? { current } : {}) });

test("the newest year with 3+ photographed rackets, most recently added first", () => {
  const rows = [r("a", 2027), r("b", 2027), r("c", 2027), r("d", 2027), r("e", 2026)];
  const added = { a: "2026-11-01", b: "2026-11-20", c: "2026-10-01", d: "2026-11-10", e: "2026-11-21" };
  assert.deepEqual(justIn(rows, added), { year: 2027, rows: [rows[1], rows[3], rows[0]] });
});

test("rackets without a photo or older model years don't count; too few falls back a year", () => {
  const rows = [r("a", 2027), r("b", 2027, null), r("c", 2027), r("x", 2027, "/p", false), r("d", 2026), r("e", 2026), r("f", 2026)];
  const pick = justIn(rows, {});
  assert.equal(pick?.year, 2026);
  assert.equal(justIn([r("a", 2027), r("b", 2026)], {}), null);
  assert.equal(JUST_IN_MIN, 3);
  assert.equal(JUST_IN_THIN, 10);
});

test("the home places JustIn after the mini-lists and before the latest reviews; sites with model years only", () => {
  const home = readFileSync("app/thread/page.tsx", "utf8"), c = readFileSync("app/thread/just-in.tsx", "utf8");
  assert.ok(home.indexOf("<JustIn") > home.indexOf("<TopPicks") && home.indexOf("<JustIn") < home.indexOf('<Feed key="fd"'));
  assert.equal(home.split("<JustIn").length, 2);
  assert.match(home, /\{justInSite\(niche\.id\) && <JustIn key="ji"\/>\}/);
  for (const t of ["${niche.words.many} just in", "All new ${niche.words.many} →", "${W.usedIt} Be one of the first", "See reviews ›", "Added "])
    assert.ok(c.includes(t), t);
  // No price link on these cards (owner 2026-11-21); the racket page keeps its buy link.
  assert.doesNotMatch(c, /check price|Affiliate link|amazonButton|ji-buy/i);
  assert.doesNotMatch(c.replace(/\/\/.*$/gm, ""), /—|\bowners?\b|\bverdict\b/i); // shown copy, not code comments
});

test("just in: padel, pickleball and tennis (real model years; tennis since its year fill, 2026-11-22); not sim racing or audio", async () => {
  const { justInSite } = await import("../lib/thread/sites");
  assert.deepEqual(["padel", "pickleball", "tennis", "simracing", "audio", "skin"].map(justInSite), [true, true, true, false, false, false]);
});
