import { test } from "node:test";
import assert from "node:assert/strict";
import { mentionIndex, splitMentions } from "../lib/thread/mention-links";
import { yearContext, pickYear, type YearRow } from "../lib/thread/mention-years";
import padelMentions from "../db/creators/padel-mentions.json";
import type { MentionYears } from "../lib/thread/mention-years";

// A slice of the padel catalogue: one row per model year, the 2026 Adidas names without their generation.
const R = (slug: string, name: string, brand: string, year: number): YearRow => ({ id: slug, slug, name: `${name} ${year}`, brand, year });
const ROWS: YearRow[] = [
  R("adidas-metalbone-3-4-2025", "Adidas Metalbone 3.4", "Adidas", 2025),
  R("adidas-metalbone-3-5-2026", "Adidas Metalbone", "Adidas", 2026),
  R("adidas-metalbone-carbon-3-4-2025", "Adidas Metalbone Carbon 3.4", "Adidas", 2025),
  R("adidas-metalbone-carbon-3-5-2026", "Adidas Metalbone Carbon", "Adidas", 2026),
  R("adidas-metalbone-carbon-ctrl-3-4-2025", "Adidas Metalbone Carbon CTRL 3.4", "Adidas", 2025),
  R("adidas-metalbone-carbon-ctrl-3-5-2026", "Adidas Metalbone Carbon CTRL", "Adidas", 2026),
  R("adidas-metalbone-ctrl-3-4-2025", "Adidas Metalbone CTRL 3.4", "Adidas", 2025),
  R("adidas-metalbone-ctrl-2026", "Adidas Metalbone CTRL", "Adidas", 2026),
  R("adidas-metalbone-hrd-plus-3-4-2025", "Adidas Metalbone HRD+ 3.4", "Adidas", 2025),
  R("adidas-metalbone-hrd-plus-3-5-2026", "Adidas Metalbone HRD+", "Adidas", 2026),
  R("siux-fenix-pro-5-2025", "Siux Fenix Pro 5", "Siux", 2025),
  R("siux-fenix-pro-6-2026", "Siux Fenix Pro", "Siux", 2026),
  R("nox-at10-genius-attack-18k-2025", "Nox AT10 Genius Attack 18K", "Nox", 2025),
  R("nox-at10-genius-attack-18k-2026", "Nox AT10 Genius Attack 18K", "Nox", 2026),
  R("bullpadel-neuron-2025", "Bullpadel Neuron", "Bullpadel", 2025),
  R("bullpadel-neuron-02-2026", "Bullpadel Neuron 02", "Bullpadel", 2026),
  R("kuikma-hybrid-carbon-2026", "Kuikma Hybrid Carbon", "Kuikma", 2026),
  R("wilson-bela-pro-v3-2025", "Wilson Bela Pro V3", "Wilson", 2025),
];
const PM = padelMentions as unknown as MentionYears;
const links = (self: string, text: string) => { const at = ROWS.find(r => r.slug === self)!.year!;
  const { rows, extra } = yearContext(ROWS, self, at, PM);
  return splitMentions(text, mentionIndex(rows, extra), self, new Set()).filter(s => s.id).map(s => [s.t, s.id]); };

test("the owner's sample card: every racket it names links to one page, by the page's season", () => {
  const text = "Finds it about 99% identical to the 2025 3.4. Prefers the Metalbone Carbon. Finds the HRD+ more progressive. "
    + "Calls the Siux Phoenix Pro 5 easier to carry, and the Nox AT Attack 18K similar.";
  assert.deepEqual(links("adidas-metalbone-3-5-2026", text), [
    ["3.4", "adidas-metalbone-3-4-2025"], ["Metalbone Carbon", "adidas-metalbone-carbon-3-5-2026"], ["HRD", "adidas-metalbone-hrd-plus-3-5-2026"],
    ["Siux Phoenix Pro 5", "siux-fenix-pro-5-2025"], ["Nox AT Attack 18K", "nox-at10-genius-attack-18k-2026"]]);
});

test("a 2025 page resolves the same names to the 2025 models", () => {
  assert.deepEqual(links("wilson-bela-pro-v3-2025", "Softer than the Adidas Metalbone HRD+ and the AT Attack 18K."),
    [["Adidas Metalbone HRD", "adidas-metalbone-hrd-plus-3-4-2025"], ["AT Attack 18K", "nox-at10-genius-attack-18k-2025"]]);
  assert.deepEqual(links("wilson-bela-pro-v3-2025", "Lighter than the Neuron."), [["Neuron", "bullpadel-neuron-2025"]]);
  assert.deepEqual(links("adidas-metalbone-3-5-2026", "Lighter than the Neuron."), [["Neuron", "bullpadel-neuron-02-2026"]]);
});

test("names stay plain when they are everyday words, belong to another page's line, or are this page's racket", () => {
  assert.deepEqual(links("adidas-metalbone-3-5-2026", "A hybrid carbon face."), []);
  assert.deepEqual(links("adidas-metalbone-3-5-2026", "The Kuikma Hybrid Carbon."), [["Kuikma Hybrid Carbon", "kuikma-hybrid-carbon-2026"]]);
  assert.deepEqual(links("wilson-bela-pro-v3-2025", "Rated 3.4 out of 5."), [], "\"3.4\" only means the Metalbone on Metalbone pages");
  assert.deepEqual(links("adidas-metalbone-3-5-2026", "The Metalbone 3.5 is this racket."), []);
});

test("pickYear: the same season, else the newest before it, else the oldest after it", () => {
  const xs = [{ year: 2024 }, { year: 2026 }, { year: 2027 }];
  assert.equal(pickYear(xs, 2026)?.year, 2026);
  assert.equal(pickYear(xs, 2025)?.year, 2024);
  assert.equal(pickYear(xs, 2023)?.year, 2024);
});
