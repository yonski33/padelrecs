import { test } from "node:test";
import assert from "node:assert/strict";
import { topPicks, type PickCat, type PickRacket } from "../lib/thread/top-picks";

// "Top picks by players" (owner 2026-11-19): share ranking, 10+ opinions, 5+ backers, one version per model, spread #1s.
const cat = (key: string): PickCat => ({ key, title: key, trait: key, choice: "x", href: "/" });
const r = (id: string, opinions: number, counts: Record<string, number>, family = id): PickRacket => ({ id, name: id.toUpperCase(), family, opinions, counts });

test("ranks by share, needs 10 opinions and 5 backers, keeps the raw count", () => {
  const [l] = topPicks([r("big", 200, { a: 40 }), r("small", 20, { a: 10 }), r("tiny", 9, { a: 9 }), r("thin", 50, { a: 4 }), r("mid", 50, { a: 15 })], [cat("a")]);
  assert.deepEqual(l.rows.map(x => [x.id, x.n]), [["small", 10], ["mid", 15], ["big", 40]]);
});

test("one version per model", () => {
  const [l] = topPicks([r("ctrl35", 40, { a: 20 }, "ctrl"), r("ctrl34", 40, { a: 18 }, "ctrl"), r("b", 40, { a: 10 }), r("c", 40, { a: 8 })], [cat("a")]);
  assert.deepEqual(l.rows.map(x => x.id), ["ctrl35", "b", "c"]);
});

test("no racket is #1 in more than 2 lists: it keeps its 2 strongest, the runner-up moves up elsewhere", () => {
  const cats = ["a", "b", "c"].map(cat);
  const star = r("star", 20, { a: 18, b: 16, c: 12 });
  const others = [r("x", 20, { a: 10, b: 10, c: 10 }), r("y", 20, { a: 8, b: 8, c: 8 }), r("z", 20, { a: 6, b: 6, c: 6 })];
  const lists = topPicks([star, ...others], cats);
  assert.deepEqual(lists.map(l => l.rows[0].id), ["star", "star", "x"]);
  assert.deepEqual(lists[2].rows.map(x => x.id), ["x", "star", "y"]);
});

test("a list needs three picks to show", () => {
  assert.equal(topPicks([r("a", 20, { a: 9 }), r("b", 20, { a: 9 })], [cat("a")]).length, 0);
});

test("the grid shows the first six lists that qualify, in order; a waiting list steps in when one falls short", async () => {
  const { PICK_CATS } = await import("../lib/thread/top-picks");
  const full = Object.fromEntries(PICK_CATS.map(c => [c.key, 9]));
  const many = ["a", "b", "c", "d"].map(id => r(id, 20, { ...full }));
  assert.deepEqual(topPicks(many).map(l => l.cat.key), ["sweet", "arm", "control", "power", "net", "intermediate"]);
  const noControl = ["a", "b", "c", "d"].map(id => r(id, 20, { ...full, control: 0 }));
  assert.deepEqual(topPicks(noControl).map(l => l.cat.key), ["sweet", "arm", "power", "net", "intermediate", "defence"]);
  // Intermediate and defence short: low trampoline is next; with that short too, beginners.
  const thin = (o: Record<string, number>) => ["a", "b", "c", "d"].map(id => r(id, 20, { ...full, intermediate: 0, defence: 0, ...o }));
  assert.deepEqual(topPicks(thin({})).map(l => l.cat.key).at(-1), "trampoline");
  assert.deepEqual(topPicks(thin({ trampoline: 0 })).map(l => l.cat.key).at(-1), "beginner");
});
