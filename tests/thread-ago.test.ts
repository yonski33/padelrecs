import { test } from "node:test";
import assert from "node:assert/strict";
import { ago } from "../app/thread/ui";

// Thread ages (owner 2026-11-19): minutes under an hour, so a comment from 20 minutes ago no longer reads "just now".
test("ages: just now, minutes, hours, days, then the date", () => {
  const now = Date.parse("2026-11-19T16:04:00Z"), at = (ms: number) => new Date(now - ms).toISOString();
  assert.equal(ago(at(20_000), now), "just now");
  assert.equal(ago(at(5 * 60_000), now), "5m ago");
  assert.equal(ago(at(59 * 60_000), now), "59m ago");
  assert.equal(ago(at(2 * 3_600_000), now), "2h ago");
  assert.equal(ago(at(26 * 3_600_000), now), "1 day ago");
  assert.equal(ago(at(3 * 86_400_000), now), "3 days ago");
  assert.equal(ago(at(-60_000), now), "just now", "a clock a little ahead");
  assert.equal(ago("not a date", now), "");
});
