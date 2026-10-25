import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { AmazonUnavailable, amazonCredentials, amazonLink, amazonSearchLink, findAmazonOffer, isAsin, matchesProduct, resetAmazonToken } from "../lib/amazon";

const credentials = { id: "test-id", secret: "test-secret", partnerTag: "skinrecs-20" };
const settings = { searchIndex: "Beauty" };
const hydrating = { name: "CeraVe Hydrating Facial Cleanser", brand: "CeraVe" };

test("only SkinRecs turns Amazon links on", () => {
  assert.deepEqual(Object.values(niches).filter(n => n.amazon).map(n => n.id), ["skin"]);
  assert.equal(niches.skin.amazon?.searchIndex, "Beauty");
  // The site no longer promises there are none.
  assert.doesNotMatch(niches.skin.site.footer, /affiliate/i);
  assert.doesNotMatch(JSON.stringify(niches.skin.copy.about), /affiliate/i);
});

test("credentials come from the environment and all three are needed", () => {
  const env = { AMAZON_CREATORS_API_CREDENTIAL_ID: "a", AMAZON_CREATORS_API_CREDENTIAL_SECRET: "b", AMAZON_PA_API_PARTNER_TAG: "c-20" };
  assert.deepEqual(amazonCredentials(env), { id: "a", secret: "b", partnerTag: "c-20" });
  assert.equal(amazonCredentials({ ...env, AMAZON_PA_API_PARTNER_TAG: "" }), null);
  assert.equal(amazonCredentials({}), null);
});

test("links go to the product page with the associate tag", () => {
  assert.equal(amazonLink("B01MSSDEPK", "skinrecs-20"), "https://www.amazon.com/dp/B01MSSDEPK?tag=skinrecs-20");
  assert.equal(amazonSearchLink(" CeraVe Hydrating Facial Cleanser ", "skinrecs-20"), "https://www.amazon.com/s?k=CeraVe+Hydrating+Facial+Cleanser&tag=skinrecs-20");
  assert.ok(isAsin("B01MSSDEPK"));
  assert.ok(!isAsin("b01mssdepk"));
  assert.ok(!isAsin("B01MSSDEP"));
});

test("a result matches only the same product of the same brand", () => {
  const title = "CeraVe Hydrating Facial Cleanser | Moisturizing Non-Foaming Face Wash with Hyaluronic Acid, Ceramides | 16 Fluid Ounce";
  assert.ok(matchesProduct(hydrating, { title, brand: "CeraVe" }));
  assert.ok(matchesProduct(hydrating, { title }));
  // Its sibling and other brands' lookalikes are not it.
  assert.ok(!matchesProduct(hydrating, { title: "CeraVe Foaming Facial Cleanser | Daily Face Wash for Oily Skin", brand: "CeraVe" }));
  assert.ok(!matchesProduct(hydrating, { title: "Hydrating Facial Cleanser with Ceramides", brand: "Amazon Basics" }));
  // Accents, apostrophes and punctuation do not matter.
  assert.ok(matchesProduct({ name: "Bioderma Sébium Exfoliating Gel", brand: "Bioderma" }, { title: "Bioderma - Sebium - Exfoliating Gel - 3.33 fl.oz.", brand: "Bioderma" }));
  assert.ok(matchesProduct({ name: "Paula's Choice SKIN PERFECTING 2% BHA Liquid Exfoliant", brand: "Paula's Choice" },
    { title: "Paulas Choice--SKIN PERFECTING 2% BHA Liquid Salicylic Acid Exfoliant", brand: "Paula's Choice" }));
  assert.ok(matchesProduct({ name: "La Roche-Posay Anthelios Melt-In Milk Sunscreen SPF 60", brand: "La Roche-Posay" },
    { title: "La Roche-Posay Anthelios Melt-in Milk Body & Face Sunscreen Lotion SPF 60", brand: "La Roche-Posay" }));
  // Numbers must agree: SPF 30 is not SPF 60, 10% is not 5%.
  assert.ok(!matchesProduct({ name: "La Roche-Posay Anthelios Melt-In Milk Sunscreen SPF 60", brand: "La Roche-Posay" },
    { title: "La Roche-Posay Anthelios Melt-in Milk Sunscreen SPF 30", brand: "La Roche-Posay" }));
  assert.ok(!matchesProduct({ name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary" }, { title: "The Ordinary Niacinamide 5% Face Serum", brand: "The Ordinary" }));
  assert.ok(matchesProduct({ name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary" }, { title: "The Ordinary Niacinamide 10% + Zinc 1% 30ml", brand: "The Ordinary" }));
  // Long names may lose one ordinary word; short ones may not.
  assert.ok(matchesProduct({ name: "La Roche-Posay Toleriane Hydrating Gentle Facial Cleanser", brand: "La Roche-Posay" },
    { title: "La Roche-Posay Toleriane Hydrating Gentle Face Cleanser", brand: "La Roche-Posay" }));
  assert.ok(!matchesProduct({ name: "Cetaphil Moisturizing Cream", brand: "Cetaphil" }, { title: "Cetaphil Moisturizing Lotion", brand: "Cetaphil" }));
});

type Call = { url: string; body: Record<string, unknown> };
function stubAmazon(answers: Record<string, unknown>, calls: Call[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://api.amazon.com/auth/o2/token")) return Response.json({ access_token: "token", expires_in: 3600 });
    const body = JSON.parse(String(init?.body));
    calls.push({ url, body });
    const answer = answers[new URL(url).pathname];
    if (answer instanceof Response) return answer;
    return Response.json(answer ?? {});
  }) as typeof fetch;
}

const searchHit = { searchResult: { items: [
  { asin: "B000FAKE01", itemInfo: { title: { displayValue: "CeraVe Foaming Facial Cleanser" }, byLineInfo: { brand: { displayValue: "CeraVe" } } } },
  { asin: "B01MSSDEPK", itemInfo: { title: { displayValue: "CeraVe Hydrating Facial Cleanser, 16 oz" }, byLineInfo: { brand: { displayValue: "CeraVe" } } } },
] } };

test("an offer is the first matching result with its live price and tagged link", async () => {
  resetAmazonToken();
  const calls: Call[] = [];
  const offer = await findAmazonOffer(hydrating, settings, credentials, stubAmazon({
    "/catalog/v1/searchItems": searchHit,
    "/catalog/v1/getItems": { itemsResult: { items: [{ asin: "B01MSSDEPK", itemInfo: { title: { displayValue: "CeraVe Hydrating Facial Cleanser, 16 oz" } }, offersV2: { listings: [{ price: { money: { amount: 15.99, currency: "USD", displayAmount: "$15.99" } } }] } }] } },
  }, calls));
  assert.deepEqual(offer, { asin: "B01MSSDEPK", title: "CeraVe Hydrating Facial Cleanser, 16 oz", price: "$15.99", url: "https://www.amazon.com/dp/B01MSSDEPK?tag=skinrecs-20" });
  assert.equal(calls[0].body.keywords, "CeraVe Hydrating Facial Cleanser");
  assert.equal(calls[0].body.searchIndex, "Beauty");
  assert.equal(calls[0].body.partnerTag, "skinrecs-20");
  assert.deepEqual(calls[1].body.itemIds, ["B01MSSDEPK"]);
});

test("no match means no product link; a match without a price keeps its link without a price", async () => {
  resetAmazonToken();
  const unrelated = { searchResult: { items: [searchHit.searchResult.items[0]] } };
  assert.equal(await findAmazonOffer(hydrating, settings, credentials, stubAmazon({ "/catalog/v1/searchItems": unrelated }), () => {}), null);
  assert.equal(await findAmazonOffer(hydrating, settings, credentials, stubAmazon({ "/catalog/v1/searchItems": { errors: [{ code: "NoResults" }] } }), () => {}), null);
  // Found, but Amazon lists no price right now.
  assert.deepEqual(await findAmazonOffer(hydrating, settings, credentials, stubAmazon({
    "/catalog/v1/searchItems": searchHit, "/catalog/v1/getItems": { itemsResult: { items: [{ asin: "B01MSSDEPK", offersV2: { listings: [] } }] } },
  }), () => {}), { asin: "B01MSSDEPK", title: "CeraVe Hydrating Facial Cleanser, 16 oz", price: null, url: "https://www.amazon.com/dp/B01MSSDEPK?tag=skinrecs-20" });
});

test("throttling and outages throw, so they are never cached as 'not on Amazon'", async () => {
  resetAmazonToken();
  await assert.rejects(findAmazonOffer(hydrating, settings, credentials, stubAmazon({
    "/catalog/v1/searchItems": Response.json({ errors: [{ code: "TooManyRequests" }] }, { status: 429 }),
  })), AmazonUnavailable);
  await assert.rejects(findAmazonOffer(hydrating, settings, credentials, stubAmazon({
    "/catalog/v1/searchItems": new Response("bad gateway", { status: 502 }),
  })), AmazonUnavailable);
});
