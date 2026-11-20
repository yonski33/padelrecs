import { test } from "node:test";
import assert from "node:assert/strict";
import { ARM_SHORT, ARM_PICK, ARM_OPTION } from "../lib/quick-match";

// Owner 2026-11-21: the quick match's arm pick reads "Arm comfort" (was "Sore arm" / "sore elbow / wrist") on PadelRecs and
// PickleballRecs. Only the label: the `arm` pick key, URLs and saved picks stay as they were.
test("the arm pick is labelled Arm comfort on padel", () => {
  assert.equal(ARM_SHORT, "arm comfort");
  assert.equal(ARM_PICK, "arm comfort");
  assert.equal(ARM_OPTION.label, "Arm comfort");
});
