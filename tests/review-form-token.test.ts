// Review posting and the form token (owner 2026-11-18: every review from "Played it?" was filed as rejected because the token
// was fetched right before the POST, under the 3 s minimum).
import { test } from "node:test";
import assert from "node:assert/strict";
import { issueFormToken, checkFormToken, tokenRejects, FORM_MIN_MS } from "../lib/form-token";

const KEY = "test-key";
test("posting flow: a token fetched when the form opens is ok by the time a person posts", () => {
  const opened = 1_000_000, token = issueFormToken(opened, KEY);
  assert.equal(checkFormToken(token, opened + FORM_MIN_MS + 500, KEY), "ok");
});

test("a too-fast token is kept for moderation (pending), never rejected; bad tokens still are", () => {
  const now = 2_000_000, token = issueFormToken(now, KEY);
  const fast = checkFormToken(token, now + 200, KEY);
  assert.equal(fast, "too-fast");
  assert.equal(tokenRejects(fast), false);
  assert.equal(tokenRejects(checkFormToken("", now, KEY)), true);
  assert.equal(tokenRejects(checkFormToken("a.b.c", now, KEY)), true);
  assert.equal(tokenRejects(checkFormToken(issueFormToken(now - 7 * 3600_000, KEY), now, KEY)), true);
  assert.equal(tokenRejects("ok"), false);
});

test("every review form takes its token from the shared hook, not a fetch at post time", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["app/rackets/[slug]/racket-reviews.tsx", "app/rackets/[slug]/quick-take-composer.tsx", "app/add-review/add-v2.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.ok(src.includes("useFormToken()"), f);
    assert.ok(!/await fetch\("\/api\/reviews", \{ cache: "no-store" \}\)/.test(src), `${f} still fetches the token at post time`);
  }
});
