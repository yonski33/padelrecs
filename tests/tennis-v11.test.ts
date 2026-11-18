import { test } from "node:test";
import assert from "node:assert/strict";
import { V11_SITES } from "../lib/v11-site";
import { V11_HEADLINES } from "../lib/v11-words";
import { fitConfigFor } from "../lib/fit-config";

const ok = (t: string) => { assert.ok(t.length <= 105, `${t.length}: ${t}`); assert.ok(!/—/.test(t), `em dash: ${t}`); };
const tn = V11_SITES.tennis;

test("tennis v11: Power / Control / Spin bands, racket headline, words for every trait", () => {
  assert.deepEqual(tn.bands.map(b => b[1]), ["Power", "Control", "Spin"]);
  assert.equal(V11_HEADLINES.tennis.no, "Probably not your racket");
  for (const t of fitConfigFor({ id: "tennis" })!.traits) { assert.ok(t.say && t.diff && t.ifYou, t.key); assert.ok(tn.giveUp[t.key], t.key); for (const x of [t.say!.hi, t.say!.mid, t.say!.lo]) ok(x); }
});

test("tennis build cards: head size, pattern, weight with balance, stiffness", () => {
  const c = tn.builds({ shape: "98 sq in (632 cm²)", core: "16x19", weight: "323 g strung", balance: "7 pts HL strung", surface: "66 RA" }, 3);
  assert.deepEqual(c.map(x => x.title), ["98 sq in head", "16x19 pattern", "323 g strung", "66 RA"]);
  for (const x of c) { ok(x.title); ok(x.line); }
  assert.match(c[2].line, /^Mid weight head-light/);
  assert.match(tn.builds({ core: "18x20" })[0].line, /controlled/);
  assert.match(tn.builds({ core: "16x19 or 18x20" })[0].line, /two patterns/);
});

test("tennis build cards: comfort only where the Arm bar backs it", () => {
  assert.doesNotMatch(tn.builds({ surface: "60 RA" }, 3)[0].line, /comfort/);
  assert.match(tn.builds({ surface: "60 RA" }, 4)[0].line, /comfort/);
  assert.match(tn.builds({ surface: "70 RA" }, 3)[0].line, /harder on a sore arm/);
  assert.doesNotMatch(tn.builds({ surface: "70 RA" }, 4)[0].line, /arm/);
});
