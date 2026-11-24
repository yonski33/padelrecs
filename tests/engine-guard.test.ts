import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { engineBase, engineScore, type EngineFacts } from "../lib/engine";
import { padel } from "../lib/niche/padel";

// The divide-by-zero guard in engineBase (PM OK 2026-11-16): a catalogue with no control praise at all (SimRacingRecs before
// its level slots fill) gets 0 there, not 0/0. Every site with control praise never reaches the guard, so its numbers are
// unchanged: padel's and disc golf's fixtures both have control praise (checked old vs new code on live padel, tennis and disc
// golf too, all byte-identical).
const P = padel.fit!.engine!;
const fx = (f: string) => JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));
const padelItems = fx("engine-padel.json").items.map((x: { slug: string; n: number } & EngineFacts) => ({ id: x.slug, n: x.n, e: x }));
const dgItems = fx("engine-discgolf.json").items.flatMap((x: { id: string; facts: { reports: number }; eng?: EngineFacts }) => x.eng ? [{ id: x.id, n: x.facts.reports, e: x.eng }] : []);

test("padel and disc golf have control praise, so the guard never applies to them", () => {
  for (const items of [padelItems, dgItems]) assert.ok(items.reduce((s: number, x: { e: EngineFacts }) => s + (x.e.voices.control?.plus ?? 0), 0) > 0);
});

test("with no control praise anywhere, the axis and scores stay numbers", () => {
  const e = (name: string, power: number): EngineFacts => ({ name, year: 2026, pos: 10, mix: 2, neg: 1,
    voices: { control: { plus: 0, minus: 0 }, power: { plus: power, minus: 0 }, arm: { plus: 0, minus: 0 } }, spec: {}, expert: {} } as unknown as EngineFacts);
  const base = engineBase([{ id: "a", n: 13, e: e("A", 0) }, { id: "b", n: 13, e: e("B", 3) }], P);
  for (const id of ["a", "b"]) {
    const b = base.get(id)!; assert.ok(Number.isFinite(b.axis));
    for (const style of ["any", "control", "power"] as const) assert.ok(Number.isFinite(engineScore(b, { style }, P).cautious));
  }
});
