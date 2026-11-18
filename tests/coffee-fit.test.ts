import { test } from "node:test";
import assert from "node:assert/strict";
import { COFFEE_FIT, coffeeFacts, coffeeMiss } from "../lib/coffee-fit";
import { coffeeRules, TIER_SUITS } from "../lib/coffee-hard";
import { claimBlock, specFact } from "../lib/claim-guard";
import { passesFilters } from "../lib/quick-match";
import { fitVerdict, type FitFacts } from "../lib/fit-verdict";
import { readChoiceKey, choiceKey } from "../lib/quick-match";

const row = (name: string, shape: string, surface: string | null = null) => ({ name, shape, balance: null, core: null, surface });
const ok = (t: string) => { assert.ok(t.length <= 105, `${t.length}: ${t}`); assert.ok(!/—/.test(t), `em dash: ${t}`); };

test("coffee profile: six or fewer qualities per type, expert words in range", () => {
  for (const shape of ["Espresso machine", "Grinder", "Brewer", "Kettle", "Scale"]) {
    const shown = COFFEE_FIT.traits.filter(t => !t.hidden && (!t.appliesTo || t.appliesTo.includes(shape)));
    assert.ok(shown.length >= 3 && shown.length <= 6, `${shape}: ${shown.map(t => t.key)}`);
  }
  for (const t of COFFEE_FIT.traits.filter(x => !x.hidden)) { assert.ok(t.say && t.diff && t.ifYou, t.key); for (const x of [t.say!.hi, t.say!.mid, t.say!.lo]) ok(x); }
});

test("coffee facts: drink, budget and each type's filters", () => {
  assert.deepEqual(coffeeFacts(row("Fellow Ode Gen 2", "Grinder")).drink, ["filter"]);
  assert.deepEqual(coffeeFacts(row("Niche Zero", "Grinder")).drink, ["espresso", "milk", "filter"]);
  assert.deepEqual(coffeeFacts(row("1Zpresso Q Air", "Grinder")).drink, ["filter"]); // espresso limited (G1)
  assert.deepEqual(coffeeFacts(row("Cafelat Robot", "Espresso machine")).drink, ["espresso"]); // no steam
  assert.deepEqual(coffeeFacts(row("Lelit Mara X", "Espresso machine")).steam, ["b2b"]);
  assert.equal(coffeeFacts(row("Breville Bambino Plus", "Espresso machine")).steam, undefined);
  assert.deepEqual(coffeeFacts(row("Breville Barista Express", "Espresso machine")).grinder, ["built"]);
  assert.deepEqual(coffeeFacts(row("Acaia Pearl", "Scale")).drink, ["filter"]); // too big for a drip tray (S1)
  assert.deepEqual(coffeeFacts(row("Fellow Clyde", "Kettle")).drink, ["espresso", "milk", "filter"]); // K2
  assert.deepEqual(coffeeFacts(row("Fellow Aiden", "Brewer")).effort, ["button"]);
  assert.deepEqual(coffeeFacts(row("Baratza Encore ESP Pro", "Grinder", "40 mm conical burrs (M2), 300 g hopper or 45 g single dose")).form, ["hopper", "single"]);
  assert.deepEqual(coffeeFacts(row("Decent Bengle", "Espresso machine")).gone, ["yes"]);
  assert.deepEqual(coffeeFacts(row("Profitec GO", "Espresso machine")).gone, ["yes"]);
});

test("coffee filters: a type's own filter never drops another type; gone never ranks", () => {
  const c = { style: "any" as const, arm: false, ff: { steam: "b2b" } };
  assert.equal(passesFilters({ kind: "grinder", ff: coffeeFacts(row("Niche Zero", "Grinder")) }, c, COFFEE_FIT), true);
  assert.equal(passesFilters({ kind: "espresso", ff: coffeeFacts(row("Breville Bambino", "Espresso machine")) }, c, COFFEE_FIT), false);
  assert.equal(passesFilters({ kind: "espresso", ff: coffeeFacts(row("Decent Bengle", "Espresso machine")) }, { style: "any", arm: false }, COFFEE_FIT), false);
});

test("coffee fit check: the main pick's reason in coffee words", () => {
  const ode = coffeeMiss(row("Fellow Ode Gen 2", "Grinder"), "drink", "espresso")!;
  assert.equal(ode.short, "Not for espresso"); ok(ode.reason); assert.match(ode.reason, /fine enough/);
  assert.match(coffeeMiss(row("Cafelat Robot", "Espresso machine"), "drink", "milk")!.reason, /steam wand/);
  const f: FitFacts = { reports: 50, tags: {}, ff: coffeeFacts(row("Fellow Ode Gen 2", "Grinder")), ffWhy: { "drink:espresso": ode } };
  const v = fitVerdict({ style: "any", arm: false, ff: { drink: "espresso" } }, f, COFFEE_FIT, "good");
  assert.equal(v.kind, "no"); assert.equal(v.reasons[0], ode.reason);
});

test("coffee level rules: lever hard for newcomers, profiling and HX without PID soft, tiers as level scores", () => {
  assert.match(coffeeRules({ slug: "cafelat-robot" }).hard?.beginner ?? "", /manual lever/i);
  assert.match(coffeeRules({ slug: "lelit-bianca-v3" }).warn?.beginner ?? "", /profiling/);
  assert.match(coffeeRules({ slug: "rocket-espresso-appartamento" }).warn?.beginner ?? "", /cooling flush/);
  assert.equal(coffeeRules({ slug: "rocket-espresso-appartamento-tca" }).warn, undefined); // it has a PID
  assert.deepEqual(coffeeRules({ slug: "breville-bambino" }).specSuits, TIER_SUITS.beginner);
  for (const r of Object.values(coffeeRules({ slug: "lelit-bianca-v3" }).hard ?? {})) ok(r!);
});

test("coffee claim guard: no 'stronger on steam' that the heaters contradict", () => {
  const db = { spec: { balance: "Dual boiler" }, tr: { dots: 4, plus: 9, minus: 0 } }, tb = { spec: { balance: "Thermoblock" }, tr: { dots: 4, plus: 9, minus: 0 } };
  assert.ok(claimBlock("coffee", "steam", 1, tb, db)); // a thermoblock is never "stronger on steam" than a dual boiler
  assert.equal(claimBlock("coffee", "steam", 1, db, tb), null);
  assert.ok(claimBlock("coffee", "steam", 1, { spec: { balance: "Manual lever" }, tr: { dots: 5, plus: 9, minus: 0 } }, tb));
  assert.match(specFact("coffee", "steam", { balance: "Dual boiler" }, { balance: "Thermoblock" })!.note(), /dual boiler vs thermoblock/);
});

// The view key reads the running site's filters, so this runs with NICHE=coffee.
test("coffee view keys: the $$$$ tier round-trips", { skip: process.env.NICHE !== "coffee" }, () => {
  const c = { style: "any" as const, arm: false, kind: "espresso", ff: { budget: "$$$$" } };
  const k = choiceKey(c, false);
  assert.match(k, /\.4d\./); assert.deepEqual(readChoiceKey(k)?.choice.ff, { budget: "$$$$" });
});
