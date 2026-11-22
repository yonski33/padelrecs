import { test } from "node:test";
import assert from "node:assert/strict";
import { noRepeat, betterPicks, chipFor, fitSub, levelLine, pickLines, type FitLine, type PickData } from "../lib/thread/fit-core";

const L = (tone: FitLine["tone"], title: string, f: string[]): FitLine => ({ tone, title, text: "x", chip: null, for: f });

test("source chips name the page's own reports and count the rest", () => {
  assert.equal(chipFor(["a", "b", "c", "d"], { a: "player", b: "youtube", c: "youtube" }), "1 player review · 2 YouTube reviews · 1 more source");
  assert.equal(chipFor(["z"], {}), "1 source");
  assert.equal(chipFor([], {}), null);
});

test("lines: the strength and downside that matter for the picks, the level line as the caution", () => {
  const yes = [L("pos", "Soft.", ["arm"]), L("pos", "Punch.", ["power"])], no = [L("neg", "Slow.", ["control"]), L("neg", "Small spot.", ["intermediate"])];
  const p = { level: "intermediate", style: "power", arm: false };
  const lvl = levelLine(p, { beginner: 20, intermediate: 45, advanced: 85 });
  assert.ok(lvl);
  assert.deepEqual(pickLines(yes, no, p, lvl).map(l => l.title), ["Punch.", "Made for stronger players.", "Small spot."]);
  assert.equal(levelLine(p, { beginner: 25, intermediate: 74, advanced: 67 }), null);
});

test("better picks are never harder than the racket the player was told is too much", () => {
  const self = { id: "hack", row: "hack", slug: "hack", pct: 0, facts: { suits: { beginner: 20, intermediate: 45, advanced: 85 }, fine: { forgiveness: 21 } } };
  const data: PickData = {
    fenix: { no: ["intermediate"], yes: [{ for: ["power"], t: "Huge smash power." }] },
    easy: { no: [], yes: [{ for: ["power", "intermediate"], t: "Easy pace." }] },
    stiff: { no: [], yes: [{ for: ["power"], t: "Pop." }] },
  };
  const cands = [
    { id: "fenix", row: "fenix", slug: "fenix", pct: 95, facts: { suits: { beginner: 25, intermediate: 66, advanced: 85 }, fine: { forgiveness: 42 } } },
    { id: "easy", row: "easy", slug: "easy", pct: 70, facts: { suits: { beginner: 35, intermediate: 80, advanced: 80 }, fine: { forgiveness: 52 } } },
    { id: "stiff", row: "stiff", slug: "stiff", pct: 90, facts: { suits: { beginner: 35, intermediate: 80, advanced: 80 }, fine: { forgiveness: 10 } } },
  ];
  assert.deepEqual(betterPicks(self, cands, data, { level: "intermediate", style: "power", arm: false }).map(b => b.slug), ["easy"]);
});

test("the heading never says players voted", () => {
  assert.match(fitSub(44, 0), /44 opinions in reviews across the web/);
  assert.match(fitSub(137, 4), /from players and reviews across the web/);
  assert.doesNotMatch(fitSub(250, 3), /voted/);
});

test("a line never repeats its title", () => {
  assert.equal(noRepeat("Heavier than the label", "Heavier than the label: often 380 g or more."), "Often 380 g or more.");
  assert.equal(noRepeat("Huge sweet spot", "Off-centre hits still land."), "Off-centre hits still land.");
});
