import { test } from "node:test";
import assert from "node:assert/strict";
import { writtenTldr, TLDR_LINE_MAX } from "../lib/thread/written-tldr";
import discgolf from "../db/summaries/discgolf.json";

test("a 2-3 line summary becomes the TL;DR; a paragraph does not", () => {
  assert.equal(writtenTldr("One paragraph. Two sentences."), null);
  assert.equal(writtenTldr(null), null);
  assert.equal(writtenTldr("Only\n"), null);
  assert.equal(writtenTldr("a\nb\nc\nd"), null);
  assert.equal(writtenTldr(`a\n${"x".repeat(TLDR_LINE_MAX + 1)}`), null);
  assert.deepEqual(writtenTldr("For tight lines.\nSuits newer arms.\nWatch out: it beats in."), {
    lead: "For tight lines.", bullets: [{ tone: "pos", text: "Suits newer arms." }, { tone: "catch", text: "Watch out: it beats in." }] });
});

test("written disc TL;DRs follow the voice rules", () => {
  for (const { slug, summary } of discgolf as { slug: string; summary: string }[]) {
    if (!summary.includes("\n")) continue;
    assert.ok(writtenTldr(summary), `${slug}: not a valid 2-3 line TL;DR`);
    assert.ok(!/—|\bwe\b|\bus\b|\bour\b|verdict|\btest(ed|ing)?\b/i.test(summary), `${slug}: voice: ${summary}`);
  }
});
