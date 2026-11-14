import { test } from "node:test";
import assert from "node:assert/strict";
import { about, gateFor, levelBand, markCount, readQuickTake, roundedDown, sentimentWords, sourcePills, spans, quickTakeSeo, type QuickTake } from "../lib/quick-take";
import { checkQuickTake, quotedPassages, type Report } from "../lib/quick-take-check";

const report = (i: number, over: Partial<Report> = {}): Report => ({ id: `r${i}`, kind: "web", platform: "Reddit", sourceName: "r/Padelracket",
  url: `https://example.com/c/${i}`, date: "2026-03-01", sentiment: i % 3 === 0 ? "mixed" : "positive", summary: `Summary ${i}`, words: `I love the racket number ${i}, the bounce is real`, ...over });
const reports = Array.from({ length: 30 }, (_, i) => report(i));
const ids = (from: number, n: number) => Array.from({ length: n }, (_, i) => `r${from + i}`);
const counts = { reports: 30, positive: reports.filter(r => r.sentiment === "positive").length, mixed: reports.filter(r => r.sentiment === "mixed").length, negative: 0 };
const block = (over: Partial<QuickTake> = {}): QuickTake => ({
  v: 1, kind: "full", hook: { good: "Power on tap.", catch: "Just be ready for the bounce." },
  tldr: { lead: "An all-rounder.", madeFor: ["**Smash lovers**", "Spin players", "Value hunters"], notFor: ["Beginners", "Calm-feel fans"] },
  level: { from: 1, to: 2, answer: "Intermediate and up.", note: "Three beginners struggled.", reports: ids(0, 3) },
  plays: { lead: "Quick in the hands.", court: { net: { chip: "Tricky", line: "Volleys fly.", reports: ids(0, 5) }, overheads: { chip: "Strong", line: "Big pop.", reports: ids(5, 5) } }, rows: [{ label: "Spin", chip: "Strong", line: "Bites.", reports: ids(10, 5) }] },
  catch: { lead: "The bounce. ==Most wish there was less==.", bullets: ["Volleys fly long", "Some love the pop"], reports: ids(0, 12), about: true },
  modules: [{ type: "arm", lead: "Split.", kind: ["Kind to one"], harsh: ["Sore for two"], reports: ids(0, 6) }],
  compare: { lead: "More punch.", cards: [{ slug: "nox-at10", name: "Nox AT10", arrows: [{ dir: "up", text: "More power" }], reports: ids(0, 3) }, { slug: null, name: "ST3", arrows: [{ dir: "same", text: "Close cousins" }], reports: ids(3, 3) }] },
  answers: [0, 1, 2, 3].map(i => ({ q: `Q${i}?`, badge: "Yes", tone: "yes" as const, a: "Players say so.", reports: ids(i, 3) })),
  tips: [{ label: "Player tip", text: "Weigh it first. Two players suggest it.", after: "arm", reports: ids(20, 2) }, { label: "Weather check", text: "Softer in summer.", after: "plays", reports: ids(22, 2) }],
  thinSpot: "only 3 players compared it with the ST3.", counts, written: "2026-11-15", ...over,
});
const check = (b: unknown, rs = reports) => checkQuickTake(b, rs, { knownSlugs: new Set(["nox-at10", "self"]), selfSlug: "self" });

test("a valid block passes", () => {
  const res = check(block());
  assert.deepEqual(res.errors, []);
  assert.ok(res.ok);
});

test("counts must match the stored reports", () => {
  const res = check(block({ counts: { ...counts, reports: 31 } }));
  assert.ok(res.errors.some(e => e.includes("counts.reports")));
});

test("quote marks only around a player's exact words, never our summaries", () => {
  assert.ok(check(block({ tldr: { ...block().tldr, lead: "Players say: \"the bounce is real\"." } })).ok);
  assert.ok(!check(block({ tldr: { ...block().tldr, lead: "Players say: \"a total trampoline\"." } })).ok);
  assert.ok(!check(block({ tldr: { ...block().tldr, lead: "Players: \"Summary 4\"." } })).ok, "summaries are ours, not quotable");
  const verbatim = block({ catch: { ...block().catch, receipts: [{ id: "r1", text: "made up words", verbatim: true }] } });
  assert.ok(check(verbatim).errors.some(e => e.includes("verbatim")));
  assert.deepEqual(quotedPassages("He said “so good” and \"fine\""), ["so good", "fine"]);
});

test("claims need 3+ reports, rows 5+, tips 2 different sources", () => {
  assert.ok(check(block({ answers: block().answers.slice(0, 2) })).errors.some(e => e.includes("3–6")));
  assert.ok(check(block({ answers: [] })).ok);
  assert.ok(check(block({ answers: [...block().answers.slice(0, 3), { q: "One?", badge: "Yes", tone: "yes", a: "x", reports: ids(0, 2) }] })).errors.some(e => e.includes("needs 3+")));
  assert.ok(!check(block({ plays: { ...block().plays!, rows: [{ label: "Spin", chip: "Strong", line: "x", reports: ids(0, 4) }] } })).ok);
  const sameSource = reports.map(r => r.id === "r21" ? { ...r, url: "https://example.com/c/20" } : r);
  assert.ok(check(block(), sameSource).errors.some(e => e.includes("2+ different sources")));
  assert.ok(check(block({ compare: { ...block().compare!, cards: [block().compare!.cards[0], { ...block().compare!.cards[1], reports: ids(3, 2) }] } })).errors.some(e => e.includes("compare")));
});

test("numbers in the text can't exceed the reports behind them; thin spot caveats are exempt", () => {
  assert.ok(check(block({ answers: [...block().answers.slice(0, 3), { q: "Q?", badge: "Yes", tone: "yes", a: "Five players agree.", reports: ids(0, 3) }] })).errors.some(e => e.includes("Five players")));
  assert.ok(check(block({ thinSpot: "only 2 players compared the ST3." })).ok);
});

test("markers: none inside the hook, at most 3 elsewhere", () => {
  assert.ok(!check(block({ hook: { good: "==Power==.", catch: "Bounce." } })).ok);
  const many = block({ tldr: { ...block().tldr, lead: "==a== ==b== ==c==" } });
  assert.ok(check(many).errors.some(e => e.includes("markers")));
});

test("module triggers and gate", () => {
  assert.ok(check(block({ modules: [{ type: "durability", lead: "x", rows: [{ label: "a", line: "b" }, { label: "c", line: "d" }], reports: ids(0, 4) }] })).errors.some(e => e.includes("needs 5+")));
  const weigh = block({ modules: [{ type: "weigh", lead: "x", heavy: { title: "Heavy", bullets: ["a"] }, light: { title: "Light", bullets: ["b"] }, weights: ids(0, 8).map(id => ({ id, grams: 370 })) }] });
  assert.ok(check(weigh).errors.some(e => e.includes("doesn't mention 370")));
  assert.ok(check(block(), reports.slice(0, 15)).errors.some(e => e.includes("gate")));
  assert.ok(check(block({ modules: [{ type: "hardness", answer: "Soft", soft: ids(0, 5), medium: ids(5, 3), hard: ids(8, 2) }] })).errors.some(e => e.includes("60%")));
});

test("verdict chips: optional, 5 words at most, checked like other text", () => {
  assert.ok(check(block({ catch: { ...block().catch, verdict: { text: "The bounce", tone: "m" } } })).ok);
  assert.ok(!check(block({ catch: { ...block().catch, verdict: { text: "one two three four five six", tone: "m" } } })).ok);
  assert.ok(!check(block({ catch: { ...block().catch, verdict: { text: "Loved by owners", tone: "g" } } })).ok);
  const covered = check(block({ plays: { ...block().plays!, rows: [{ label: "Defence", chip: "Good", line: "x", reports: ids(0, 5) }] } }));
  assert.ok(covered.ok && covered.warnings.some(w => w.includes("repeats the court map")));
});

test("banned words", () => {
  assert.ok(check(block({ tldr: { ...block().tldr, madeFor: ["AT10 owners", "b", "c"] } })).errors.some(e => e.includes("owners")));
  assert.ok(check(block({ tldr: { ...block().tldr, lead: "From Reddit reviews." } })).errors.some(e => e.includes("Reddit reviews")));
});

test("helpers", () => {
  assert.equal(roundedDown(136), 130); assert.equal(roundedDown(79), 75); assert.equal(about(42), 40);
  assert.equal(gateFor(20), "full"); assert.equal(gateFor(8), "short"); assert.equal(gateFor(7), null);
  assert.deepEqual(sentimentWords(65, 51, 20), { lead: "Leaning positive", leadKey: "positive", rest: [{ key: "mixed", words: "some mixed" }, { key: "negative", words: "a few negative" }] });
  assert.equal(sentimentWords(49, 20, 10)!.lead, "Mostly positive");
  assert.equal(sentimentWords(30, 35, 35)!.lead, "Divided");
  assert.deepEqual(spans("a **b** ==c=="), [{ text: "a " }, { text: "b", b: true }, { text: " " }, { text: "c", mark: true }]);
  assert.equal(markCount("==a== and ==b=="), 2);
  assert.deepEqual(levelBand(1, 2), { left: "38%", right: "0%" });
  assert.deepEqual(sourcePills(["Reddit", "YouTube", "Blog"], 2, "PadelRecs"), ["YouTube testers", "Padel blogs", "Reddit", "PadelRecs players"]);
  assert.equal(readQuickTake({ v: 2 }), null);
  assert.equal(quickTakeSeo("Siux ST4", 2025, block(), 137, "PadelRecs").title, "Siux ST4 review (2025): what players say | PadelRecs");
});
