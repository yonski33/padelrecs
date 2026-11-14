import { test } from "node:test";
import assert from "node:assert/strict";
import { readChoice, choiceHref, isDefault, chosenOptions, levelBonus, quickMatch, matchTitle, matchSeoTitle, DEFAULT_CHOICE, type LevelEvidence } from "../lib/quick-match";
import type { FinderProduct } from "../lib/finder";

const finder = { questions: [
  { id: "style", question: "", options: [{ label: "Control", want: ["good control"] }, { label: "Power", want: ["easy power"] }, { label: "A balance of both", want: ["good control", "easy power"] }] },
  { id: "level", question: "", options: [{ label: "Beginner", want: ["forgiving"], avoid: ["demanding"], weight: 2 }, { label: "Intermediate", want: ["forgiving"], weight: 0.75 }, { label: "Advanced" }] },
] };
const p = (id: string, tags: Record<string, number>, reviews = 20): FinderProduct => ({ id, reviews, positive: 15, mixed: 3, negative: 2, tags, shape: "Round" });
const pool = [p("ctrl", { "good control": 10 }), p("pow", { "easy power": 12 }), p("arm", { "good control": 4, "arm-friendly": 8 }), p("hard", { "demanding": 9, "good control": 6 })];
const signal = (id: string) => ({ ctrl: 80, pow: 90, arm: 70, hard: 60 } as Record<string, number>)[id] ?? null;
const run = (q: Record<string, string>, level: (id: string) => LevelEvidence | undefined = () => undefined) =>
  quickMatch(pool, finder, readChoice(q), { signal, negativeTags: ["demanding"], level, count: 10 }).map(m => m.product.id);

test("choices read from and write to the URL; unknown values fall back", () => {
  assert.deepEqual(readChoice({}), DEFAULT_CHOICE);
  assert.deepEqual(readChoice({ style: "control", level: "beginner", arm: "1" }), { style: "control", level: "beginner", arm: true });
  assert.deepEqual(readChoice({ style: "nope", level: "pro" }), DEFAULT_CHOICE);
  assert.equal(choiceHref(DEFAULT_CHOICE), "/#match");
  assert.equal(choiceHref({ style: "power", level: "advanced", arm: true }, ""), "/?style=power&level=advanced&arm=1");
  assert.ok(isDefault(readChoice({ level: "intermediate" })));
});

test("nothing chosen: Player score order", () => {
  assert.deepEqual(run({}), ["pow", "ctrl", "arm", "hard"]);
  assert.deepEqual(chosenOptions(finder, DEFAULT_CHOICE), []);
});

test("style, level and arm re-rank from the counted tags", () => {
  assert.equal(run({ style: "control" })[0], "ctrl");
  assert.equal(run({ style: "power" })[0], "pow");
  assert.equal(run({ arm: "1" })[0], "arm");
  const beg = run({ style: "control", level: "beginner" });
  assert.ok(beg.indexOf("hard") > beg.indexOf("arm"), "demanding falls below the forgiving control rackets for beginners");
  assert.equal(run({ style: "control", arm: "1" }).length, 4, "arm-friendly ranks first but doesn't empty the list");
});

test("level evidence: inside the quick-take band helps, outside hurts, players at that level who liked it add a little", () => {
  assert.ok(levelBonus({ liked: {}, band: { from: 1, to: 2 } }, "advanced") > 0);
  assert.ok(levelBonus({ liked: {}, band: { from: 1, to: 2 } }, "beginner") < 0);
  assert.ok(levelBonus({ liked: { beginner: 3 } }, "beginner") > levelBonus({ liked: { beginner: 1 } }, "beginner"));
  assert.equal(levelBonus({ liked: { beginner: 50 } }, "beginner"), levelBonus({ liked: { beginner: 5 } }, "beginner"), "capped");
  const band = (id: string) => id === "hard" ? { liked: {}, band: { from: 2, to: 2 } } : undefined;
  assert.ok(run({ style: "control", level: "advanced" }, band).indexOf("hard") <= run({ style: "control", level: "advanced" }).indexOf("hard"));
});

test("titles", () => {
  assert.deepEqual(matchTitle(DEFAULT_CHOICE, "rackets"), { title: "Top rackets right now", sub: "ranked by Player score" });
  assert.deepEqual(matchTitle({ style: "control", level: "beginner", arm: true }, "rackets"), { title: "Top control rackets for you", sub: "ranked for beginners · arm-friendly first" });
  assert.equal(matchSeoTitle({ style: "control", level: "beginner", arm: false }, "padel rackets"), "Best control padel rackets for beginners");
});
