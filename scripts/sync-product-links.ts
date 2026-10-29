import { eq } from "drizzle-orm";
import { rackets } from "../db/schema";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";
import { niche, hasYears } from "../lib/niche";
import { connect } from "./connection";

// Copies each product's website and affiliate link from db/catalogs/<niche>.json onto products already in the database
// (db:import only inserts, so it never changes them). Only those two columns are written; products missing from the
// database are listed and skipped. A link removed from the catalog is cleared. Dry run unless --apply.
// Usage: NICHE=software npm run db:sync-links [-- --apply]
const path = `db/catalogs/${niche.id}.json`;
const wanted = catalogSnapshot(await readCatalog(path), niche.schema, `catalog:${path}`, hasYears).tables.rackets
  .map(p => ({ id: p.id, name: p.name, websiteUrl: p.website_url ?? null, affiliateUrl: p.affiliate_url ?? null }));
const apply = process.argv.includes("--apply");
const { db, client } = connect();
try {
  const stored = new Map((await db.select({ id: rackets.id, websiteUrl: rackets.websiteUrl, affiliateUrl: rackets.affiliateUrl }).from(rackets)).map(r => [r.id, r]));
  const missing = wanted.filter(p => !stored.has(p.id));
  const changes = wanted.filter(p => { const s = stored.get(p.id); return s && (s.websiteUrl !== p.websiteUrl || s.affiliateUrl !== p.affiliateUrl); });
  for (const p of changes) console.log(`${p.name}: website ${p.websiteUrl ?? "—"}, affiliate ${p.affiliateUrl ?? "—"}`);
  if (missing.length) console.log(`Not in the database yet (import them first): ${missing.map(p => p.name).join(", ")}`);
  if (!apply) console.log(`${changes.length} of ${wanted.length} ${niche.words.many} in "${niche.schema}" would change. Add --apply to write them.`);
  else {
    await db.transaction(async tx => { for (const p of changes) await tx.update(rackets).set({ websiteUrl: p.websiteUrl, affiliateUrl: p.affiliateUrl }).where(eq(rackets.id, p.id)); });
    console.log(`Updated links on ${changes.length} ${niche.words.many} in "${niche.schema}".`);
  }
} finally { await client.end(); }
