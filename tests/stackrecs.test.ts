import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STACK_TOOLS, CATEGORIES, sideOf, tryLink, COMMISSION_NOTE } from "../lib/stack/catalog";
import { PRICES } from "../lib/stack/prices";
import { BUILD_GROUPS, GROW_GROUPS, STACK_BOARDS, validStackVote, SECTION_TITLE } from "../lib/stack/traits";
import { ageWeight, weighOpinions, stackScores, majorOf, FULL_MONTHS, CUTOFF_MONTHS, type Opinion } from "../lib/stack/score";
import { rankMatch, readPicks, picksHref, withinBudget, DEFAULT_PICKS, MIN_FIT, type MatchInput } from "../lib/stack/match";
import { STACK_RANKINGS } from "../lib/stack/rankings";
import { TRAIT_GROUPS, traitGroupsFor, validTraitVote } from "../lib/thread/traits";
import { threadPath, threadSite, stackPath } from "../lib/thread/look";
import { selectNiche } from "../lib/niche/all";

// StackRecs pilot (plan PR #517, owner sign-off 2026-11-19).

test("catalog: 39 tools (Google AI Studio in, Emergent out), unique slugs, every category on a side", () => {
  assert.equal(STACK_TOOLS.length, 39);
  assert.equal(new Set(STACK_TOOLS.map(t => t.slug)).size, STACK_TOOLS.length);
  assert.ok(STACK_TOOLS.some(t => t.slug === "google-ai-studio"));
  assert.ok(!STACK_TOOLS.some(t => /emergent/i.test(t.name)));
  assert.equal(STACK_TOOLS.filter(t => sideOf(t.category) === "build").length, 24);
  assert.equal(STACK_TOOLS.filter(t => sideOf(t.category) === "grow").length, 15);
  for (const t of STACK_TOOLS) { assert.ok(/^[a-z0-9-]+$/.test(t.slug), t.slug); assert.ok(t.website.startsWith("https://"), t.slug); }
  // Every tool's price was read on its vendor's page (lib/stack/prices.ts); only plainly stated ones count as checked.
  for (const t of STACK_TOOLS) { assert.ok(PRICES[t.slug]?.source.startsWith("https://"), `${t.slug} has a price source`); assert.equal(t.checked, PRICES[t.slug].checked); }
  assert.equal(Object.keys(PRICES).length, STACK_TOOLS.length);
  const n = selectNiche("stackrecs");
  assert.equal(n.schema, "stackrecs"); assert.equal(n.site.name, "StackRecs"); assert.equal(n.productPath, "tools");
  assert.deepEqual(n.shapeFilter, [...CATEGORIES.build, ...CATEGORIES.grow]);
});

test("vote groups: 9 per side, keys fit the trait_votes check, padel's nine unchanged", () => {
  for (const set of [BUILD_GROUPS, GROW_GROUPS]) {
    assert.equal(set.length, 9);
    for (const g of set) { assert.match(g.key, /^[a-z_]{2,20}$/); assert.equal(g.options.length, 3); for (const [k] of g.options) assert.match(k, /^[a-z_]{2,20}$/); }
  }
  assert.equal(SECTION_TITLE.build, "How does it build?"); assert.equal(SECTION_TITLE.grow, "How does it grow?");
  assert.ok(validStackVote("limits", "rarely", "build")); assert.ok(!validStackVote("limits", "rarely", "grow"));
  assert.ok(validStackVote("best_for", "agency")); assert.ok(!validStackVote("best_for", "power"));
  // Padel: the same nine groups and the same answers from the API check.
  assert.equal(traitGroupsFor("padel"), TRAIT_GROUPS);
  assert.deepEqual(TRAIT_GROUPS.map(g => g.key), ["plays_like", "level", "sweet_spot", "arm", "feel", "side", "maneuver", "trampoline", "durability"]);
  assert.ok(validTraitVote("feel", "soft")); assert.ok(!validTraitVote("limits", "rarely"));
  const stack = traitGroupsFor("stackrecs");
  assert.equal(stack.length, 17);
  assert.ok(validTraitVote("best_for", "non_coder", stack) && validTraitVote("best_for", "in_house", stack) && !validTraitVote("feel", "soft", stack));
  for (const b of STACK_BOARDS) assert.ok(validStackVote(b.trait, b.choice, b.side), b.slug);
});

test("addresses: StackRecs' pages map to app/thread/stack, padel's mapping is unchanged", () => {
  assert.ok(threadSite("stackrecs") && threadSite("padel") && !threadSite("golf"));
  assert.equal(threadPath("/", "/tools", "stackrecs"), "/thread/stack");
  assert.equal(threadPath("/tools", "/tools", "stackrecs"), "/thread/stack/tools");
  assert.equal(threadPath("/tools/claude-code", "/tools", "stackrecs"), "/thread/stack/tools/claude-code");
  assert.equal(stackPath("/rankings/best-coding-agents"), "/thread/stack/rankings/best-coding-agents");
  assert.equal(stackPath("/how-we-make-these"), "/thread/stack/score");
  assert.equal(stackPath("/add-review"), null);
  assert.equal(threadPath("/"), "/thread"); assert.equal(threadPath("/rackets/x"), "/thread/rackets/x");
  for (const l of STACK_RANKINGS) assert.match(l.slug, /^[a-z0-9-]+$/);
  assert.equal(new Set(STACK_RANKINGS.map(l => l.slug)).size, STACK_RANKINGS.length);
});

const NOW = Date.parse("2026-11-19T00:00:00Z");
const monthsAgo = (m: number) => new Date(NOW - m * 30.44 * 86_400_000).toISOString();

test("freshness: full weight for 3 months, halves every 3, floor 0.1, gone after 18", () => {
  assert.equal(ageWeight(0), 1); assert.equal(ageWeight(FULL_MONTHS), 1);
  assert.ok(Math.abs(ageWeight(6) - 0.5) < 1e-9); assert.ok(Math.abs(ageWeight(9) - 0.25) < 1e-9);
  assert.equal(ageWeight(17), 0.1); assert.equal(ageWeight(CUTOFF_MONTHS + 0.1), 0);
  assert.equal(majorOf("Cursor 3.x"), 3); assert.equal(majorOf("Semrush 2026"), 2026); assert.equal(majorOf("Claude Code"), null);
  // Recent praise outweighs older complaints; the count is the plain number inside the cutoff.
  const ops: Opinion[] = [
    ...Array.from({ length: 5 }, () => ({ toolId: "a", verdict: "positive" as const, date: monthsAgo(1) })),
    ...Array.from({ length: 5 }, () => ({ toolId: "a", verdict: "negative" as const, date: monthsAgo(9) })),
    { toolId: "a", verdict: "negative", date: monthsAgo(20) },
  ];
  const w = weighOpinions(ops, NOW);
  assert.equal(w.judged, 10);
  assert.ok(w.positive > 7.5 && w.negative < 2.5, JSON.stringify(w));
  // Two majors back counts half.
  const v = weighOpinions([{ toolId: "b", verdict: "positive", date: monthsAgo(1), version: "X 3.x" }, { toolId: "b", verdict: "negative", date: monthsAgo(1), version: "X 1.x" }], NOW);
  assert.ok(Math.abs(v.positive - 4 / 3) < 1e-9);
});

test("bias rule: scores are commission-blind and nobody sets one by hand", () => {
  const bare = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const src = bare("lib/stack/score.ts");
  assert.doesNotMatch(src, /affiliate|programme|commission|override|tryLink|catalog/i, "lib/stack/score.ts reads opinions only");
  const data = readFileSync("app/thread/stack/data.ts", "utf8");
  assert.match(data, /stackScores\(tools\.map\(r => \(\{ id: r\.id, category: r\.shape! \}\)\), opinions, now\)/, "the pages score from ids, categories and opinions only");
  const matchSrc = bare("lib/stack/match.ts");
  assert.doesNotMatch(matchSrc, /affiliate|programme|tryLink/i, "Find my match never sees a programme");
  const ops: Opinion[] = Array.from({ length: 12 }, (_, i) => ({ toolId: i % 2 ? "paid" : "free", verdict: "positive", date: monthsAgo(1) }));
  const s = stackScores([{ id: "paid", category: "SEO suite" }, { id: "free", category: "SEO suite" }], ops, NOW);
  assert.equal(s.get("paid")!.signal, s.get("free")!.signal);
  // "Try it" only with a programme and a link the owner added; Claude Code has no programme.
  assert.equal(tryLink("claude-code", "https://example.com/?ref=x"), null);
  assert.equal(tryLink("lovable", ""), null);
  assert.equal(tryLink("lovable", " https://lovable.dev/?via=x "), "https://lovable.dev/?via=x");
  assert.equal(STACK_TOOLS.filter(t => t.category === "Coding agent" && t.programme).length, 0);
  assert.match(COMMISSION_NOTE, /never changes the score/);
});

test("unscaled scores: a category leader with mostly mixed opinions doesn't read 96 (owner 2026-11-19)", () => {
  const mk = (id: string, pos: number, mix: number, neg: number): Opinion[] => [
    ...Array.from({ length: pos }, () => ({ toolId: id, verdict: "positive" as const, date: monthsAgo(1) })),
    ...Array.from({ length: mix }, () => ({ toolId: id, verdict: "mixed" as const, date: monthsAgo(1) })),
    ...Array.from({ length: neg }, () => ({ toolId: id, verdict: "negative" as const, date: monthsAgo(1) }))];
  const tools = [{ id: "cc", category: "Coding agent" }, { id: "cu", category: "Coding agent" }, { id: "se", category: "SEO suite" }, { id: "sr", category: "SEO suite" }];
  const s = stackScores(tools, [...mk("cc", 12, 17, 2), ...mk("cu", 10, 19, 22), ...mk("se", 4, 3, 12), ...mk("sr", 3, 4, 0)], NOW);
  const cc = s.get("cc")!.signal, cu = s.get("cu")!.signal, sr = s.get("sr")!.signal;
  assert.ok(cc >= 70 && cc <= 85, `Claude-Code-like mix scores ${cc}`);
  assert.ok(sr <= 85, `a 7-opinion leader scores ${sr}`);
  assert.ok(cc > cu, "order still follows the opinions");
  for (const [, x] of s) assert.ok(Number.isInteger(x.signal), `whole numbers only (${x.signal})`);
  assert.equal(s.get("cc")!.rank, 1); assert.equal(s.get("cu")!.of, 2);
  // An all-positive tool with many opinions can still score high: the score isn't capped, only unstretched.
  assert.ok(stackScores([{ id: "a", category: "x" }], mk("a", 40, 0, 0), NOW).get("a")!.signal >= 95);
});

test("Find my match: budget gate, Best for ranking, the caution rule and the address", () => {
  const rows: MatchInput[] = [
    { id: "1", slug: "lovable", side: "build", score: 80, bestFor: { non_coder: 9, hobby_dev: 1 } },
    { id: "2", slug: "claude-code", side: "build", score: 90, bestFor: { pro_team: 8, non_coder: 1 } },
    { id: "3", slug: "aider", side: "build", score: 85, bestFor: { pro_team: 1 } },
    { id: "4", slug: "semrush", side: "grow", score: 88, bestFor: {} },
  ];
  assert.deepEqual(rankMatch(rows, DEFAULT_PICKS).map(x => x.id), ["2", "3", "1"]);
  const nc = rankMatch(rows, { side: "build", who: "non_coder", budget: "any" });
  assert.equal(nc[0].id, "1"); assert.equal(nc.find(x => x.id === "3")!.pct, null, `under ${MIN_FIT} reports: no match %`);
  assert.equal(nc[nc.length - 1].id, "3");
  // Free: Claude Code has no free plan in the catalog facts.
  assert.ok(!rankMatch(rows, { side: "build", who: null, budget: "free" }).some(x => x.id === "2"));
  assert.ok(withinBudget({ free: false, fromUsd: 129 }, "grow", "low")); assert.ok(!withinBudget({ free: false, fromUsd: 129 }, "build", "low"));
  const p = readPicks(new URLSearchParams("side=grow&who=agency&budget=low"));
  assert.deepEqual(p, { side: "grow", who: "agency", budget: "low" });
  assert.equal(picksHref(p), "/?side=grow&who=agency&budget=low");
  assert.equal(readPicks(new URLSearchParams("who=agency")).who, null, "a Grow pick on the Build side falls back");
});

test("copy: no em dashes and no 'we' in StackRecs' own copy", () => {
  for (const f of ["lib/niche/stackrecs.ts", "lib/stack/catalog.ts", "lib/stack/traits.ts", "lib/stack/match.ts", "lib/stack/rankings.ts",
    "app/thread/stack/page.tsx", "app/thread/stack/score/page.tsx", "app/thread/stack/tools/[slug]/page.tsx", "app/thread/stack/live/match.tsx", "app/thread/stack/live/catalog.tsx"]) {
    // Quoted copy only; paths and class names ("/how-we-make-these") are not copy.
    const strings = (readFileSync(f, "utf8").match(/"[^"\n]*"|`[^`\n]*`/g) ?? []).filter(x => !x.includes("/")).join("\n");
    assert.doesNotMatch(strings, /—/, `${f}: em dash`);
    assert.doesNotMatch(strings, /\b(we|We|us|our|Our)\b/, `${f}: "we"`);
  }
});
