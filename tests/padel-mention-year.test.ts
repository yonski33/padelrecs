import { test } from "node:test";
import assert from "node:assert/strict";
import { mentionIndex, splitMentions } from "../lib/thread/mention-links";
import { yearContext, type YearRow } from "../lib/thread/mention-years";

// Owner bug 2026-11-24: on the Nox AT10 18K page, "Nox AT10 Genius 12K Alum XTREM 2026" linked only "AT10 Genius 12K" and opened
// the 2025 12K page. A slice of the padel catalogue: the 2025 12K, the 2026 and 2027 Alum XTREM, the 2026 Alum XTREM Lite.
const R = (slug: string, name: string, year: number): YearRow => ({ id: slug, slug, name: `${name} ${year}`, brand: "Nox", year });
const ROWS: YearRow[] = [
  R("nox-at10-genius-18k-2026", "Nox AT10 Genius 18K", 2026),
  R("nox-at10-genius-12k-2025", "Nox AT10 Genius 12K", 2025),
  R("nox-at10-genius-12k-alum-xtrem-2026", "Nox AT10 Genius 12K Alum XTREM", 2026),
  R("nox-at10-genius-12k-alum-xtrem-2027", "Nox AT10 Genius 12K Alum XTREM", 2027),
  R("nox-at10-genius-12k-alum-xtrem-lite-2026", "Nox AT10 Genius 12K Alum XTREM Lite", 2026),
];
const links = (text: string) => { const { rows, extra } = yearContext(ROWS, "nox-at10-genius-18k-2026", 2026, {});
  return splitMentions(text, mentionIndex(rows, extra, ROWS), "nox-at10-genius-18k-2026", new Set()).filter(s => s.id).map(s => [s.t, s.id]); };

test("the owner's case: the full name with its year opens the 2026 Alum XTREM, not the 2025 12K", () => {
  assert.deepEqual(links("Compares it with the Nox AT10 Genius 12K Alum XTREM 2026 and finds it stiffer."),
    [["Nox AT10 Genius 12K Alum XTREM 2026", "nox-at10-genius-12k-alum-xtrem-2026"]]);
});
test("the longest name wins: the Lite is its own racket, and the plain 12K only links as itself", () => {
  assert.deepEqual(links("Prefers the Nox AT10 Genius 12K Alum XTREM Lite 2026."), [["Nox AT10 Genius 12K Alum XTREM Lite 2026", "nox-at10-genius-12k-alum-xtrem-lite-2026"]]);
  assert.deepEqual(links("Plays the Nox AT10 Genius 12K more often."), [["Nox AT10 Genius 12K", "nox-at10-genius-12k-2025"]]);
});
test("a named year picks that year's racket only", () => {
  assert.deepEqual(links("Beats the Nox AT10 Genius 12K Alum XTREM 2027 on power."), [["Nox AT10 Genius 12K Alum XTREM 2027", "nox-at10-genius-12k-alum-xtrem-2027"]]);
});
test("a named year the catalogue does not have stays plain: never another year's page", () => {
  assert.deepEqual(links("Like the Nox AT10 Genius 12K Alum XTREM 2025 but softer."), []);
  assert.deepEqual(links("Like the Nox AT10 Genius 12K 2026 but softer."), []);
});
