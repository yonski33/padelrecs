import { test } from "node:test";
import assert from "node:assert/strict";
import { spreadByProduct, helpfulnessScore, nicheTerms, helpfulRank } from "../lib/review-order";
import { selectNiche } from "../lib/niche";

test("a day's reviews of one product are spread out, days stay newest first", () => {
  const day = (d: string, h: number) => `2026-10-${d}T${String(h).padStart(2, "0")}:00:00Z`;
  const items = [
    ...[1, 2, 3, 4].map(h => ({ key: `a${h}`, product: "A", date: day("21", 10 + h) })),
    { key: "b1", product: "B", date: day("21", 9) },
    { key: "c1", product: "C", date: day("21", 8) },
    { key: "old", product: "A", date: day("20", 12) },
  ];
  const out = spreadByProduct(items).map(i => i.key);
  assert.deepEqual(out, ["a4", "b1", "c1", "a3", "a2", "a1", "old"]);
  assert.equal(new Set(out).size, items.length);
});

test("helpfulness: detailed first-hand reviews outrank one-liners, votes still count most", () => {
  const terms = nicheTerms(selectNiche("padel"));
  const short = helpfulnessScore({ text: "Great racket, love it." }, terms);
  const detailed = helpfulnessScore({ text: "Three months with it on the left side as an intermediate. Coming from a Vertex 04, the sweet spot is bigger and control on volleys is better, but power on smashes is lower and it vibrates on mishits.", tags: ["good control", "small sweet spot"], sentiment: "mixed" }, terms);
  assert(short <= 3, `short ${short}`);
  assert(detailed >= 6, `detailed ${detailed}`);
  assert(detailed > short);
  for (const s of [short, detailed]) assert(s >= 1 && s <= 10);
  assert(helpfulRank({ helpful: 3, score: short }) > helpfulRank({ helpful: 0, score: detailed }));
});
