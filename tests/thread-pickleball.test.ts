import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { threadPath, th, guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS, THREAD_DEFAULT, GUIDE_PATHS } from "../lib/thread/look";
import { traitGroupsFor, voteBoardsFor, validTraitVote, TRAIT_GROUPS, VOTE_BOARDS } from "../lib/thread/traits";
import { pickCatsFor, PICK_CATS } from "../lib/thread/top-picks";

// PickleballRecs on the Thread pages (plans/PICKLEBALL-THREAD-PLAN.md). The shared code became niche-aware, so padel's
// values are checked against a snapshot taken from main before the change (tests/fixtures/thread-padel-snapshot.json).
const SNAP = JSON.parse(readFileSync(new URL("./fixtures/thread-padel-snapshot.json", import.meta.url), "utf8"));
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));

test("padel: flag, guide addresses, routing and links are exactly as before", () => {
  assert.equal(process.env.NICHE ?? "padel", "padel", "this file runs as padel");
  assert.equal(THREAD_DEFAULT, SNAP.THREAD_DEFAULT);
  assert.deepEqual(plain(GUIDE_PATHS), SNAP.GUIDE_PATHS);
  assert.deepEqual(plain(guidePathsFor("padel")), SNAP.GUIDE_PATHS);
  assert.deepEqual(GUIDE_KEYS, SNAP.GUIDE_KEYS);
  for (const [p, to] of Object.entries(SNAP.threadPath)) assert.equal(threadPath(p), to, p);
  for (const [h, to] of Object.entries(SNAP.th)) assert.equal(th(h), to, h);
  for (const [h, to] of Object.entries(SNAP.thPreview)) assert.equal(th(h, "/rackets", true), to, h);
});

test("padel: vote groups, vote boards and Top picks lists are exactly as before", () => {
  assert.deepEqual(plain(TRAIT_GROUPS), SNAP.TRAIT_GROUPS);
  assert.deepEqual(plain(traitGroupsFor("padel")), SNAP.TRAIT_GROUPS);
  assert.deepEqual(plain(VOTE_BOARDS), SNAP.VOTE_BOARDS);
  assert.deepEqual(plain(voteBoardsFor("padel")), SNAP.VOTE_BOARDS);
  assert.deepEqual(plain(PICK_CATS), SNAP.PICK_CATS);
  assert.deepEqual(plain(pickCatsFor("padel")), SNAP.PICK_CATS);
});

test("pickleball: Thread is a preview until its flag is on; its own guide addresses", () => {
  assert.equal(threadSite("pickleball"), true);
  assert.equal(threadDefaultFor("pickleball"), false, "preview only until the owner switches it on");
  assert.equal(threadDefaultFor("tennis"), false);
  const g = guidePathsFor("pickleball");
  assert.deepEqual(Object.keys(g), GUIDE_KEYS);
  assert.equal(g.racket, "/guide");
  assert.equal(g.shape, "/guides/paddle-shapes");
  assert.equal(g.side, "/guides/doubles-or-singles");
  const P = (p: string) => threadPath(p, "/paddles", "pickleball");
  assert.equal(P("/"), "/thread");
  assert.equal(P("/paddles"), "/thread/rackets");
  assert.equal(P("/paddles/joola-perseus-16mm"), "/thread/rackets/joola-perseus-16mm");
  assert.equal(P("/guides/doubles-or-singles"), "/thread/guides/side");
  assert.equal(P("/guides/paddle-shapes"), "/thread/guides/shape");
  assert.equal(P("/guides/court-side"), null, "padel's guide address isn't a pickleball page");
  assert.equal(P("/rackets"), null);
  assert.equal(th("/paddles/x", "/paddles", true), "/paddles/x?look=thread");
});

test("pickleball: the nine vote groups (owner 2026-11-19: Spin in place of Maneuverable), boards and lists", () => {
  const groups = traitGroupsFor("pickleball");
  assert.equal(groups.length, 9);
  assert.deepEqual(groups.map(g => g.key), ["game_type", "plays_like", "level", "sweet_spot", "arm", "feel", "spin", "pop", "durability"]);
  for (const g of groups) {
    assert.match(g.key, /^[a-z_]{2,20}$/, "trait_votes key rule");
    assert.equal(g.options.length, 3, g.key);
    for (const [k] of g.options) assert.match(k, /^[a-z_]{2,20}$/, `${g.key}.${k}`);
  }
  assert.equal(validTraitVote("spin", "lots", groups), true);
  assert.equal(validTraitVote("maneuver", "very", groups), false);
  assert.equal(validTraitVote("trampoline", "low", groups), false);
  assert.equal(validTraitVote("side", "left", groups), false);
  // Every board and list points at a real group and option.
  for (const b of voteBoardsFor("pickleball")) assert.ok(validTraitVote(b.trait, b.choice, groups), b.title);
  for (const c of pickCatsFor("pickleball")) {
    if (!c.score) assert.ok(validTraitVote(c.trait, c.choice, groups), c.title);
    assert.doesNotMatch(c.href, /padel|rackets/, c.title);
  }
});

test("pickleball proxy: live pages by default, Thread pages with ?look=thread", () => {
  // The site is chosen at import time, so pickleball runs in its own process.
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const out = {};
    for (const p of ["/", "/?look=thread", "/paddles?look=thread", "/paddles/joola-perseus-16mm?look=thread", "/guides/doubles-or-singles?look=thread", "/compare?look=thread", "/about?look=classic"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.pickleballrecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "pickleball" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.doesNotMatch(out["/"], /^\/thread/, "the normal home stays live");
  assert.equal(out["/?look=thread"], "/thread");
  assert.equal(out["/paddles?look=thread"], "/thread/rackets");
  assert.equal(out["/paddles/joola-perseus-16mm?look=thread"], "/thread/rackets/joola-perseus-16mm");
  assert.equal(out["/guides/doubles-or-singles?look=thread"], "/thread/guides/side");
  assert.doesNotMatch(out["/compare?look=thread"], /^\/thread/);
  assert.doesNotMatch(out["/about?look=classic"], /^\/thread/);
});
