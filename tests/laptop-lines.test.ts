// LaptopRecs' model lines (lib/thread/laptop-lines.ts, db/catalogs/laptop-lines.json): the newest model that can show stands
// for its line, older ones link to the newest, and the table covers known families in the right order.
import test from "node:test";
import assert from "node:assert/strict";
import { laptopLines, LAPTOP_LINES, type LineTable } from "../lib/thread/laptop-lines";

const T: LineTable = { "air-m1": ["Air 13", 1], "air-m4": ["Air 13", 4], "air-m5": ["Air 13", 5], "t14-6": ["T14", 6], "t14-7": ["T14", 7], solo: ["Solo", 0] };
const it = (slug: string, opinions: number, creator = 0) => ({ id: slug, slug, opinions, creator });

test("the newest model that can show stands for its line; older ones link to the newest", () => {
  const r = laptopLines([it("air-m1", 55), it("air-m4", 12), it("air-m5", 0, 9), it("t14-6", 44), it("t14-7", 0), it("solo", 0)], T);
  assert.deepEqual([...r.current].sort(), ["air-m5", "t14-6"]);
  assert.equal(r.newer.get("air-m1"), "air-m5");
  assert.equal(r.newer.get("t14-6"), "t14-7");
  assert.equal(r.newer.has("air-m5"), false);
  assert.deepEqual(r.fallback, [{ line: "T14", newest: "t14-7", shown: "t14-6" }]);
});

test("a laptop missing from the table is a line of its own", () => {
  const r = laptopLines([it("new-thing", 5)], T);
  assert.ok(r.current.has("new-thing"));
});

test("the table: known families in generation order", () => {
  const gen = (s: string) => LAPTOP_LINES[s]![1], line = (s: string) => LAPTOP_LINES[s]![0];
  assert.equal(line("apple-macbook-air-13-m1"), line("apple-macbook-air-13-m5"));
  assert.ok(gen("apple-macbook-air-13-m5") > gen("apple-macbook-air-13-m1"));
  assert.notEqual(line("apple-macbook-pro-14-m5"), line("apple-macbook-pro-14-m5-pro-max"));
  assert.ok(gen("asus-rog-zephyrus-g14-2026") > gen("asus-rog-zephyrus-g14-2025"));
  assert.ok(gen("lenovo-thinkpad-t14-gen-6") > gen("lenovo-thinkpad-t14-gen-1"));
  assert.notEqual(line("lenovo-thinkpad-t14-gen-6"), line("lenovo-thinkpad-t14s-gen-6"));
  assert.ok(gen("lenovo-thinkpad-x1-carbon-gen-13") > gen("lenovo-thinkpad-x1-carbon-6th-gen"));
  for (const [s, v] of Object.entries(LAPTOP_LINES)) assert.ok(typeof v[0] === "string" && v[0] && Number.isFinite(v[1]), s);
});
