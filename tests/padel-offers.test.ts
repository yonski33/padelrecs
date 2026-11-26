import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_AGE_DAYS, offersBySlug, shopOffers, type StoredOffer } from "../lib/padel-offers";
import { PADEL_SHOPS, PADEL_SHOP_SOURCE, money, shopForUrl, shopHref, shopNamed } from "../lib/padel-shops";
import { fromJsonLd, fromShopifyJs, readShopPage, sameRacket } from "../lib/padel-shop-reader";
import { offersFromRows } from "../db/creator-reviews";

const NOW = Date.parse("2026-11-26T12:00:00Z");
const row = (o: Partial<StoredOffer>): StoredOffer => ({ shop: "Padelshop", url: "https://padelshop.com/products/x", price: 100, currency: "EUR", inStock: true, checked: "2026-11-26T06:00:00Z", ...o });

test("padel shops: every shop has a short name, hosts and a read kind; no affiliate is on yet", () => {
  for (const s of PADEL_SHOPS) { assert.ok(s.short && s.hosts.length && ["shopify", "jsonld", "blocked"].includes(s.read)); assert.equal(s.affiliate, null); }
  assert.equal(shopForUrl("https://www.padelnuestro.com/x")?.name, "Padel Nuestro");
  assert.equal(shopForUrl("https://us.padelmarket.com/products/x")?.name, "Padel Market US");
  assert.equal(shopForUrl("https://padelmarket.com/en-eu/products/x")?.name, "Padel Market EU");
  assert.equal(shopForUrl("https://www.decathlon.co.uk/p/x")?.currency, "GBP");
  assert.equal(shopForUrl("https://example.com/x"), null);
});

test("padel offers: in stock first, then cheapest across currencies, own currency shown, plain links", () => {
  const out = shopOffers([row({ shop: "Padel USA", url: "https://padelusa.com/products/a", price: 150, currency: "USD" }),
    row({ price: 120, inStock: false }), row({ shop: "NINEPADEL", url: "https://ninepadel.com/products/b", price: 130, currency: "GBP" }),
    row({ shop: "Padel Nuestro", url: "https://www.padelnuestro.com/c", price: 139.95 })], NOW);
  assert.deepEqual(out.map(o => [o.short, o.price, o.inStock]), [["Padel USA", "$150", true], ["Padel Nuestro", "€139.95", true], ["NINEPADEL", "£130", true], ["Padelshop", "€120", false]]);
  assert.ok(out.every(o => !o.affiliate && !/sponsored/.test(o.rel)));
});

test(`padel offers: a row checked more than ${MAX_AGE_DAYS} days ago is hidden (owner 2026-11-26)`, () => {
  const out = shopOffers([row({ checked: "2026-11-23T13:00:00Z" }), row({ url: "https://padelshop.com/products/y", checked: "2026-11-23T11:00:00Z" }),
    row({ url: "https://padelshop.com/products/z", checked: "2026-11-24" })], NOW);
  assert.deepEqual(out.map(o => o.href), ["https://padelshop.com/products/x", "https://padelshop.com/products/z"]);
});

test("padel offers: DB rows by slug; the shop's own currency wins; creator price box skips padel shop rows", () => {
  const rows = [{ slug: "a", shop: "NINEPADEL", url: "https://ninepadel.com/products/a", price: "179.70", currency: "GBP", in_stock: "t", checked_at: "2026-11-26T06:00:00Z", source: `${PADEL_SHOP_SOURCE}:x` },
    { slug: "a", shop: "Padel USA", url: "https://padelusa.com/products/a", price: "209", currency: "USD", in_stock: false, checked_at: "2026-11-26", source: `${PADEL_SHOP_SOURCE}:x` }];
  const m = offersBySlug(rows);
  assert.deepEqual(m.a!.map(o => [o.price, o.currency, o.inStock]), [[179.7, "GBP", true], [209, "USD", false]]);
  assert.equal(offersFromRows(rows, NOW), null);
});

test("padel shops: the affiliate switch builds the link", () => {
  assert.equal(money(209, "USD"), "$209");
  const nine = { ...shopNamed("NINEPADEL")!, affiliate: { kind: "query" as const, params: { ref: "CODE" } } };
  assert.equal(shopHref(nine, "https://ninepadel.com/products/x"), "https://ninepadel.com/products/x?ref=CODE");
  const pp = { ...shopNamed("Padel-Point")!, affiliate: { kind: "awin" as const, merchant: "1", publisher: "2" } };
  assert.equal(shopHref(pp, "https://www.padel-point.com/products/x"), "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=https%3A%2F%2Fwww.padel-point.com%2Fproducts%2Fx");
});

test("reader: Shopify .js and schema.org Product", () => {
  assert.deepEqual(fromShopifyJs(JSON.stringify({ title: "Bullpadel Icon 2026", price: 26000, available: false })), { ok: true, title: "Bullpadel Icon 2026", price: 260, currency: null, inStock: false });
  const html = `<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"ADIDAS METALBONE CARBON 2026","offers":{"@type":"Offer","price":159.95,"priceCurrency":"EUR","availability":"https://schema.org/OutOfStock"}}]}</script>`;
  assert.deepEqual(fromJsonLd(html), { ok: true, title: "ADIDAS METALBONE CARBON 2026", price: 159.95, currency: "EUR", inStock: false });
  assert.equal(fromJsonLd("<html></html>").ok, false);
});

test("reader: blocked shops are never fetched; 404 means gone", async () => {
  let calls = 0;
  const f = async () => { calls++; return new Response("", { status: 404 }); };
  assert.deepEqual(await readShopPage(shopNamed("Tienda Padel Point")!, "https://www.tiendapadelpoint.com/en/x", f), { ok: false, gone: false, why: "shop blocks scripts" });
  assert.equal(calls, 0);
  assert.deepEqual(await readShopPage(shopNamed("Padel USA")!, "https://padelusa.com/products/x?variant=1", f), { ok: false, gone: true, why: "HTTP 404" });
});

test("model check: exact model and year only", () => {
  assert.ok(sameRacket("Bullpadel Hack 04 2026", 2026, "Bullpadel Hack 04 26").ok);
  assert.ok(sameRacket("Bullpadel Xplo CMF", 2026, "Pala Bullpadel Xplo Comfort 2026").ok);
  assert.ok(sameRacket("Babolat Viper Juan Lebrón 3.1", 2027, "BABOLAT VIPER 3.1 2027 JUAN LEBRON (Pala)").ok);
  assert.ok(sameRacket("StarVie Triton+ Power", 2026, "Pala StarVie Triton Power+ 2026").ok);
  assert.equal(sameRacket("Nox EA10 Ventus Hybrid 12K", 2026, "NOX EA10 Ventus Hybrid 12K Xtrem Padel Racket 2026").why, "extra xtrem");
  assert.match(sameRacket("Head Coello Pro", 2026, "Head Coello Pro 2025").why, /^year/);
  assert.equal(sameRacket("Nox AT10 Genius 18K", 2026, "Nox AT10 Genius 18K ALUM", "https://padelusa.com/products/nox-at10-genius-18k-alum").ok, false);
  assert.ok(sameRacket("Wilson Blade V4", 2026, "Wilson Blade V4 Padel", "https://shop.example/products/wilson-blade-v4-2026").ok);
  assert.match(sameRacket("Bullpadel Neuron 02 Edge Comfort", 2027, "Pala Bullpadel Chingotto Neuron 02 2027").why, /^missing/);
});
