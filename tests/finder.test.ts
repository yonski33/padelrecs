import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeAnswers, encodeAnswers, finderPool, matchFinder, visibleQuestions, type FinderProduct } from "../lib/finder";
import { niches } from "../lib/niche";

const product = (id: string, year = 2026) => ({ id, slug: id, name: id, brandId: "b", year, shape: null, weight: null, balance: null, core: null, surface: null });
const web = (racketId: string, sentiment: "positive" | "mixed" | "negative", tags: string[], i: number) =>
  ({ id: `${racketId}${i}`, racketId, sentiment, tags, excerpt: null, sourceUrl: "", sourcePlatform: "Reddit", sourceName: "", createdAt: "2026-01-01" });
const many = (id: string, n: number, sentiment: "positive" | "negative", tags: string[]) => Array.from({ length: n }, (_, i) => web(id, sentiment, tags, i));
const entry = (id: string, reviews: number, tags: Record<string, number>): FinderProduct => ({ id, reviews, positive: reviews, mixed: 0, negative: 0, tags, shape: null });

test("the pool keeps the rankings' bar: enough reviews, mostly positive, recent enough", () => {
  const data = { listed: [product("ok"), product("few"), product("disliked"), product("old", 2020)], reviews: [],
    external: [...many("ok", 5, "positive", []), ...many("few", 4, "positive", []), ...many("disliked", 5, "negative", []), ...many("old", 5, "positive", [])] };
  assert.deepEqual(finderPool({ maxAgeYears: 2 }, data as never, [], new Date("2026-06-01")).map(p => p.id), ["ok"]);
});

test("a finder can set a stricter bar than the rankings", () => {
  const data = { listed: [product("loved"), product("split")], reviews: [],
    external: [...many("loved", 8, "positive", []), ...many("split", 13, "positive", []), ...many("split", 7, "negative", [])] };
  assert.deepEqual(finderPool({ minPositive: 0.7 }, data as never, [], new Date("2026-06-01")).map(p => p.id), ["loved"]);
  assert.deepEqual(finderPool({ minReviews: 10 }, data as never, [], new Date("2026-06-01")).map(p => p.id), ["split"]);
});

test("a negative review doesn't count toward a good tag, but its bad tags still count", () => {
  const data = { listed: [product("a")], reviews: [], external: [...many("a", 5, "positive", ["easy power"]), web("a", "negative", ["easy power", "demanding"], 9)] };
  const [p] = finderPool({}, data as never, ["easy power"], new Date("2026-06-01"));
  assert.equal(p.tags["easy power"], 5);
  assert.equal(p.tags.demanding, 1);
});

test("answers lead the order, and share beats a small sample", () => {
  const pool = [entry("big", 100, { soft: 40 }), entry("small", 5, { soft: 2 }), entry("none", 100, {})];
  assert.deepEqual(matchFinder(pool, [{ label: "Soft", want: ["soft"] }], [], 2).map(m => m.product.id), ["big", "small"]);
});

test("between close matches the better-reviewed product wins, but a clearly better fit still leads", () => {
  const soft = { label: "Soft", want: ["soft"] };
  assert.equal(matchFinder([entry("thin", 6, { soft: 3 }), entry("known", 60, { soft: 20 })], [soft], [], 1)[0].product.id, "known");
  assert.equal(matchFinder([entry("fit", 20, { soft: 15 }), entry("famous", 200, { soft: 5 })], [{ ...soft, weight: 2 }], [], 1)[0].product.id, "fit");
});

test("avoid tags count against a product, and the top worry is shown", () => {
  const pool = [entry("hard", 20, { forgiving: 8, demanding: 8 }), entry("easy", 20, { forgiving: 8 })];
  const [first, second] = matchFinder(pool, [{ label: "Beginner", want: ["forgiving"], avoid: ["demanding"] }], ["demanding"]);
  assert.equal(first.product.id, "easy");
  assert.deepEqual(second.watch, { tag: "demanding", count: 8 });
});

test("a must answer narrows the pool only when enough products qualify", () => {
  const arm = { label: "Yes", want: ["arm-friendly"], must: true };
  const three = [entry("a", 10, { "arm-friendly": 3 }), entry("b", 10, { "arm-friendly": 2 }), entry("c", 10, { "arm-friendly": 2 }), entry("d", 500, { "arm-friendly": 1 })];
  assert(!matchFinder(three, [arm], []).some(m => m.product.id === "d"));
  const one = [entry("a", 10, { "arm-friendly": 3 }), entry("b", 10, {}), entry("c", 10, {})];
  assert.equal(matchFinder(one, [arm], []).length, 3);
});

test("a chosen shape narrows the pool only when enough products have it", () => {
  const shaped = (id: string, shape: string | null) => ({ ...entry(id, 10, {}), shape });
  const diamond = { label: "Diamond", shapes: ["Diamond"] };
  const pool = [shaped("a", "Diamond"), shaped("b", "Diamond"), shaped("c", "Diamond"), shaped("d", "Round"), shaped("e", null)];
  assert.deepEqual(matchFinder(pool, [diamond], []).map(m => m.product.id).sort(), ["a", "b", "c"]);
  assert.equal(matchFinder(pool.slice(2), [diamond], []).length, 3);
});

test("no preference changes nothing and shows no reasons", () => {
  const pool = [entry("a", 10, { soft: 5 })];
  assert.deepEqual(matchFinder(pool, [{ label: "No preference" }], [])[0].reasons, []);
});

test("answers survive a shared link, and bad links are ignored", () => {
  const finder = { questions: [{ id: "a", question: "", options: [{ label: "x" }, { label: "y" }] }, { id: "b", question: "", options: [{ label: "z" }] }] };
  assert.deepEqual(decodeAnswers(encodeAnswers([1, 0]), finder), [1, 0]);
  assert.deepEqual(decodeAnswers("9", finder), [null, null]);
  assert.deepEqual(decodeAnswers("90", finder), [null, 0]);
  assert.deepEqual(decodeAnswers(null, finder), [null, null]);
});

test("a follow-up question only appears after its answer", () => {
  const finder = { questions: [{ id: "type", question: "", options: [{ label: "Sunscreen" }, { label: "Toner" }] },
    { id: "cast", question: "", onlyIf: { question: "type", labels: ["Sunscreen"] }, options: [{ label: "A lot" }] }, { id: "skin", question: "", options: [{ label: "Dry" }] }] };
  assert.deepEqual(visibleQuestions(finder, [null, null, null]), [0, 2]);
  assert.deepEqual(visibleQuestions(finder, [0, null, null]), [0, 1, 2]);
  assert.deepEqual(visibleQuestions(finder, [1, null, null]), [0, 2]);
  assert.deepEqual(decodeAnswers(encodeAnswers([1, null, 0]), finder), [1, null, 0]);
});

test("every finder only uses tags from its niche's bank", () => {
  for (const [id, niche] of Object.entries(niches)) {
    const bank = new Set(niche.tags.map(t => t.label));
    for (const o of niche.finder?.questions.flatMap(q => q.options) ?? []) for (const t of [...(o.want ?? []), ...(o.avoid ?? [])]) assert(bank.has(t), `${id}: ${t}`);
  }
});

const racket = (id: string, reviews: number, tags: Record<string, number>, place?: number, shape = "Teardrop"): FinderProduct =>
  ({ ...entry(id, reviews, tags), shape, lists: place ? { power: place } : {} });
const power = { label: "Power", want: ["easy power"], weight: 1.5, list: "power" };
const ids = (matches: { product: FinderProduct }[]) => matches.map(m => m.product.id);

test("an answer tied to a ranking never brings back a product outside it, even with fewer results", () => {
  const pool = [racket("ctrl", 59, { "easy power": 30 }), racket("a", 26, { "easy power": 9 }, 1), racket("b", 40, { "easy power": 9 }, 2)];
  assert.deepEqual(ids(matchFinder(pool, [power], [])), ["a", "b"]);
});

test("the ranking's order beats a small lead in share of mentions", () => {
  const pool = [racket("second", 20, { "easy power": 8 }, 2), racket("first", 40, { "easy power": 12 }, 1), racket("third", 30, { "easy power": 7 }, 3)];
  assert.equal(matchFinder(pool, [power], [])[0].product.id, "first");
});

test("other answers narrow inside the group, and the group stays when none of it fits", () => {
  const pool = [racket("diamond", 30, { "easy power": 9 }, 1, "Diamond"), racket("hybrid", 30, { "easy power": 9 }, 2, "Hybrid"), racket("round", 30, { "easy power": 9 }, undefined, "Round")];
  const shaped = (shapes: string[]) => ids(matchFinder(pool, [power, { label: "Shape", shapes }], []));
  assert.deepEqual(shaped(["Hybrid"]), ["hybrid"]);
  assert.deepEqual(shaped(["Round"]), ["diamond", "hybrid"]);
});

test("an empty ranking removes nothing", () => {
  assert.equal(matchFinder([racket("a", 30, { "easy power": 9 }), racket("b", 30, { "easy power": 8 })], [power], []).length, 2);
});

test("every answer tied to a ranking points at a ranking that exists", () => {
  for (const n of Object.values(niches)) for (const q of n.finder?.questions ?? []) for (const o of q.options)
    if (o.list) assert.ok(n.topLists?.some(l => l.slug === o.list), `${o.label} -> ${o.list}`);
});
