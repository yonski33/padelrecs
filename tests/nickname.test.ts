import { test } from "node:test";
import assert from "node:assert/strict";
import { makeNickname, NICK_A } from "../lib/nickname";

test("generated nicknames: adjective + niche word + 3 digits", () => {
  const n = makeNickname(["Volley"], () => 0);
  assert.equal(n, `${NICK_A[0]}Volley100`);
  for (let i = 0; i < 50; i++) assert.match(makeNickname(["Dink", "Erne"]), /^[A-Z][a-z]+(Dink|Erne)\d{3}$/);
  assert.match(makeNickname([]), /^[A-Z][a-z]+[A-Z][a-z]+\d{3}$/);
});

test("each niche's own nickname words (owner 2026-11-18: SkinRecs showed SharpSpin899)", async () => {
  const { niches } = await import("../lib/niche/all");
  const list = Object.values(niches as Record<string, { id: string; form: { quickVote?: { nicknames: string[]; nickFirst?: string[] } } }>);
  for (const id of ["padel", "pickleball", "discgolf", "simracing", "tennis", "skin", "coffee"]) {
    const n = list.find(x => x.id === id);
    assert.ok(n?.form.quickVote?.nicknames.length, `${id} has its own nickname words`);
  }
  const skin = list.find(x => x.id === "skin")!.form.quickVote!;
  assert.ok(skin.nickFirst?.includes("Dewy") && skin.nicknames.includes("Glow"));
  assert.ok(!skin.nicknames.some(w => /Spin|Volley|Smash/.test(w)));
  const nick = makeNickname(skin.nicknames, () => 0, skin.nickFirst);
  assert.equal(nick, "DewyGlow100");
  // Padel keeps its lists.
  assert.ok(list.find(x => x.id === "padel")!.form.quickVote!.nicknames.includes("Bandeja"));
});
