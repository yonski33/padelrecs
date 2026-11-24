import { test } from "node:test";
import assert from "node:assert/strict";
import { avatarOf } from "../lib/thread/avatar";

test("discussion avatars: two initials, one letter-pair for one word, a stable tone", () => {
  assert.equal(avatarOf("Gali A").init, "GA");
  assert.equal(avatarOf("vibora_tuesdays").init, "VT");
  assert.equal(avatarOf("lobmaster").init, "LO");
  assert.equal(avatarOf("!!").init, "?");
  assert.equal(avatarOf("Marta").bg, avatarOf("marta").bg);
  assert.match(avatarOf("Marta").bg, /^oklch\(/);
});
