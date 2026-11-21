import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { topMatch } from "../app/thread/ui";

// Match % badges (owner 2026-11-21): padel keeps its green / yellow scale; every other Thread site shows the best match in a
// tint of its own accent ("m top") and the rest white ("m"). Score badges keep the scale everywhere.
const root = new URL("..", import.meta.url).pathname;
const script = `
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const { Badge } = await import("./app/thread/ui.tsx");
const cls = (p) => renderToStaticMarkup(h(Badge, p)).match(/class="th-badge ([^"]*)"/)[1];
console.log(JSON.stringify([cls({ n: 91, pct: true, top: true }), cls({ n: 88, pct: true }), cls({ n: 72, pct: true }), cls({ n: 90 })]));`;
const classes = (site: string): string[] => JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script],
  { env: { ...process.env, NICHE: site }, cwd: root, encoding: "utf8" }).trim().split("\n").pop()!);

test("topMatch: the highest %, first on a tie, null without any", () => {
  assert.equal(topMatch([{ id: "a", pct: 70 }, { id: "b", pct: 88 }, { id: "c", pct: 88 }, { id: "d", pct: null }]), "b");
  assert.equal(topMatch([{ id: "a" }, { id: "b", pct: null }]), null);
});

test("match badges: padel keeps green / yellow; other sites tint the best match and leave the rest white", () => {
  assert.deepEqual(classes("padel"), ["g", "g", "y", "g"]);
  for (const site of ["skin", "pickleball", "discgolf", "stackrecs"]) assert.deepEqual(classes(site), ["m top", "m", "m", "g"], site);
});
