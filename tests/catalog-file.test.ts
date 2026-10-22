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
  const snapshot = catalogSnapshot(catalog, "pickleballrecs", "catalog:test", false);
  assert.equal(snapshotSchema(snapshot), "pickleballrecs");
  assert.equal(snapshot.tables.brands.length, 31);
  assert.equal(snapshot.tables.rackets.length, 287);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 287, "no two paddles share a URL");
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0, "a catalog never brings reviews");
  assert(catalog.products.every(p => p.sources.every(s => /^https:\/\//.test(s))), "every value has an https source");
  assert(snapshot.tables.rackets.some(r => r.slug === "crbn1-trufoam-genesis"));
  assert(snapshot.tables.rackets.some(r => r.slug === "crbn2-trufoam-genesis"), "superscript CRBN numbers stay distinct");
  // Names and URLs carry no year; ids keep the year they were first imported with, and the year column keeps its value.
  const prism = snapshot.tables.rackets.find(r => r.slug === "vatic-pro-prism-flash")!;
  assert.deepEqual([prism.id, prism.name, prism.year], ["vatic-pro-prism-2023", "Vatic Pro Prism Flash", 2023], "a renamed product keeps its import id");
  assert(snapshot.tables.rackets.every(r => !/ (19|20)\d{2}$/.test(r.name)), "no name ends in a year");
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
  assert.equal(shapeOf("Treatment"), "tube");
});

test("catalogs without model years keep the year out of names", () => {
  const snapshot = catalogSnapshot({ about: "", checked: "2026-10-19", brands: [{ id: "cerave", name: "CeraVe" }],
    products: [{ brand: "cerave", name: "CeraVe Moisturizing Cream", shape: "Moisturizer", weight: null, core: null, surface: null, swingWeight: null, sources: ["https://example.com/"] }] }, "skinrecs", "catalog:test", false);
  assert.equal(snapshot.tables.rackets[0].name, "CeraVe Moisturizing Cream");
  assert.equal(snapshot.tables.rackets[0].slug, "cerave-moisturizing-cream");
  assert.equal(snapshot.tables.rackets[0].year, 2026);
  assert.throws(() => catalogSnapshot({ about: "", checked: "2026-10-19", brands: [{ id: "x", name: "X" }], products: [{ brand: "x", name: "X One", shape: null, weight: null, core: null, surface: null, swingWeight: null, sources: ["https://e.com"] }] }, "pickleballrecs", "t"), /needs a model year/);
});

test("the SkinRecs catalog: 333 sourced face products, no years in names, known types and fragrance values", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/skin.json");
  const snapshot = catalogSnapshot(catalog, "skinrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 42);
  assert.equal(snapshot.tables.rackets.length, 333);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 333);
  assert(snapshot.tables.rackets.some(r => r.shape === "Treatment"));
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

test("the TennisRecs catalog: 35 starter rackets plus current and previous generations (348), named by generation, with unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/tennis.json");
  const snapshot = catalogSnapshot(catalog, "tennisrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 10);
  assert.equal(snapshot.tables.rackets.length, 348);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 348);
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
  // 2024 models are added only when reviews of them turn up (owner rule, 2026-10-21).
  assert(rows.every(r => /\b20(24|25|26|27)$/.test(r.name)), "recent models only, named with their year");
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

test("the RunningRecs starter catalog: sourced shoes named by version, every category drawable, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/running.json");
  const snapshot = catalogSnapshot(catalog, "runningrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 16);
  assert(snapshot.tables.rackets.length >= 400);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/running");
  for (const r of snapshot.tables.rackets) {
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: category ${r.shape}`);
    assert(r.core === null || /^\d+(\.\d+)? mm$/.test(r.core), `${r.name}: drop ${r.core}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: shoes carry versions, not years`);
  }
  // Starter shoes come from RunRepeat; shoes added later for held reviews may cite another review site (2026-10-21).
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert(catalog.products.filter(p => !p.sources[0].startsWith("https://runrepeat.com/")).length <= 10);
});

test("the GolfRecs starter catalog: sourced drivers named by generation, known categories, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/golf.json");
  const snapshot = catalogSnapshot(catalog, "golfrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 13);
  assert(snapshot.tables.rackets.length >= 75);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/golf");
  for (const r of snapshot.tables.rackets) {
    assert(r.shape === null || shapeOf(r.shape) !== "unknown", `${r.name}: category ${r.shape}`);
    assert(r.weight === null || /^\d+(\.\d+)?°(, \d+(\.\d+)?°)*$/.test(r.weight), `${r.name}: lofts ${r.weight}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: drivers carry generations, not years`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
});

test("the GamingRecs starter catalog: 460 sourced products in five known categories, no years in names, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/gaming.json");
  const snapshot = catalogSnapshot(catalog, "gamingrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 40);
  assert.equal(snapshot.tables.rackets.length, 460);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 460);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.gaming.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/gaming");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: gear carries generations, not years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.filter(r => r.shape === c).length >= 80, `${c}: at least 80 products`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Wooting 80HE+")?.slug, "wooting-80he-plus");
});

test("the DiscGolfRecs starter catalog: sourced molds without years, known types, flight numbers in speed / glide / turn / fade, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/discgolf.json");
  const snapshot = catalogSnapshot(catalog, "discgolfrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 12);
  assert(snapshot.tables.rackets.length >= 450);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/discgolf");
  for (const r of snapshot.tables.rackets) {
    assert(r.shape !== null && shapeOf(r.shape) !== "unknown", `${r.name}: type ${r.shape}`);
    assert(r.weight === null || /^\d+(\.5)? \/ \d+(\.5)? \/ -?\d+(\.5)? \/ \d+(\.5)?$/.test(r.weight), `${r.name}: flight numbers ${r.weight}`);
    assert(r.balance === null || /^\d(\.\d)? cm$/.test(r.balance), `${r.name}: rim width ${r.balance}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: discs are molds, not years`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
});

test("the SimRacingRecs starter catalog: sourced gear without years in five known categories, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/simracing.json");
  const snapshot = catalogSnapshot(catalog, "simracingrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 13);
  assert(snapshot.tables.rackets.length >= 250);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/simracing");
  for (const r of snapshot.tables.rackets) {
    assert(r.shape !== null && shapeOf(r.shape) !== "unknown", `${r.name}: category ${r.shape}`);
    assert(r.weight === null || /^\d+(\.\d)? (Nm|kg load cell)$/.test(r.weight), `${r.name}: torque / force ${r.weight}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: gear is named by generation, not year`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Fanatec ClubSport DD+")?.slug, "fanatec-clubsport-dd-plus");
});
