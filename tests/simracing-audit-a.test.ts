import { test } from "node:test";
import assert from "node:assert/strict";
import { worksWith, heavyLoad, platformsOf, type RigPart } from "../lib/similar-picks";
import { simracingFacts, SIMRACING_FIT } from "../lib/simracing-fit";
import { fitVerdict } from "../lib/fit-verdict";
import { traitNote } from "../lib/trait-note";

// SimRacingRecs audit fixes, PR A (Grok audit 2026-11-17).
test("#6 #8: a cockpit is console ok; a discontinued product carries the gone fact", () => {
  const row = (shape: string, core: string | null, surface: string | null = null) => ({ shape, balance: null, core, surface, name: "x" });
  assert.deepEqual(simracingFacts(row("Cockpit", null), {}).con, ["yes"]);
  assert.equal(simracingFacts(row("Wheelbase", "PC"), {}).con, undefined);
  assert.deepEqual(simracingFacts(row("Wheel", "PC", "Discontinued: no longer on Thrustmaster's shop (Nov 2026)"), {}).gone, ["yes"]);
  assert.equal(simracingFacts(row("Wheel", "PC", "Wireless (USB dongle)"), {}).gone, undefined);
});

test("#7: a heavy load gets an aluminium-profile rig, with the load as the reason; no 'holds it all'", () => {
  const p = (id: string, type: string, weight: string | null, frame: string | null = null): RigPart => ({ id, type, brand: id, platforms: platformsOf("PC"), signal: 90, weight, frame });
  const trophy = { ...p("trophy", "Cockpit", null, "Steel frame"), signal: 99 }, profile = p("gt1", "Cockpit", null, "Aluminium profile");
  assert.equal(heavyLoad(p("ult", "Pedals", "140 kg max (200 kg load cell)")), "140 kg brake");
  assert.equal(heavyLoad(p("srp2", "Pedals", "100 kg load cell")), null);
  assert.equal(heavyLoad(p("r25", "Wheelbase", "25 Nm")), "25 Nm");
  const heavy = worksWith(p("ult", "Pedals", "140 kg max (200 kg load cell)"), [trophy, profile]);
  assert.deepEqual(heavy.map(x => [x.id, x.why]), [["gt1", "profile rig for 140 kg brake"]]);
  const light = worksWith(p("srp2", "Pedals", "100 kg load cell"), [trophy, profile]);
  assert.deepEqual(light.map(x => [x.id, x.why]), [["trophy", "steel frame"]]);
});

test("#1: with console picked, a PC-only product is held back with the console reason", () => {
  const facts = { reports: 30, tags: {}, hard: { arm: SIMRACING_FIT.words!.hardArm } } as unknown as Parameters<typeof fitVerdict>[1];
  const v = fitVerdict({ style: "any", level: "intermediate", arm: true }, facts, SIMRACING_FIT);
  assert.notEqual(v.kind, "good");
  assert.ok(JSON.stringify(v).includes("PC only"));
});

test("#27: the bars' notes are sentences, not 'Strong quiet: a real strength.'", () => {
  for (const t of SIMRACING_FIT.traits.filter(x => !x.hidden)) {
    const note = traitNote(t.key, 4, 0, 0, t.label, t.say);
    assert.ok(!/^Strong .*: a real strength\.$/.test(note), `${t.key}: ${note}`);
  }
});
