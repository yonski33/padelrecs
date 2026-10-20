import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";
import { migrationSql } from "../db/migrations";
import { importSnapshot, snapshotSchema } from "../db/transfer";
import { shapeOf } from "../app/art/pickleball";
import type { getDb } from "../db/index";

test("the pickleball catalog (starter + expansion) is complete, sourced and imports cleanly", async () => {
  const catalog = await readCatalog("db/catalogs/pickleball.json");
  const snapshot = catalogSnapshot(catalog, "pickleballrecs", "catalog:test");
  assert.equal(snapshotSchema(snapshot), "pickleballrecs");
  assert.equal(snapshot.tables.brands.length, 31);
  assert.equal(snapshot.tables.rackets.length, 287);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 287, "no two paddles share a URL");
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0, "a catalog never brings reviews");
  assert(catalog.products.every(p => p.sources.every(s => /^https:\/\//.test(s))), "every value has an https source");
  assert(snapshot.tables.rackets.some(r => r.slug === "crbn1-trufoam-genesis-2025"));
  assert(snapshot.tables.rackets.some(r => r.slug === "crbn2-trufoam-genesis-2025"), "superscript CRBN numbers stay distinct");
  assert(snapshot.tables.brands.some(b => b.slug === "bread-butter"));
  assert.equal(shapeOf("Traditional"), "standard");
  // A throwaway local engine. db/schema.ts follows the active niche (padel while testing), so this checks the rows fit the
  // shared table layout; the real import runs with NICHE=pickleball and writes to "pickleballrecs".
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    const counts = await importSnapshot(db, snapshot);
    assert.deepEqual(counts, { brands: 31, rackets: 287, reviews: 0, externalReviews: 0 });
  } finally { await engine.close(); }
});

test("skin product types pick the right container", async () => {
  const { shapeOf } = await import("../app/art/skin");
  assert.equal(shapeOf("Serum"), "dropper");
  assert.equal(shapeOf("Moisturizer"), "jar");
  assert.equal(shapeOf("Eye cream"), "tube");
  assert.equal(shapeOf("Sunscreen"), "tube");
  assert.equal(shapeOf("Cleanser"), "bottle");
  assert.equal(shapeOf("Mask"), "jar");
});

test("catalogs without model years keep the year out of names", () => {
  const snapshot = catalogSnapshot({ about: "", checked: "2026-10-19", brands: [{ id: "cerave", name: "CeraVe" }],
    products: [{ brand: "cerave", name: "CeraVe Moisturizing Cream", shape: "Moisturizer", weight: null, core: null, surface: null, swingWeight: null, sources: ["https://example.com/"] }] }, "skinrecs", "catalog:test", false);
  assert.equal(snapshot.tables.rackets[0].name, "CeraVe Moisturizing Cream");
  assert.equal(snapshot.tables.rackets[0].slug, "cerave-moisturizing-cream");
  assert.equal(snapshot.tables.rackets[0].year, 2026);
  assert.throws(() => catalogSnapshot({ about: "", checked: "2026-10-19", brands: [{ id: "x", name: "X" }], products: [{ brand: "x", name: "X One", shape: null, weight: null, core: null, surface: null, swingWeight: null, sources: ["https://e.com"] }] }, "pickleballrecs", "t"), /needs a model year/);
});

test("the SkinRecs starter catalog: 31 sourced face products, no years in names, known types and fragrance values", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/skin.json");
  const snapshot = catalogSnapshot(catalog, "skinrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 8);
  assert.equal(snapshot.tables.rackets.length, 31);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const types = niches.skin.specs.find(s => s.column === "shape")!.options!;
  for (const r of snapshot.tables.rackets) {
    assert(!/\b20\d\d$/.test(r.name), `${r.name} should not end in a year`);
    assert(types.includes(r.shape!), `${r.name}: unknown type ${r.shape}`);
    assert(r.balance === null || ["Fragrance-free", "Contains fragrance"].includes(r.balance), `${r.name}: fragrance ${r.balance}`);
  }
  assert(catalog.products.every(p => p.sources.every(s => /^https:\/\//.test(s))));
  assert(snapshot.tables.brands.some(b => b.slug === "paulas-choice"));
  assert(!catalog.products.some(p => /Advanced Repair|Hydrogel Mask/.test(p.name)), "body cream and unavailable mask were dropped");
});

test("apostrophes vanish from slugs", async () => {
  const { slugify } = await import("../lib/slug");
  assert.equal(slugify("Paula's Choice 10% Niacinamide Booster"), "paulas-choice-10-niacinamide-booster");
  assert.equal(slugify("Nox AT10 Genius 12K 2025"), "nox-at10-genius-12k-2025");
});

test("tennis head sizes pick the frame size", async () => {
  const { shapeOf } = await import("../app/art/tennis");
  assert.equal(shapeOf("97 sq in (626 cm²)"), "midplus");
  assert.equal(shapeOf("90 sq in"), "midsize");
  assert.equal(shapeOf("110 sq in"), "oversize");
  assert.equal(shapeOf("100"), "midplus");
  assert.equal(shapeOf("645 cm²"), "unknown");
  assert.equal(shapeOf(null), "unknown");
});

test("the TennisRecs starter catalog: 35 sourced rackets named by generation, with comparable stiffness", async () => {
  const catalog = await readCatalog("db/catalogs/tennis.json");
  const snapshot = catalogSnapshot(catalog, "tennisrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 6);
  assert.equal(snapshot.tables.rackets.length, 35);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/tennis");
  for (const r of snapshot.tables.rackets) {
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: head size ${r.shape}`);
    assert(r.surface === null || /^\d\d RA$/.test(r.surface), `${r.name}: stiffness ${r.surface}`);
    assert(r.core && /^\d\dx\d\d$/.test(r.core), `${r.name}: pattern ${r.core}`);
  }
  assert(catalog.products.every(p => p.sources.length > 0 && p.sources.every(s => /^https:\/\//.test(s))));
  assert(!catalog.products.some(p => p.name.includes("Defyer")));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Wilson Pro Staff 97 V14")?.shape, "97 sq in (626 cm²)");
});

test("the padel catalog expansion: sourced current models with unique URLs that import cleanly", async () => {
  const catalog = await readCatalog("db/catalogs/padel.json");
  const snapshot = catalogSnapshot(catalog, "padelrecs", "catalog:test");
  const rows = snapshot.tables.rackets;
  assert(rows.length >= 150, "the owner chose about 150 mid and top models");
  assert.equal(new Set(rows.map(r => r.slug)).size, rows.length, "every racket gets its own URL");
  assert(catalog.products.every(p => p.sources.every(s => /^https:\/\//.test(s))), "every racket has an https source");
  assert(rows.every(r => /\b20(25|26|27)$/.test(r.name)), "current models only, named with their year");
  assert.equal(rows.find(r => r.name === "Oxdog Hyper Pro+ 2.0 2026")!.slug, "oxdog-hyper-pro-plus-2-0-2026", "a + model doesn't take the plain model's URL");
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    // The live import goes on top of the existing padel data; scripts/catalog-snapshot.ts + db:import check that against a backup first.
    const counts = await importSnapshot(db, snapshot);
    assert.deepEqual(counts, { brands: catalog.brands.length, rackets: rows.length, reviews: 0, externalReviews: 0 });
  } finally { await engine.close(); }
});
