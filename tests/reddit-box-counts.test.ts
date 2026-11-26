// Reddit / forum boxes never state how many posts, threads or players they come from (owner 2026-11-24, again 2026-11-26:
// "lets not say number from now as it sounds too low"). Words like "most", "some", "a few" instead; a small box ends with
// "Early signal from a few posts." Numbers that are facts about the product (8 oz, Gen 3, 16mm, 8GB) are fine.
// Covers every site in db/creators/reddit-roundups.json (padel, pickleball, discgolf, skin, laptop).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const COUNT = /\b\d+\s+(?:of\s+(?:the\s+)?)?(?:posts?|threads?|players?|people|users|owners?|commenters?|comments?|reviewers?|reviews?|redditors?|members?|replies)\b|Early signal from \d/i;
type Box = { headline?: string; paras?: string[]; tags?: { text: string }[]; highlights?: { text: string }[] };
const data = JSON.parse(readFileSync(new URL("../db/creators/reddit-roundups.json", import.meta.url), "utf8")) as Record<string, Record<string, Box>>;

test("Reddit boxes state no post, thread or player counts", () => {
  const bad: string[] = [];
  for (const [site, boxes] of Object.entries(data)) for (const [slug, b] of Object.entries(boxes)) {
    const texts = [b.headline ?? "", ...(b.paras ?? []), ...(b.tags ?? []).map(t => t.text), ...(b.highlights ?? []).map(h => h.text)];
    for (const t of texts) { const m = t.match(COUNT); if (m) bad.push(`${site}/${slug}: "${m[0]}"`); }
  }
  assert.deepEqual(bad, []);
});

test("the count pattern catches counts and leaves product numbers alone", () => {
  assert.ok(COUNT.test("Early signal from 5 posts."));
  assert.ok(COUNT.test("Across 12 threads, players agree"));
  assert.ok(COUNT.test("3 of the players found it heavy"));
  assert.ok(!COUNT.test("Early signal from a few posts."));
  assert.ok(!COUNT.test("heavy at 8 oz, like the Gen 3 16mm model"));
  assert.ok(!COUNT.test("the 8GB model"));
});
