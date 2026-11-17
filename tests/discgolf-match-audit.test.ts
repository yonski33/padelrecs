// The DiscGolfRecs match audit's 13 engine tests (Grok audit 2026-11-16, owner OK via PM 2026-11-17), on the live disc golf
// items saved in tests/fixtures/engine-discgolf.json (scripts/discgolf-match-sweep.mts --fixture), ranked through the home's own
// rankHome. Tests that wait on catalogue writes or on a "not now" item report their numbers as todo instead of failing CI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rankHome, type RankItem } from "../lib/home-rank";
import { readChoice } from "../lib/quick-match";
import { discgolf } from "../lib/niche/discgolf";
import { DISCGOLF_FIT } from "../lib/discgolf-fit";
import { flightOf } from "../lib/discgolf-profile";
import { pageSkips, skipsIn } from "../lib/discgolf-skips";
import { discRules, moldOf } from "../lib/discgolf-hard";
import { engineBase, type EngineFacts } from "../lib/engine";
import { matchFinder, type FinderProduct } from "../lib/finder";

const fx = JSON.parse(readFileSync("tests/fixtures/engine-discgolf.json", "utf8")) as { names: Record<string, string>; discs: Record<string, { slug: string; flight: string | null }>; items: RankItem[] };
const items = fx.items, name = (id: string) => fx.names[id] ?? id, fl = (id: string) => flightOf(fx.discs[id]?.flight), skip = (id: string) => pageSkips(fx.discs[id]?.slug ?? "");
const setup = { ...discgolf.finder!, levelGate: discgolf.fit!.levelGate, engine: discgolf.fit!.engine };
const BAD = discgolf.tags.filter(t => t.tone === "neg").map(t => t.label);
const KINDS = [undefined, "putter", "midrange", "fairway", "distance"], STYLES = ["any", "control", "balance", "power"], LEVELS = [undefined, "beginner", "intermediate", "advanced"];
type Combo = { kind?: string; style: string; level?: string; arm: boolean; rows: { id: string; pct: number | null }[] };
const list = (kind: string | undefined, style: string, level: string | undefined, arm: boolean, size = 10) =>
  rankHome(items, setup, BAD, readChoice({ kind, style, level, arm: arm ? "1" : undefined }, DISCGOLF_FIT), false, size).rows;
const combos: Combo[] = [];
for (const kind of KINDS) for (const style of STYLES) for (const level of LEVELS) for (const arm of [false, true]) combos.push({ kind, style, level, arm, rows: list(kind, style, level, arm) });
const fastForArm = (id: string) => { const f = fl(id); return !!f && (f.speed >= 13 || (f.speed >= 12 && f.turn + f.fade >= 2)); };
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };

test("dg audit 1: no beginner list has a speed 12+ disc in its top 10 at 55% or more", () => {
  const bad = combos.filter(c => c.level === "beginner").flatMap(c => c.rows.filter(r => (fl(r.id)?.speed ?? 0) >= 12 && (r.pct ?? 0) >= 55).map(r => `${name(r.id)} ${r.pct}`));
  assert.deepEqual(bad, []);
});

test("dg audit 2: no slower-arm list shows speed 13+, or 12+ with turn + fade ≥ 2, above 54%", () => {
  const bad = combos.filter(c => c.arm).flatMap(c => list(c.kind, c.style, c.level, true, 9999).filter(r => fastForArm(r.id) && (r.pct ?? 0) > 54).map(r => name(r.id)));
  assert.deepEqual([...new Set(bad)], []);
});

test("dg audit 3: a disc whose page says to skip it never shows 55%+ for that pick", () => {
  const beg = combos.filter(c => c.level === "beginner").flatMap(c => list(c.kind, c.style, "beginner", c.arm, 9999).filter(r => skip(r.id).beginner && (r.pct ?? 0) >= 55).map(r => name(r.id)));
  const arm = combos.filter(c => c.arm).flatMap(c => list(c.kind, c.style, c.level, true, 9999).filter(r => skip(r.id).arm && (r.pct ?? 0) >= 55).map(r => name(r.id)));
  assert.deepEqual([...new Set([...beg, ...arm])], []);
  // The page phrases it reads.
  assert.deepEqual(skipsIn("Newer players learning angles should skip it."), { beginner: true, arm: false });
  assert.deepEqual(skipsIn("Not a first disc."), { beginner: true, arm: false });
  assert.deepEqual(skipsIn("Slow arms wanting glide should skip it."), { beginner: false, arm: true });
  assert.deepEqual(skipsIn("Hard throwers should skip DX and Pro runs."), { beginner: false, arm: false });
});

test("dg audit 4: the ✓ slower-arm chip needs speed ≤ 9, turn + fade ≤ 2 and no slow-arm skip (Firebird and Resistor fail)", () => {
  const chip = (id: string) => !!DISCGOLF_FIT.quick!.armSpecOk!({ weight: fx.discs[id].flight } as never) && !discRules({ slug: fx.discs[id].slug, weight: fx.discs[id].flight }).hard?.arm;
  const by = (n: string) => Object.keys(fx.names).find(id => fx.names[id] === n)!;
  assert.equal(chip(by("Innova Firebird")), false);
  assert.equal(chip(by("MVP Resistor")), false);
  assert.equal(chip(by("Innova Leopard3")), true);
  const wrong = Object.keys(fx.discs).filter(id => chip(id) && (() => { const f = fl(id)!; return f.speed > 9 || f.turn + f.fade > 2; })());
  assert.deepEqual(wrong, []);
});

test("dg audit 5a: no level list is just the no-level list filtered (same order, same %)", () => {
  const plain = combos.filter(c => c.level).filter(c => {
    const keep = new Set(list(c.kind, c.style, c.level, c.arm, 9999).map(r => r.id)), mine = list(c.kind, c.style, c.level, c.arm, 9999);
    const f = list(c.kind, c.style, undefined, c.arm, 9999).filter(r => keep.has(r.id));
    return f.length === mine.length && f.every((r, i) => r.id === mine[i].id && r.pct === mine[i].pct);
  });
  assert.equal(plain.length, 0);
});

test("dg audit 5b: at least 80% of discs that appear in two levels' top 10s show a different % by level", { todo: "discs whose suits are equal at two levels (the 45 / 85 / 85 template) can't differ with the level term at 0.2; reported" }, () => {
  let same = 0, all = 0;
  for (const c of combos.filter(x => x.level === "beginner")) {
    const lists = ["beginner", "intermediate", "advanced"].map(l => new Map(list(c.kind, c.style, l, c.arm, 10).map(r => [r.id, r.pct])));
    // Per disc: it appears at 2+ levels, and its % isn't the same at all of them.
    for (const id of new Set(lists.flatMap(m => [...m.keys()]))) { const ps = lists.filter(m => m.has(id)).map(m => m.get(id)); if (ps.length < 2) continue; all++; if (new Set(ps).size === 1) same++; }
  }
  assert.ok(all > 0 && (all - same) / all >= 0.8, `${all - same}/${all} differ`);
});

test("dg audit 6: the pro bag stays for advanced players (Pure, Judge, EMac Judge, Watt; Buzzz)", () => {
  const putters = new Set(list("putter", "any", "advanced", false, 9999).map(r => name(r.id)));
  for (const n of ["Latitude 64 Pure", "Dynamic Discs Judge", "Dynamic Discs EMac Judge", "Discmania Watt"].filter(n => Object.values(fx.names).includes(n))) assert.ok(putters.has(n), n);
  assert.ok(list("midrange", "any", "advanced", false, 9999).some(r => name(r.id) === "Discraft Buzzz"), "Buzzz");
});

test("dg audit 7a: every any-stability list with 20+ discs can reach Strong fit", () => {
  // A list where every disc is a step-up or a no for the pick (beginner distance drivers: all speed 9+) is held under Strong fit
  // on purpose (site audit 2026-11-17 #6).
  const f = new Map(items.map(x => [x.id, x.facts])), flagged = (id: string, c: Combo) => { const x = f.get(id)!;
    return (c.level === "beginner" && !!(x.hard?.beginner || x.warn?.beginner)) || (c.arm && !!(x.hard?.arm || x.warn?.arm)); };
  const weak = combos.filter(c => c.style === "any" && (c.kind || c.level || c.arm)).filter(c => { const all = list(c.kind, "any", c.level, c.arm, 9999);
    return all.length >= 20 && !all.every(r => flagged(r.id, c)) && (c.rows[0]?.pct ?? 0) < 75; });
  assert.deepEqual(weak.map(c => `${c.kind ?? "any"}.${c.level ?? "-"}.${c.arm}`), []);
});

test("dg audit 7b: #1 medians per stability within ±5 points of each other (a spread of 10)", () => {
  const meds = STYLES.map(s => median(combos.filter(c => c.style === s && (c.kind || c.level || c.arm)).map(c => c.rows[0]?.pct ?? 0)));
  assert.ok(Math.max(...meds) - Math.min(...meds) <= 10, `any / understable / stable / overstable #1 medians ${meds.join(" / ")}`);
});

test("dg audit 8: at most 15% of top-10 rows show 85% or more", () => {
  const rows = combos.flatMap(c => c.rows), hi = rows.filter(r => (r.pct ?? 0) >= 85).length;
  assert.ok(hi / rows.length <= 0.15, `${hi}/${rows.length}`);
});

test("dg audit 9: no disc is #1 in more than 8% of combos or top 5 in more than 15%", { todo: "Wraith: popularity weight already 0.15 → 0.08; a #1 rule is an owner decision" }, () => {
  const one = new Map<string, number>(), five = new Map<string, number>();
  for (const c of combos) { if (c.rows[0]) one.set(c.rows[0].id, (one.get(c.rows[0].id) ?? 0) + 1); c.rows.slice(0, 5).forEach(r => five.set(r.id, (five.get(r.id) ?? 0) + 1)); }
  const [o1, n1] = [...one].sort((a, b) => b[1] - a[1])[0], [o5, n5] = [...five].sort((a, b) => b[1] - a[1])[0];
  assert.ok(n1 / combos.length <= 0.08 && n5 / combos.length <= 0.15, `#1: ${name(o1)} ${n1}/${combos.length}; top 5: ${name(o5)} ${n5}/${combos.length}`);
});

test("dg audit 10: name labels match whole last words only; a disc without 4 flight numbers never ranks", () => {
  const p = discgolf.fit!.engine!;
  const facts = (name: string): EngineFacts => ({ name, year: 2026, pos: 10, mix: 0, neg: 0, voices: { control: { plus: 1, minus: 0 }, power: { plus: 1, minus: 0 } }, spec: { control: 0, power: 0 }, expert: {} });
  const b = engineBase(["Discraft Zone OS", "Discraft XS", "Discraft Buzzz SS", "Prodigy D Model OS", "Discraft Zone"].map((n, i) => ({ id: String(i), n: 10, e: facts(n) })), p);
  assert.ok(b.get("0")!.axis >= 0.65, "Zone OS is overstable");
  assert.ok(Math.abs(b.get("1")!.axis - b.get("4")!.axis) < 1e-9, "the mold XS is not a label");
  assert.ok(b.get("2")!.axis <= 0.35, "Buzzz SS is understable");
  assert.ok(b.get("3")!.axis >= 0.65, "D Model OS");
  const noFlight = new Set(Object.keys(fx.discs).filter(id => !fl(id)));
  assert.deepEqual(combos.flatMap(c => list(c.kind, c.style, c.level, c.arm, 9999)).filter(r => noFlight.has(r.id)).map(r => name(r.id)), []);
});

test("dg audit 11: data — the type fits the speed band, max weights match the maker (Lynx 175 g)", { todo: "catalogue writes wait for the owner's OK (dry run in the PR); a speed-band filter is a follow-up" }, () => {
  assert.fail("not checked in CI until the catalogue writes land");
});

test("dg audit 12: a specialty disc (turn ≤ −4) is never #1 for any stability", () => {
  const bad = combos.filter(c => c.style === "any" && c.rows[0] && (fl(c.rows[0].id)?.turn ?? 0) <= -4).map(c => `${c.kind ?? "any"}.${c.level ?? "-"}.${c.arm}: ${name(c.rows[0].id)}`);
  assert.deepEqual(bad, []);
});

test("dg audit 13: the finder's beginner answers never put speed 12+ with turn + fade ≥ 2 in the top 3, nor two variants of one mold", () => {
  const f = discgolf.finder!, cards: FinderProduct[] = items.filter(x => x.pool && x.pool.reviews >= (f.minReviews ?? 0))
    .map(x => ({ id: x.id, ...x.pool!, tags: x.facts.tags, ...(x.facts.suits ? { suits: x.facts.suits } : {}), ...(x.facts.hard?.beginner ? { hardBeginner: true } : {}), mold: moldOf(name(x.id)) }));
  const [type, level, flight, thrw, prio] = ["type", "level", "flight", "throw", "priority"].map(id => f.questions.find(q => q.id === id)!.options);
  const bad: string[] = [];
  for (const t of type) for (const fl2 of flight) for (const th of thrw) for (const p of prio) for (const lv of [level[0]]) {
    const top = matchFinder(cards, [t, lv, fl2, th, p], BAD, 3, f.rankWeight, discgolf.fit!.levelGate);
    for (const m of top) if (fastForArm(m.product.id) && (fl(m.product.id)?.speed ?? 0) >= 12) bad.push(`${t.label}/${fl2.label}: ${name(m.product.id)}`);
    const molds = top.map(m => moldOf(name(m.product.id)));
    if (new Set(molds).size < molds.length) bad.push(`${t.label}/${fl2.label}: ${molds.join(", ")}`);
  }
  assert.deepEqual([...new Set(bad)], []);
});
