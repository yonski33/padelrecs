import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";
import targets from "../deployment/targets.json";
import { AmazonUnavailable, affiliateTag, amazonCredentials, amazonLink, amazonSearchLink, findAmazonOffer, isAsin, matchesProduct, resetAmazonToken } from "../lib/amazon";

const credentials = { id: "test-id", secret: "test-secret", partnerTag: "skinrecs-20" };
const settings = { searchIndex: "Beauty" };
const hydrating = { name: "CeraVe Hydrating Facial Cleanser", brand: "CeraVe" };

test("every Recs site with a Vercel project has Amazon links configured, and none says it has no affiliate links", () => {
  // Sites that link to the product's own website instead of Amazon (the `website` niche option, #162), with no Amazon or commission
  // wording until real affiliate links exist. MoneyRecs is listed by id until it sets `website`.
  const linksToWebsite = (id: string) => "website" in niches[id] || id === "money";
  const withoutAmazon = Object.keys(targets.vercelProjects).filter(linksToWebsite);
  const sites = Object.keys(targets.vercelProjects).filter(id => !linksToWebsite(id));
  for (const id of sites) assert.ok(niches[id]?.amazon?.searchIndex, `${id} has no amazon config`);
  for (const id of withoutAmazon) {
    assert.equal(niches[id].amazon, undefined, id);
    assert.doesNotMatch(JSON.stringify(niches[id].copy.about), /amazon|commission/i, id);
  }
  assert.equal(niches.skin.amazon?.searchIndex, "Beauty");
  assert.equal(niches.simracing.amazon?.searchIndex, "VideoGames");
  for (const n of Object.values(niches).filter(n => n.amazon)) {
    // These sites no longer promise there are none, and say how Amazon links work.
    assert.doesNotMatch(n.site.footer, /no affiliate/i, n.id);
    assert.doesNotMatch(JSON.stringify(n.copy.about), /no (ads, )?affiliate/i, n.id);
    assert.match(JSON.stringify(n.copy.about), /commission/, n.id);
  }
});

test("Amazon links, the affiliate note and the disclosure page wait for the associate tag", () => {
  // The test run is padel, which now has amazon config: on only once the deployment has a tag.
  assert.equal(amazonLinksOn({}), false);
  assert.equal(amazonLinksOn({ AMAZON_PA_API_PARTNER_TAG: "" }), false);
  assert.equal(amazonLinksOn({ AMAZON_PA_API_PARTNER_TAG: "padelrecs-20" }), true);
  assert.equal(amazonLinksOn({ AMAZON_AFFILIATE_TAG: "recssite-20" }), true);
});

test("links carry AMAZON_AFFILIATE_TAG when set; the API keeps the partner tag", () => {
  const env = { AMAZON_CREATORS_API_CREDENTIAL_ID: "a", AMAZON_CREATORS_API_CREDENTIAL_SECRET: "b", AMAZON_PA_API_PARTNER_TAG: "c-20" };
  assert.equal(affiliateTag(env), "c-20");
  assert.equal(affiliateTag({ ...env, AMAZON_AFFILIATE_TAG: " recssite-20 " }), "recssite-20");
  assert.equal(affiliateTag({ ...env, AMAZON_AFFILIATE_TAG: "" }), "c-20");
  assert.equal(amazonCredentials({ ...env, AMAZON_AFFILIATE_TAG: "recssite-20" })?.partnerTag, "c-20");
  assert.equal(affiliateTag({}), "");
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
