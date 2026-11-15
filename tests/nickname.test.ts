import { test } from "node:test";
import assert from "node:assert/strict";
import { makeNickname, NICK_A } from "../lib/nickname";

test("generated nicknames: adjective + niche word + 3 digits", () => {
  const n = makeNickname(["Volley"], () => 0);
  assert.equal(n, `${NICK_A[0]}Volley100`);
  for (let i = 0; i < 50; i++) assert.match(makeNickname(["Dink", "Erne"]), /^[A-Z][a-z]+(Dink|Erne)\d{3}$/);
  assert.match(makeNickname([]), /^[A-Z][a-z]+[A-Z][a-z]+\d{3}$/);
});
