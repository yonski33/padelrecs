import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, checkCompat, type CatalogItem } from "../lib/simracing-compat";
import { simracingFacts, simracingLevelCap, SIMRACING_FIT } from "../lib/simracing-fit";
import { fitVerdict } from "../lib/fit-verdict";

// SimRacingRecs PR B (PM 2026-11-18): platform pick, torque level cap, the compatibility CSV checks.
test("platform facts: PlayStation / Xbox / PC from the platforms; a cockpit works with all", () => {
  const row = (shape: string, core: string) => ({ shape, balance: null, core, surface: null, name: "x" });
  assert.deepEqual(simracingFacts(row("Wheelbase", "PC, PlayStation"), {}).platform, ["pc", "ps"]);
  assert.deepEqual(simracingFacts(row("Wheelbase", "PC"), { platform: "PC, Xbox" }).platform, ["pc", "xbox"], "the owner sheet wins");
  assert.deepEqual(simracingFacts(row("Cockpit", ""), {}).platform, ["pc", "ps", "xbox"]);
});

test("a picked platform the product lacks is 'Probably not', with the platforms it does work on", () => {
  const facts = { reports: 30, tags: {}, ff: { platform: ["pc", "xbox"] } } as unknown as Parameters<typeof fitVerdict>[1];
  const v = fitVerdict({ style: "any", level: "beginner", arm: false, ff: { platform: "ps" } }, facts, SIMRACING_FIT, "good");
  assert.equal(v.kind, "no");
  assert.ok(JSON.stringify(v).includes("Not on PlayStation: it works on Xbox and PC"));
  assert.notEqual(fitVerdict({ style: "any", level: "beginner", arm: false, ff: { platform: "xbox" } }, facts, SIMRACING_FIT, "good").kind, "no");
});

test("torque caps a wheelbase's levels: under 6 new, 6–12 new and serious, 12+ serious and all-in", () => {
  const wb = (weight: string | null, slug = "x") => ({ slug, shape: "Wheelbase", weight });
  assert.deepEqual(simracingLevelCap(wb("3.9 Nm"), {}), { beginner: true, intermediate: false, advanced: false });
  assert.deepEqual(simracingLevelCap(wb("8 Nm"), {}), { beginner: true, intermediate: true, advanced: false });
  assert.deepEqual(simracingLevelCap(wb("12 Nm"), {}), { beginner: false, intermediate: true, advanced: true });
  assert.deepEqual(simracingLevelCap(wb(null), { torque_nm: 25 }), { beginner: false, intermediate: true, advanced: true }, "the owner sheet's torque");
  assert.equal(simracingLevelCap(wb(null), {}), null, "unknown torque: no cap");
  assert.equal(simracingLevelCap({ slug: "p", shape: "Pedals", weight: "100 kg load cell" }, {}), null);
});

test("compat CSVs: catalogue names only, the right type, a maker link on every row, no duplicates", () => {
  const catalog: CatalogItem[] = [{ name: "Logitech G29", brand: "logitech", shape: "Wheelbase" }, { name: "MOZA R5", brand: "moza", shape: "Wheelbase" },
    { name: "MOZA ES", brand: "moza", shape: "Wheel" }];
  const csv = `name,fixed_rim,qr_system,platforms,editions,pedal_ports,shifter_ports,source,notes
Logitech G29,yes,none,"PC, PlayStation",single,G29 pedals,Driving Force Shifter,https://www.logitechg.com/en-us/shop/p/driving-force-racing-wheel,
Moza R5,no,MOZA QR,PC,single,USB only,USB only,https://mozaracing.com/products/r5,
MOZA ES,no,,PC,single,,,https://mozaracing.com/products/es,
Logitech G29,yes,none,PC,single,,,https://www.logitechg.com/x,`;
  const { problems, ok, missing } = checkCompat("wheelbases", parseCsv(csv), catalog);
  assert.deepEqual(ok.map(r => r.name), ["Logitech G29"]);
  assert.ok(problems.some(p => p.includes(`did you mean "MOZA R5"`)));
  assert.ok(problems.some(p => p.includes("is a Wheel, not a Wheelbase")));
  assert.ok(problems.some(p => p.includes("twice")));
  assert.deepEqual(missing, ["MOZA R5"]);
  const shop = checkCompat("wheelbases", parseCsv(`name,source\nMOZA R5,https://www.amazon.com/dp/x`), catalog);
  assert.ok(shop.problems.some(p => p.includes("no moza maker link")));
});
