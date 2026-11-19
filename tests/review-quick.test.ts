// Admin quick edits (owner 2026-11-17): only name, date and text, the public form's limits, no future dates, admin only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { quickEditInput, withDate } from "../lib/review-quick";
import { POST } from "../app/api/funtimes/review-quick/route";

test("quick edit: the name is trimmed and capped at 50; text needs 20 to 2000 characters", () => {
  assert.equal(quickEditInput.parse({ id: "r1", field: "alias", value: "  Sam  " }).value, "Sam");
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "alias", value: "x".repeat(51) }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "text", value: "too short" }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "text", value: "y".repeat(2001) }).success);
  assert.ok(quickEditInput.safeParse({ id: "r1", field: "text", value: "A fair review of twenty plus characters." }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "rating", value: "5" }).success, "no other field");
});

test("quick edit: a real past or present date only, keeping the time of day", () => {
  assert.ok(quickEditInput.safeParse({ id: "r1", field: "date", value: "2026-01-31" }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "date", value: "2026-02-30" }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "date", value: "2999-01-01" }).success);
  assert.equal(withDate("2026-11-10T08:15:00.000Z", "2026-11-01"), "2026-11-01T08:15:00.000Z");
});

test("quick edit: refused without an admin session, before anything is read", async () => {
  const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    const r = await POST(new Request("http://localhost:3000/api/funtimes/review-quick", { method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: "id=r1&field=alias&value=Sam" }));
    assert.equal(r.status, 403);
  } finally {
    if (previous.url) process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous.key;
  }
});

test("quick edit: level and side take the form's own values, or empty to clear", () => {
  assert.ok(quickEditInput.safeParse({ id: "r1", field: "playerLevel", value: "Intermediate" }).success);
  assert.ok(quickEditInput.safeParse({ id: "r1", field: "playingSide", value: "" }).success);
  assert.ok(!quickEditInput.safeParse({ id: "r1", field: "playingSide", value: "Middle" }).success);
});
