import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { lines, listLine } from "../lib/list-lines";

test("every site's lines belong to a real site and stay short", () => {
  for (const [site, all] of Object.entries(lines)) {
    assert(niches[site as keyof typeof niches], site);
    for (const line of Object.values(all)) assert(line.length <= 105 && line.endsWith("."), line);
  }
});

test("a product without a line falls back to its summary's first sentence", () => {
  assert.equal(listLine({ slug: "nope", reviewSummary: "First one. Second one." }, "padel"), "First one.");
  assert.equal(listLine({ slug: "nope", reviewSummary: null }, "padel"), null);
  assert(listLine({ slug: "siux-fenix-pro-6-2026" }, "padel")?.startsWith("Easy power"));
});
