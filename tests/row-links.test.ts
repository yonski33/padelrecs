// Ranking rows' links (owner 2026-11-27): a row without a current price but with a saved Amazon item gets a plain Amazon
// link with no price; a priced row keeps its price link; nothing without the associate tag.
import { test } from "node:test";
import assert from "node:assert/strict";
import { withAmazonFallback, AMAZON_FALLBACK_LABEL } from "../app/thread/row-links";

const x = (price: { label: string; url: string; rel: string } | null) => ({ pill: null, href: "/p", reviews: 0, price });
test("Amazon fallback only on rows without a price, only with a tag", () => {
  const priced = { label: "from $99 · check price ↗", url: "https://shop.example/p", rel: "nofollow noopener" };
  const out = withAmazonFallback({ a: x(priced), b: x(null), c: x(null) }, { a: "B0AAA", b: "B0BBB" }, "tag-20");
  assert.deepEqual(out.a!.price, priced);
  assert.equal(out.b!.price!.label, AMAZON_FALLBACK_LABEL);
  assert.ok(out.b!.price!.url.includes("B0BBB") && out.b!.price!.url.includes("tag-20"));
  assert.ok(!/\$/.test(out.b!.price!.label));
  assert.equal(out.c!.price, null);
  assert.equal(withAmazonFallback({ b: x(null) }, { b: "B0BBB" }, null).b!.price, null);
});
