import { test } from "node:test";
import assert from "node:assert/strict";
import { writtenTldr, TLDR_LINE_MAX } from "../lib/thread/written-tldr";
import discgolf from "../db/summaries/discgolf.json";
import padel from "../db/summaries/padel.json";

test("a summary line plus 2-4 dotted bullets becomes the TL;DR; a paragraph does not", () => {
  assert.equal(writtenTldr("One paragraph. Two sentences."), null);
  assert.equal(writtenTldr(null), null);
  assert.equal(writtenTldr("Only a lead\n+ one bullet"), null);
  assert.equal(writtenTldr("Lead.\n+ a\n+ b\n+ c\n+ d\n+ e"), null);
  assert.equal(writtenTldr("Lead.\nno dot\n+ b"), null);
  assert.equal(writtenTldr(`Lead.\n+ a\n+ ${"x".repeat(TLDR_LINE_MAX + 1)}`), null);
  assert.deepEqual(writtenTldr("A soft round racket.\n+ Players love the sweet spot.\n~ Some find it bouncy.\n- A common complaint is power."), {
    lead: "A soft round racket.", bullets: [{ tone: "pos", text: "Players love the sweet spot." }, { tone: "mix", text: "Some find it bouncy." },
      { tone: "neg", text: "A common complaint is power." }] });
});

test("written TL;DRs follow the voice rules, with no counts in the bullets", () => {
  for (const { slug, summary } of [...discgolf, ...padel] as { slug: string; summary: string }[]) {
    if (!summary.includes("\n")) continue;
    assert.ok(writtenTldr(summary), `${slug}: not a valid 2-3 line TL;DR`);
    assert.ok(!/—|\bwe\b|\bus\b|\bour\b|verdict|\btest(ed|ing)?\b/i.test(summary), `${slug}: voice: ${summary}`);
    for (const b of writtenTldr(summary)!.bullets) assert.ok(!/\d+ (of \d+ )?(reviews|players|throwers)/i.test(b.text), `${slug}: count in a bullet: ${b.text}`);
  }
});
