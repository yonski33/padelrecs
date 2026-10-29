import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { catalogSnapshot } from "../db/catalog-file";
import { migrationSql } from "../db/migrations";
import { importSnapshot } from "../db/transfer";
import { rackets } from "../db/schema";
import { websiteButton } from "../lib/product-links";
import { niches } from "../lib/niche";
import type { getDb } from "../db/index";

const links = (websiteUrl: string | null, affiliateUrl: string | null = null) => ({ websiteUrl, affiliateUrl });

test("website niches link to the product's own site, and an affiliate link replaces it only when the data has one", () => {
  const on = { label: "Visit site" };
  assert.deepEqual(websiteButton(links("https://openai.com/chatgpt/"), on), { url: "https://openai.com/chatgpt/", label: "Visit site", affiliate: false });
  assert.deepEqual(websiteButton(links("https://openai.com/", "https://partner.example/ref"), on), { url: "https://partner.example/ref", label: "Visit site", affiliate: true });
  assert.equal(websiteButton(links(null), on), null, "no link, no button");
  assert.equal(websiteButton(links("https://openai.com/"), undefined), null, "niches without `website` never show one");
  assert.equal(websiteButton(links("javascript:alert(1)"), on), null, "only https addresses become links");
  assert.deepEqual(websiteButton(links("https://a.example/", "http://b.example/"), on), { url: "https://a.example/", label: "Visit site", affiliate: false });
  assert.equal(websiteButton(links("https://a.example/"), {})?.label, "Visit site");
});

test("no niche has both Amazon and website links", () => {
  for (const n of Object.values(niches)) assert(!(n.amazon && n.website), `${n.id} sets both amazon and website`);
});

test("catalog website and affiliate links import into their own columns; older snapshots without them still import", async () => {
  const snapshot = catalogSnapshot({ about: "", checked: "2026-10-29", brands: [{ id: "openai", name: "OpenAI" }], products: [
    { brand: "openai", name: "ChatGPT", shape: null, weight: null, core: null, surface: null, website: "https://chatgpt.com/", sources: ["https://openai.com/"] },
    { brand: "openai", name: "Sora", shape: null, weight: null, core: null, surface: null, sources: ["https://openai.com/"] },
  ] }, "padelrecs", "catalog:test", false);
  assert.equal(snapshot.tables.rackets[0].website_url, "https://chatgpt.com/");
  assert.equal("website_url" in snapshot.tables.rackets[1], false);
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    await importSnapshot(db, snapshot);
    const rows = await db.select({ name: rackets.name, websiteUrl: rackets.websiteUrl, affiliateUrl: rackets.affiliateUrl }).from(rackets).orderBy(rackets.name);
    assert.deepEqual(rows, [{ name: "ChatGPT", websiteUrl: "https://chatgpt.com/", affiliateUrl: null }, { name: "Sora", websiteUrl: null, affiliateUrl: null }]);
  } finally { await engine.close(); }
});
