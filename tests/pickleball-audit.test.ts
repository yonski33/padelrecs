import { test } from "node:test";
import assert from "node:assert/strict";
import { paddleRules } from "../lib/pickleball-hard";
import { pageBar } from "../lib/page-bars";

test("a page that says 'Not a first paddle' is a hard no for beginners, with its own words", () => {
  const r = paddleRules({ slug: "x" }, false, { no: [{ title: "Not a first paddle", t: "The pop ==takes sessions to tame==." }] });
  assert.equal(r.hard?.beginner, "Not a first paddle: The pop takes sessions to tame.");
  assert.equal(paddleRules({ slug: "x" }, false, { bottom: "A strong main paddle. Beginners: go softer." }).hard?.beginner, "A strong main paddle. Beginners: go softer.".split(". ")[1]);
});

test("the bottom line's level counts only where the paddle has no level data", () => {
  const page = { bottom: "For intermediates who want calm power. Already on a Vapor Power?" };
  assert.equal(paddleRules({ slug: "x" }, false, page).hard, undefined);
  assert.equal(paddleRules({ slug: "x" }, true, page).hard?.beginner, "For intermediates who want calm power.");
  assert.equal(paddleRules({ slug: "x" }, true, { bottom: "For beginners and intermediates who want pop." }).hard, undefined);
});

test("sore-arm advice on the page is a hard no for sore arms", () => {
  assert.match(paddleRules({ slug: "x" }, false, { no: [{ title: "Can hurt sore arms", t: "The stiff face can flare a sore elbow." }] }).hard?.arm ?? "", /sore arms/);
  assert.equal(paddleRules({ slug: "x" }, false, { no: [{ title: "Wears out fast", t: "The grit fades in months." }] }).hard, undefined);
});

test("a bar never reads the opposite of the page's own clear claim", () => {
  assert.equal(pageBar("spin", 3, { tagline: "A hard-hitting 14 mm hybrid with big spin." }), 4);
  assert.equal(pageBar("power", 4, { tagline: "A soft paddle. The catch: it gives up some pace." }), 3);
  assert.equal(pageBar("power", 3, { yes: [{ title: "Easy power", t: "Drives leave the face with pace." }], no: [{ title: "Little free power", t: "You supply the pace." }] }), 3);
  assert.equal(pageBar("power", 3, { yes: [{ title: "Quiet", t: "It's not a cannon, which suits me." }] }), 3);
  assert.equal(pageBar("control", 5, null), 5);
});

import { specNumber } from "../lib/spec-number";
test("research notes in a spec read as one clean range; labelled values stay", () => {
  assert.equal(specNumber("115 (john kew) · 116 (studio) · 120 (paddlespecs)"), "115–120");
  assert.equal(specNumber("116 (studio)"), "116");
  assert.equal(specNumber("14 mm: 111 · 16 mm: 114"), "14 mm: 111 · 16 mm: 114");
  assert.equal(specNumber("Low (head-light)"), "Low (head-light)");
  assert.equal(specNumber("108-112"), "108-112");
});
test("research notes with capitals read as one range too", () => {
  assert.equal(specNumber("115 (John Kew) · 116 (Studio) · 120 (PaddleSpecs)"), "115–120");
});
