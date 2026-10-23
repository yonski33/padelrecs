import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { rankList, aboveAverage, matchesFilters, ratingVerdict, listTotals, MIN_POSITIVE_SHARE, listTitle, rankingHref, type ListInput, type Verdict } from "../lib/top-lists";
import type { TopList } from "../lib/niche/types";

const tags = niches.padel.tags;
const product = (id: string, specs: Partial<Record<"shape" | "balance", string>> = {}, year = 2026) =>
  ({ id, slug: id, name: `Racket ${id}`, brandId: "b", year, shape: null, weight: null, balance: null, core: null, surface: null, ...specs });
let seq = 0;
const web = (racketId: string, sentiment: Verdict | null, tagList: string[] = [], excerpt: string | null = null, createdAt = "2026-10-01T00:00:00Z", sourceDate: string | null = null) =>
  ({ id: `w${seq++}`, racketId, sentiment, tags: tagList, excerpt, sourceUrl: "https://www.reddit.com/r/padel/x", sourcePlatform: "Reddit", sourceName: "r/padel", sourceDate, createdAt });
const NOW = new Date("2026-10-22T00:00:00Z");
const many = (n: number, f: () => ReturnType<typeof web>) => Array.from({ length: n }, f);
const overall: TopList = { slug: "all", label: "Best overall", title: "Best Padel Rackets", intro: "" };

test("a handful of glowing reviews doesn't beat many mostly glowing ones", () => {
  assert.equal(aboveAverage(0, 0, 0.7), 0);
  assert(aboveAverage(6, 6, 0.7) < aboveAverage(40, 45, 0.7));
  const data: ListInput = {
    listed: [product("niche"), product("popular"), product("meh")],
    reviews: [],
    external: [
      ...many(6, () => web("niche", "positive")),
      ...many(38, () => web("popular", "positive")), ...many(4, () => web("popular", "mixed")), ...many(3, () => web("popular", "negative")),
      ...many(20, () => web("meh", "positive")), ...many(20, () => web("meh", "negative")),
    ],
  };
  const ranked = rankList(overall, data, tags, NOW);
  assert.deepEqual(ranked.map(e => e.product.id), ["popular", "niche"]);
  assert.equal(ranked[1].positiveShare, 1);
  // A higher minimum leaves small samples out altogether.
  assert.deepEqual(rankList({ ...overall, minReviews: 15 }, data, tags).map(e => e.product.id), ["popular"]);
});

test("more discussion wins: 33 positive of 43 ranks above 15 of 17 (the PickleballRecs case)", () => {
  const data: ListInput = { listed: [product("prism"), product("vapor"), product("vsol"), product("meh")], reviews: [], external: [
    ...many(15, () => web("prism", "positive")), web("prism", "mixed"), web("prism", "negative"),
    ...many(26, () => web("vapor", "positive")), ...many(6, () => web("vapor", "mixed")), ...many(2, () => web("vapor", "negative")),
    ...many(33, () => web("vsol", "positive")), ...many(6, () => web("vsol", "mixed")), ...many(4, () => web("vsol", "negative")),
    ...many(50, () => web("meh", "positive")), ...many(40, () => web("meh", "negative")),
  ] };
  assert.deepEqual(rankList(overall, data, tags, NOW).map(e => e.product.id), ["vsol", "vapor", "prism"]);
});

test("old reviews and old models stay out", () => {
  const data: ListInput = { listed: [product("new", {}, 2026), product("old", {}, 2023), product("stale", {}, 2026)], reviews: [], external: [
    ...many(8, () => web("new", "positive")), ...many(8, () => web("old", "positive")),
    // Written in 2021: only collected recently, but the source is five years old.
    ...many(8, () => web("stale", "positive", [], null, "2026-10-01T00:00:00Z", "2021-05-01")),
  ] };
  assert.deepEqual(rankList(overall, data, tags, NOW).map(e => e.product.id), ["new", "old"]);
  assert.deepEqual(rankList({ ...overall, maxAgeYears: 2 }, data, tags, NOW).map(e => e.product.id), ["new"]);
  assert.deepEqual(rankList({ ...overall, reviewYears: 6 }, data, tags, NOW).map(e => e.product.id).sort(), ["new", "old", "stale"]);
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
  // bland: 1 of 31 mention power, too few. powerful (6 of 8) leads liked (6 of 20), which is happier.
  assert.deepEqual(ranked.map(e => e.product.id), ["powerful", "liked"]);
  assert.equal(ranked[1].traitReviews, 6);
  assert(ranked[1].aboveAverage > ranked[0].aboveAverage);
  assert.deepEqual(rankList(forgiving, data, tags).map(e => e.product.id), []);
});

test("trait lists are led by trait mentions; mentions in negative reviews don't count", () => {
  const power: TopList = { ...overall, slug: "power", trait: { tags: ["easy power", "great on smashes"], minShare: 0.2, noun: "power" } };
  const data: ListInput = { listed: [product("fenix"), product("coello"), product("panned"), product("rest")], reviews: [], external: [
    // The PadelRecs case: 9 of 29 mention power at 60% positive should rank above 3 of 14 at 75%.
    ...many(9, () => web("fenix", "positive", ["easy power"])), ...many(5, () => web("fenix", "positive")), ...many(7, () => web("fenix", "mixed")), ...many(8, () => web("fenix", "negative")),
    ...many(3, () => web("coello", "positive", ["easy power"])), ...many(6, () => web("coello", "positive")), ...many(3, () => web("coello", "mixed")), ...many(2, () => web("coello", "negative")),
    // Its power tags are all in negative reviews, so it has no mentions that count and isn't listed.
    ...many(8, () => web("panned", "positive")), ...many(4, () => web("panned", "negative", ["easy power"])),
    ...many(60, () => web("rest", "positive")), ...many(30, () => web("rest", "negative")),
  ] };
  const ranked = rankList(power, data, tags, NOW);
  assert.deepEqual(ranked.map(e => e.product.id), ["fenix", "coello"]);
  assert(ranked[0].positiveShare < ranked[1].positiveShare);
});

test("on trait lists being liked is a bonus, never a penalty", () => {
  const power: TopList = { ...overall, slug: "power", trait: { tags: ["easy power"], minShare: 0.2, noun: "power" } };
  const data: ListInput = { listed: [product("loved"), product("powerful"), product("rest")], reviews: [], external: [
    // 4 of 10 mention power, all positive: a bonus for being liked.
    ...many(4, () => web("loved", "positive", ["easy power"])), ...many(6, () => web("loved", "positive")),
    // 6 of 10 mention power, 65% positive: below average, but that costs nothing.
    ...many(6, () => web("powerful", "positive", ["easy power"])), ...many(1, () => web("powerful", "mixed")), ...many(3, () => web("powerful", "negative")),
    ...many(60, () => web("rest", "positive")), ...many(20, () => web("rest", "negative")),
  ] };
  const ranked = rankList(power, data, tags, NOW);
  assert.deepEqual(ranked.map(e => e.product.id), ["powerful", "loved"]);
  assert(ranked[0].aboveAverage < 0 && ranked[1].aboveAverage > 0);
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
    const all = lists.flatMap(l => [l.slug, ...l.formerSlugs ?? []]);
    assert.equal(new Set(all).size, all.length, `${id}: list slugs and former slugs must all be different`);
    for (const l of lists) {
      for (const slug of [l.slug, ...l.formerSlugs ?? []]) assert.match(slug, /^[a-z0-9-]+$/);
      for (const t of [...l.trait?.tags ?? [], ...l.trait?.against ?? []]) assert(n.tags.some(x => x.label === t), `${id}/${l.slug}: "${t}" is not in the tag bank`);
      for (const f of l.filters ?? []) assert(n.specs.some(s => s.column === f.column), `${id}/${l.slug}: no ${f.column} spec`);
    }
  }
  assert.equal(niches.padel.topLists?.length, 4);
});
