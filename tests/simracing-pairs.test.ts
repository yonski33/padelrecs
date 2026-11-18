import { test } from "node:test";
import assert from "node:assert/strict";
import pairs from "../db/compat/simracing-pairs.json";
import { mentions, buildPairs, type PairItem } from "../lib/simracing-pairs";

// "Works with" from the makers' table (owner 2026-11-18): the fixes Grok found hold in the built pairs file.
const P = pairs as Record<string, { name: string; shape: string; note?: string }[]>;
const names = (k: string) => (P[k] ?? []).map(x => x.name);
test("fixed-rim bases list no rims; the T80 doesn't take the TH8A; the T-LCM / T80 'check' pair is held back", () => {
  for (const b of ["Logitech G29", "Logitech G920", "Logitech G923", "Thrustmaster T80 Ferrari 488 GTB Edition", "Thrustmaster T128", "Thrustmaster T248"])
    assert.ok(!(P[b] ?? []).some(x => x.shape === "Wheel"), b);
  assert.ok(!names("Thrustmaster T80 Ferrari 488 GTB Edition").includes("Thrustmaster TH8A"));
  assert.ok(!names("Thrustmaster T80 Ferrari 488 GTB Edition").includes("Thrustmaster T-LCM"));
});
test("Fanatec rims need a hub; the RS H-Shifter needs the G Racing Adapter on a G29 on console", () => {
  assert.equal(P["Fanatec ClubSport Wheel Rim 320"]?.find(x => x.name === "Fanatec CSL DD 8 Nm")?.note, "needs a hub");
  assert.equal(P["Logitech RS H-Shifter"]?.find(x => x.name === "Logitech G29")?.note, "needs the G Racing Adapter on console");
});
test("Simucube generations and the Initium's RaceView rule; the P500 pairs with Simagic bases only", () => {
  assert.ok(!names("Simucube x BavarianSimTec Delta Pro SC").includes("Simucube 2 Pro"));
  assert.ok(!names("Simucube 3 Pro").includes("Simucube Tahko GT-21"));
  assert.ok(!names("Asetek Initium Direct Drive Wheelbase").includes("Asetek Forte Formula Pro"));
  assert.ok(names("Simagic P500").length > 0 && names("Simagic P500").every(n => n.startsWith("Simagic")));
});
test("matching: a bare type word never matches; another brand needs its name in the text; spaces are loose", () => {
  const items: PairItem[] = [{ name: "Simucube Pedals", brand: "simucube", shape: "Pedals" }, { name: "Thrustmaster T300RS", brand: "thrustmaster", shape: "Wheelbase" },
    { name: "MOZA RS V2", brand: "moza", shape: "Wheel" }];
  assert.deepEqual(mentions("all Fanatec pedals", items, ["Pedals"], "fanatec"), []);
  assert.deepEqual(mentions("T300 RS servo base", items, ["Wheelbase"], "thrustmaster").map(x => x.name), ["Thrustmaster T300RS"]);
  assert.deepEqual(mentions("Logitech RS Wheel Hub", items, ["Wheel"], "logitech"), []);
  assert.deepEqual(buildPairs({ wheelbases: { "X": { pedal_ports: "unknown" } } }, [{ name: "X", brand: "x", shape: "Wheelbase" }], []), {});
});
