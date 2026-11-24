import { test } from "node:test";
import assert from "node:assert/strict";
import { V11_SITES } from "../lib/v11-site";
import { V11_HEADLINES } from "../lib/v11-words";

const lines = (cards: { title: string; line: string }[]) => cards.flatMap(c => [c.title, c.line]);
const ok = (t: string) => { assert.ok(t.length <= 105, `${t.length}: ${t}`); assert.ok(!/—/.test(t), `em dash: ${t}`); };

test("pickleball build cards: shape, core, weight, face in plain lines", () => {
  const c = V11_SITES.pickleball.builds({ shape: "Hybrid", core: "16 mm", weight: "8.0–8.3 oz", surface: "Raw T700 carbon" }, 2);
  assert.deepEqual(c.map(x => x.title), ["Hybrid shape", "16 mm core", "8.0–8.3 oz", "Carbon face"]);
  // The face line names the material (owner 2026-11-17).
  assert.match(c[3].line, /^Raw T700 carbon: /);
  lines(c).forEach(ok);
  // Under 4 on the Arm bar no card promises comfort on the arm.
  assert.ok(!c.some(x => /arm/.test(x.line)), c.map(x => x.line).join(" | "));
  assert.match(V11_SITES.pickleball.builds({ core: "16 mm" }, 5)[0].line, /kinder to the arm/);
  assert.match(V11_SITES.pickleball.builds({ core: "14 or 16 mm" })[0].title, /14 or 16 mm core/);
});

test("disc golf build cards: flight numbers first, then stability, speed and type", () => {
  const c = V11_SITES.discgolf.builds({ shape: "Distance driver", weight: "11 / 5 / -1 / 3" });
  assert.deepEqual(c.map(x => x.key), ["flight", "gauge", "gauge", "disc"]);
  assert.deepEqual(c[0].nums, [11, 5, -1, 3]);
  assert.equal(c[1].title, "Stable"); assert.equal(c[2].title, "Speed 11");
  lines(c).forEach(ok);
  assert.deepEqual(V11_SITES.discgolf.builds({ weight: "not listed" }), []);
});

test("every v11 site has three bands and its own headline words", () => {
  for (const [id, s] of Object.entries(V11_SITES)) {
    // A per-type site (SimRacingRecs) has each type's own bars: at least three for every type.
    if (typeof s.bands === "function") for (const shape of ["Wheelbase", "Wheel", "Pedals", "Cockpit", "Shifter / handbrake"]) assert.ok(s.bands(shape).length >= 3, `${id} ${shape}`);
    else assert.equal(s.bands.length, 3, id);
    assert.ok(V11_HEADLINES[id], id);
    Object.values(V11_HEADLINES[id]).forEach(ok);
  }
  assert.match(V11_HEADLINES.pickleball.no, /paddle/); assert.match(V11_HEADLINES.discgolf.no, /disc/); assert.match(V11_HEADLINES.simracing.thin, /drivers/);
});

test("v11c build row: padel weight chip after balance, hidden without a weight; disc golf max weight", () => {
  const p = V11_SITES.padel.builds({ shape: "Round", core: "EVA Soft", balance: "Medium", weight: "345–360 g", surface: "16K carbon" });
  assert.deepEqual(p.map(x => x.title), ["Round shape", "Soft core", "Medium balance", "345–360 g", "16K carbon face"]);
  assert.match(p[3].line, /^Mid-weight: /);
  assert.match(V11_SITES.padel.builds({ weight: "340 g" })[0].line, /^Light: /);
  assert.match(V11_SITES.padel.builds({ weight: "370 g" })[0].line, /^Heavy: /);
  assert.ok(!V11_SITES.padel.builds({ shape: "Round", weight: null }).some(x => x.key === "weight"));
  assert.match(p[4].line, /^16K carbon: /);
  const d = V11_SITES.discgolf.builds({ shape: "Distance driver", weight: "11 / 5 / -1 / 3", surface: "175.1 g" });
  assert.equal(d.at(-1)!.title, "up to 175 g");
  [...p, ...d].forEach(x => assert.ok(x.line.length <= 105, x.line));
});

test("paddle build cards follow the material and the bars (Grok audit #13 #19 #25)", () => {
  const hush = V11_SITES.pickleball.builds({ core: "16 mm", surface: "eTPU foam face" }, 3, { pop: 5 });
  assert.equal(hush.find(c => c.key === "face")?.title, "Foam face");
  assert.ok(!/less pop/.test(hush[0].line), hush[0].line);
  assert.match(V11_SITES.pickleball.builds({ core: "12.7, 14 or 16 mm" })[0].line, /three thicknesses/);
  assert.ok(!/comfort/.test(V11_SITES.pickleball.builds({ surface: "Kevlar" }, 3)[0].line));
  assert.equal(V11_SITES.pickleball.builds({ surface: "Premium composite" }).length, 0);
});
test("a face with no material named gets no card; three thicknesses read as a list", () => {
  assert.equal(V11_SITES.pickleball.builds({ surface: "Proprietary raw composite" }).length, 0);
  assert.equal(V11_SITES.pickleball.builds({ core: "12.7, 14 or 16 mm" })[0].title, "12.7, 14 or 16 mm core");
});

test("sim racing v11 build chips: drive and torque for a base, brake and force for pedals, frame and seat for a cockpit; edition note", () => {
  const b = V11_SITES.simracing.builds({ shape: "Wheelbase", balance: "Direct drive", weight: "8 Nm", core: "PC; PlayStation / PC and Xbox / PC editions", surface: "Sold as separate PlayStation and Xbox editions; buy the one for your console" });
  assert.deepEqual(b.map(x => x.title), ["Direct drive", "8 Nm", "PC · PlayStation · Xbox"]);
  assert.match(b[2].line, /separate PlayStation and Xbox editions/);
  const p = V11_SITES.simracing.builds({ shape: "Pedals", balance: "Load cell", weight: "140 kg max (200 kg load cell)", core: "PC" });
  assert.deepEqual(p.map(x => x.title), ["Load cell", "140 kg", "PC"]);
  assert.match(p[1].line, /aluminium-profile rig/);
  const c = V11_SITES.simracing.builds({ shape: "Cockpit", balance: "Aluminium profile", surface: "Seat not included; Rated for wheelbases up to 40 Nm" });
  assert.deepEqual(c.map(x => x.title), ["Aluminium profile", "Up to 40 Nm"]);
  assert.match(c[1].line, /Seat sold separately/);
});
