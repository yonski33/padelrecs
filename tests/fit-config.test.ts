import { test } from "node:test";
import assert from "node:assert/strict";
import { fitConfigFor } from "../lib/fit-config";
import { traitScores, specLean, type TraitInput } from "../lib/trait-score";
import { fitVerdict, styleLean } from "../lib/fit-verdict";
import { DEFAULT_CHOICE } from "../lib/quick-match";

const padel = fitConfigFor({ id: "padel" })!, pb = fitConfigFor({ id: "pickleball" })!;
const p = (id: string, tags: Record<string, number>, specs?: TraitInput["specs"]): TraitInput => ({ id, tagged: Object.values(tags).reduce((a, b) => a + b, 0), tags, specs });

test("padel is the default: passing its config changes nothing", () => {
  const pool = [p("a", { "good control": 9, forgiving: 4 }, { shape: "Round", balance: "Low" }), p("b", { "easy power": 12, "small sweet spot": 6 }, { shape: "Diamond" }), p("c", { "arm-friendly": 3 })];
  assert.deepEqual([...traitScores(pool, padel)], [...traitScores(pool)]);
  assert.equal(fitConfigFor({ id: "tennis" }), undefined);
});

test("pickleball: seven traits, every listed paddle scored, floor 3", () => {
  assert.deepEqual(pb.traits.map(t => t.label), ["Power", "Pop", "Control", "Spin", "Forgiveness", "Hand speed", "Arm comfort"]);
  const pool = Array.from({ length: 12 }, (_, i) => p(`x${i}`, { "good control": i, "easy power": 12 - i, "lots of spin": 3 }));
  const out = traitScores(pool, pb);
  for (const s of out.values()) for (const t of pb.traits) { const v = s[t.key]!; assert.ok(v.dots >= 3 && v.dots <= 5, `${t.key} ${v.dots}`); }
});

test("pickleball spec prior: 16mm leans control and forgiveness, 13–14mm power and pop, raw carbon spin, light swing weight hand speed", () => {
  const thick = specLean({ core: "16 mm", shape: "Standard", surface: "Raw T700 carbon", balance: "106" }, pb);
  assert.ok(thick.control > 0 && thick.forgiveness > 0 && thick.spin > 0 && thick.speed > 0);
  const thin = specLean({ core: "14mm", shape: "Elongated" }, pb);
  assert.ok(thin.power > 0 && thin.pop > 0 && thin.control < 0);
  for (const v of Object.values(thick)) assert.ok(Math.abs(v) <= 1);
});

test("pickleball: 2 dots only for heavy dead-spot / sweet-spot complaints", () => {
  const pool = [...Array.from({ length: 6 }, (_, i) => p(`ok${i}`, { forgiving: 3, "good control": 6 })), p("bad", { "dead spots": 9, forgiving: 1 })];
  const out = traitScores(pool, pb);
  assert.equal(out.get("bad")!.forgiveness!.dots, 2);
  assert.equal(out.get("bad")!.power!.dots, 3, "little power praise is not a complaint");
});

test("pickleball fit check: control axis counts dinks, arm check works without a harsh tag, paddle wording", () => {
  const f = { reports: 40, tags: { "great for dinks": 9, "good control": 4, "easy power": 2, "hard to control": 6, forgiving: 1, "arm-friendly": 4 } };
  assert.equal(styleLean(f, pb).lean, "control");
  const v = fitVerdict({ ...DEFAULT_CHOICE, style: "power", level: "beginner", arm: true }, f, pb);
  assert.equal(v.kind, "no");
  assert.ok(v.reasons.some(r => r.includes("control paddle")));
  assert.ok(v.reasons.some(r => r.includes("call it demanding")));
});

test("pickleball heads-ups: tags or words, negations don't count, USAP needs the problem wording", async () => {
  const { reportSays } = await import("../lib/fit-config");
  const [, , crush, usap] = pb.headsUp!;
  assert.ok(reportSays(crush, { tags: [], text: "My Pulse S is core crushing after two months." }));
  assert.ok(!reportSays(crush, { tags: [], text: "10 hours a week since launch without it core crushing." }));
  assert.ok(!reportSays(crush, { tags: [], text: "No core crush after 50+ hours." }));
  assert.ok(!reportSays(crush, { tags: [], text: "The Gen 1 build sidesteps core crush worries." }));
  assert.ok(reportSays(pb.headsUp![0], { tags: ["delamination"], text: "" }));
  assert.ok(reportSays(usap, { tags: [], text: "It was disqualified due to not USAP approved." }));
  assert.ok(!reportSays(usap, { tags: [], text: "Great grit while remaining USAP approved." }));
});
