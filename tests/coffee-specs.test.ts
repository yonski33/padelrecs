import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COFFEE_SPECS, coffeeSpec, steamRank, backToBack } from "../lib/coffee-specs";

const fixes = JSON.parse(readFileSync(new URL("../db/fixes/coffee-2026-11-18.json", import.meta.url), "utf8")) as { name: string; set: Record<string, string>; source: string }[];
// One fixed Type per category (owner via PM 2026-11-18: "map the type field to fixed values per category").
const TYPES: Record<string, string[]> = {
  espresso: ["Single boiler", "Heat exchanger", "Dual boiler", "Thermoblock", "Thermocoil", "Manual lever", "Manual pump"],
  grinder: ["Hand grinder", "Flat burr electric", "Conical burr electric"],
  brewer: ["Pour-over dripper", "Immersion press", "Immersion and pour-over dripper", "French press", "Drip coffee maker"],
  kettle: ["Electric gooseneck kettle", "Stovetop gooseneck kettle", "Electric kettle"],
  scale: ["Espresso scale", "Brew scale"],
};

test("coffee specs: 149 products, fixed types, tiers and levels", () => {
  const all = Object.values(COFFEE_SPECS);
  assert.equal(all.length, 149);
  for (const s of all) {
    if (s.type !== null) assert.ok(TYPES[s.cat].includes(s.type), `${s.name}: ${s.type}`);
    assert.ok(s.tier === null || /^\${1,4}$/.test(s.tier), s.name);
    assert.ok(["beginner", "middle", "enthusiast"].includes(s.level), s.name);
    assert.match(s.source, /^https?:\/\//, s.name);
  }
  // Most products in the middle tier (profile 3: about 60–70 %), few enthusiast-only.
  const mid = all.filter(s => s.level === "middle").length / all.length, ent = all.filter(s => s.level === "enthusiast").length / all.length;
  assert.ok(mid >= 0.55 && mid <= 0.75, String(mid)); assert.ok(ent <= 0.2, String(ent));
});

test("coffee specs: Grok's errors are fixed in the specs and the fix list", () => {
  assert.equal(coffeeSpec({ name: "ECM Mechanika Max II" })?.type, "Heat exchanger");
  assert.equal(coffeeSpec({ name: "Lelit Mara X3" })?.flowControl, true);
  assert.equal(coffeeSpec({ name: "Baratza Vario+" })?.burrMaterial, "ceramic");
  assert.match(coffeeSpec({ name: "Profitec GO" })?.gone ?? "", /GO 2\.0/);
  assert.ok(coffeeSpec({ name: "Decent Bengle" })?.preRelease);
  assert.equal(coffeeSpec({ name: "Fellow Ode Gen 2" })?.espresso, false);
  assert.equal(coffeeSpec({ name: "Wacaco Picopresso" })?.type, "Manual pump");
  const fx = (n: string) => fixes.find(f => f.name === n)?.set ?? {};
  assert.equal(fx("ECM Mechanika Max II").balance, "Heat exchanger");
  assert.equal(fx("Timemore Basic 3.0").surface, "2,000 g max, 0.1 g");
  assert.equal(fx("Varia EVO").weight, "800 g");
  assert.match(fx("Baratza Vario+").surface, /ceramic/);
  for (const f of fixes) assert.match(f.source, /^https?:\/\//, f.name);
});

test("coffee specs: steam ranks and back-to-back milk drinks", () => {
  assert.deepEqual(["Dual boiler", "Heat exchanger", "Single boiler", "Thermoblock", "Manual lever"].map(steamRank), [3, 2, 1.5, 1, 0]);
  assert.equal(backToBack(coffeeSpec({ name: "Lelit Mara X" })!), true);
  assert.equal(backToBack(coffeeSpec({ name: "Breville Bambino Plus" })!), false);
  assert.equal(backToBack(coffeeSpec({ name: "Cafelat Robot" })!), false);
});
