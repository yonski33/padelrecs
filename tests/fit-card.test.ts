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

test("plainReason drops the level bookkeeping only", () => {
 assert.equal(plainReason("Level: the brand says professional · 3 reviewers say beginner to intermediate. Suits intermediates."), "Suits intermediates.");
 assert.equal(plainReason("A pro line, built for advanced players."), "A pro line, built for advanced players.");
});

test("padel content follows the rules: ≤105 chars, sources, 2+ for tips, no banned words", () => {
 for (const [slug, c] of Object.entries(padel as Record<string, CardContent>)) for (const l of [...c.strengths, ...c.catches]) {
  for (const t of [l.t, l.tip?.t, l.alt?.t].filter((x): x is string => !!x)) {
   assert.ok(t.length <= 105, `${slug}: too long: ${t}`);
   assert.ok(!/reddit|% liked|brand says/i.test(t), `${slug}: banned words: ${t}`);
  }
  assert.ok(l.src.length > 0, `${slug}: no sources: ${l.t}`);
  if (l.tip) assert.ok(new Set(l.tip.src).size >= 2, `${slug}: tip needs 2+ sources: ${l.tip.t}`);
 }
});
