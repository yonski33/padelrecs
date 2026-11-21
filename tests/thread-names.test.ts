import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewerName, commenterName, isGeneratedNickname, typedName, nameProblem, reviewerInfo, isProfileOnlyName, PROFILE_NAME, subreddit } from "../lib/thread/display-name";
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

test("unnamed reviews: level and side as reviewer info, never a name (owner 2026-11-21)", () => {
  assert.equal(reviewerInfo({ level: "Intermediate", side: "Right" }), "Intermediate · right side");
  assert.equal(reviewerInfo({ level: "beginner", side: null }), "Beginner");
  assert.equal(reviewerInfo({ level: null, side: "Both" }), "Both sides");
  assert.equal(reviewerInfo({ level: null, side: null }), null);
});

test("a typed name that is only a level and side is refused (owner 2026-11-21)", () => {
  for (const n of ["intermediate right side", "Beginner left", "Advanced player", "both sides"]) { assert.ok(isProfileOnlyName(n), n); assert.equal(nameProblem(n), PROFILE_NAME); }
  for (const n of ["Gali A", "Lefty", "Rightside Rob", "Nacho"]) { assert.equal(isProfileOnlyName(n), false, n); assert.equal(nameProblem(n), null); }
});

test("Reddit rows show the subreddit as r/name, else Reddit (owner 2026-11-21)", () => {
  assert.deepEqual(["r/padel", "/r/PadelRacket", "padel", "Reddit", "", "r/", "Some thread title"].map(subreddit), ["r/padel", "r/PadelRacket", "r/padel", "Reddit", "Reddit", "Reddit", "Reddit"]);
});
