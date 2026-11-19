import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewerName, commenterName, isGeneratedNickname, typedName, nameProblem } from "../lib/thread/display-name";
import { makeNickname } from "../lib/nickname";

// Thread names (owner 2026-11-19): typed name, else from the reviewer's own answers, else "Anonymous". Generated ignored.
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
  assert.equal(reviewerName({ alias: "SteadyGlass787", level: null, side: null }), "Anonymous");
  assert.equal(reviewerName({ alias: null, level: null, side: "Both" }), "Plays both sides");
  assert.equal(commenterName("SteadyGlass787"), "Anonymous");
  assert.equal(commenterName("Gali"), "Gali");
  assert.equal(commenterName("[removed]"), "[removed]");
});
test("typed names: optional, up to 24 characters, no links", () => {
  assert.equal(nameProblem(""), null); assert.equal(nameProblem("Gali"), null);
  assert.ok(nameProblem("x".repeat(25))); assert.ok(nameProblem("www.spam.example")); assert.ok(nameProblem("https://x.io"));
});
