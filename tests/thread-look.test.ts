import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { threadPath, th, threadSite, GUIDE_PATHS, THREAD_DEFAULT } from "../lib/thread/look";

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

test("Thread links: plain addresses while Thread is the default; in preview mode they carry ?look=thread ahead of the hash", () => {
  assert.equal(THREAD_DEFAULT, true, "go-live: Thread is padel's default look (set to false to roll back)");
  assert.equal(th("/rackets/x"), "/rackets/x");
  assert.equal(th("/rackets/x", "/rackets", true), "/rackets/x?look=thread");
  assert.equal(th("/rackets/x?tag=soft#reviews", "/rackets", true), "/rackets/x?tag=soft&look=thread#reviews");
  assert.equal(th("/brands/nox", "/rackets", true), "/brands/nox");
  assert.equal(th("https://example.com/", "/rackets", true), "https://example.com/");
  assert.equal(th("//cdn.example.com/a", "/rackets", true), "//cdn.example.com/a");
});

test("only PadelRecs previews the Thread look", () => {
  assert.equal(threadSite("padel"), true);
  for (const id of ["tennis", "pickleball", "skin", "discgolf", "simracing"]) assert.equal(threadSite(id), false);
});

test("padel: the normal addresses are served by Thread; ?look=classic gets today's live routing without the query", async () => {
  process.env.NICHE ??= "padel";
  const { proxy } = await import("../proxy");
  const go = async (path: string) => { const r = await proxy(new NextRequest(new URL(path, "https://www.padelrecs.com")));
    const to = r.headers.get("x-middleware-rewrite"); return to ? `${new URL(to).pathname}${new URL(to).search}` : r.headers.get("x-middleware-next") ? "next" : String(r.status); };
  assert.equal(await go("/"), "/thread");
  assert.equal(await go("/rackets/adidas-metalbone-ctrl-2026"), "/thread/rackets/adidas-metalbone-ctrl-2026");
  assert.equal(await go("/rankings/best-padel-rackets"), "/thread/rankings/best-padel-rackets");
  assert.equal(await go("/guides/tennis-elbow"), "/thread/guides/elbow");
  assert.equal(await go("/brands/nox"), "next");
  // The classic look: the live cached views, and plain pages without ?look (so they never show the older "classic" layout).
  assert.match(await go("/?look=classic"), /^\/quick\//);
  assert.match(await go("/rackets/adidas-metalbone-ctrl-2026?look=classic"), /^\/v\/racket\/adidas-metalbone-ctrl-2026\//);
  assert.equal(await go("/about?look=classic"), "/about");
});
