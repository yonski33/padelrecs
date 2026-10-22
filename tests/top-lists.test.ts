import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { rankList, adjustedShare, matchesFilters, ratingVerdict, listTotals, MIN_POSITIVE_SHARE, listTitle, rankingHref, type ListInput, type Verdict } from "../lib/top-lists";
import type { TopList } from "../lib/niche/types";

const tags = niches.padel.tags;
const product = (id: string, specs: Partial<Record<"shape" | "balance", string>> = {}) =>
  ({ id, slug: id, name: `Racket ${id}`, brandId: "b", shape: null, weight: null, balance: null, core: null, surface: null, ...specs });
let seq = 0;
const web = (racketId: string, sentiment: Verdict | null, tagList: string[] = [], excerpt: string | null = null, createdAt = "2026-10-01T00:00:00Z") =>
  ({ id: `w${seq++}`, racketId, sentiment, tags: tagList, excerpt, sourceUrl: "https://www.reddit.com/r/padel/x", sourcePlatform: "Reddit", sourceName: "r/padel", createdAt });
const many = (n: number, f: () => ReturnType<typeof web>) => Array.from({ length: n }, f);
const overall: TopList = { slug: "all", label: "Best overall", title: "Best Padel Rackets", intro: "" };

test("a handful of glowing reviews doesn't beat many mostly glowing ones", () => {
  assert.equal(adjustedShare(0, 0, 0.7), 0.7);
  assert(adjustedShare(6, 6, 0.7) < adjustedShare(40, 45, 0.7));
  const data: ListInput = {
    listed: [product("niche"), product("popular"), product("meh")],
    reviews: [],
    external: [
      ...many(6, () => web("niche", "positive")),
      ...many(38, () => web("popular", "positive")), ...many(4, () => web("popular", "mixed")), ...many(3, () => web("popular", "negative")),
      ...many(20, () => web("meh", "positive")), ...many(20, () => web("meh", "negative")),
    ],
  };
  const ranked = rankList(overall, data, tags);
  assert.deepEqual(ranked.map(e => e.product.id), ["popular", "niche"]);
  assert.equal(ranked[1].positiveShare, 1);
  // A higher minimum leaves small samples out altogether.
  assert.deepEqual(rankList({ ...overall, minReviews: 15 }, data, tags).map(e => e.product.id), ["popular"]);
});

test("mixed counts as half, and lists leave out products most reviewers aren't happy with", () => {
  const data: ListInput = { listed: [product("a"), product("b")], reviews: [], external: [
    ...many(4, () => web("a", "positive")), ...many(2, () => web("a", "mixed")),
    ...many(3, () => web("b", "positive")), ...many(2, () => web("b", "mixed")), ...many(2, () => web("b", "negative")),
  ] };
  const ranked = rankList(overall, data, tags);
  assert.deepEqual(ranked.map(e => e.product.id), ["a"]);
  assert.equal(ranked[0].positiveShare, 5 / 6);
  assert(4 / 7 < MIN_POSITIVE_SHARE);
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

test("trait lists only take products enough reviewers describe that way, then weigh happiness and the trait", () => {
  const power: TopList = { ...overall, slug: "power", trait: { tags: ["easy power", "great on smashes"], minShare: 0.25, noun: "power" } };
  const forgiving: TopList = { ...overall, slug: "forgiving", trait: { tags: ["forgiving"], minShare: 0.2, against: ["small sweet spot"], noun: "forgiveness" } };
  const data: ListInput = {
    listed: [product("liked"), product("powerful"), product("bland"), product("disputed")],
    reviews: [],
    external: [
      ...many(14, () => web("liked", "positive")), ...many(6, () => web("liked", "positive", ["easy power"])),
      ...many(6, () => web("powerful", "positive", ["easy power", "great on smashes"])), web("powerful", "negative"), web("powerful", "mixed"),
      ...many(30, () => web("bland", "positive")), web("bland", "positive", ["easy power"]),
      ...many(4, () => web("disputed", "positive", ["forgiving"])), ...many(4, () => web("disputed", "positive", ["small sweet spot"])),
    ],
  };
  const ranked = rankList(power, data, tags);
  // bland: 1 of 31 mention power, too few. powerful (6 of 8) outranks liked (6 of 20), which is happier.
  assert.deepEqual(ranked.map(e => e.product.id), ["powerful", "liked"]);
  assert.equal(ranked[1].traitReviews, 6);
  assert(ranked[1].adjusted > ranked[0].adjusted);
  assert.deepEqual(rankList(forgiving, data, tags).map(e => e.product.id), []);
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

test("title and address follow the agreed pattern", () => {
  assert.equal(rankingHref("best-padel-rackets"), "/rankings/best-padel-rackets");
  assert.equal(listTitle({ title: "Best Padel Rackets" }, 2026, 1234), "Best Padel Rackets 2026, Ranked by 1,234 Real Player Reviews");
});

test("every niche's lists use bank tags, real spec columns and unique slugs", () => {
  for (const [id, n] of Object.entries(niches)) {
    const lists = n.topLists ?? [];
    assert.equal(new Set(lists.map(l => l.slug)).size, lists.length, `${id} list slugs`);
    for (const l of lists) {
      assert.match(l.slug, /^[a-z0-9-]+$/);
      for (const t of [...l.trait?.tags ?? [], ...l.trait?.against ?? []]) assert(n.tags.some(x => x.label === t), `${id}/${l.slug}: "${t}" is not in the tag bank`);
      for (const f of l.filters ?? []) assert(n.specs.some(s => s.column === f.column), `${id}/${l.slug}: no ${f.column} spec`);
    }
  }
  assert.equal(niches.padel.topLists?.length, 4);
});
