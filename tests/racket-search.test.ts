import { test } from "node:test";
import assert from "node:assert/strict";
import { matchingRackets } from "../lib/racket-search";

const rackets = [
  { name: "Nox AT10 Genius 12K 2025", slug: "nox-at10-genius-12k-2025" },
  { name: "Nox AT10 Genius 18K 2025", slug: "nox-at10-genius-18k-2025" },
  { name: "Nox EA10 Ventus Hybrid 12K 2026", slug: "nox-ea10-ventus-hybrid-12k-2026" },
  { name: "Bullpadel Vertex 05 2026", slug: "bullpadel-vertex-05-2026" },
];
test("partial names match separated words and progressively narrow results", () => {
  assert.equal(matchingRackets(rackets,"nox").length,3);
  assert.equal(matchingRackets(rackets,"nox 12k").length,2);
  assert.deepEqual(matchingRackets(rackets,"nox at10 12k").map(r=>r.slug),[rackets[0].slug]);
  assert.deepEqual(matchingRackets(rackets,"12k nox 2025").map(r=>r.slug),[rackets[0].slug]);
});
test("search tolerates case, accents, extra spaces and punctuation", () => {
  assert.deepEqual(matchingRackets(rackets,"  NÓX, AT10   12K ").map(r=>r.slug),[rackets[0].slug]);
  assert.equal(matchingRackets(rackets,"nox 12k 2024").length,0);
  assert.equal(matchingRackets(rackets," ").length,4);
});
