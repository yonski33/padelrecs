import {test} from "node:test";
import assert from "node:assert/strict";
import {cardLines, plainReason, type CardContent} from "../lib/fit-card";
import padel from "../db/fit-card/padel.json";

const C: CardContent = {
 strengths: [
  {t: "Sweet spot", for: ["beginner", "control"], src: ["a"]},
  {t: "Spin", for: ["power", "advanced"], src: ["b"]},
  {t: "Arm", for: ["arm"], only: ["arm"], src: ["c"]},
 ],
 catches: [
  {t: "Weak smashes", for: ["power"], src: ["d"], alt: {slug: "x", t: "Try X", src: ["e"]}, tip: {label: "Player tip", t: "Add weight", src: ["f", "g"]}},
  {t: "Bouncy", for: ["control"], src: ["h"], tip: {label: "Weather check", t: "Hot days", src: ["i", "j"]}},
  {t: "Not for beginners", for: ["beginner"], only: ["beginner"], src: ["k"]},
  {t: "Cracks", for: [], src: ["l"]},
 ],
};

test("picks the strengths and catches that match the picks; arm-only lines need the arm box", () => {
 const a = cardLines(C, {style: "control", level: "intermediate", arm: false});
 assert.deepEqual(a.strengths.map(x => x.t), ["Sweet spot", "Spin"]);
 assert.deepEqual(a.catches.map(x => x.t), ["Bouncy"]);
 const b = cardLines(C, {style: "any", level: "beginner", arm: true});
 assert.equal(b.strengths[0].t, "Arm");
 assert.equal(b.catches[0].t, "Not for beginners");
});

test("a clean fit gets one catch; one note per catch, the alternative when it answers the style", () => {
 const a = cardLines(C, {style: "power", level: "beginner", arm: false}, {maxCatches: 1});
 assert.equal(a.catches.length, 1);
 assert.equal(a.catches[0].note?.kind, "alt");
 const b = cardLines(C, {style: "control", level: "advanced", arm: false});
 assert.equal(b.catches[0].note?.kind, "tip");
});

test("a hard conflict: a racket line on the same pick replaces the generic reason, else the reason leads", () => {
 const a = cardLines(C, {style: "power", level: "intermediate", arm: false}, {hard: "You want power, but this one is a control racket: 9 players praise the control."});
 assert.equal(a.lead, null);
 assert.equal(a.catches[0].t, "Weak smashes");
 const b = cardLines(C, {style: "control", level: "intermediate", arm: false}, {hard: "Level: the brand says professional · players say advanced. Players and reviewers call it a racket for advanced players."});
 assert.equal(b.lead, "Players and reviewers call it a racket for advanced players.");
 assert.equal(b.catches.length, 1);
});

test("a minor strength never leads", () => {
 const c: CardContent = {strengths: [{t: "Spin", for: ["power"], minor: true, src: ["a"]}, {t: "Control", for: [], src: ["b"]}], catches: []};
 assert.deepEqual(cardLines(c, {style: "power", level: "advanced", arm: false}).strengths.map(x => x.t), ["Control", "Spin"]);
});

test("counts in the fit check's reasons become words", () => {
 assert.equal(plainReason("You want power, but this one is a control racket: 20 players praise the control."), "You want power, but this one is a control racket: lots of players praise the control.");
 assert.equal(plainReason("Sore arm: 5 players mention vibration, only 1 player calls it arm-friendly."), "Sore arm: some players mention vibration, only one player calls it arm-friendly.");
});

test("plainReason drops the level bookkeeping only", () => {
 assert.equal(plainReason("Level: the brand says professional · 3 reviewers say beginner to intermediate. Suits intermediates."), "Suits intermediates.");
 assert.equal(plainReason("A pro line, built for advanced players."), "A pro line, built for advanced players.");
});

test("padel content follows the rules: ≤105 chars, sources, 2+ for tips, no banned words", () => {
 for (const [slug, c] of Object.entries(padel as Record<string, CardContent>)) for (const l of [...c.strengths, ...c.catches]) {
  for (const t of [l.t, l.tip?.t, l.alt?.t].filter((x): x is string => !!x)) {
   assert.ok(t.length <= 105, `${slug}: too long: ${t}`);
   assert.ok(!/reddit|% liked|brand says|roomy/i.test(t), `${slug}: banned words: ${t}`);
   assert.ok(!/\b\d+ (players|reviewers|testers)\b/i.test(t), `${slug}: counts in words, not numbers: ${t}`);
  }
  assert.ok(l.src.length > 0, `${slug}: no sources: ${l.t}`);
  if (l.tip) assert.ok(new Set(l.tip.src).size >= 2, `${slug}: tip needs 2+ sources: ${l.tip.t}`);
 }
});

test("racket page: 'matters for you' picks the arm first, at most 2 per column, and counts evidence from sources", async () => {
 const { mattersFor, evidenceLine, marked } = await import("../lib/racket-page");
 const items = [{ title: "A", t: "x", src: ["1"], for: ["intermediate"] }, { title: "B", t: "x", src: ["1"], for: ["control"] }, { title: "C", t: "x", src: ["1", "2", "1"], for: ["arm"] }];
 assert.deepEqual([...mattersFor(items, ["control", "intermediate", "arm"])], ["C", "B"]);
 assert.equal(mattersFor(items, []).size, 0);
 // Counts dedupe the sources; under 5 the line is hidden (owner rule, all sites).
 const five = { title: "D", t: "x", src: ["1", "2", "3", "4", "5", "5"] };
 assert.equal(evidenceLine(items[2]), null);
 assert.equal(evidenceLine(five, "players"), "5 players mention it");
 assert.equal(evidenceLine({ ...five, ev: "the #1 complaint, {n} players" }), "the #1 complaint, 5 players");
 assert.deepEqual(marked("a ==b== c"), [{ text: "a ", mark: false }, { text: "b", mark: true }, { text: " c", mark: false }]);
});

test("racket page tiers come from the content: 3+ a side full, fewer short, no entry none", async () => {
 const { pageTier } = await import("../lib/racket-page");
 const it = { title: "x", t: "==x==", src: ["a", "b"] };
 assert.equal(pageTier({ tagline: "", bottom: "", yes: [it, it, it], no: [it, it, it] }), "full");
 assert.equal(pageTier({ tagline: "", bottom: "", yes: [it, it, it], no: [it] }), "short");
 assert.equal(pageTier(null), null);
});

test("racket page content follows the rules: 1-4 items a side, one highlight, <=105 chars, no 'owners' or '% liked'", async () => {
 const { default: page } = await import("../db/racket-page/padel.json", { with: { type: "json" } });
 for (const [slug, v] of Object.entries(page as Record<string, { tagline: string; bottom: string; yes: { t: string; src: string[] }[]; no: { t: string; src: string[] }[] }>)) {
  for (const t of [v.tagline, v.bottom, ...v.yes.map(i => i.t.replace(/==/g, "")), ...v.no.map(i => i.t.replace(/==/g, ""))]) {
   assert.ok(t.length <= 105, `${slug}: too long: ${t}`);
   assert.ok(!/owner|% (liked|loved)|reddit|brand says/i.test(t), `${slug}: banned words: ${t}`);
  }
  // Full tier: 3–4 a side; short tier (6–9 reports): 1–2. Every item rests on 2+ different reports.
  for (const side of [v.yes, v.no]) { assert.ok(side.length >= 1 && side.length <= 4, `${slug}: 1-4 items`); for (const i of side) { assert.equal(i.t.split("==").length, 3, `${slug}: one highlight: ${i.t}`); assert.ok(new Set(i.src).size >= 2, `${slug}: 2+ sources: ${i.t}`); } }
 }
});

test("page items stand in as fit-card lines when a racket has no fit-card entry", async () => {
 const { cardFromPage } = await import("../lib/racket-page");
 const c = cardFromPage({ tagline: "", bottom: "", yes: [{ title: "Precise control", t: "Players like ==its feel==.", src: ["a", "b"], for: ["control"] }], no: [{ title: "Sore arm", t: "Some got ==elbow pain==.", src: ["c", "d"], for: ["arm"] }] });
 assert.equal(c.strengths[0].t, "Precise control: players like its feel.");
 assert.deepEqual(c.catches[0].only, ["arm"]);
});
