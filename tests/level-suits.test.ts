import { test } from "node:test";
import assert from "node:assert/strict";
import { levelSuits, levelDisagreement } from "../lib/level-suits";

test("a brand's 'advanced' alone never pushes a racket out for intermediates", () => {
  const s = levelSuits({ brand: { from: 2, to: 2 } });
  assert.equal(s.intermediate, 50);
  assert.ok(s.beginner >= 40 && s.advanced <= 60);
});

test("players and reviewers outweigh the brand", () => {
  const s = levelSuits({ brand: { from: 2, to: 2 }, youtube: { from: 0, to: 1, channels: 3 }, players: [{ level: 1, liked: true }, { level: 1, liked: true }, { level: 0, liked: null }], forgiveness: { P: 20, C: 1 } });
  assert.ok(s.beginner >= 70 && s.intermediate >= 80);
  assert.match(levelDisagreement({ brand: { from: 2, to: 2 }, youtube: { from: 0, to: 1, channels: 3 } })!, /brand says advanced; 3 YouTube reviewers say beginner to intermediate/);
});

test("an explicit beginner label counts, and demanding rackets sit low for beginners", () => {
  assert.ok(levelSuits({ brand: { from: 0, to: 1 } }).beginner > 55);
  assert.ok(levelSuits({ players: [{ level: 2, liked: true }, { level: 2, liked: true }], forgiveness: { P: 2, C: 10 } }).beginner < 35);
});
