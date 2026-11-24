import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { niches } from "../lib/niche/all";

// Owner 2026-11-18 (AFTER-RESET.md 2, 3, 5, 6): the shared v11c product page's small fixes.
const fit = readFileSync("app/rackets/[slug]/racket-fit.tsx", "utf8");
const css = readFileSync("app/rackets/[slug]/v11.css", "utf8");

test("reviews section: each site's own word for its reviewers", () => {
  const who = (id: string) => (niches[id].reviewers ?? niches[id].people).many;
  assert.equal(who("discgolf"), "throwers");
  assert.equal(who("padel"), "players");
  assert.equal(who("simracing"), "drivers");
  assert.equal(who("coffee"), "home baristas");
  // No hard-coded "players" / "Thrown it?" in the props the page hands the reviews section.
  assert.doesNotMatch(fit, /peopleTab: SITE_FIT\.words \? niche\.people\.many : "players"/);
  assert.doesNotMatch(fit, /: "Thrown it\?"/);
});

test("why yes, why not: no heading, source line above, even rows", () => {
  assert.doesNotMatch(fit, /<h2>Why yes, why not<\/h2>/);
  assert.match(fit, /className="v11-ysrc"/);
  assert.match(css, /\.rf \.v11-yit \{ margin: 0;/);
});

test("jump to reviews link near the hero, score box links to the reviews", () => {
  assert.match(fit, /className="v11-jump" href="#reviews">\{`Jump to reviews \(\$\{cards\.length\}\) ↓`\}/);
  assert.match(fit, /className="v11-sl" href="#reviews"/);
});
