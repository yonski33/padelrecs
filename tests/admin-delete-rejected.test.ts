// Permanent delete of rejected reviews (owner 2026-11-18): the server only ever deletes rows that are rejected right now.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { rejectedOnly, deleteRejectedReviews } from "../db/review-editing";
import { POST } from "../app/api/funtimes/delete-rejected/route";

const render = (ids: string[] | "all") => { const q = new PgDialect().sqlToQuery(rejectedOnly(ids)!); return { sql: q.sql, params: q.params }; };

test("delete-rejected: one id still has to be rejected, in the same statement", () => {
  const q = render(["r1"]);
  assert.match(q.sql, /"reviews"\."status" = \$1/);
  assert.match(q.sql, /"reviews"\."id" in \(\$3\)/);
  assert.deepEqual(q.params, ["rejected", "demo-%", "r1"]);
});

test("delete-rejected: 'all' is every rejected review, never pending or approved, never demo rows", () => {
  const q = render("all");
  assert.match(q.sql, /"status" = \$1/); assert.match(q.sql, /not like \$2/);
  assert.deepEqual(q.params, ["rejected", "demo-%"]);
});

test("delete-rejected: an empty id list deletes nothing and never opens a transaction", async () => {
  const db = { transaction: () => { throw new Error("should not run"); } } as never;
  assert.deepEqual(await deleteRejectedReviews(db, []), []);
});

test("delete-rejected: a request without an admin session is refused before anything is read", async () => {
  const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    const r = await POST(new Request("http://localhost:3000/api/funtimes/delete-rejected", { method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: "all=yes" }));
    assert.equal(r.status, 403);
  } finally {
    if (previous.url) process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous.key;
  }
});
