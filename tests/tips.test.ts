import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { checkTips, tipSources, tipsCurrent, MAX_TIPS } from "../lib/tips";
import { migrationSql } from "../db/migrations";
import { parseSnapshot, importSnapshot, verifySnapshot } from "../db/transfer";
import { reviews, externalReviews } from "../db/schema";
import { fixture } from "./fixture";
import type { getDb } from "../db/index";

const report = "Reviewer says the stock grip gets slippery once it's warm, so they put an overgrip on. Ask the shop to weigh a few, theirs came in at 375 g.";
const src = tipSources({ summary: report, excerpt: "La pala es más dura en invierno.", excerptTranslation: "The racket is harder in winter." });

test("tips quote any stored text: the summary as stored and as shown, the excerpt and its translation", () => {
  const { kept, dropped } = checkTips([
    { kind: "setup", text: "Add an overgrip early; the stock grip gets slippery in the heat.", quote: "the stock grip gets slippery once it's warm" },
    { kind: "buying", text: "Ask the shop to weigh a few before you pick one.", quote: "Ask the shop to weigh a few" },
    { kind: "conditions", text: "Expect it to play harder in winter.", quote: "The racket is harder in winter." },
  ], src);
  assert.equal(dropped.length, 0);
  assert.deepEqual(kept.map(t => t.kind), ["setup", "buying", "conditions"]);
  // plainSummary drops "Reviewer says"; a quote starting where the card's text starts still matches.
  assert.equal(checkTips([{ kind: "setup", text: "Put an overgrip on.", quote: "The stock grip gets slippery" }], src).kept.length, 1);
});

test("a tip whose quote is not an exact substring is dropped with a reason, and the rest are kept", () => {
  const { kept, dropped } = checkTips([
    { kind: "setup", text: "Add an overgrip.", quote: "the stock grip gets slipery once it's warm" },
    { kind: "setup", text: "Add an overgrip.", quote: "The Stock Grip Gets Slippery" },
    { kind: "buying", text: "Weigh a few before buying.", quote: "Ask the shop to weigh a few" },
  ], src);
  assert.equal(kept.length, 1);
  assert.deepEqual(dropped.map(d => d.reason), ["quote not in the stored text", "quote not in the stored text"]);
});

test("kind, length, one-sentence, short-quote, duplicate and count rules", () => {
  const ok = { kind: "buying", text: "Weigh a few before buying.", quote: "Ask the shop to weigh a few" };
  const reasons = (tips: unknown[]) => checkTips(tips, src).dropped.map(d => d.reason);
  assert.deepEqual(reasons([{ ...ok, kind: "praise" }]), ['unknown kind "praise"']);
  assert.deepEqual(reasons([{ ...ok, text: " " }]), ["no text"]);
  assert.deepEqual(reasons([{ ...ok, text: "word ".repeat(19) }]), ["text over 18 words"]);
  assert.deepEqual(reasons([{ ...ok, text: "Weigh a few. Pick the lightest." }]), ["text is more than one sentence"]);
  assert.deepEqual(reasons([{ ...ok, quote: "weigh a" }]), ["quote too short"]);
  assert.deepEqual(reasons([ok, ok]), ["duplicate"]);
  const many = ["the stock grip gets slippery", "so they put an overgrip on", "Ask the shop to weigh a few", "theirs came in at 375 g"]
    .map(quote => ({ kind: "setup", text: "A tip.", quote }));
  assert.equal(checkTips(many, src).kept.length, MAX_TIPS);
  assert.deepEqual(checkTips("none", src).dropped.map(d => d.reason), ["not a list"]);
  assert.deepEqual(checkTips([], src), { kept: [], dropped: [] });
});

test("saved tips are current only when read and every quote is still in the text", () => {
  const tip = { kind: "buying" as const, text: "Weigh a few.", quote: "Ask the shop to weigh a few" };
  assert.equal(tipsCurrent(null, src), false);
  assert.equal(tipsCurrent([], src), true);
  assert.equal(tipsCurrent([tip], src), true);
  assert.equal(tipsCurrent([tip], tipSources({ summary: "Edited: the shop weighed none." })), false);
  assert.deepEqual(tipSources({ reviewText: "  " }), []);
});

test("migration 0019 is journaled after every earlier migration, so the migrator never skips it", () => {
  const { entries } = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string; when: number }[] };
  const tips = entries.find(e => e.tag === "0019_review_tips");
  assert(tips);
  for (const e of entries) if (e !== tips) assert(e.when < tips.when, `${e.tag} is not before 0019`);
});

test("the tips jsonb column round-trips on both review tables and through snapshots", async () => {
  const engine = new PGlite();
  try {
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    const db = drizzle(engine);
    const withTips = structuredClone(fixture) as typeof fixture;
    const tip = { kind: "care", text: "Fit a head protector from day one.", quote: "A long external excerpt." };
    (withTips.tables.external_reviews[0] as Record<string, unknown>).tips = [tip];
    (withTips.tables.reviews[0] as Record<string, unknown>).tips = [];
    const snapshot = parseSnapshot(withTips);
    await importSnapshot(db as unknown as ReturnType<typeof getDb>, snapshot);
    await verifySnapshot(db as unknown as ReturnType<typeof getDb>, snapshot);
    const [web] = await db.select({ tips: externalReviews.tips }).from(externalReviews);
    assert.deepEqual(web.tips, [tip]);
    const [player] = await db.select({ tips: reviews.tips }).from(reviews).where(eq(reviews.id, "approved-review"));
    assert.deepEqual(player.tips, []);
    const [pending] = await db.select({ tips: reviews.tips }).from(reviews).where(eq(reviews.id, "pending-review"));
    assert.equal(pending.tips, null);
    const bad = structuredClone(withTips);
    (bad.tables.external_reviews[0] as Record<string, unknown>).tips = [{ ...tip, kind: "praise" }];
    assert.throws(() => parseSnapshot(bad));
  } finally { await engine.close(); }
});
