// CoffeeRecs' quick match (lib/coffee-match.ts) and its inputs (lib/coffee-wire.ts): plain objects in, so the rules are pinned.
import test from "node:test";
import assert from "node:assert/strict";
import { coffeeMatch, rankCoffee, NO_COFFEE_PICKS, type CoffeeWire, type CoffeeCan } from "../lib/coffee-match";
import { coffeeWire, canOf } from "../lib/coffee-wire";
import { COFFEE_SPECS } from "../lib/coffee-specs";

const CAN: CoffeeCan = { espresso: null, filter: null, steam: null, hand: false };
const w = (id: string, category: string, loved: number, s: CoffeeWire["s"] = {}, can: Partial<CoffeeCan> = {}): CoffeeWire => ({ id, category, can: { ...CAN, ...can }, loved, n: 20, s });

test("no picks: the loved score; filter coffee keeps espresso machines under Worth a look and ranks them last", () => {
  assert.equal(coffeeMatch(w("a", "Brewer", 80), NO_COFFEE_PICKS).pct, 80);
  const m = coffeeMatch(w("e", "Espresso machine", 95), { make: "filter", want: null, quiet: false });
  assert.ok(m.hard && m.pct! <= 54);
  const ranked = rankCoffee([w("e", "Espresso machine", 95), w("b", "Brewer", 70), w("k", "Kettle", 90)], { make: "filter", want: null, quiet: false }).map(x => x.w.id);
  assert.deepEqual(ranked, ["k", "b", "e"]);
});

test("espresso: a filter-only grinder and a brewer are hard catches; a 'limited' grinder a soft one", () => {
  const p = { make: "espresso" as const, want: null, quiet: false };
  assert.ok(coffeeMatch(w("g", "Grinder", 90, {}, { espresso: false, filter: true }), p).hard);
  assert.ok(coffeeMatch(w("b", "Brewer", 90), p).hard);
  const lim = coffeeMatch(w("l", "Grinder", 90, {}, { espresso: "limited", filter: true }), p);
  assert.ok(!lim.hard && lim.warn && lim.pct! <= 74);
});

test("milk drinks: a machine with no steam wand is a hard catch", () => {
  const m = coffeeMatch(w("m", "Espresso machine", 90, {}, { steam: false }), { make: "milk", want: null, quiet: false });
  assert.ok(m.hard && m.reasons[0].includes("steam"));
});

test("quiet: a product people call loud is a hard catch; an electric grinder with no noise data a soft one", () => {
  assert.ok(coffeeMatch(w("x", "Grinder", 80, { noise: [20, 5] }), { make: null, want: null, quiet: true }).hard);
  const e = coffeeMatch(w("y", "Grinder", 80), { make: null, want: null, quiet: true });
  assert.ok(!e.hard && e.warn);
  assert.ok(!coffeeMatch(w("h", "Grinder", 80, {}, { hand: true }), { make: null, want: null, quiet: true }).warn);
});

test("inputs: tags and creator words per part, smoothed; loved needs 2 voices", () => {
  const x = coffeeWire({ id: "x", category: "Grinder", spec: undefined,
    opinions: [{ tags: ["consistent"], sentiment: "positive" }, { tags: ["consistent", "loud"], sentiment: "mixed" }],
    creators: [{ attrs: { consistency: "Excellent", noise: "Okay" }, stance: "pos" }] });
  assert.deepEqual(x.s.consistency, [88, 3]); // (100 + 100 + 100 + 50) / 4
  assert.deepEqual(x.s.noise, [30, 2]); // (0 + 40 + 50) / 3
  assert.equal(x.loved, Math.round(100 * (2 + 0.5 + 1.5) / 6));
  assert.equal(coffeeWire({ id: "y", category: null, spec: undefined, opinions: [{ tags: [], sentiment: "positive" }], creators: [] }).loved, null);
});

test("maker specs: espresso-capable grinders, steam wands, hand grinders", () => {
  const specs = Object.entries(COFFEE_SPECS);
  const grinder = specs.find(([, s]) => s.cat === "grinder" && s.espresso === false)?.[1];
  if (grinder) assert.equal(canOf(grinder).espresso, false);
  const noSteam = specs.find(([, s]) => s.cat === "espresso" && s.steam === "none")?.[1];
  if (noSteam) assert.equal(canOf(noSteam).steam, false);
  const hand = specs.find(([, s]) => s.power === "hand")?.[1];
  if (hand) assert.equal(canOf(hand).hand, true);
  assert.deepEqual(canOf(undefined), CAN);
});
