import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogKeyword, catalogTitle, catalogDescription, listJsonLd } from "../lib/catalogue-seo";

test("the catalogue title and description use the keyword and live numbers", () => {
  assert.equal(catalogKeyword, "Padel Rackets");
  assert.equal(catalogTitle(1571), "1,571 Padel Rackets Compared: Real Player Reviews");
  assert.match(catalogDescription(4210, ["A", "B", "C"]), /^Padel Rackets compared by 4,210 real reviews: A, B, C and more\./);
  assert(catalogDescription(4210, ["A".repeat(90), "B".repeat(90)]).length <= 160, "long names drop out to stay snippet-sized");
});

test("list structured data carries breadcrumbs and at most 30 products, with < escaped", () => {
  const ld = JSON.parse(listJsonLd([{ name: "Rackets", path: "/rackets" }], Array.from({ length: 40 }, (_, i) => ({ name: `<P${i}`, href: `/rackets/p${i}` }))));
  assert.deepEqual(ld["@graph"][0].itemListElement.map((x: { name: string }) => x.name), ["PadelRecs", "Rackets"]);
  assert.equal(ld["@graph"][1].numberOfItems, 40);
  assert.equal(ld["@graph"][1].itemListElement.length, 30);
  assert(!listJsonLd([], [{ name: "<x", href: "/x" }]).includes("<x"));
});
