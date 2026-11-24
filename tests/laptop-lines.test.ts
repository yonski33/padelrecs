// LaptopRecs' model lines (lib/thread/laptop-lines.ts, db/catalogs/laptop-lines.json, owner 2026-11-24): lists show a line's
// newest READY 2026 model, else its ready 2025 one, never 2024 or older; older models link only to a ready current model.
import test from "node:test";
import assert from "node:assert/strict";
import { laptopLines, laptopReady, LAPTOP_LINES, LAPTOP_READY, type LineTable } from "../lib/thread/laptop-lines";

const T: LineTable = {
  "air-m1": ["Air 13", 1, 2020], "air-m4": ["Air 13", 4, 2025], "air-m5": ["Air 13", 5, 2026],
  "t14-6": ["T14", 6, 2025], "t14-7": ["T14", 7, 2026], "g14-24": ["G14", 2024, 2024], "zb": ["ZBook Ultra", 1, 2025],
  "xps-9440": ["XPS 14", 1, 2024], "dell-14-premium": ["XPS 14", 2, 2025], "xps-da": ["XPS 14", 3, 2026],
};
const it = (slug: string, ready = true) => ({ id: slug, slug, ready });

test("ready: creator reviews or a TL;DR, plus owner votes (the config threshold)", () => {
  assert.deepEqual(LAPTOP_READY, { creatorReviews: 3, votes: 3 });
  assert.equal(laptopReady({ creator: 9, tldr: true, votes: 0 }), false); // content but no votes
  assert.equal(laptopReady({ creator: 3, tldr: false, votes: 3 }), true);
  assert.equal(laptopReady({ creator: 0, tldr: true, votes: 5 }), true);
  assert.equal(laptopReady({ creator: 2, tldr: false, votes: 40 }), false); // votes but no written content
});

test("the slot goes to the newest READY model: 2026 if ready, else 2025; 2024 and older never; not-ready never", () => {
  const r = laptopLines([it("air-m1"), it("air-m4"), it("air-m5", false), it("t14-6"), it("t14-7"), it("g14-24"), it("zb", false)], T);
  assert.deepEqual([...r.current].sort(), ["air-m4", "t14-7"]);
  assert.deepEqual(r.standIns, [{ line: "Air 13", slug: "air-m4" }]);
  // Older pages link to the ready current model; nothing links to the not-ready M5.
  assert.equal(r.newer.get("air-m1"), "air-m4");
  assert.equal(r.newer.get("t14-6"), "t14-7");
  assert.ok(![...r.newer.values()].includes("air-m5"));
  assert.equal(r.newer.has("air-m5"), false);
});

test("a renamed successor shares its predecessor's line (XPS 14 -> Dell 14 Premium -> XPS 14 DA14260)", () => {
  const r = laptopLines([it("xps-9440"), it("dell-14-premium"), it("xps-da")], T);
  assert.deepEqual([...r.current], ["xps-da"]);
  assert.equal(r.newer.get("dell-14-premium"), "xps-da");
});

test("a laptop missing from the table never lists", () => {
  assert.equal(laptopLines([it("new-thing")], T).current.size, 0);
});

test("the table: years and renames for known families", () => {
  const e = (s: string) => LAPTOP_LINES[s]!;
  assert.equal(e("apple-macbook-air-13-m1")[2], 2020);
  assert.equal(e("apple-macbook-air-13-m5")[2], 2026);
  assert.equal(e("asus-rog-zephyrus-g14-2026")[2], 2026);
  assert.equal(e("lenovo-thinkpad-t14-gen-7")[2], 2026);
  assert.equal(e("dell-14-premium")[0], e("dell-xps-14-da14260")[0]);
  assert.notEqual(e("apple-macbook-pro-14-m5")[0], e("apple-macbook-pro-14-m5-pro-max")[0]);
  for (const [s, v] of Object.entries(LAPTOP_LINES)) assert.ok(v[0] && Number.isFinite(v[1]) && v[2] >= 2015 && v[2] <= 2026, s);
});
