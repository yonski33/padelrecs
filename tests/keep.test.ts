import { test } from "node:test";
import assert from "node:assert/strict";
import { kept, forgetKept, FRESH_MS, STALE_MS } from "../db/keep";
// @ts-expect-error plain .mjs script without types
import { pickPages } from "../scripts/warm.mjs";

// Instance memory (db/keep.ts): the catalog, the evidence rows and the match context load once per server instance.
test("kept: fresh copies are reused, stale ones served while a refresh runs, failures not kept", async () => {
  let t = 0, loads = 0, fail = false;
  const k = kept(async () => { loads++; if (fail) throw new Error("down"); return loads; }, () => t);
  assert.equal(await k.get(), 1);
  t = FRESH_MS - 1; assert.equal(await k.get(), 1); assert.equal(loads, 1);
  t = FRESH_MS + 1; assert.equal(await k.get(), 1, "stale copy served at once"); assert.equal(loads, 2);
  await new Promise(r => setImmediate(r));
  assert.equal(await k.get(), 2, "the refresh replaced it");
  t += STALE_MS + 1; fail = true;
  await assert.rejects(k.get());
  fail = false; assert.equal(await k.get(), 4, "a failed load is not kept");
  forgetKept(); assert.equal(await k.get(), 5, "forgetKept drops it (admin writes)");
});

test("warm-up picks the site's own pages first, skips the prebuilt quick-match homes and other hosts", () => {
  const url = (loc: string, p: number) => `<url><loc>${loc}</loc><priority>${p}</priority></url>`;
  const o = "https://www.x.com";
  const xml = [url(`${o}/`, 1), url(`${o}/rackets/a`, 0.9), url(`${o}/?level=beginner`, 0.7), url(`${o}/?type=cleansers&amp;skin=dry`, 0.6),
    url(`${o}/rackets`, 0.8), url(`${o}/rankings/best`, 0.8), url("https://other.com/x", 1), url(`${o}/rackets/b`, 0.5)].join("");
  assert.deepEqual(pickPages(xml, o, 10), [`${o}/`, `${o}/rackets`, `${o}/rankings/best`, `${o}/?type=cleansers&skin=dry`, `${o}/rackets/a`, `${o}/rackets/b`]);
  assert.equal(pickPages(xml, o, 2).length, 2);
});

test("the racket page's seed stands in only for the same picks", async () => {
  const { sameChoice } = await import("../lib/rank-seed");
  assert.ok(sameChoice({ style: "power", level: "beginner", arm: false }, { arm: false, level: "beginner", style: "power" }));
  assert.ok(sameChoice({ style: "any", arm: false }, { style: "any", arm: false, fine: undefined }));
  assert.ok(!sameChoice({ style: "power", arm: false }, { style: "power", arm: true }));
  assert.ok(!sameChoice({ style: "power", arm: false }, { style: "power", arm: false, fine: { shape: "round" } }));
});
