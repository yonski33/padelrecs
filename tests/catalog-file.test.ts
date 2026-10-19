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
