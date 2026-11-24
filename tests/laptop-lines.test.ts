// LaptopRecs' model lines (lib/thread/laptop-lines.ts, db/catalogs/laptop-lines.json, owner 2026-11-24): lists show a line's
// 2026 model, a 2025 model only when the line has no 2026 successor, never 2024 or older; older models link to the newest.
import test from "node:test";
import assert from "node:assert/strict";
import { laptopLines, LAPTOP_LINES, type LineTable } from "../lib/thread/laptop-lines";

const T: LineTable = {
  "air-m1": ["Air 13", 1, 2020], "air-m4": ["Air 13", 4, 2025], "air-m5": ["Air 13", 5, 2026],
  "t14-6": ["T14", 6, 2025], "g14-24": ["G14", 2024, 2024], "old-only": ["Old", 1, 2023],
  "xps-9440": ["XPS 14", 1, 2024], "dell-14-premium": ["XPS 14", 2, 2025], "xps-da": ["XPS 14", 3, 2026],
};
const it = (slug: string) => ({ id: slug, slug });

test("2026 takes the line, reviews or not; a 2025 model stands in only without a 2026 successor; 2024 and older never list", () => {
  const r = laptopLines(["air-m1", "air-m4", "air-m5", "t14-6", "g14-24", "old-only"].map(it), T);
  assert.deepEqual([...r.current].sort(), ["air-m5", "t14-6"]);
  assert.deepEqual(r.standIns, [{ line: "T14", slug: "t14-6" }]);
  assert.equal(r.newer.get("air-m1"), "air-m5");
  assert.equal(r.newer.get("air-m4"), "air-m5");
  assert.equal(r.newer.has("air-m5"), false);
});

test("a renamed successor shares its predecessor's line (XPS 14 -> Dell 14 Premium -> XPS 14 DA14260)", () => {
  const r = laptopLines(["xps-9440", "dell-14-premium", "xps-da"].map(it), T);
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
