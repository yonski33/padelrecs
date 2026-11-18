import { test } from "node:test";
import assert from "node:assert/strict";
import { isComplete } from "../lib/complete-text";

test("whole comments pass", () => {
  for (const t of ["It flies straight and fades late.", "Love it!", "Is it worth the money?", "Great disc (for me).", "Best putter ever 🔥",
    "He said it was \"the best\".", "Turns over a lot for a mid :)"]) assert.equal(isComplete(t), true, t);
});
test("fragments are skipped", () => {
  for (const t of ["its hilariously flippy. I also always have", "Great disc but the", "...and that's why I bag it.", "It's fine, I guess…",
    "Feels great and", "It's my main for", "I'd say it's very."]) assert.equal(isComplete(t), false, t);
});
