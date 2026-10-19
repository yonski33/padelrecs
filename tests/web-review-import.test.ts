import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { importSnapshot, parseSnapshot } from "../db/transfer";
import { fixture } from "./fixture";
import { niches } from "../lib/niche";
import { parseCandidates, planImport, siteState, applyImport, markPublished, webReviewId } from "../db/web-review-import";
import { catalog } from "../db/data";
import type { getDb } from "../db/index";

const line = (over: object) => JSON.stringify({
  id: "c1", racket_name: "Nox Test 2025", source_platform: "Reddit", source_name: "r/Padelracket",
  source_url: "https://www.reddit.com/r/Padelracket/comments/abc/x/def/", source_date: "2026-07-06", author: "u/someone",
  excerpt: "I have the same racket with 7 months of experience and I dont feel that at all.", summary: "Our own words.",
  sentiment: "positive", first_hand: true, confidence: "high", tags: ["soft"], status: "approved", ...over,
});
const queue = [
  line({}),
  line({ id: "c2", excerpt: null }),                                              // no quote → never published
  line({ id: "c3", status: "pending", source_url: "https://example.com/p" }),     // not approved → ignored
  line({ id: "c4", racket_name: "Unknown Racket 2030", source_url: "https://example.com/u" }),
  line({ id: "c5", source_url: "https://old.reddit.com/r/Padelracket/comments/abc/x/def?utm_source=share" }), // same source as c1
  line({ id: "c6", tags: ["amazing"], source_url: "https://example.com/t" }),
  line({ id: "c7", source_date: "2025-07", source_url: "https://example.com/d", source_platform: "Forum", source_name: "Padel forum" }),
].join("\n") + "\n";

test("only approved items with an exact quote, a known racket and valid tags are planned; duplicates are skipped", () => {
  const plan = planImport(parseCandidates(queue), { rackets: [{ id: "racket-nox", name: "Nox Test 2025" }], external: [] }, niches.padel, new Date("2026-10-19T10:00:00Z"));
  assert.deepEqual(plan.rows.map(r => r.candidateId), ["c1", "c7"]);
  assert.equal(plan.rows[0].id, webReviewId("c1"));
  assert.equal(plan.rows[0].sourceName, "r/Padelracket");
  assert.equal(plan.rows[0].sourceDate, "2026-07-06");
  assert.equal(plan.rows[1].sourceDate, null, "a month alone isn't shown as a date");
  assert.equal(plan.rows[0].createdAt, "2026-10-19T10:00:00.000Z");
  const reasons = Object.fromEntries(plan.skipped.map(s => [s.candidate.id, s.reason]));
  assert.match(reasons.c2, /no exact quote/);
  assert.match(reasons.c4, /no racket named/);
  assert.match(reasons.c5, /already quoted/);
  assert.match(reasons.c6, /tag bank/);
  assert.equal(reasons.c3, undefined);
});

test("publishing writes web reviews that show on the site, can't happen twice, and marks the queue", async () => {
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    await importSnapshot(db, parseSnapshot(fixture));
    const candidates = parseCandidates(queue);
    const plan = planImport(candidates, await siteState(db), niches.padel);
    assert.equal(await applyImport(db, plan), 2);
    const site = await catalog(db);
    const published = site.external.find(e => e.id === webReviewId("c1"))!;
    assert.equal(published.excerpt, "I have the same racket with 7 months of experience and I dont feel that at all.");
    assert.equal(published.sourceName, "r/Padelracket");
    assert.deepEqual(published.tags, ["soft"]);
    // Running again finds nothing new.
    const again = planImport(candidates, await siteState(db), niches.padel);
    assert.equal(again.rows.length, 0);
    assert(again.skipped.some(s => s.candidate.id === "c1" && s.reason === "already published"));
    const marked = parseCandidates(markPublished(queue, plan.rows.map(r => ({ candidateId: r.candidateId, id: r.id }))));
    assert.deepEqual(marked.filter(c => c.status === "published").map(c => c.id), ["c1", "c7"]);
    assert.equal(marked.find(c => c.id === "c2")!.status, "approved");
  } finally { await engine.close(); }
});
