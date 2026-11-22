import { test } from "node:test";
import assert from "node:assert/strict";
import { clearLeader, votedLabels } from "../lib/thread/vote-label";
import { displayName } from "../lib/brand-name";

// PickleballRecs labels from votes (audit 2026-11-22): 30+ in the box and a leader 1.5x the runner-up.
test("a clear leader needs 30+ and 1.5x the runner-up", () => {
  assert.equal(clearLeader({ power: 34, all_round: 14, control: 4 }), "power"); // CRBN4 Waves
  assert.equal(clearLeader({ power: 20, all_round: 17, control: 13 }), null); // Quanta R2.16: no clear leader
  assert.equal(clearLeader({ control: 20, power: 5 }), null); // under 30
  assert.equal(clearLeader({ medium: 41, hard: 27, soft: 9 }), "medium"); // Spartus Apollo, 1.52x
  assert.equal(clearLeader(undefined), null);
});

test("votedLabels maps each box to the row's words and leaves unclear boxes out", () => {
  const boxes: Record<string, Record<string, number>> = { plays_like: { control: 36, all_round: 17, power: 8 }, feel: { medium: 17, hard: 13, soft: 5 }, level: { intermediate: 40, advanced: 24, beginner: 11 } };
  assert.deepEqual(votedLabels({ id: "x" }, () => t => boxes[t] ?? {}), { styleVote: "control", levels: ["intermediate"] });
  assert.deepEqual(votedLabels({ id: "x" }, () => () => ({ all_round: 50, power: 10 })).styleVote, "balance");
});

test("a brand glued to a model number shows once (CRBN¹), others keep the brand", () => {
  assert.equal(displayName("CRBN⁴ TruFoam Waves", "CRBN"), "CRBN⁴ TruFoam Waves");
  assert.equal(displayName("Vertex 05", "Bullpadel").endsWith("Vertex 05"), true);
  assert.equal(displayName("Vertex 05", "Bullpadel").startsWith("Bullpadel"), true);
});
