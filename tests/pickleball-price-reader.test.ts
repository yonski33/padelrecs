// The 2026-11-27 baht bug: a Shopify Markets shop answered 3,490.00 THB from a Thai IP and the run stored "$3490".
import { test } from "node:test";
import assert from "node:assert/strict";
import { plausible, usdOffer, usdUrl } from "../lib/pickleball-price-reader";

const page = (price: string, currency: string | null, availability = "https://schema.org/InStock") =>
  `<script type="application/ld+json">${JSON.stringify({ "@type": "Product", name: "Pegasus Power 2", offers:
    [{ price, ...(currency ? { priceCurrency: currency } : {}), availability }] })}</script>`;

test("usdUrl pins the US market and keeps the variant", () => {
  const u = new URL(usdUrl("https://11six24.com/products/pegasus-power-2?variant=123"));
  assert.equal(u.searchParams.get("country"), "US");
  assert.equal(u.searchParams.get("currency"), "USD");
  assert.equal(u.searchParams.get("variant"), "123");
});

test("usdOffer takes a USD offer and rejects any other currency or none", () => {
  const ok = usdOffer(page("169.99", "USD"));
  assert.ok(ok.ok && ok.price === 169.99 && ok.inStock);
  const thb = usdOffer(page("3490.00", "THB"));
  assert.ok(!thb.ok && /THB/.test(thb.why));
  const none = usdOffer(page("3490.00", null));
  assert.ok(!none.ok && /no currency/.test(none.why));
});

test("plausible rejects local-currency numbers and keeps real price gaps", () => {
  assert.ok(!plausible(3490, [169.99, 159]).ok);                 // baht next to dollar offers
  assert.ok(!plausible(2204, []).ok);                            // no other offer, above $1,000
  assert.ok(plausible(199.95, [99.95, 99.95]).ok);               // list price next to sale offers (2x) stays
  assert.ok(plausible(279, []).ok);
  assert.ok(!plausible(260, [99.95]).ok);                        // more than 2.5x
});

import { fromShopifyJson, shopifyJsonUrl, stockFromShopifyJs, usd } from "../lib/pickleball-price-reader";
const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

test("ProductGroup variants: the ?variant= one, in USD", () => {
  const html = ld({ "@type": "ProductGroup", name: "Pegasus", hasVariant: [
    { "@type": "Product", "@id": "/p?variant=1#v", offers: { price: "149.00", priceCurrency: "USD", availability: "OutOfStock" } },
    { "@type": "Product", "@id": "/p?variant=2#v", offers: { price: "169.00", priceCurrency: "USD", availability: "https://schema.org/InStock" } }] });
  const r = usdOffer(html, "https://x.com/products/p?variant=2");
  assert.ok(r.ok && r.price === 169 && r.inStock === true && r.title === "Pegasus");
  const thb = usdOffer(html.replaceAll("USD", "THB"), "https://x.com/products/p?variant=2");
  assert.ok(!thb.ok && /THB/.test(thb.why));
});

test("JSON-LD with raw newlines in strings still parses", () => {
  const html = `<script type="application/ld+json">{"@type":"Product","name":"A\nB","offers":{"price":"99.95","priceCurrency":"USD"}}</script>`;
  const r = usdOffer(html); assert.ok(r.ok && r.price === 99.95 && r.inStock === null);
});

test("price meta tags count only with their currency", () => {
  const ok = usdOffer(`<meta property="og:title" content="Paddle"><meta property="og:price:amount" content="1,199.00"><meta property="og:price:currency" content="USD">`);
  assert.ok(ok.ok && ok.price === 1199);
  assert.ok(!usdOffer(`<meta property="og:price:amount" content="3490.00">`).ok);
  const eur = usdOffer(`<meta content="139.00" property="product:price:amount"><meta content="EUR" property="product:price:currency">`);
  assert.ok(!eur.ok && /EUR/.test(eur.why));
});

test("Shopify globals: USD at rate 1.0 only", () => {
  const meta = `var meta = {"product":{"variants":[{"id":7,"price":16999},{"id":8,"price":17999}]}};\nfor (var attr in meta)`;
  const g = (cur: string) => `<script>Shopify.currency = ${cur};</script><script>${meta}</script>`;
  const r = usdOffer(g(`{"active":"USD","rate":"1.0"}`), "https://x.com/products/p?variant=8");
  assert.ok(r.ok && r.price === 179.99 && r.source === "shopify globals");
  assert.ok(!usdOffer(g(`{"active":"USD","rate":"0.71"}`)).ok);
  assert.ok(!usdOffer(g(`{"active":"THB","rate":"1.0"}`)).ok);
});

test("Shopify .json needs price_currency USD; .js gives stock", () => {
  assert.equal(shopifyJsonUrl("https://x.com/products/pegasus-2?variant=3"), "https://x.com/products/pegasus-2.json?country=US&currency=USD");
  assert.equal(shopifyJsonUrl("https://x.com/store/p/abc"), null);
  const body = (c?: string) => JSON.stringify({ product: { title: "P", variants: [{ id: 3, price: "159.00", ...(c ? { price_currency: c } : {}) }] } });
  assert.ok(usd(fromShopifyJson(body("USD"), "https://x.com/products/p?variant=3")).ok);
  assert.ok(!usd(fromShopifyJson(body("THB"))).ok);
  assert.ok(!usd(fromShopifyJson(body())).ok);
  assert.equal(stockFromShopifyJs(JSON.stringify({ available: true, variants: [{ id: 3, available: false }] }), "https://x.com/products/p?variant=3"), false);
});
