import { test } from "node:test";
import assert from "node:assert/strict";
import { mentionIndex, splitMentions, namedIds } from "../lib/thread/mention-links";

const rows = [
  { id: "vp2", name: "11SIX24 Vapor Power 2", brand: "11SIX24" },
  { id: "vp", name: "11SIX24 Vapor Power", brand: "11SIX24" },
  { id: "j2", name: "Honolulu J2CR", brand: "Honolulu" },
  { id: "pp4", name: "Joola Perseus Pro IV", brand: "Joola" },
  { id: "c16", name: "Six Zero Coral 16mm", brand: "Six Zero" },
  { id: "cp16", name: "Six Zero Coral Pro 16mm", brand: "Six Zero" },
  { id: "h1", name: "Brand X Hybrid", brand: "Brand X" },
  { id: "h2", name: "Brand Y Hybrid", brand: "Brand Y" },
  { id: "eap", name: "Engage Alpha Pro", brand: "Engage" },
  { id: "vapp", name: "11SIX24 Vapor Alpha Pro Power", brand: "11SIX24" },
];
const idx = mentionIndex(rows);
const links = (t: string, self = "none") => splitMentions(t, idx, self, new Set()).filter(s => s.id).map(s => `${s.t}=${s.id}`);

test("links unique exact names, first mention only", () => {
  assert.deepEqual(links("Better than the Vapor Power 2 and the J2CR; the Vapor Power 2 again."), ["Vapor Power 2=vp2", "J2CR=j2"]);
});
test("a name followed by a generation is a different paddle", () => {
  assert.deepEqual(links("the Vapor Power 3 is out"), []);
  assert.deepEqual(links("the Vapor Power is older"), ["Vapor Power=vp"]);
});
test("roman and digit generations match", () => {
  assert.deepEqual(links("next to the Perseus Pro 4"), ["Perseus Pro 4=pp4"]);
  assert.deepEqual(links("next to the Perseus Pro V"), []);
});
test("ambiguous or vague names stay plain", () => {
  assert.deepEqual(links("the 11SIX24 hybrid and the Coral"), []);
  assert.deepEqual(links("any Hybrid"), []);
});
test("the own paddle never links and claims its text", () => {
  assert.deepEqual(links("the Coral Pro 16mm beats the Coral 16mm", "cp16"), ["Coral 16mm=c16"]);
  assert.deepEqual(links("the Coral Pro 16mm is great", "cp16"), []);
});
test("namedIds lists the other paddles a page names", () => {
  assert.deepEqual(namedIds(["vs J2CR", null, "and Coral 16mm, J2CR"], idx, "cp16"), ["j2", "c16"]);
});
test("a letter-digit model matches with a space inside", () => {
  assert.deepEqual(links("the J2 CR and the j2cr"), ["J2 CR=j2"]);
});
test("a short name inside another paddle's longer name stays plain", () => {
  assert.deepEqual(links("the 11SIX24 Alpha Pro Power and the Alpha Pro"), []);
  assert.deepEqual(links("the Engage Alpha Pro"), ["Engage Alpha Pro=eap"]);
});
