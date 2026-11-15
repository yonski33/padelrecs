import test from "node:test";
import assert from "node:assert/strict";
import { modelFamily } from "../lib/compare-pairs";
import { fitVerdict, type FitFacts } from "../lib/fit-verdict";
import { matchFit } from "../lib/match-score";

const fam = (name: string) => modelFamily({ name, brandId: "b" });
test("a model's years and generations are one family, other models are not", () => {
  assert.equal(fam("Metalbone HRD+ 3.4 2025"), fam("Metalbone HRD+ 3.5 2026"));
  assert.equal(fam("Electra Pro ST4 2025"), fam("Electra Pro ST5 2026"));
  assert.equal(fam("Fenix Pro 5 2025"), fam("Fenix Pro 6 2026"));
  assert.equal(fam("Neuron 2024"), fam("Neuron 02 2027"));
  assert.notEqual(fam("AT10 Genius 12K 2025"), fam("AT10 Genius 18K 2026"));
  assert.notEqual(fam("Vertex 05 Hybrid 2026"), fam("Vertex 05 Geo 2026"));
  assert.notEqual(fam("AT10 Genius 2026"), fam("EA10 Genius 2026"));
  assert.notEqual(modelFamily({ name: "Pro 2026", brandId: "a" }), modelFamily({ name: "Pro 2026", brandId: "b" }));
});

const base: FitFacts = { reports: 40, tags: { "good control": 14, "easy power": 10 }, suits: { beginner: 20, intermediate: 60, advanced: 85, basis: ["5 players"] } };
const c = { style: "power", level: "advanced", arm: false, fine: { shape: "hybrid" } } as const;
test("inside a picked shape, a strong all-rounder counts as built for the style, a control racket mid-pack is soft", () => {
  assert.equal(fitVerdict(c, base).kind, "maybe");
  assert.equal(fitVerdict(c, { ...base, styleWithin: { rank: 0.8, shape: "hybrid" } }).kind, "good");
  assert.equal(fitVerdict(c, { ...base, styleWithin: { rank: 0.3, shape: "hybrid" } }).kind, "maybe");
  const control: FitFacts = { ...base, tags: { "good control": 29, "easy power": 7 } };
  assert.equal(fitVerdict(c, control).kind, "no");
  assert.equal(fitVerdict(c, { ...control, styleWithin: { rank: 0.5, shape: "hybrid" } }).kind, "maybe");
  assert.equal(fitVerdict(c, { ...control, styleWithin: { rank: 0.2, shape: "hybrid" } }).kind, "no");
});
test("the style part leans on the place inside the shape", () => {
  const m = { control: 48, power: 50, arm: null, signal: 79, suits: 85 };
  assert.ok(matchFit(c, { ...m, styleWithin: 0.9 }) > matchFit(c, m));
  assert.ok(matchFit(c, { ...m, styleWithin: 0.1 }) < matchFit(c, m));
});

test("a newest year without enough reports hands the row to the newest year that has them, with a link to the new one", async () => {
  const { rowOfFamily } = await import("../lib/compare-pairs");
  const p = (id: string, year: number) => ({ id, name: `AT10 Genius 12K Alum Xtrem ${year}`, brandId: "nox", year }) as never as Parameters<typeof rowOfFamily>[0];
  const y25 = p("a", 2025), y26 = p("b", 2026), y27 = p("c", 2027), all = [y25, y26, y27];
  const reports: Record<string, number> = { a: 70, b: 79, c: 3 };
  const row = rowOfFamily(y25, all, r => reports[(r as { id: string }).id] >= 6);
  assert.equal((row.shown as { id: string }).id, "b");
  assert.equal((row.newer as { id: string } | null)?.id, "c");
  reports.c = 6; // once the newest has enough, it takes the row
  const next = rowOfFamily(y26, all, r => reports[(r as { id: string }).id] >= 6);
  assert.equal((next.shown as { id: string }).id, "c");
  assert.equal(next.newer, null);
  // no year has enough: the newest still shows
  assert.equal((rowOfFamily(y25, all, () => false).shown as { id: string }).id, "c");
});
