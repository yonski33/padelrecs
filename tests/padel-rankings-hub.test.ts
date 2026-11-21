import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ratingTen, HOW, HOW_INTRO, HUB_LEAD, HUB_GROUPS, HUB_BLURB, hubBlurb, hubPlace, hubTitle } from "../lib/thread/rankings-hub";
import { threadPath } from "../lib/thread/look";

test("rating on a 0 to 10 scale", () => {
  assert.equal(ratingTen(97), "9.7");
  assert.equal(ratingTen(80), "8.0");
  assert.equal(ratingTen(60), "6.0");
});

test("copy: honest order, no score, house rules", () => {
  const lead = HUB_LEAD;
  assert.ok(lead);
  for (const t of [lead, HOW_INTRO, ...HOW.flatMap(s => [s.title, ...s.body]), ...HUB_GROUPS.flatMap(g => [g.title, g.sub]), ...Object.values(HUB_BLURB)]) {
    assert.doesNotMatch(t, /—|\bwe\b|\bus\b|\bour\b|verdict|player score|0-100|\d+%/i, t);
    // Lists never "change as new reviews come in". (Votes may order a list now: lib/thread/vote-order.ts.)
    assert.doesNotMatch(t, /change as new reviews/i, t);
  }
  assert.ok(lead.length <= 105, lead);
});

test("hub and How page: page-scoped CSS, no score", () => {
  const css = readFileSync(new URL("../app/thread/rankings/rankings-hub.css", import.meta.url), "utf8");
  // Every rule under .rkh (the ranking list owns .rk4 in thread.css).
  const sels = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]+\{/g, "").match(/[^{}]+(?=\{)/g) ?? [];
  for (const s of sels) for (const one of s.split(",")) assert.match(one.trim(), /^(\.th )?\.rkh\b/, one);
  const ui = readFileSync(new URL("../app/thread/rankings/hub-v3.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(ui, /r\.score|Badge|rk4/);
});

test("How rankings work: a padel address only", () => {
  assert.equal(threadPath("/how-rankings-work", "/rackets", "padel"), "/thread/how-rankings");
  assert.equal(threadPath("/how-rankings-work/", "/rackets", "padel"), "/thread/how-rankings");
  assert.equal(threadPath("/how-rankings-work", "/paddles", "pickleball"), null);
  assert.equal(threadPath("/how-rankings-work", "/products", "skin"), null);
  assert.equal(threadPath("/how-we-make-these", "/rackets", "padel"), "/thread/score");
});

test("hub v4: the mock's three groups, its card titles and lines", () => {
  const where = (slug: string) => HUB_GROUPS.findIndex(g => hubPlace(g, slug) >= 0);
  assert.equal(where("best-padel-rackets"), 0);
  assert.equal(where("best-power-padel-rackets"), 0);
  assert.equal(where("best-control-padel-rackets"), 0);
  assert.equal(where("best-padel-rackets-for-tennis-elbow"), 1);
  assert.equal(where("best-padel-rackets-2025"), 1);
  assert.equal(where("best-teardrop-padel-rackets"), 2);
  assert.ok(hubPlace(HUB_GROUPS[1], "best-padel-rackets-for-tennis-elbow") < hubPlace(HUB_GROUPS[1], "best-padel-rackets-2025"), "the mock's order");
  assert.equal(hubTitle("Best teardrop rackets"), "Best teardrop");
  assert.equal(hubTitle("Best for power"), "Best for power");
  assert.equal(hubBlurb("best-padel-rackets-2025"), "Last season, often cheaper now.");
  assert.doesNotMatch(hubBlurb("best-padel-rackets")!, /best-reviewed/, "Best overall goes by most loved now");
  const ui = readFileSync(new URL("../app/thread/rankings/hub-v3.tsx", import.meta.url), "utf8");
  const code = ui.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /rating|ratingTen|\.score\b|opinions/i, "no score, no rating, no counts on the hub");
  assert.match(ui, /How rankings work →/);
});
