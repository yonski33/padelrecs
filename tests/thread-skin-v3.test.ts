// SkinRecs on the PadelRecs v3 pages (V3-ROLLOUT-BRIEF wave 2, 2026-11-21): one site config, its own words and pills, no score.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { v3Site, postTypeSite, quickMatchFor, followSite, storiesSite } from "../lib/thread/sites";
import { votePill, SKIN_PILL_WORDS, SKIN_PILL_LABELS } from "../lib/thread/vote-pill";
import { SKIN_TRAIT_GROUPS } from "../lib/thread/traits";
import { SKIN_HOW } from "../lib/thread/rankings-hub";

const code = (f: string) => readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

test("SkinRecs is a v3 site with the typed feed and questions; no follows, no stories; its own quick match", () => {
  assert.equal(v3Site("skin"), true);
  assert.equal(postTypeSite("skin"), true);
  assert.equal(quickMatchFor("skin"), "skin");
  assert.equal(followSite("skin"), false);
  assert.equal(storiesSite("skin"), false);
});

test("skin pills read quality first, then the community word; the skin type keeps Most picked for", () => {
  assert.equal(votePill({ irritation: { none: 14, a_little: 3, a_lot: 1 } }, "people", SKIN_PILL_WORDS, SKIN_PILL_LABELS), "Gentle, no irritation · 14 people");
  assert.equal(votePill({ skin_type: { dry: 9, combination: 2, oily: 1 } }, "people", SKIN_PILL_WORDS, SKIN_PILL_LABELS), "Most picked for dry skin · 9 people");
  // A middle answer never makes a pill; under 5 behind it, none either.
  assert.equal(votePill({ value: { ok: 12, worth_it: 2 } }, "people", SKIN_PILL_WORDS, SKIN_PILL_LABELS), null);
  assert.equal(votePill({ scent: { none: 4 } }, "people", SKIN_PILL_WORDS, SKIN_PILL_LABELS), null);
  // Every pill answer is a real option of its group.
  for (const [k, opts] of Object.entries(SKIN_PILL_WORDS)) {
    const g = SKIN_TRAIT_GROUPS.find(x => x.key === k);
    assert.ok(g, k);
    for (const o of Object.keys(opts)) assert.ok(g!.options.some(([v]) => v === o), `${k}.${o}`);
  }
});

test("skin v3 copy: no score, no em dash, no owners or players, never verdict", () => {
  const text = [...Object.values(SKIN_PILL_LABELS).flatMap(o => Object.values(o)), ...SKIN_HOW.flatMap(s => [s.title, ...s.body])].join("\n").replace("Counts only, never a score.", "");
  assert.doesNotMatch(text, /—|\bowners?\b|\bplayers?\b|\bverdict\b|\bscore\b/i);
  const skin = code("app/thread/live/skin-match.tsx");
  const v3 = skin.slice(skin.indexOf("function SkinBar"));
  assert.doesNotMatch(v3, /—|\bowners?\b|\bplayers?\b|\bverdict\b|th-badge new|W\.score|\bsignal\b(?!:)/i);
});

test("the skin look stays its own: skin-v3.css is scoped to .th-skin and has no black header bars", () => {
  const css = readFileSync("app/thread/skin-v3.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const rule of css.split("}").map(r => r.trim()).filter(Boolean)) assert.match(rule.split("{")[0], /\.th-skin/, rule);
  assert.doesNotMatch(css, /background:\s*var\(--ink\)/);
});

test("skin pills: every placeholder word has a label, and each page that uses skin's words passes skin's labels", async () => {
  const { SKIN_PILL_WORDS, SKIN_PILL_LABELS } = await import("../lib/thread/vote-pill");
  for (const [g, words] of Object.entries(SKIN_PILL_WORDS)) for (const [k, w] of Object.entries(words))
    if (w === "x") assert.ok(SKIN_PILL_LABELS[g]?.[k], `${g}.${k} has a label`);
  const { readFileSync } = await import("node:fs");
  for (const f of ["app/thread/padel-list-data.ts", "app/thread/rackets/[slug]/page.tsx", "app/thread/rankings/[slug]/page.tsx", "app/compare/compare-v3.tsx"]) {
    const src = readFileSync(f, "utf8");
    if (src.includes("SKIN_PILL_WORDS")) assert.ok(/SKIN \? SKIN_PILL_LABELS|SKIN_PILL_WORDS, SKIN_PILL_LABELS/.test(src), `${f} passes SKIN_PILL_LABELS`);
  }
});
