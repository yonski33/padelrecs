import { test } from "node:test";
import assert from "node:assert/strict";
import { mentionOf, withoutMention } from "../lib/thread/mention";

// Reply to a reply (owner 2026-11-20): the box starts with "@Name ", which alone doesn't count as a comment.
test("a reply to a reply starts with @Name; the mention alone is not a comment", () => {
  const m = mentionOf("Mira K");
  assert.equal(m, "@Mira K ");
  assert.equal(withoutMention(m, m).trim(), "");
  assert.equal(withoutMention("@Mira K agreed, the grip wears fast", m).trim(), "agreed, the grip wears fast");
  assert.equal(withoutMention("No mention here", m), "No mention here");
  assert.equal(withoutMention("@Mira K hi"), "@Mira K hi");
});
