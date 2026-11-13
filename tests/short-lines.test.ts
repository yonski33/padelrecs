import { test } from "node:test";
import assert from "node:assert/strict";
import { shortLines } from "../lib/short-lines";
import { lines } from "../lib/list-lines";

test("home short lines stay short and only cover products that have a ranking line", () => {
  for (const [site, byProduct] of Object.entries(shortLines)) for (const [slug, text] of Object.entries(byProduct)) {
    assert.ok(text.length <= 70, `${site}/${slug} is ${text.length} characters`);
    assert.ok(lines[site]?.[slug], `${site}/${slug} has no ranking line`);
    assert.ok(!/\b(he|she|his|her)\b/i.test(text), `${site}/${slug} should write about reviewers as "they"`);
  }
});
