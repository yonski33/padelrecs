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

test("the home places JustIn after the mini-lists and before the latest reviews; padel only", () => {
  const home = readFileSync("app/thread/page.tsx", "utf8"), c = readFileSync("app/thread/just-in.tsx", "utf8");
  assert.ok(home.indexOf("<JustIn") > home.indexOf("<TopPicks") && home.indexOf("<JustIn") < home.indexOf('<Feed key="fd"'));
  assert.equal(home.split("<JustIn").length, 2);
  assert.match(home, /\{PADEL && <JustIn key="ji"\/>\}/); // the v3 home also serves AudioRecs
  for (const t of ["rackets just in", "All new rackets →", "Played with it? Be one of the first", "See reviews ›", "check price ↗", "Added "])
    assert.ok(c.includes(t), t);
  assert.doesNotMatch(c.replace(/\/\/.*$/gm, ""), /—|\bowners?\b|\bverdict\b/i); // shown copy, not code comments
});
