import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";
import { migrationSql } from "../db/migrations";
import { importSnapshot, snapshotSchema } from "../db/transfer";
import { shapeOf } from "../app/art/pickleball";
import type { getDb } from "../db/index";

test("the pickleball starter catalog is complete, sourced and imports cleanly", async () => {
  const catalog = await readCatalog("db/catalogs/pickleball.json");
  const snapshot = catalogSnapshot(catalog, "pickleballrecs", "catalog:test");
  assert.equal(snapshotSchema(snapshot), "pickleballrecs");
  assert.equal(snapshot.tables.brands.length, 8);
  assert.equal(snapshot.tables.rackets.length, 28);
  assert.equal(snapshot.tables.reviews.length + snapshot.tables.external_reviews.length, 0, "a catalog never brings reviews");
  assert(catalog.paddles.every(p => p.sources.every(s => /^https:\/\//.test(s))), "every value has an https source");
  assert(snapshot.tables.rackets.some(r => r.slug === "crbn1-trufoam-genesis-2025"));
  assert.equal(shapeOf("Traditional"), "standard");
  // A throwaway local engine. db/schema.ts follows the active niche (padel while testing), so this checks the rows fit the
  // shared table layout; the real import runs with NICHE=pickleball and writes to "pickleballrecs".
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    const counts = await importSnapshot(db, snapshot);
    assert.deepEqual(counts, { brands: 8, rackets: 28, reviews: 0, externalReviews: 0 });
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
    paddles: [{ brand: "cerave", name: "CeraVe Moisturizing Cream", shape: "Moisturizer", weight: null, core: null, surface: null, swingWeight: null, sources: ["https://example.com/"] }] }, "skinrecs", "catalog:test", false);
  assert.equal(snapshot.tables.rackets[0].name, "CeraVe Moisturizing Cream");
  assert.equal(snapshot.tables.rackets[0].slug, "cerave-moisturizing-cream");
  assert.equal(snapshot.tables.rackets[0].year, 2026);
  assert.throws(() => catalogSnapshot({ about: "", checked: "2026-10-19", brands: [{ id: "x", name: "X" }], paddles: [{ brand: "x", name: "X One", shape: null, weight: null, core: null, surface: null, swingWeight: null, sources: ["https://e.com"] }] }, "pickleballrecs", "t"), /needs a model year/);
});
