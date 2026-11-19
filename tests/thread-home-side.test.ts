import { test } from "node:test";
import assert from "node:assert/strict";
import { sideItems, addCounts, racketOf, type SideComment } from "../lib/thread/home-side";

// "Latest from the comments" (owner 2026-11-19): 3 newest racket-page comments, then "Busy this week" to make up 3.
const c = (id: string, page: string, at: string, body = "Is it good for a beginner?"): SideComment => ({ id, page, alias: "Gali", body, at });
const all = () => true;

test("newest racket-page comments first, ranking and guide pages left out", () => {
  const items = sideItems([c("a", "racket:x", "2026-11-18"), c("b", "ranking:best", "2026-11-19"), c("d", "racket:y", "2026-11-19"), c("e", "racket:z", "2026-11-17"), c("f", "racket:w", "2026-11-16")], new Map([["q", 9]]), all);
  assert.deepEqual(items.map(x => x.kind === "comment" ? x.id : x.racketId), ["d", "a", "e"]);
  assert.equal(racketOf("guide:feel"), null); assert.equal(racketOf("racket:abc"), "abc");
});
test("fewer than 3 comments: the busiest rackets fill in, never one already shown, each with its count", () => {
  const busy = addCounts(addCounts(new Map(), [{ racketId: "x", n: 4 }, { racketId: "p", n: 2 }]), [{ racketId: "q", n: "5" }, { racketId: "p", n: 1 }]);
  const items = sideItems([c("a", "racket:x", "2026-11-18")], busy, all);
  assert.deepEqual(items, [{ kind: "comment", id: "a", racketId: "x", alias: "Gali", body: "Is it good for a beginner?", at: "2026-11-18" },
    { kind: "busy", racketId: "q", n: 5 }, { kind: "busy", racketId: "p", n: 3 }]);
});
test("unknown rackets, blank comments and quiet rackets stay out; both empty is no block", () => {
  const known = (id: string, kind: string) => kind === "comment" ? id !== "gone" : id === "cur";
  const items = sideItems([c("a", "racket:gone", "2026-11-19"), c("b", "racket:x", "2026-11-18", "  ")], new Map([["old", 9], ["cur", 2], ["none", 0]]), known);
  assert.deepEqual(items, [{ kind: "busy", racketId: "cur", n: 2 }]);
  assert.deepEqual(sideItems([], new Map(), all), []);
});
