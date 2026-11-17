// The catalog style filter (owner 2026-11-17): a racket can sit under two styles (beginner rackets count as control and
// balance); without a list it falls back to its one style.
import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogTests, type CatalogRow } from "../lib/catalog-filter";

const row = (x: Partial<CatalogRow>): CatalogRow => ({ id: "a", name: "A", lean: null, shape: null, year: "2026", arm: false, weight: null, feel: null, sweet: false, signal: null, n: 0, judged: 0, newest: true, ...x });

test("style filter: a beginner racket shows under control and balance, never power unless its own style is power", () => {
  const style = catalogTests(62).style;
  const r = row({ lean: "balance", styles: ["balance", "control"] });
  assert.ok(style(r, "control") && style(r, "balance") && !style(r, "power"));
  assert.ok(style(row({ lean: "power" }), "power") && !style(row({ lean: "power" }), "control"));
});
