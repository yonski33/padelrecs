import { test } from "node:test";
import assert from "node:assert/strict";
import { padelOffers, shopOffers, type OffersFile, type StoredOffer } from "../lib/padel-offers";
import { PADEL_SHOPS, money, shopHref, shopNamed } from "../lib/padel-shops";
import { refreshFromFeed } from "../lib/ninepadel-feed";
import data from "../db/shop/padel-offers.json";

const file = data as unknown as OffersFile;
const row = (o: Partial<StoredOffer>): StoredOffer => ({ shop: "Padelshop", url: "https://padelshop.com/products/x", price: 100, currency: "EUR", inStock: true, checked: "2026-11-23", ...o });

test("padel offers: every stored row names a known shop on its own host, https, a positive price in the shop's currency", () => {
  for (const [slug, rows] of Object.entries(file.offers)) {
    assert.match(slug, /^[a-z0-9-]+$/);
    for (const o of rows) {
      const s = shopNamed(o.shop);
      assert.ok(s, `${slug}: unknown shop ${o.shop}`);
      const host = new URL(o.url).host.replace(/^www\./, "");
      assert.ok(s!.hosts.includes(host), `${slug}: ${o.url} not on ${s!.hosts.join(", ")}`);
      assert.ok(o.url.startsWith("https://") && o.price > 0 && o.currency === s!.currency, `${slug}: ${o.url}`);
      assert.match(o.checked, /^\d{4}-\d{2}-\d{2}$/);
      assert.doesNotMatch(o.url, /\/products\/trade-/);
    }
    assert.equal(new Set(rows.map(o => o.url)).size, rows.length, `${slug}: duplicate URL`);
  }
});

test("padel offers: no affiliate is switched on yet (approvals pending), so every link is plain", () => {
  assert.ok(PADEL_SHOPS.every(s => s.affiliate === null));
  for (const rows of Object.values(file.offers)) for (const o of shopOffers(rows)) { assert.equal(o.affiliate, false); assert.doesNotMatch(o.rel, /sponsored/); }
});

test("padel offers: in stock first, then cheapest across currencies, own currency shown", () => {
  const out = shopOffers([row({ shop: "Padel USA", url: "https://padelusa.com/products/a", price: 150, currency: "USD" }),
    row({ price: 120, inStock: false }), row({ shop: "NINEPADEL", url: "https://ninepadel.com/products/b", price: 130, currency: "GBP" }),
    row({ shop: "Padel Nuestro", url: "https://www.padelnuestro.com/c", price: 139.95 })]);
  assert.deepEqual(out.map(o => [o.short, o.price, o.inStock]), [["Padel USA", "$150", true], ["Padel Nuestro", "€139.95", true], ["NINEPADEL", "£130", true], ["Padelshop", "€120", false]]);
  assert.deepEqual(padelOffers("no-such-racket"), []);
});

test("padel shops: the affiliate switch builds the link", () => {
  assert.equal(money(209, "USD"), "$209");
  const nine = { ...shopNamed("NINEPADEL")!, affiliate: { kind: "query" as const, params: { ref: "CODE" } } };
  assert.equal(shopHref(nine, "https://ninepadel.com/products/x"), "https://ninepadel.com/products/x?ref=CODE");
  const pp = { ...shopNamed("Padel-Point")!, affiliate: { kind: "awin" as const, merchant: "1", publisher: "2" } };
  assert.equal(shopHref(pp, "https://www.padel-point.com/products/x"), "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=https%3A%2F%2Fwww.padel-point.com%2Fproducts%2Fx");
  assert.equal(shopHref(shopNamed("Padelshop"), "https://padelshop.com/products/x"), "https://padelshop.com/products/x");
});

test("NINEPADEL feed: updates price and stock by URL, drops rows that left the feed, leaves other shops alone", () => {
  const f: OffersFile = { offers: {
    a: [row({ shop: "NINEPADEL", url: "https://ninepadel.com/products/a-racket", price: 200, currency: "GBP" }), row({})],
    b: [row({ shop: "NINEPADEL", url: "https://ninepadel.com/products/gone", price: 99, currency: "GBP" })] } };
  const { next, report } = refreshFromFeed(f, { currency: "GBP", items: [
    { link: "https://ninepadel.com/products/a-racket/", price: "250.00", price_now: "179.99", currency: "GBP", availability: "out of stock", category: "Padel rackets" },
    { link: "https://ninepadel.com/products/other", price: "100", currency: "GBP", availability: "in stock", category: "Padel rackets" }] }, "2026-11-30");
  assert.deepEqual(next.offers.a!.map(o => [o.shop, o.price, o.inStock, o.checked]), [["NINEPADEL", 179.99, false, "2026-11-30"], ["Padelshop", 100, true, "2026-11-23"]]);
  assert.equal(next.offers.b, undefined);
  assert.deepEqual([report.updated, report.priceChanged, report.stockChanged, report.dropped.length, report.unlinked], [1, 1, 1, 1, 1]);
});
