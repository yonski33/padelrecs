import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import padel from "../db/photos/padel.json";
import { NO_PHOTO, photoHidden, shopPhoto } from "../lib/shop-photos";

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

test("an uploaded photo beats the shop's, and hiding shows the drawing on any site", () => {
  const slug = Object.keys(padel)[0], upload = "/product-photo/abc?v=1";
  assert.equal(shopPhoto({ slug, imageUrl: upload }, "padel"), upload);
  assert.equal(shopPhoto({ slug: "any", imageUrl: upload }, "skin"), upload);
  assert.equal(shopPhoto({ slug, imageUrl: NO_PHOTO }, "padel"), null);
  assert.ok(photoHidden({ imageUrl: NO_PHOTO }));
  assert.equal(shopPhoto({ slug, imageUrl: "https://elsewhere.example/a.jpg" }, "padel"), `/photos/padel/${slug}.webp`);
});
