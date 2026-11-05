import { test } from "node:test";
import assert from "node:assert/strict";
import { score } from "../db/data";
import { isRecent, MIN_RECENT } from "../lib/recent";
import { niche } from "../lib/niche";

const now = new Date();
const ago = (months: number) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - months); return d.toISOString(); };
const old = ago((niche.recentMonths ?? 24) + 6), fresh = ago(1);
const web = (id: string, sentiment: "positive" | "negative", sourceDate: string) =>
  ({ id, racketId: "p", sentiment, sourceDate, createdAt: fresh, tags: [] as string[] });
const data = (external: ReturnType<typeof web>[]) => ({ reviews: [], external } as unknown as Parameters<typeof score>[0]);

test("a web review is old by its source date, not the day it was added", () => {
  assert.equal(isRecent(fresh), true);
  assert.equal(isRecent(old), niche.recentMonths === undefined);
});

test("% positive counts only recent reviews once there are enough of them", () => {
  const recent = Array.from({ length: MIN_RECENT }, (_, i) => web(`r${i}`, "positive", fresh));
  const s = score(data([...recent, web("d", "negative", old), web("e", "negative", old)]), "p");
  assert.equal(s.web, MIN_RECENT + 2, "every review still counts toward the total");
  assert.deepEqual([s.judged, s.positive], niche.recentMonths === undefined ? [MIN_RECENT + 2, MIN_RECENT] : [MIN_RECENT, MIN_RECENT]);
});

test("with fewer than MIN_RECENT recent reviews, % positive falls back to every review", () => {
  const s = score(data([web("a", "positive", fresh), web("d", "negative", old), web("e", "negative", old)]), "p");
  assert.deepEqual([s.judged, s.positive], [3, 1]);
});
