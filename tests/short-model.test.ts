// "Players on the <model>": the brand stays when the rest is a bare number or a fragment (owner 2026-11-21).
import { test } from "node:test";
import assert from "node:assert/strict";
import { shortModel } from "../lib/brand-name";

test("shortModel drops the brand, unless the rest starts with a digit or is under 4 characters", () => {
  assert.equal(shortModel("Adidas Metalbone CTRL", "Adidas"), "Metalbone CTRL");
  assert.equal(shortModel("Simucube 2 Pro", "Simucube"), "Simucube 2 Pro");
  assert.equal(shortModel("MOZA R5", "MOZA"), "MOZA R5");
  assert.equal(shortModel("Meze 109 Pro", "Meze"), "Meze 109 Pro");
  assert.equal(shortModel("Nox AT10 Genius 18K", "Nox"), "AT10 Genius 18K");
  assert.equal(shortModel("Logitech G29", null), "Logitech G29");
});
