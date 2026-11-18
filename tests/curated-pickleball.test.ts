import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { curatedEntries, curatedFor, curatedKey, curatedRanking, curatedRankingStyle, curatedSlugs, hasCurated } from "../lib/curated";
import { pickleball as pickleballNiche } from "../lib/niche/pickleball";
import pickleball from "../db/curated/pickleball.json";
import padel from "../db/curated/padel.json";

// PickleballRecs' curated top 10s (owner "Import them" 2026-11-19): 24 lists, control / balance / power / spin × level × arm,
// read per site, so padel's lists and pages stay exactly as they were.
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const picks = <S extends string>(styles: readonly S[]) => styles.flatMap(style => LEVELS.flatMap(level => [false, true].map(arm => ({ style, level, arm }))));
const PB = picks(["control", "balance", "power", "spin"] as const), PADEL = picks(["control", "balance", "power"] as const);
const final = JSON.parse(readFileSync(new URL("../db/racket-page/pickleball.json", import.meta.url), "utf8")) as Record<string, unknown>;

test("pickleball: all 24 lists load, in the owner-approved order, every pick the owner's", () => {
  assert.ok(hasCurated("pickleball"));
  assert.equal(Object.keys(pickleball.lists).length, 24);
  for (const c of PB) {
    const l = curatedEntries(c, "pickleball");
    assert.ok(l.length >= 6 && l.length <= 10, `${curatedKey(c)}: ${l.length}`);
    assert.deepEqual(l.map(e => e.slug), (pickleball.lists as Record<string, { slug: string }[]>)[curatedKey(c)].map(e => e.slug));
    assert.ok(l.every(e => e.owner), curatedKey(c));
    assert.equal(new Set(l.map(e => e.slug)).size, l.length, `${curatedKey(c)}: no repeats`);
  }
  assert.deepEqual(curatedFor({ style: "spin", level: "beginner", arm: false }, "pickleball").slice(0, 2), ["honolulu-j2cr", "six-zero-coral-pro-16mm"]);
  assert.deepEqual(curatedFor({ style: "any", level: "beginner", arm: false }, "pickleball"), [], "no list for any style");
});

test("pickleball: every curated slug is a paddle in the catalogue", () => {
  for (const s of curatedSlugs("pickleball")) assert.ok(s in final, s);
});

test("pickleball: the site's styles all have lists; #1–3 are Strong fits as on padel", () => {
  const styles = pickleballNiche.fit!.engine!.styles!;
  for (const style of styles) for (const level of LEVELS) for (const arm of [false, true]) assert.ok(curatedKey({ style, level, arm }) in pickleball.lists);
  assert.deepEqual(pickleballNiche.fit!.engine!.curatedTop, [90, 86, 82]);
});

test("pickleball rankings pages: power, control and spin from their lists; overall keeps its score order", () => {
  const fam = (s: string) => ({ key: s, year: 2026 });
  assert.deepEqual(curatedRanking("best-power-pickleball-paddles", fam, "pickleball"), pickleball.lists["power/advanced/arm-off"].map(e => e.slug));
  const ctrl = curatedRanking("best-control-pickleball-paddles", fam, "pickleball")!, spin = curatedRanking("best-spin-pickleball-paddles", fam, "pickleball")!;
  assert.equal(ctrl[0], pickleball.lists["control/intermediate/arm-off"][0].slug); assert.equal(new Set(ctrl).size, ctrl.length);
  assert.equal(spin[0], pickleball.lists["spin/intermediate/arm-off"][0].slug); assert.equal(new Set(spin).size, spin.length);
  assert.equal(curatedRankingStyle("best-spin-pickleball-paddles", "pickleball"), "spin");
  assert.equal(curatedRanking("best-pickleball-paddles", fam, "pickleball"), null);
});

test("padel unchanged: its 18 lists and pages read only padel's file", () => {
  assert.equal(Object.keys(padel.lists).length, 18);
  for (const c of PADEL) assert.deepEqual(curatedFor(c, "padel"), (padel.lists as Record<string, { slug: string }[]>)[curatedKey(c)].map(e => e.slug));
  assert.deepEqual(curatedEntries({ style: "spin", level: "beginner", arm: false }, "padel"), []);
  const pb = new Set(curatedSlugs("pickleball"));
  assert.ok(curatedSlugs("padel").every(s => !pb.has(s)));
  assert.equal(curatedRankingStyle("best-power-padel-rackets", "padel"), "power");
  assert.equal(curatedRankingStyle("best-power-pickleball-paddles", "padel"), null);
  assert.equal(hasCurated("tennis"), false);
});

test("the importer reads spin combinations", async () => {
  const { keyOf } = await import("../scripts/import-curated.mjs");
  assert.equal(keyOf("spin-advanced-arm"), "spin/advanced/arm-on");
  assert.equal(keyOf("control-beginner-noarm"), "control/beginner/arm-off");
  assert.equal(keyOf("topspin-advanced-arm"), null);
});
