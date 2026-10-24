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

test("the GamingRecs starter catalog: 372 sourced products in four known categories (monitors moved to MonitorRecs), no years in names, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/gaming.json");
  const snapshot = catalogSnapshot(catalog, "gamingrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 32);
  assert.equal(snapshot.tables.rackets.length, 372);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, 372);
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

test("the CyclingRecs starter catalog: sourced bikes without years, one per model and frame tier, known categories, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/cycling.json");
  const snapshot = catalogSnapshot(catalog, "cyclingrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 10);
  assert(snapshot.tables.rackets.length >= 170);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/cycling");
  for (const r of snapshot.tables.rackets) {
    assert(r.shape !== null && shapeOf(r.shape) !== "unknown", `${r.name}: category ${r.shape}`);
    assert(r.weight === null || ["Carbon", "Aluminium"].includes(r.weight), `${r.name}: frame ${r.weight}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: bikes are named by generation, not year`);
    assert(!/\b(Frameset|Turbo|E-Bike)\b|\+/.test(r.name), `${r.name}: no framesets or e-bikes`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Trek Domane SL Gen 5")?.slug, "trek-domane-sl-gen-5");
});

test("the AudioRecs starter catalog: sourced headphones, IEMs and earbuds without years, no gaming headsets, unique URLs", async () => {
  const catalog = await readCatalog("db/catalogs/audio.json");
  const snapshot = catalogSnapshot(catalog, "audiorecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 26);
  assert(snapshot.tables.rackets.length >= 400);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const { shapeOf } = await import("../app/art/audio");
  for (const r of snapshot.tables.rackets) {
    assert(r.shape !== null && shapeOf(r.shape) !== "unknown", `${r.name}: category ${r.shape}`);
    assert(r.weight === null || ["Wired", "Wireless"].includes(r.weight), `${r.name}: connection ${r.weight}`);
    assert(!/\b(INZONE|Maxwell|Gaming|Headset)\b/i.test(r.name), `${r.name}: gaming headsets belong to GamingRecs`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Sony WH-1000XM6")?.slug, "sony-wh-1000xm6");
});

test("the MonitorRecs starter catalog: the 88 GamingRecs monitors under their old URLs plus sourced non-gaming monitors, known categories, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const { movedMonitorSlugs } = await import("../lib/niche/gaming-moved");
  const catalog = await readCatalog("db/catalogs/monitor.json");
  const snapshot = catalogSnapshot(catalog, "monitorrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 12);
  assert(snapshot.tables.rackets.length >= 150);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const slugs = new Set(snapshot.tables.rackets.map(r => r.slug));
  for (const slug of movedMonitorSlugs) assert(slugs.has(slug), `${slug}: moved from GamingRecs, must keep its URL`);
  const categories = niches.monitor.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/monitor");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: monitors carry model numbers, not years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one monitor`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Alienware AW3225QF")?.slug, "alienware-aw3225qf");
});

test("the CameraRecs starter catalog: sourced mirrorless, compact, vlogging and action cameras, known categories, no years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/camera.json");
  const snapshot = catalogSnapshot(catalog, "camerarecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 13);
  assert(snapshot.tables.rackets.length >= 100);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.camera.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/camera");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: cameras carry generations, not years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one camera`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Sony a7 IV")?.slug, "sony-a7-iv");
});

test("the UltralightRecs starter catalog: sourced tents, packs, pads and quilts, known categories, no years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/ultralight.json");
  const snapshot = catalogSnapshot(catalog, "ultralightrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 15);
  assert(snapshot.tables.rackets.length >= 150);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.ultralight.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/ultralight");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: gear is named without years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Durston X-Mid Pro 2")?.slug, "durston-x-mid-pro-2");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Durston X-Mid Pro 2+")?.slug, "durston-x-mid-pro-2-plus");
});

test("the BadmintonRecs starter catalog: sourced Yonex, Victor and Li-Ning rackets, known series, no years or colour codes, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/badminton.json");
  const snapshot = catalogSnapshot(catalog, "badmintonrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 3);
  assert(snapshot.tables.rackets.length >= 180);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const series = niches.badminton.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/badminton");
  for (const r of snapshot.tables.rackets) {
    assert(series.includes(r.shape!), `${r.name}: unknown series ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    // Model numbers like Halbertec 2000 are not years; 2010–2029 would be.
    assert(!/ 20[12]\d$/.test(r.name), `${r.name}: rackets are named without years`);
    assert(r.name.split(" ").includes(r.shape!), `${r.name}: series ${r.shape} not in the name`);
  }
  for (const s of series) assert(snapshot.tables.rackets.some(r => r.shape === s), `${s}: at least one racket`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Yonex Astrox 99 Pro")?.slug, "yonex-astrox-99-pro");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Victor Auraspeed Fantôme")?.slug, "victor-auraspeed-fantome");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Li-Ning Halbertec 8000")?.balance, "Even balance (302 mm)");
});

test("the FragranceRecs starter catalog: sourced perfumes and colognes, one entry per concentration, known For values, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/fragrance.json");
  const snapshot = catalogSnapshot(catalog, "fragrancerecs", "catalog:test", false);
  assert(snapshot.tables.brands.length >= 40);
  assert(snapshot.tables.rackets.length >= 250);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const forValues = niches.fragrance.specs.find(s => s.column === "shape")!.options!;
  const concentrations = niches.fragrance.specs.find(s => s.column === "balance")!.options!;
  for (const r of snapshot.tables.rackets) {
    assert(!r.shape || forValues.includes(r.shape), `${r.name}: unknown For ${r.shape}`);
    assert(!r.balance || concentrations.includes(r.balance), `${r.name}: unknown concentration ${r.balance}`);
    assert(!/ 20[12]\d$/.test(r.name), `${r.name}: fragrances are named without years`);
  }
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Concentrations are separate fragrances.
  for (const name of ["Dior Sauvage Eau de Toilette", "Dior Sauvage Parfum", "Dior Sauvage Elixir", "Chanel Bleu de Chanel Eau de Parfum", "Creed Aventus", "Maison Francis Kurkdjian Baccarat Rouge 540 Eau de Parfum", "Maison Francis Kurkdjian Baccarat Rouge 540 Extrait de Parfum", "Le Labo Santal 33", "Lattafa Khamrah", "Armaf Club de Nuit Intense Man Eau de Parfum"])
    assert(snapshot.tables.rackets.some(r => r.name === name), `${name}: in the catalog`);
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Dior Sauvage Eau de Toilette")?.slug, "dior-sauvage-eau-de-toilette");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Dior Sauvage Eau de Toilette")?.balance, "Eau de Toilette");
  // "Elixir" read only out of a name is not a stated concentration.
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Jean Paul Gaultier Le Male Elixir")?.balance, null);
});

test("the CoffeeRecs starter catalog: sourced machines, grinders, brewers, kettles and scales, known categories, no years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/coffee.json");
  const snapshot = catalogSnapshot(catalog, "coffeerecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 32);
  assert(snapshot.tables.rackets.length >= 140);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.coffee.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/coffee");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/ 20\d\d$/.test(r.name), `${r.name}: gear is named without years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Fellow Stagg [XF]")?.slug, "fellow-stagg-xf");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Mahlkönig X54")?.slug, "mahlkonig-x54");
});

test("the ClimbingRecs starter catalog: sourced shoes, harnesses, belay devices, ropes, chalk bags and crash pads, known categories, no years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/climbing.json");
  const snapshot = catalogSnapshot(catalog, "climbingrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 10);
  assert(snapshot.tables.rackets.length >= 240);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.climbing.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/climbing");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/(^| )20\d\d( |$)/.test(r.name.replace(/^\S+ /, "")), `${r.name}: gear is named without years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Petzl GRIGRI +")?.slug, "petzl-grigri-plus");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Edelrid Jul²")?.slug, "edelrid-jul-2");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Mad Rock D2.ONE LV")?.slug, "mad-rock-d2-one-lv");
});

test("the NailsRecs starter catalog: sourced polishes, gels, coats, press-ons, treatments and cuticle oils, known categories, no shades or years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/nails.json");
  const snapshot = catalogSnapshot(catalog, "nailsrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 23);
  assert(snapshot.tables.rackets.length >= 200);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.nails.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/nails");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(!/(^| )20\d\d( |$)/.test(r.name), `${r.name}: nail products are named without years`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Shades are covered by their line: no "Big Apple Red" or "Bubble Bath" entries.
  assert(!snapshot.tables.rackets.some(r => /Big Apple Red|Bubble Bath|Funny Bunny/.test(r.name)));
  assert.equal(snapshot.tables.rackets.find(r => r.name === "OPI xPRESS/ON")?.slug, "opi-xpress-on");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Aprés Gel-X Tips")?.slug, "apres-gel-x-tips");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Sally Hansen Good. Kind. Pure.")?.slug, "sally-hansen-good-kind-pure");
});

test("the KitchenRecs starter catalog: sourced air fryers, ovens, blenders, mixers, processors and multicookers, known categories, no years, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/kitchen.json");
  const snapshot = catalogSnapshot(catalog, "kitchenrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 15);
  assert(snapshot.tables.rackets.length >= 211);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.kitchen.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/kitchen");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    // "Philips Airfryer 2000 Series" is a line name, not a year; a year would end the name.
    assert(!/ (19|20)\d\d$/.test(r.name), `${r.name}: appliances are named without years`);
    // Out of scope: microwaves and coffee gear (CoffeeRecs).
    assert(!/microwave|espresso|grinder|kettle/i.test(r.name), `${r.name}: not a KitchenRecs product`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Look-alike Ninja air fryers are separate products, told apart by model number.
  for (const name of ["Ninja Air Fryer AF101", "Ninja Foodi DualZone DZ201", "Ninja Foodi Dual Zone AF300", "Ninja DualZone DZ801"]) assert(snapshot.tables.rackets.some(r => r.name === name), name);
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Ninja Foodi DualZone DZ201")?.slug, "ninja-foodi-dualzone-dz201");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Nutribullet Pro+")?.slug, "nutribullet-pro");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Instant Pot Duo")?.surface, "3, 6 or 8 qt");
});

test("the SnowboardRecs starter catalog: sourced boards and splitboards with model years, known categories, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/snowboard.json");
  const snapshot = catalogSnapshot(catalog, "snowboardrecs", "catalog:test", true);
  assert.equal(snapshot.tables.brands.length, 14);
  assert(snapshot.tables.rackets.length >= 200);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.snowboard.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/snowboard");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    // Every board carries its model year, and only once.
    assert.match(r.name, / 20(2[5-7])$/, `${r.name}: boards are named with their model year`);
    // evo's " Snowboard" suffix and "- Women's" are dropped ("The Black Snowboard of Death" keeps its own word).
    assert(!/ 20\d\d .*20\d\d$| Snowboard 20\d\d$|Women's|Bindings|Boots/.test(r.name), `${r.name}: not a clean board name`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one board`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Each model year is its own product.
  for (const name of ["Burton Custom 2025", "Burton Custom 2026", "CAPiTA Defenders of Awesome 2026", "Lib Tech Skunk Ape C2X 2025", "Lib Tech Skunk Ape Camber 2026"]) assert(snapshot.tables.rackets.some(r => r.name === name), name);
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Burton Custom 2026")?.slug, "burton-custom-2026");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Jones Solution Splitboard 2027")?.shape, "Splitboard");
});

test("the TableTennisRecs starter catalog: sourced blades, rubbers and pre-assembled rackets, known types, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/tabletennis.json");
  const snapshot = catalogSnapshot(catalog, "tabletennisrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 11);
  assert(snapshot.tables.rackets.length >= 200);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const types = niches.tabletennis.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/tabletennis");
  for (const r of snapshot.tables.rackets) {
    assert(types.includes(r.shape!), `${r.name}: unknown type ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    // Handle shapes, penhold versions and hardness degrees are one product, never part of the name.
    assert(!/Penhold|\bCS\b|\bFL\b|Degree|°|\bw\/|Proline/.test(r.name), `${r.name}: not a clean product name`);
  }
  for (const t of types) assert(snapshot.tables.rackets.some(r => r.shape === t), `${t}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Versions sold under their own names are separate products.
  for (const name of ["Butterfly Viscaria", "Butterfly Viscaria Super ALC", "Butterfly Tenergy 05", "Butterfly Tenergy 05 FX", "Butterfly Dignics 09C", "DHS Hurricane 3", "DHS Hurricane 3 Neo", "DHS Hurricane 3 Neo National", "Stiga Cybershape Carbon"]) assert(snapshot.tables.rackets.some(r => r.name === name), name);
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Butterfly Tenergy 05 FX")?.slug, "butterfly-tenergy-05-fx");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Butterfly Viscaria")?.core, "5W+2ALC");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Butterfly Dignics 09C")?.shape, "Rubber");
});

test("the HomeGymRecs starter catalog: sourced dumbbells, racks, benches, bars, plates, machines and cardio, known categories, unique URLs", async () => {
  const { niches } = await import("../lib/niche");
  const catalog = await readCatalog("db/catalogs/homegym.json");
  const snapshot = catalogSnapshot(catalog, "homegymrecs", "catalog:test", false);
  assert.equal(snapshot.tables.brands.length, 10);
  assert(snapshot.tables.rackets.length >= 200);
  assert.equal(new Set(snapshot.tables.rackets.map(r => r.slug)).size, snapshot.tables.rackets.length);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0);
  const categories = niches.homegym.specs.find(s => s.column === "shape")!.options!;
  const { shapeOf } = await import("../app/art/homegym");
  for (const r of snapshot.tables.rackets) {
    assert(categories.includes(r.shape!), `${r.name}: unknown category ${r.shape}`);
    assert(shapeOf(r.shape) !== "unknown", `${r.name}: no drawing for ${r.shape}`);
    assert(r.balance, `${r.name}: no type`);
    // Heights, depths, lb or kg versions and bundles are one product, never part of the name.
    assert(!/\b(LB|KG|lb|kg)\b|\d+"|Pre-Selected|Builder|Bundle|Prebuilt/.test(r.name), `${r.name}: not a clean product name`);
  }
  for (const c of categories) assert(snapshot.tables.rackets.some(r => r.shape === c), `${c}: at least one product`);
  assert(catalog.products.every(p => p.sources.length >= 1 && p.sources.every(s => s.startsWith("https://"))));
  // Models sold under their own names are separate products.
  for (const name of ["REP PR-4000", "REP PR-5000", "Bowflex SelectTech 552", "Bowflex SelectTech 1090", "PowerBlock Pro 50", "PowerBlock Commercial Pro 50", "Ironmaster Super Bench", "Ironmaster Super Bench PRO V2", "Concept2 RowErg", "Force USA G3", "Force USA G20 Pro"]) assert(snapshot.tables.rackets.some(r => r.name === name), name);
  assert.equal(snapshot.tables.rackets.find(r => r.name === "REP PR-4000")?.slug, "rep-pr-4000");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Nüobell Adjustable Dumbbells")?.slug, "nuobell-adjustable-dumbbells");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "Bowflex SelectTech 552")?.surface, "5–52.5 lb");
  assert.equal(snapshot.tables.rackets.find(r => r.name === "REP AB-5200 2.0")?.shape, "Bench");
});
