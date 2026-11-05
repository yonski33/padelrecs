import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import padel from "../db/photos/padel.json";
import { shopPhoto } from "../lib/shop-photos";

test("every listed padel photo has its file, names its source, and other sites and rackets get none", () => {
  for (const [slug, photo] of Object.entries(padel)) {
    assert.ok(existsSync(`public/photos/padel/${slug}.webp`), slug);
    assert.match(photo.source, /^https:\/\/www\.tiendapadelpoint\.com\//);
  }
  const slug = Object.keys(padel)[0];
  assert.equal(shopPhoto({ slug }, "padel"), `/photos/padel/${slug}.webp`);
  assert.equal(shopPhoto({ slug }, "skin"), null);
  assert.equal(shopPhoto({ slug: "not-a-racket" }, "padel"), null);
});
