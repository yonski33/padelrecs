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
