import { test } from "node:test";
import assert from "node:assert/strict";
import { amazonPhoto } from "../lib/amazon-photos";
import { largerImage, pickResult } from "../scripts/fill-amazon-photos";
import { niche } from "../lib/niche";

const env = { AMAZON_AFFILIATE_TAG: "test-20" };
const stored = { amazonAsin: "B00TTD9BRC", amazonImage: "https://m.media-amazon.com/images/I/x.jpg" };
const result = (title: string, extra = {}) => ({ asin: "B00T038XZM", title, thumbnail: "https://m.media-amazon.com/images/I/a._AC_UL320_.jpg", ...extra });
const vanicream = { name: "Vanicream Gentle Facial Cleanser", brand: "Vanicream" };

test("a photo shows only on a site with photos on, links to Amazon, and needs both columns", () => {
  const photo = amazonPhoto(stored, env);
  if (niche.amazon?.photos) assert.match(photo!.url, /B00TTD9BRC/);
  else assert.equal(photo, null);
  assert.equal(amazonPhoto({ ...stored, amazonImage: null }, env), null);
  assert.equal(amazonPhoto({ ...stored, amazonAsin: null }, env), null);
  assert.equal(amazonPhoto(stored, {}), null);
});

test("a brandless title must open with the model, so another brand's lookalike is refused", () => {
  assert.equal(pickResult(vanicream, [result("Toleriane Hydrating Gentle Facial Cleanser, with Niacinamide")]), null);
  assert.equal(pickResult(vanicream, [result("Gentle Facial Cleanser, 8 Fl Oz")])?.asin, "B00T038XZM");
});

test("sponsored results and sets are skipped, and a single beats a pack", () => {
  assert.equal(pickResult(vanicream, [result("Gentle Facial Cleanser", { sponsored: true })]), null);
  assert.equal(pickResult(vanicream, [result("Gentle Facial Cleanser Travel Set")]), null);
  const single = "Gentle Facial Cleanser, 8 Fl Oz";
  assert.equal(pickResult(vanicream, [result("Gentle Facial Cleanser (Pack of 2)"), result(single)])?.title, single);
});

test("a thumbnail's size token is swapped for the larger image", () => {
  assert.equal(largerImage("https://m.media-amazon.com/images/I/a._AC_UL320_.jpg"), "https://m.media-amazon.com/images/I/a._SL500_.jpg");
});
