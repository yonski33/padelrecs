import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogView, catalogHref, readCatalogFilters, type CatalogRow } from "../lib/catalog-filter";
import { viewKey, readViewKey, viewQuery, CATALOG_VIEW, RANKING_VIEW, RACKET_VIEW } from "../lib/view-key";
import { alternatives, type RankItem } from "../lib/home-rank";
import { padel } from "../lib/niche/padel";

// Speed batch (owner 2026-11-15): /rackets filters in the browser, and /rackets, /rankings and racket pages served from one
// cached page per view.
const row = (id: string, o: Partial<CatalogRow> = {}): CatalogRow => ({ id, name: id, lean: "control", shape: "round", year: "2026", arm: false, weight: "medium", feel: "soft",
  sweet: false, signal: 70, n: 20, judged: 18, newest: true, suits: { beginner: 40, intermediate: 70, advanced: 80 }, ...o });
const rows = [row("a", { signal: 90 }), row("b", { lean: "power", shape: "diamond", signal: 80, arm: true }), row("c", { newest: false, year: "2025", signal: 95 }),
  row("d", { lean: "balance", suits: { beginner: 70, intermediate: 70, advanced: 50 }, signal: 60, judged: 50 })];

test("the catalogue filters: newest rows by default, picks narrow, counts say what a pick would leave", () => {
  const all = catalogView(rows, {}, 62);
  assert.deepEqual(all.shown.map(x => x.id), ["a", "b", "d"]);
  assert.equal(all.olderN, 1); assert.equal(all.total, 3);
  const control = catalogView(rows, { style: "control" }, 62);
  assert.deepEqual(control.shown.map(x => x.id), ["a"]);
  // A group's counts hold the other picks but not its own.
  assert.equal(control.counts.style.power, 1); assert.equal(control.counts.level.beginner, 0);
  assert.deepEqual(catalogView(rows, { level: "beginner" }, 62).shown.map(x => x.id), ["d"]);
  assert.deepEqual(catalogView(rows, { arm: "1" }, 62).shown.map(x => x.id), ["b"]);
  assert.deepEqual(catalogView(rows, { sort: "reviews" }, 62).shown.map(x => x.id), ["d", "a", "b"]);
  assert.deepEqual(catalogView(rows, { older: "1" }, 62).shown.map(x => x.id), ["c", "a", "b", "d"]);
});

test("catalogue addresses keep the other picks and drop unknown keys", () => {
  assert.equal(catalogHref("/rackets", { style: "control", show: "40" }, { level: "beginner" }), "/rackets?style=control&level=beginner");
  assert.equal(catalogHref("/rackets", { style: "control" }, { style: undefined }), "/rackets");
  assert.deepEqual(readCatalogFilters({ style: "power", nope: "x" }), { style: "power" });
});

test("view keys: one key per view, unknown keys and free text stay uncached, keys read back", () => {
  assert.equal(viewKey(new URLSearchParams("level=beginner&style=power"), RANKING_VIEW), "level.beginner~style.power");
  assert.equal(viewKey(new URLSearchParams("style=power&level=beginner"), RANKING_VIEW), "level.beginner~style.power");
  assert.equal(viewKey(new URLSearchParams(""), CATALOG_VIEW), "-");
  assert.equal(viewKey(new URLSearchParams("q=nox"), CATALOG_VIEW), null);
  assert.equal(viewKey(new URLSearchParams("style=power&utm_source=x"), RACKET_VIEW), null);
  assert.equal(viewKey(new URLSearchParams("style=Power Plus"), RACKET_VIEW), null);
  assert.equal(viewKey(new URLSearchParams("style=power&style=control"), RACKET_VIEW), null);
  assert.deepEqual(readViewKey("level.beginner~style.power", RANKING_VIEW), { level: "beginner", style: "power" });
  assert.deepEqual(readViewKey("-", RANKING_VIEW), {});
  assert.equal(readViewKey("style.power~level.beginner", RANKING_VIEW), null, "not the canonical order");
  assert.equal(readViewKey("nope.x", RANKING_VIEW), null);
  assert.equal(viewQuery({ style: "power", level: "beginner" }), "?style=power&level=beginner");
});

test("a racket page's better matches never list the racket itself", () => {
  const finder = { ...padel.finder!, levelGate: padel.fit?.levelGate };
  const suits = { beginner: 50, intermediate: 80, advanced: 70, basis: ["players"] };
  const item = (id: string, signal: number): RankItem => ({ id, facts: { reports: 30, tags: { "good control": 10, forgiving: 3 }, suits }, control: 70, power: 50, arm: 50, signal,
    level: { liked: {}, suits }, pool: { reviews: 30, positive: 25, mixed: 3, negative: 2, shape: "Round", lists: {} }, row: id });
  const items = ["a", "b", "c", "d", "e", "f"].map((id, i) => item(id, 90 - i));
  const alts = alternatives(items, finder, [], { style: "control", level: "intermediate", arm: false }, "a");
  assert.equal(alts.length, 4);
  assert.ok(!alts.some(r => r.id === "a"));
});
