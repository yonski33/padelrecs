import { test } from "node:test";
import assert from "node:assert/strict";
import { attrProfileFor, statedGroups, fragranceFact, spfOf } from "../lib/attr-profile";
import { scoreAll, attrMatch, attrWords, dotsOf } from "../lib/attr-score";
import { readSkinChoice, skinHref, skinWords } from "../lib/skin-choice";
import type { EvidenceRow } from "../lib/evidence";

const skin = attrProfileFor({ id: "skin" })!;
const groups = (t: string) => statedGroups(t).map(g => g.group).sort();

test("the writer's own skin type counts; advice and negations don't", () => {
  assert.deepEqual(groups("I have very oily skin and this keeps me matte"), ["oily"]);
  assert.deepEqual(groups("Has combination, acne-prone skin and says it helped"), ["acne", "combination"]);
  assert.deepEqual(groups("Works on their dry, sensitive skin"), ["dry", "sensitive"]);
  assert.deepEqual(groups("I have rosacea and it didn't sting"), ["sensitive"]);
  assert.deepEqual(groups("Great for oily skin, apparently"), []);
  assert.deepEqual(groups("I don't have sensitive skin but it burned"), []);
  assert.equal(statedGroups("My skin is super dry in winter")[0].quote, "My skin is super dry");
});

test("fragrance: brand 'fragrance-free' with essential oils is not fragrance-free", () => {
  assert.equal(fragranceFact("Fragrance-free"), "free");
  assert.equal(fragranceFact("Brand claims fragrance-free; contains lemongrass oil"), "oils");
  assert.equal(fragranceFact("Contains fragrance (Parfum)"), "fragrance");
  assert.equal(fragranceFact(null), null);
  assert.equal(spfOf("Relief Sun SPF 50+"), 50);
});

const row = (productId: string, attribute: string, value: number, author: string, extra: Partial<EvidenceRow> = {}): EvidenceRow =>
  ({ productId, sourceKind: "player_report", sourceRef: `w:${author}`, authorKey: author, attribute, value, valueText: null, strength: 1, quote: "q", saidAt: null, extractedBy: "t", ...extra });

test("suits needs enough group members, counts each voice once, and leans on its stand-in quality", () => {
  const products = [{ id: "a", shape: "Moisturizer", reports: 20, verdict: 0.5 }, { id: "b", shape: "Moisturizer", reports: 20, verdict: 0.5 }];
  const rows = [
    ...["u1", "u2", "u3", "u4"].map(u => row("a", "suits_dry", 1, u)), row("a", "suits_dry", 1, "u1", { sourceRef: "w:u1b" }),
    ...["u1", "u2"].map(u => row("b", "suits_dry", -1, u)),
  ];
  const s = scoreAll(skin, products, rows);
  assert.equal(s.get("a")!.scores.suits_dry!.n, 4);
  assert(s.get("a")!.scores.suits_dry!.score >= 80);
  assert.equal(s.get("b")!.scores.suits_dry, null, "2 dry-skin voices: no score yet");
});

test("axis sits between its ends and applies only to its product types", () => {
  const products = [{ id: "m", shape: "Moisturizer", reports: 10, verdict: 0 }, { id: "c", shape: "Cleanser", reports: 10, verdict: 0 }];
  const rows = ["a", "b", "c", "d"].flatMap(u => [row("m", "texture", -1, u), row("c", "texture", -1, u)]);
  const s = scoreAll(skin, products, rows);
  const t = skin.attrs.find(a => a.key === "texture")!;
  assert(s.get("m")!.scores.texture!.score < 30);
  assert.equal(attrWords(t, s.get("m")!.scores.texture), "light");
  assert.equal(s.get("c")!.scores.texture, null);
});

test("match: no % without the picked group's voices; the best fit wins", () => {
  const products = [{ id: "a", shape: "Moisturizer", reports: 30, verdict: 0.6 }, { id: "b", shape: "Moisturizer", reports: 30, verdict: 0.6 }];
  const rows = [...["1", "2", "3", "4", "5"].map(u => row("a", "suits_oily", 1, u)), ...["1", "2", "3"].map(u => row("b", "suits_oily", -1, u))];
  const s = scoreAll(skin, products, rows);
  const c = { type: null, skin: "oily", concerns: [], finish: null, ff: false };
  const a = attrMatch(skin, s.get("a")!, "Moisturizer", 80, c), b = attrMatch(skin, s.get("b")!, "Moisturizer", 80, c);
  assert(a.pct! > b.pct!);
  assert.deepEqual(attrMatch(skin, s.get("a")!, "Moisturizer", 80, { ...c, concerns: ["sensitive"] }).missing, ["sensitive skin"]);
  assert.equal(dotsOf(80), 5);
});

test("skin picks round-trip through the URL", () => {
  const types = [{ slug: "moisturizers", shape: "Moisturizer" }];
  const c = readSkinChoice({ type: "moisturizers", skin: "dry", sens: "1", finish: "dewy", ff: "1", junk: "x" }, types);
  assert.equal(skinHref(c, "/", ""), "/?type=moisturizers&skin=dry&sens=1&finish=dewy&ff=1");
  assert.deepEqual(skinWords(c), ["dry, sensitive skin", "dewy finish", "fragrance-free"]);
  assert.equal(readSkinChoice({ skin: "purple" }, types).skin, null);
});
