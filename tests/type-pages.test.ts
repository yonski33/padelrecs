import { test } from "node:test";
import assert from "node:assert/strict";
import { niches, niche } from "../lib/niche";
import { hubTitle, hubDescription } from "../lib/type-pages";

test("every type hub has a plural keyword phrase for its title, and no two hubs on a site share one", () => {
  for (const n of Object.values(niches)) {
    const labels = (n.typePages ?? []).map(t => t.seoLabel);
    for (const t of n.typePages ?? []) assert(t.seoLabel && t.seoLabel.length >= t.label.length - 2, `${n.id} /${t.slug} needs a seoLabel`);
    assert.equal(new Set(labels).size, labels.length, `${n.id}: duplicate seoLabel`);
  }
});

test("hub titles and descriptions follow the agreed pattern", () => {
  const t = { shape: "Air fryer", slug: "air-fryers", label: "Air fryers", seoLabel: "Air Fryers", intro: "Basket and oven-style air fryers" };
  assert.equal(hubTitle(t), `Best Air Fryers – Real ${niche.people.One} Reviews and Ratings`);
  const d = hubDescription(t, ["Ninja AF101", "Cosori TurboBlaze", "Instant Vortex Plus", "Philips 3000", "Typhur Dome"]);
  assert.match(d, /^Air Fryers compared by real \w+ reviews: Ninja AF101, Cosori TurboBlaze, Instant Vortex Plus and 2 more\./);
  assert(d.length <= 160, d);
  assert.match(hubDescription(t, ["Monarch", "YNAB"]), /: Monarch and YNAB\./);
  assert.match(hubDescription(t, ["A", "B", "C"]), /: A, B and C\./);
  const long = hubDescription(t, ["A very long product name number one", "A very long product name number two", "A very long product name number three", "x"]);
  assert(long.length <= 170 && !long.includes("Basket"), "the intro is dropped when it would run long");
  assert.match(hubDescription(t, []), /^Air Fryers: real \w+ reviews and ratings on \w+\. Basket and oven-style air fryers\.$/);
});
