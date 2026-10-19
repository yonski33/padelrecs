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
  excerpt: "I have the same racket with 7 months of experience and I dont feel that at all.", summary: "Seven-month owner who never noticed the ball flying off the face.",
  sentiment: "positive", first_hand: true, confidence: "high", tags: ["soft"], status: "approved", ...over,
});
const queue = [
  line({}),
  line({ id: "c2", excerpt: null, summary: "Too short." }),                       // neither a quote nor a real summary
  line({ id: "c8", excerpt: null, summary: "Played it for a season and found it comfortable but short of power on smashes.", source_url: "https://example.com/s" }), // summary only
  line({ id: "c3", status: "pending", source_url: "https://example.com/p" }),     // not approved → ignored
  line({ id: "c4", racket_name: "Unknown Racket 2030", source_url: "https://example.com/u" }),
  line({ id: "c5", source_url: "https://old.reddit.com/r/Padelracket/comments/abc/x/def?utm_source=share" }), // same source as c1
  line({ id: "c6", tags: ["amazing"], source_url: "https://example.com/t" }),
  line({ id: "c7", source_date: "2025-07", source_url: "https://example.com/d", source_platform: "Forum", source_name: "Padel forum" }),
].join("\n") + "\n";

test("only approved items with an exact quote, a known racket and valid tags are planned; duplicates are skipped", () => {
  const plan = planImport(parseCandidates(queue), { rackets: [{ id: "racket-nox", name: "Nox Test 2025" }], external: [] }, niches.padel, new Date("2026-10-19T10:00:00Z"));
  assert.deepEqual(plan.rows.map(r => r.candidateId), ["c1", "c8", "c7"]);
  const summaryOnly = plan.rows.find(r => r.candidateId === "c8")!;
  assert.equal(summaryOnly.excerpt, null);
  assert.match(summaryOnly.summary!, /comfortable/);
  assert.match(plan.rows[0].summary!, /Seven-month owner/);
  assert.equal(plan.rows[0].id, webReviewId("c1"));
  assert.equal(plan.rows[0].sourceName, "r/Padelracket");
  assert.equal(plan.rows[0].sourceDate, "2026-07-06");
  assert.equal(plan.rows.find(r => r.candidateId === "c7")!.sourceDate, null, "a month alone isn't shown as a date");
  assert.equal(plan.rows[0].createdAt, "2026-10-19T10:00:00.000Z");
  const reasons = Object.fromEntries(plan.skipped.map(s => [s.candidate.id, s.reason]));
  assert.match(reasons.c2, /needs an exact quote/);
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
    assert.deepEqual(await applyImport(db, plan), { inserted: 3, updated: 0 });
    const site = await catalog(db);
    const published = site.external.find(e => e.id === webReviewId("c1"))!;
    assert.equal(published.excerpt, "I have the same racket with 7 months of experience and I dont feel that at all.");
    assert.equal(published.sourceName, "r/Padelracket");
    assert.match(published.summary!, /Seven-month owner/);
    assert.deepEqual(published.tags, ["soft"]);
    assert.equal(published.sentiment, "positive", "the moderated sentiment is published with the review");
    // Running again finds nothing new.
    const again = planImport(candidates, await siteState(db), niches.padel);
    assert.equal(again.rows.length, 0);
    assert.equal(again.updates.length, 0, "unchanged text needs no update");
    const marked = parseCandidates(markPublished(queue, plan.rows.map(r => ({ candidateId: r.candidateId, id: r.id }))));
    assert.deepEqual(marked.filter(c => c.status === "published").map(c => c.id), ["c1", "c8", "c7"]);
    // A rewritten summary for a published item updates the live web review in place.
    const rewritten = marked.map(c => c.id === "c1" ? { ...c, summary: "Rewritten: a seven-month owner who never noticed any trampoline effect." } : c);
    const update = planImport(rewritten, await siteState(db), niches.padel);
    assert.deepEqual(update.updates.map(u => u.candidateId), ["c1"]);
    assert.deepEqual(await applyImport(db, update), { inserted: 0, updated: 1 });
    assert.match((await catalog(db)).external.find(e => e.id === webReviewId("c1"))!.summary!, /^Rewritten/);
    // A changed sentiment (or one published before sentiments were stored) is brought in line too.
    const relabelled = rewritten.map(c => c.id === "c1" ? { ...c, sentiment: "mixed" as const } : c);
    assert.deepEqual(planImport(relabelled, await siteState(db), niches.padel).updates.map(u => [u.candidateId, u.sentiment]), [["c1", "mixed"]]);
    assert.equal(marked.find(c => c.id === "c2")!.status, "approved");
  } finally { await engine.close(); }
});
