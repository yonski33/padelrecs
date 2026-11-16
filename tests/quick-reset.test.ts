import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_CHOICE, homeHref, isDefault, readChoice } from "../lib/quick-match";

// "reset ↺" on the quick-match home (owner 2026-11-16: on ?level=intermediate it did nothing, because it reset to
// level "intermediate"). It must go to the default picks, whose address is the plain "/", and forget the saved picks.
test("reset goes to the default picks at the plain address, and forgets saved picks", () => {
  assert.equal(homeHref(DEFAULT_CHOICE, false), "/");
  assert.ok(isDefault(DEFAULT_CHOICE));
  assert.ok(isDefault(readChoice({})), "the plain address reads back as the default picks");
  const src = readFileSync(new URL("../app/home-match.tsx", import.meta.url), "utf8");
  assert.match(src, /export const RESET_CHOICE: QuickChoice = DEFAULT_CHOICE;/);
  const reset = /const reset = instantClick\(\(\) => \{([^}]*)\}\);/.exec(src)?.[1] ?? "";
  assert.match(reset, /forgetSavedPicks\(\)/);
  assert.match(reset, /choice: RESET_CHOICE, older: false/);
  assert.doesNotMatch(src, /onClick=\{go\(\{ style: "any", level:/, "no reset to a fixed level");
});
