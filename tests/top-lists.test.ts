import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { rankList, wilsonLower, matchesFilters, ratingVerdict, tagPart, listTotals, listTitle, type ListInput, type Verdict } from "../lib/top-lists";
import type { TopList } from "../lib/niche/types";

const tags = niches.padel.tags;
const product = (id: string, specs: Partial<Record<"shape" | "balance", string>> = {}) =>
  ({ id, slug: id, name: `Racket ${id}`, brandId: "b", shape: null, weight: null, balance: null, core: null, surface: null, ...specs });
let seq = 0;
const web = (racketId: string, sentiment: Verdict | null, tagList: string[] = [], excerpt: string | null = null, createdAt = "2026-10-01T00:00:00Z") =>
  ({ id: `w${seq++}`, racketId, sentiment, tags: tagList, excerpt, sourceUrl: "https://www.reddit.com/r/padel/x", sourcePlatform: "Reddit", sourceName: "r/padel", createdAt });
const many = (n: number, f: () => ReturnType<typeof web>) => Array.from({ length: n }, f);
const overall: TopList = { slug: "all", label: "Best overall", title: "Best Padel Rackets", intro: "" };

test("Wilson lower bound rewards bigger samples and counts mixed as half", () => {
  assert.equal(wilsonLower(0, 0), 0);
  assert(wilsonLower(38, 40) > wilsonLower(5, 5));
  assert(wilsonLower(5, 10) < 0.5 && wilsonLower(5, 10) > 0.2);
  const data: ListInput = { listed: [product("a")], reviews: [], external: [...many(5, () => web("a", "mixed"))] };
  const [e] = rankList(overall, data, tags);
  assert.equal(e.positiveShare, 0.5);
  assert.equal(e.score, wilsonLower(2.5, 5));
});

test("products need five judged reviews; lists are never padded", () => {
  const data: ListInput = {
    listed: [product("a"), product("b"), product("c")],
    reviews: [{ racketId: "c", rating: 5, tags: [], createdAt: "2026-01-01" }],
    external: [...many(5, () => web("a", "positive")), ...many(4, () => web("b", "positive")), web("b", null), ...many(3, () => web("c", "positive"))],
  };
  // b has 4 judged + 1 unjudged; c has 3 web + 1 player review.
  assert.deepEqual(rankList(overall, data, tags).map(e => e.product.id), ["a"]);
  // A config can't lower the floor.
  assert.deepEqual(rankList({ ...overall, minReviews: 2 }, data, tags).map(e => e.product.id), ["a"]);
});

test("player star ratings become verdicts", () => {
  assert.deepEqual([5, 4, 3, 2, 1].map(ratingVerdict), ["positive", "positive", "mixed", "negative", "negative"]);
});

test("at most ten entries, ranked by score then review count", () => {
  const ids = Array.from({ length: 14 }, (_, i) => `p${i}`);
  const data: ListInput = { listed: ids.map(id => product(id)), reviews: [], external: ids.flatMap((id, i) => [...many(5 + i, () => web(id, "positive")), web(id, "negative")]) };
  const ranked = rankList(overall, data, tags);
  assert.equal(ranked.length, 10);
  assert.deepEqual(ranked.map(e => e.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(ranked[0].product.id, "p13");
  assert.deepEqual(listTotals(ranked).reviews, ranked.reduce((a, e) => a + e.reviews, 0));
});

test("tag weights reorder a list and minTagged keeps untagged products out", () => {
  const power: TopList = { ...overall, slug: "power", tagWeights: { "easy power": 1, "great on smashes": 1 }, tagBlend: 0.6, minTagged: 2 };
  const data: ListInput = {
    listed: [product("liked"), product("powerful"), product("bland")],
    reviews: [],
    external: [
      ...many(20, () => web("liked", "positive")), web("liked", "positive", ["easy power"]), web("liked", "positive", ["easy power"]),
      ...many(6, () => web("powerful", "positive", ["easy power", "great on smashes"])), web("powerful", "negative"), web("powerful", "mixed"),
      ...many(30, () => web("bland", "positive")), web("bland", "positive", ["easy power"]),
    ],
  };
  assert.deepEqual(rankList(power, data, tags).map(e => e.product.id), ["powerful", "liked"]);
  assert.deepEqual(rankList(overall, data, tags).map(e => e.product.id), ["bland", "liked", "powerful"]);
  assert.equal(tagPart({ "forgiving": 0.5, "small sweet spot": 0.8 }, { "forgiving": 1, "small sweet spot": -1 }), 0);
  assert.equal(tagPart({ "forgiving": 1 }, { "forgiving": 1, "arm-friendly": 1 }), 0.5);
});

test("spec filters compare first words; include drops blanks, exclude keeps them", () => {
  assert(matchesFilters(product("a", { balance: "High (~26 cm)" }), [{ column: "balance", include: ["High"] }]));
  assert(!matchesFilters(product("a"), [{ column: "balance", include: ["High"] }]));
  assert(matchesFilters(product("a"), [{ column: "shape", exclude: ["Round"] }]));
  assert(!matchesFilters(product("a", { shape: "round" }), [{ column: "shape", exclude: ["Round"] }]));
  assert(!matchesFilters(product("a", { balance: "Low/Medium" }), [{ column: "balance", exclude: ["Low"] }]));
});

test("entries carry real tags and a positive verbatim quote with its source", () => {
  const long = "x".repeat(400);
  const data: ListInput = { listed: [product("a")], reviews: [], external: [
    web("a", "positive", ["easy power", "forgiving"], "Lots of easy power and the sweet spot is huge, really happy with it."),
    web("a", "negative", ["small sweet spot", "head-heavy"], "Way too head-heavy for me, my elbow hated it after two weeks of play."),
    web("a", "positive", ["easy power"], long), web("a", "mixed", ["head-heavy"]), web("a", "positive", ["good control"]),
  ] };
  const [e] = rankList(overall, data, tags);
  assert.deepEqual(e.pros, [{ label: "easy power", count: 2 }, { label: "forgiving", count: 1 }, { label: "good control", count: 1 }]);
  assert.deepEqual(e.con, { label: "head-heavy", count: 2 });
  assert.equal(e.quote?.text, "Lots of easy power and the sweet spot is huge, really happy with it.");
  assert.equal(e.quote?.url, "https://www.reddit.com/r/padel/x");
  assert.equal(e.latest, "2026-10-01T00:00:00Z");
});

test("title follows the agreed pattern", () => {
  assert.equal(listTitle({ title: "Best Padel Rackets" }, 2026, 1234), "Best Padel Rackets 2026, Ranked by 1,234 Real Player Reviews");
});

test("every niche's lists use bank tags, real spec columns and unique slugs", () => {
  for (const [id, n] of Object.entries(niches)) {
    const lists = n.topLists ?? [];
    assert.equal(new Set(lists.map(l => l.slug)).size, lists.length, `${id} list slugs`);
    for (const l of lists) {
      assert.match(l.slug, /^[a-z0-9-]+$/);
      for (const t of Object.keys(l.tagWeights ?? {})) assert(n.tags.some(x => x.label === t), `${id}/${l.slug}: "${t}" is not in the tag bank`);
      for (const f of l.filters ?? []) assert(n.specs.some(s => s.column === f.column), `${id}/${l.slug}: no ${f.column} spec`);
    }
  }
  assert.equal(niches.padel.topLists?.length, 4);
});
