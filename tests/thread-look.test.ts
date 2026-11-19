import { test } from "node:test";
import assert from "node:assert/strict";
import { threadPath, th, threadSite, GUIDE_PATHS } from "../lib/thread/look";

// The Thread preview (owner 2026-11-19): only ?look=thread addresses reach app/thread, and every Thread link keeps the query,
// so a live address (and its CDN copy) never serves a Thread page.
test("each previewed address maps to its Thread page; others keep their live page", () => {
  assert.equal(threadPath("/"), "/thread");
  assert.equal(threadPath("/rackets"), "/thread/rackets");
  assert.equal(threadPath("/rackets/adidas-metalbone-ctrl-2026"), "/thread/rackets/adidas-metalbone-ctrl-2026");
  assert.equal(threadPath("/rankings"), "/thread/rankings");
  assert.equal(threadPath("/rankings/best-padel-rackets"), "/thread/rankings/best-padel-rackets");
  assert.equal(threadPath(GUIDE_PATHS.racket), "/thread/guides/racket");
  assert.equal(threadPath(GUIDE_PATHS.elbow), "/thread/guides/elbow");
  assert.equal(threadPath("/how-we-make-these"), "/thread/score");
  assert.equal(threadPath("/affiliate-disclosure"), "/thread/affiliate");
  for (const p of ["/brands", "/brands/nox", "/compare", "/add-review", "/rackets/a/b", "/thread", "/guides/unknown"]) assert.equal(threadPath(p), null, p);
});

test("Thread links carry ?look=thread ahead of the hash; outside links and unpreviewed pages stay as they are", () => {
  assert.equal(th("/rackets/x"), "/rackets/x?look=thread");
  assert.equal(th("/rackets/x?tag=soft#reviews"), "/rackets/x?tag=soft&look=thread#reviews");
  assert.equal(th("/brands/nox"), "/brands/nox");
  assert.equal(th("https://example.com/"), "https://example.com/");
  assert.equal(th("//cdn.example.com/a"), "//cdn.example.com/a");
});

test("only PadelRecs previews the Thread look", () => {
  assert.equal(threadSite("padel"), true);
  for (const id of ["tennis", "pickleball", "skin", "discgolf", "simracing"]) assert.equal(threadSite(id), false);
});
