import {test} from "node:test";
import assert from "node:assert/strict";
import {gibberishWord, looksRandomText, looksRandomName, dottedGmail, normalizeEmail, spamScore} from "../lib/review-spam";
import {issueFormToken, checkFormToken, FORM_MIN_MS, FORM_MAX_MS} from "../lib/form-token";
import {createLimiter, createLoginThrottle} from "../lib/rate-limit";
import {POST} from "../app/api/reviews/route";
import robots from "../app/robots";

// Taken from the spam that reached the admin queue.
const spam = [
 {reviewText: "nsi4jhtFBuVsfLOS6YQz", alias: "nKrXGtJeygseSSaQQhCNgOn", email: "po.b.o.j.ev.odo.b5.0@gmail.com"},
 {reviewText: "jbBqQyg3ZrQl4FO6rPtF", alias: "oGsgCUYMBjUoTICykybO", email: "o.ter.i.joya.d.6.0@gmail.com"},
];
const real = [
 {reviewText: "Great control at the net, a bit heavy on the head after two hours. Would buy again.", alias: "Maria", email: "maria.lopez@gmail.com"},
 {reviewText: "Love the WH1000XM5 noise cancelling, battery lasts all week.", alias: "SteelSeriesFan", email: ""},
 {reviewText: "Solid well-thought-through design; the PlayStation controller feels cheap next to it.", alias: "padel_king_88", email: "j.r.smith@example.com"},
 {reviewText: "Absolutely fantastic paddle!!!", alias: "McDonald", email: "a.b@gmail.com"},
];

test("random tokens are gibberish; words, brands and model codes are not", () => {
 for (const w of ["nsi4jhtFBuVsfLOS6YQz", "nKrXGtJeygseSSaQQhCNgOn", "oGsgCUYMBjUoTICykybO", "asdkjhqwkzxcvbn"]) assert.equal(gibberishWord(w), true, w);
 for (const w of ["McDonald", "PlayStation", "iPhone15Pro", "WH1000XM5", "RTX4090", "strengths", "well-thought-through", "SteelSeries", "TaylorMade", "maneuverability", "unbelievable!"]) assert.equal(gibberishWord(w), false, w);
});

test("text, alias and email heuristics", () => {
 assert.equal(looksRandomText("nsi4jhtFBuVsfLOS6YQz"), true);
 assert.equal(looksRandomText("aaaaaaaaaaaaaaaaaaaaaaaa"), true);
 assert.equal(looksRandomText(real[0].reviewText), false);
 assert.equal(looksRandomName("nKrXGtJeygseSSaQQhCNgOn"), true);
 assert.equal(looksRandomName("Big Server Energy"), false);
 assert.equal(dottedGmail("po.b.o.j.ev.odo.b5.0@gmail.com"), true);
 assert.equal(dottedGmail("maria.lopez@gmail.com"), false);
 assert.equal(dottedGmail("a.b.c.d@example.com"), false);
 assert.equal(normalizeEmail("Po.B.o.j+promo@GoogleMail.com"), "poboj@gmail.com");
 assert.equal(normalizeEmail("Jo.Smith@Example.com"), "jo.smith@example.com");
});

test("the queue's spam scores as spam; ordinary reviews do not", () => {
 for (const s of spam) assert.equal(spamScore(s).spam, true, s.reviewText);
 for (const r of real) assert.deepEqual(spamScore(r).spam, false, r.reviewText);
 // One weak signal alone still reaches the queue.
 assert.equal(spamScore({...real[0], email: spam[0].email}).spam, false);
 assert.equal(spamScore({...real[0], alias: spam[0].alias}).spam, false);
 assert.equal(spamScore({...real[0], alias: spam[0].alias, email: spam[0].email}).spam, true);
 assert.equal(spamScore({reviewText: "Buy cheap rackets at https://spam.example now", alias: "", email: spam[0].email}).spam, true);
});

test("form token is signed and must be between a few seconds and a few hours old", () => {
 const now = 1_800_000_000_000, key = "test-secret", token = issueFormToken(now, key);
 assert.equal(checkFormToken(token, now + FORM_MIN_MS + 1, key), "ok");
 assert.equal(checkFormToken(token, now + 500, key), "too-fast");
 assert.equal(checkFormToken(token, now + FORM_MAX_MS + 1, key), "expired");
 assert.equal(checkFormToken(token, now + 10_000, "other-secret"), "invalid");
 const [, nonce, sig] = token.split(".");
 assert.equal(checkFormToken(`${(now - 60_000).toString(36)}.${nonce}.${sig}`, now + 10_000, key), "invalid", "backdating breaks the signature");
 assert.equal(checkFormToken(undefined, now, key), "missing");
 assert.equal(checkFormToken("a.b", now, key), "invalid");
});

test("limiter allows a burst then refuses until the window passes", () => {
 const limiter = createLimiter({limit: 2, windowMs: 1000});
 assert.deepEqual([limiter.hit("a", 0), limiter.hit("a", 1), limiter.hit("a", 2), limiter.hit("b", 2)], [true, true, false, true]);
 assert.equal(limiter.hit("a", 1500), true);
});

test("login throttle backs off exponentially after the free attempts and resets on success", () => {
 const t = createLoginThrottle({free: 2, baseMs: 1000, maxMs: 4000});
 t.fail(["ip"], 0); t.fail(["ip"], 0);
 assert.equal(t.wait(["ip"], 0), 0);
 t.fail(["ip"], 0); assert.equal(t.wait(["ip"], 0), 1000);
 t.fail(["ip"], 0); assert.equal(t.wait(["ip"], 0), 2000);
 t.fail(["ip"], 0); t.fail(["ip"], 0); assert.equal(t.wait(["ip"], 0), 4000, "capped");
 assert.equal(t.wait(["other", "ip"], 0), 4000);
 t.succeed(["ip"]); assert.equal(t.wait(["ip"], 0), 0);
});

const post = (body: object, ip = "203.0.113.9") => POST(new Request("http://localhost:3000/api/reviews", {method: "POST", headers: {"content-type": "application/json", "x-real-ip": ip}, body: JSON.stringify(body)}));
test("bots get the normal success response without reaching the database", async () => {
 const valid = {racketId: "racket-nox", rating: "4", ...real[0]};
 const old = issueFormToken(Date.now() - 60_000);
 // Each of these returns before database() is called; a call would fail here (no DATABASE_URL) with a 500.
 for (const [why, body, ip] of [
  ["honeypot", {...valid, website: "http://spam.example", formToken: old}, "203.0.113.1"],
  ["no token", valid, "203.0.113.2"],
  ["too fast", {...valid, formToken: issueFormToken(Date.now())}, "203.0.113.3"],
  ["random content", {...valid, ...spam[0], formToken: old}, "203.0.113.4"],
 ] as const) {
  const response = await post(body, ip);
  assert.equal(response.status, 201, why);
  assert.deepEqual(await response.json(), {status: "pending"}, why);
 }
});

test("robots.txt does not reveal the admin path", () => {
 const rules = JSON.stringify(robots().rules);
 assert.equal(rules.includes("funtimes"), false);
 assert.equal(rules.includes("admin"), false);
});
