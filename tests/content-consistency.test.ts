import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { claims, contradicts, gap, padelWords } from "../lib/content-consistency";
import padel from "../db/racket-page/padel.json";

// One story per padel racket page (owner 2026-11-17): content words about forgiveness, power, control and arm comfort must
// not disagree with that racket's trait dots by 2+ steps (tests/fixtures/padel-trait-dots.json, live 2026-11-17). The page
// itself hides a line already at 1 step (lib/content-consistency.ts contradicts).
const DOTS = JSON.parse(readFileSync(new URL("./fixtures/padel-trait-dots.json", import.meta.url), "utf8")) as Record<string, Record<string, number>>;

test("claims are read from plain words", () => {
  assert.deepEqual(claims("A generous, easy-to-find hitting zone helps on mishits"), [{ trait: "forgiveness", dir: 1 }]);
  assert.deepEqual(claims("Smashes need your own arm"), [{ trait: "power", dir: -1 }]);
  assert.equal(gap({ trait: "forgiveness", dir: 1 }, 3), 1);
  assert.ok(contradicts("A generous, easy-to-find hitting zone helps on mishits", { forgiveness: 3 }), "the Vertex 05 case is hidden on the page");
  assert.equal(padelWords("an easy-to-find hitting zone"), "an easy-to-find sweet spot");
});

test("no padel page line disagrees with its racket's trait dots by 2+ steps", () => {
  const bad: string[] = [];
  for (const [slug, c] of Object.entries(padel as Record<string, { tagline: string; yes: { title: string; t: string }[]; no: { title: string; t: string }[] }>)) {
    const d = DOTS[slug]; if (!d) continue;
    for (const [where, text] of [["tagline", c.tagline], ...c.yes.map(i => ["yes", `${i.title}. ${i.t}`]), ...c.no.map(i => ["no", `${i.title}. ${i.t}`])] as [string, string][]) {
      const k = contradicts(text, d, 2); if (k) bad.push(`${slug} ${where} (${k.trait} ${k.dir > 0 ? "+" : "−"} vs ${d[k.trait]} dots): ${text.slice(0, 80)}`);
    }
  }
  assert.deepEqual(bad, []);
});
