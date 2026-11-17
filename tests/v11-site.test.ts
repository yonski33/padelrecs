import { test } from "node:test";
import assert from "node:assert/strict";
import { V11_SITES } from "../lib/v11-site";
import { V11_HEADLINES } from "../lib/v11-words";

const lines = (cards: { title: string; line: string }[]) => cards.flatMap(c => [c.title, c.line]);
const ok = (t: string) => { assert.ok(t.length <= 105, `${t.length}: ${t}`); assert.ok(!/—/.test(t), `em dash: ${t}`); };

test("pickleball build cards: shape, core, weight, face in plain lines", () => {
  const c = V11_SITES.pickleball.builds({ shape: "Hybrid", core: "16 mm", weight: "8.0–8.3 oz", surface: "Raw T700 carbon" }, 2);
  assert.deepEqual(c.map(x => x.title), ["Hybrid shape", "16 mm core", "Mid weight", "Carbon face"]);
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
    assert.equal(s.bands.length, 3, id);
    assert.ok(V11_HEADLINES[id], id);
    Object.values(V11_HEADLINES[id]).forEach(ok);
  }
  assert.match(V11_HEADLINES.pickleball.no, /paddle/); assert.match(V11_HEADLINES.discgolf.no, /disc/);
});
