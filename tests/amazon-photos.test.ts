import { test } from "node:test";
import assert from "node:assert/strict";
import { amazonPhoto } from "../lib/amazon-photos";
import { niche } from "../lib/niche";

const now = Date.parse("2026-11-05T12:00:00Z"), env = { AMAZON_AFFILIATE_TAG: "test-20" };
const stored = { amazonAsin: "B00TTD9BRC", amazonImage: "https://m.media-amazon.com/images/I/x.jpg", amazonCheckedAt: "2026-11-05T01:00:00Z" };
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString();

test("a photo shows only on a site with photos on, and links to the Amazon product", () => {
  const photo = amazonPhoto(stored, now, env);
  if (!niche.amazon?.photos) return assert.equal(photo, null);
  assert.equal(photo?.image, stored.amazonImage);
  assert.match(photo!.url, /B00TTD9BRC/);
  assert.match(photo!.url, /tag=test-20/);
});

test("a link at Amazon's 24 hour limit, or with anything missing, falls back to the drawing", () => {
  assert.equal(amazonPhoto({ ...stored, amazonCheckedAt: hours(24) }, now, env), null);
  assert.equal(amazonPhoto({ ...stored, amazonImage: null }, now, env), null);
  assert.equal(amazonPhoto({ ...stored, amazonAsin: null }, now, env), null);
  assert.equal(amazonPhoto({ ...stored, amazonCheckedAt: null }, now, env), null);
  assert.equal(amazonPhoto(stored, now, {}), null);
});
