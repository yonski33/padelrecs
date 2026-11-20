import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { SITES, siteFor, verifyHook, signinEmails, verifyLink, FALLBACK_DOMAIN } from "../lib/thread/signin-email";
import { niches } from "../lib/niche/all";

test("the site table matches every niche config", () => {
  assert.deepEqual(SITES, Object.fromEntries(Object.values(niches).map(n => [n.site.domain, n.site.name])));
});

test("the site comes from the link's address, www or not", () => {
  assert.deepEqual(siteFor("https://www.pickleballrecs.com/auth/confirm?next=%2F"), { name: "PickleballRecs", domain: "pickleballrecs.com" });
  assert.deepEqual(siteFor("https://skinrecs.com/auth/callback"), { name: "SkinRecs", domain: "skinrecs.com" });
  assert.deepEqual(siteFor("not a url", "https://www.tvrecs.com"), { name: "TVRecs", domain: "tvrecs.com" });
  assert.deepEqual(siteFor("https://example.com/x"), { name: "PadelRecs", domain: "padelrecs.com" });
});

test("the hook signature is checked (Standard Webhooks)", () => {
  const raw = Buffer.from("a secret key for tests"), secret = `v1,whsec_${raw.toString("base64")}`;
  const body = '{"x":1}', id = "msg_1", now = Date.parse("2026-11-20T12:00:00Z"), ts = String(now / 1000);
  const sig = createHmac("sha256", raw).update(`${id}.${ts}.${body}`).digest("base64");
  assert.equal(verifyHook(body, { id, timestamp: ts, signature: `v1,${sig}` }, secret, now), true);
  assert.equal(verifyHook(body, { id, timestamp: ts, signature: `v1,bogus v1,${sig}` }, secret, now), true, "any listed signature");
  assert.equal(verifyHook('{"x":2}', { id, timestamp: ts, signature: `v1,${sig}` }, secret, now), false, "changed body");
  assert.equal(verifyHook(body, { id, timestamp: ts, signature: `v1,${sig}` }, secret, now + 10 * 60_000), false, "too old");
  assert.equal(verifyHook(body, { id, timestamp: ts, signature: null }, secret, now), false);
});

test("a pickleball sign-in email says PickleballRecs, comes from its domain, with link and code", () => {
  const redirect = "https://www.pickleballrecs.com/auth/confirm?next=%2Faccount";
  const [e, ...rest] = signinEmails({ user: { email: "p@example.com" }, email_data: { token: "123456", token_hash: "pkce_abc", redirect_to: redirect, email_action_type: "magiclink", site_url: "https://www.padelrecs.com" } }, "https://ref.supabase.co/");
  assert.equal(rest.length, 0);
  assert.equal(e.from, "PickleballRecs <no-reply@pickleballrecs.com>");
  assert.deepEqual(e.to, ["p@example.com"]);
  assert.equal(e.subject, "Your PickleballRecs sign-in link");
  const link = verifyLink("https://ref.supabase.co", "pkce_abc", "magiclink", redirect);
  assert.equal(link, `https://ref.supabase.co/auth/v1/verify?token=pkce_abc&type=magiclink&redirect_to=${encodeURIComponent(redirect)}`);
  assert.ok(e.text.includes(link) && e.text.includes("123456"));
  assert.ok(e.html.includes(link.replace(/&/g, "&#38;")) && e.html.includes("123456"));
  assert.ok(!/—|\bwe\b/i.test(e.text + e.html), "house style: no em dashes, no we");
  assert.equal(signinEmails({ user: { email: "p@example.com" }, email_data: { token_hash: "h", redirect_to: redirect, email_action_type: "signup" } }, "https://ref.supabase.co", FALLBACK_DOMAIN)[0].from, "PickleballRecs <no-reply@redrecs.com>");
});

test("an admin sign-in on another site and an email change", () => {
  const [a] = signinEmails({ user: { email: "o@example.com" }, email_data: { token: "654321", token_hash: "h1", redirect_to: "https://www.skinrecs.com/auth/callback", email_action_type: "magiclink" } }, "https://ref.supabase.co");
  assert.equal(a.from, "SkinRecs <no-reply@skinrecs.com>");
  const both = signinEmails({ user: { email: "old@example.com", new_email: "new@example.com" }, email_data: { token_hash: "forNew", token_hash_new: "forOld", redirect_to: "https://www.padelrecs.com/account", email_action_type: "email_change" } }, "https://ref.supabase.co");
  assert.deepEqual(both.map(e => [e.to[0], e.text.includes("token=forNew")]), [["new@example.com", true], ["old@example.com", false]]);
  assert.equal(signinEmails({ user: {}, email_data: { token_hash: "h", email_action_type: "magiclink" } }, "https://ref.supabase.co").length, 0);
});
