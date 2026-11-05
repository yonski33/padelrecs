import sharp from "sharp";
import { clearBackground } from "../lib/photo-background";
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

test("a plain background goes, the product and white inside it stay, and a busy photo is left alone", async () => {
  const square = (size: number, background: string) => sharp({ create: { width: size, height: size, channels: 4, background } });
  const product = await square(30, "#111").composite([{ input: await square(10, "#fff").png().toBuffer(), left: 10, top: 10 }]).png().toBuffer();
  const photo = await square(60, "#e1e4e8").composite([{ input: product, left: 15, top: 15 }]).png().toBuffer();
  const { data } = await sharp(await clearBackground(photo)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = (x: number, y: number) => data[(y * 60 + x) * 4 + 3];
  assert.equal(alpha(2, 2), 0);
  assert.equal(alpha(17, 17), 255);
  assert.equal(alpha(30, 30), 255, "the white inside the product stays");
  const busy = await square(60, "#fff").composite([{ input: await square(10, "#000").png().toBuffer(), left: 0, top: 0 }]).png().toBuffer();
  assert.equal(await clearBackground(busy), busy);
});
