// In-place approve (owner 2026-11-17): the JSON answer sits behind the same admin and origin checks as the form post.
import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/funtimes/reviews/route";
import { wantsJson } from "../app/funtimes/auth";

test("approve in place: a JSON request without an admin session is refused before anything is read", async () => {
  const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    const r = await POST(new Request("http://localhost:3000/api/funtimes/reviews", { method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: "id=r1&status=approved&expectedStatus=pending&returnStatus=pending" }));
    assert.equal(r.status, 403);
  } finally {
    if (previous.url) process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous.key;
  }
});

test("only a request asking for JSON gets the JSON answer", () => {
  assert.ok(wantsJson(new Request("http://x/", { headers: { accept: "application/json" } })));
  assert.ok(!wantsJson(new Request("http://x/", { headers: { accept: "text/html" } })));
});
