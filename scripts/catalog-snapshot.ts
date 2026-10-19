import { writeFile } from "node:fs/promises";
import { niche, hasYears } from "../lib/niche";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";

// Turns db/catalogs/<niche>.json into a snapshot for db:import (brands + products, no reviews).
// Usage: NICHE=pickleball npx tsx scripts/catalog-snapshot.ts backups/pickleball-catalog.json
const out = process.argv[2];
if (!out) throw new Error("Usage: NICHE=<niche> npx tsx scripts/catalog-snapshot.ts <output.json>");
const path = `db/catalogs/${niche.id}.json`;
const snapshot = catalogSnapshot(await readCatalog(path), niche.schema, `catalog:${path}`, hasYears);
await writeFile(out, JSON.stringify(snapshot, null, 1));
console.log(`${snapshot.tables.brands.length} brands, ${snapshot.tables.rackets.length} ${niche.words.many} for schema "${niche.schema}" written to ${out}`);
