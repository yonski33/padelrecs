// LaptopRecs' quick match (lib/laptop-match.ts) and its inputs (lib/laptop-wire.ts): plain objects in, so the rules are pinned.
import test from "node:test";
import assert from "node:assert/strict";
import { laptopMatch, rankLaptops, NO_LAPTOP_PICKS, type LaptopWire } from "../lib/laptop-match";
import { laptopWire, kgOf } from "../lib/laptop-wire";

const w = (id: string, category: string, loved: number, s: LaptopWire["s"] = {}, kg: number | null = 1.5): LaptopWire => ({ id, category, kg, loved, n: 20, s });

test("weights: lb and kg, first value, nonsense ignored", () => {
  assert.equal(kgOf("3.31 lb"), 1.5);
  assert.equal(kgOf("from 1.24 kg (2.73 lb)"), 1.24);
  assert.equal(kgOf("1340 g"), 1.34);
  assert.equal(kgOf("light"), null);
  assert.equal(kgOf(null), null);
});

test("no picks: no %; gaming keeps Chromebooks under Worth a look and ranks them last", () => {
  assert.equal(laptopMatch(w("a", "Gaming", 80), NO_LAPTOP_PICKS).pct, 80);
  const cb = laptopMatch(w("c", "Chromebook", 95), { use: "gaming", want: null, quiet: false });
  assert.ok(cb.hard && cb.pct! <= 54);
  const ranked = rankLaptops([w("c", "Chromebook", 95), w("g", "Gaming", 70), w("u", "Ultrabook", 90)], { use: "gaming", want: null, quiet: false }).map(x => x.w.id);
  assert.deepEqual(ranked, ["g", "u", "c"]);
});

test("a thin-data ultrabook doesn't beat gaming laptops for gaming (category default when no part is backed)", () => {
  const p = { use: "gaming" as const, want: null, quiet: false };
  assert.ok(laptopMatch(w("g", "Gaming", 75), p).pct! > laptopMatch(w("u", "Ultrabook", 75), p).pct!);
  assert.ok(laptopMatch(w("u", "Ultrabook", 75), p).warn);
});

test("quiet fans: a laptop people call hot is a hard catch", () => {
  const m = laptopMatch(w("h", "Ultrabook", 80, { thermals: [20, 6] }), { use: null, want: null, quiet: true });
  assert.ok(m.hard && m.reasons[0].includes("hot"));
});

test("inputs: tags and creator words per part, smoothed; loved needs 2 voices", () => {
  const x = laptopWire({ id: "x", category: "Ultrabook", weight: "2.9 lb",
    opinions: [{ tags: ["great battery life"], sentiment: "positive" }, { tags: ["great battery life", "runs hot"], sentiment: "mixed" }],
    creators: [{ attrs: { battery: "Excellent", thermals: "Okay" }, stance: "pos" }] });
  assert.deepEqual(x.s.battery, [88, 3]); // (100 + 100 + 100 + 50) / 4
  assert.deepEqual(x.s.thermals, [30, 2]); // (0 + 40 + 50) / 3
  assert.equal(x.kg, 1.32);
  assert.equal(x.loved, 67); // (2 loved + 1 mixed / 2 + 1.5) / (3 + 3)
  assert.equal(laptopWire({ id: "y", category: null, weight: null, opinions: [{ tags: [], sentiment: "positive" }], creators: [] }).loved, null);
});
