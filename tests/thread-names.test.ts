import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewerName, commenterName, isGeneratedNickname, typedName, nameProblem } from "../lib/thread/display-name";
import { makeNickname } from "../lib/nickname";

// Thread names (owner 2026-11-19): typed name, else from the reviewer's own answers, else "Player". Generated ignored.
test("generated nicknames are recognised and ignored; typed and owner-set names stay", () => {
  for (let i = 0; i < 50; i++) assert.equal(isGeneratedNickname(makeNickname(["Volley", "Lob", "Smash", "Rally", "Bandeja", "Vibora", "Chiquita", "Rebound", "Topspin", "Slice", "Bajada", "Glass"])), true);
  for (const n of ["SharpBandeja197", "SteadyGlass787", "RapidGlass804"]) assert.equal(typedName(n), null, n);
  for (const n of ["Nacho", "CoolSmash", "padel_king_88", "Marta G.", "Sharp Bandeja 197"]) assert.equal(typedName(n), n, n);
  assert.equal(typedName("A PadelRecs player"), null);
});
test("the display rule", () => {
  assert.equal(reviewerName({ alias: "Nacho", level: "Intermediate", side: "Left" }), "Nacho");
  assert.equal(reviewerName({ alias: "SharpBandeja197", level: "Intermediate", side: null }), "Intermediate player");
  assert.equal(reviewerName({ alias: null, level: null, side: "Left" }), "Left-side player");
  assert.equal(reviewerName({ alias: "", level: "beginner", side: "Right" }), "Beginner, right side");
  assert.equal(reviewerName({ alias: "SteadyGlass787", level: null, side: null }), "Player");
  assert.equal(reviewerName({ alias: null, level: null, side: "Both" }), "Plays both sides");
  assert.equal(commenterName("SteadyGlass787"), "Player");
  assert.equal(commenterName("Gali"), "Gali");
  assert.equal(commenterName("[removed]"), "[removed]");
});
test("typed names: required, 2 to 24 characters, no links", () => {
  assert.equal(nameProblem(""), "Add a name to post."); assert.equal(nameProblem("  "), "Add a name to post."); assert.ok(nameProblem("G")); assert.equal(nameProblem("Gali"), null);
  assert.equal(typedName("Player"), null);
  assert.ok(nameProblem("x".repeat(25))); assert.ok(nameProblem("www.spam.example")); assert.ok(nameProblem("https://x.io"));
});

// Level and Side next to the name (owner 2026-11-19).
test("a byline: the name plus level and side, or level and side alone", async () => {
  const { byline, profileLine, commenterName: cn } = await import("../lib/thread/display-name");
  assert.deepEqual(byline("Gali A", "Intermediate", "Left"), { who: "Gali A", meta: "Intermediate, left side" });
  assert.deepEqual(byline("Gali A", null, null), { who: "Gali A", meta: null });
  assert.deepEqual(byline("", "Intermediate", "Left"), { who: "Intermediate, left side", meta: null });
  assert.deepEqual(byline("SteadyGlass787", null, null), { who: "Player", meta: null });
  assert.deepEqual(byline("[removed]", "Advanced", "Right"), { who: "[removed]", meta: null });
  assert.equal(profileLine(null, "Both"), "Both sides"); assert.equal(profileLine("Beginner", null), "Beginner"); assert.equal(profileLine(null, null), null);
  assert.equal(cn("", "Advanced", "Right"), "Advanced, right side");
});
test("posting needs a name, or a level or side", async () => {
  const { postProblem, POST_HINT } = await import("../lib/thread/display-name");
  assert.equal(postProblem("", null, null), `${POST_HINT}.`); assert.equal(POST_HINT, "Add a name or pick your level to post");
  assert.equal(postProblem("", "Beginner", null), null); assert.equal(postProblem("  ", null, "Left"), null);
  assert.equal(postProblem("Gali", null, null), null); assert.ok(postProblem("G", "Beginner", null), "a typed name keeps its rules");
});
