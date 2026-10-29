import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import { niches, productPathIn } from "../lib/niche";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";
import { productMove } from "../proxy";

// Owner decision 2026-10-30: niches with several product types serve product pages under the type (/vpns/mullvad-vpn)
// and every old address 301s there, because the physical-goods sites are already indexed.
const SWITCHED = ["audio", "camera", "climbing", "coffee", "gaming", "homegym", "kitchen", "money", "nails", "simracing", "skin", "software", "tabletennis", "ultralight"];

test("exactly the multi-type niches have category paths", () => {
  assert.deepEqual(Object.values(niches).filter(n => n.categoryPaths).map(n => n.id).sort(), [...SWITCHED].sort());
  for (const id of SWITCHED) assert((niches[id].typePages?.length ?? 0) > 1, `${id} has several types`);
});

test("category slugs are short lowercase keywords that clash with no other page", () => {
  // Top-level pages and folders in app/ and public/ (brands, rankings, about, api, niches…), plus every niche's product path.
  const reserved = new Set([...readdirSync("app"), ...readdirSync("public")].map(f => f.replace(/\.(tsx?|css)$/, "")));
  for (const id of SWITCHED) {
    const n = niches[id], slugs = n.typePages!.map(t => t.slug);
    assert.equal(new Set(slugs).size, slugs.length, `${id}: no two types share a slug`);
    for (const slug of slugs) {
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${id}: ${slug}`);
      assert(slug.length <= 24, `${id}: ${slug} is short`);
      assert(!reserved.has(slug), `${id}: /${slug} would clash with app/${slug}`);
      assert.notEqual(slug, n.productPath, `${id}: /${slug} is the catalogue`);
      assert(!(n.topLists ?? []).some(l => l.slug === slug));
    }
  }
});

test("switched niches rewrite /<type>/<slug> to the product page and leave old addresses to proxy.ts", async () => {
  for (const id of SWITCHED) {
    const before = process.env.NICHE;
    process.env.NICHE = id;
    try {
      const config = (await import(`../next.config.ts?category=${id}`)).default;
      const rewrites = await config.rewrites();
      for (const t of niches[id].typePages!) {
        assert(rewrites.some((r: { source: string; destination: string }) => r.source === `/${t.slug}/:path+` && r.destination === "/rackets/:path+"), `${id} /${t.slug}/:path+`);
        // The type page itself is matched first.
        assert(rewrites.findIndex((r: { source: string }) => r.source === `/${t.slug}`) < rewrites.findIndex((r: { source: string }) => r.source === `/${t.slug}/:path+`));
      }
      const redirects = await config.redirects();
      // A 308 from next.config would win over proxy.ts's 301 to the type address.
      assert(!redirects.some((r: { source: string }) => r.source === "/rackets/:slug"), `${id}: no config redirect for /rackets/:slug`);
    } finally { if (before === undefined) delete process.env.NICHE; else process.env.NICHE = before; }
  }
});

test("every old product address on every switched niche 301s to its category address", async () => {
  let checked = 0;
  for (const id of SWITCHED) {
    const n = niches[id];
    const catalog = await readCatalog(`db/catalogs/${id}.json`);
    const products = catalogSnapshot(catalog, n.schema, "catalog:test", n.productYears !== false).tables.rackets.map(r => ({ slug: r.slug, shape: r.shape ?? null }));
    const bySlug = new Map(products.map(p => [p.slug, p]));
    // A former slug, as the admin slug editor records it, resolves to the product too.
    const first = products[0];
    bySlug.set(`${first.slug}-old-name`, first);
    const lookup = async () => bySlug;
    const origin = `https://www.${n.site.domain}`;
    const hit = async (path: string) => productMove(new NextRequest(`${origin}${path}`), n, lookup);
    for (const p of products) {
      const target = productPathIn(n, p);
      const type = n.typePages!.find(t => t.shape.toLowerCase() === p.shape?.toLowerCase());
      assert(type, `${id} ${p.slug}: shape "${p.shape}" has a type page`);
      assert.equal(target, `/${type.slug}/${p.slug}`);
      for (const old of [`/${n.productPath}/${p.slug}`, `/rackets/${p.slug}`]) {
        const response = await hit(`${old}?sort=helpful`);
        assert.equal(response?.status, 301, `${id} ${old}`);
        assert.equal(response.headers.get("location"), `${origin}${target}?sort=helpful`, `${id} ${old}`);
        checked++;
      }
      assert.equal(await hit(target), null, `${id} ${target} is served, not redirected`);
    }
    // Former slugs and a product filed under the wrong type both land on the current address.
    const firstTarget = productPathIn(n, first);
    assert.equal((await hit(`/${n.productPath}/${first.slug}-old-name`))?.headers.get("location"), `${origin}${firstTarget}`);
    assert.equal((await hit(`${firstTarget}-old-name`))?.headers.get("location"), `${origin}${firstTarget}`);
    const otherType = n.typePages!.find(t => `/${t.slug}/${first.slug}` !== firstTarget)!;
    assert.equal((await hit(`/${otherType.slug}/${first.slug}`))?.headers.get("location"), `${origin}${firstTarget}`);
    // Unknown products, brand pages, share images and the catalogue itself are left alone.
    for (const path of [`/${n.productPath}/no-such-product`, `/brands/${first.slug}`, `/rackets/${first.slug}/opengraph-image`, `/${n.productPath}`, "/"]) assert.equal(await hit(path), null, `${id} ${path}`);
  }
  assert(checked > 3000, `checked ${checked} old addresses`);
});

test("a product with no type page keeps the generic address, and old /rackets links reach it", async () => {
  const n = niches.software, p = { slug: "mystery-tool", shape: null };
  assert.equal(productPathIn(n, p), "/tools/mystery-tool");
  const response = await productMove(new NextRequest("https://www.softwarerecs.com/rackets/mystery-tool"), n, async () => new Map([[p.slug, p]]));
  assert.equal(response?.status, 301);
  assert.equal(response.headers.get("location"), "https://www.softwarerecs.com/tools/mystery-tool");
  assert.equal(await productMove(new NextRequest("https://www.softwarerecs.com/tools/mystery-tool"), n, async () => new Map([[p.slug, p]])), null);
});

test("single-type niches keep /<productPath>/<slug> and never look products up", async () => {
  for (const n of Object.values(niches).filter(n => !n.categoryPaths)) {
    assert.equal(productPathIn(n, { slug: "x", shape: n.typePages?.[0]?.shape ?? null }), `/${n.productPath}/x`);
    const lookup = async () => { throw new Error("no lookup expected"); };
    assert.equal(await productMove(new NextRequest(`https://www.${n.site.domain}/${n.productPath}/x`), n, lookup), null);
  }
});

test("the pill label is the type's short singular name", () => {
  const label = (id: string, shape: string) => { const t = niches[id].typePages!.find(t => t.shape === shape)!; return t.one ?? t.shape; };
  assert.equal(label("money", "Budgeting app"), "Budgeting app");
  assert.equal(label("software", "VPN"), "VPN");
  assert.equal(label("audio", "IEMs"), "IEM");
  assert.equal(label("kitchen", "Air fryer"), "Air fryer");
});
