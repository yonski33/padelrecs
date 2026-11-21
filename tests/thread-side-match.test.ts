import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The ranking sidebar's "See how you match" (owner report 2026-11-21: SkinRecs' rankings showed padel's Beginner · Control ·
// Sore arm card). Each site renders the card its ranking page would show (lib/thread/sites.ts quickMatchFor), in its own
// process with NICHE set, and reads the pick labels off the markup.
const root = new URL("..", import.meta.url).pathname;
const script = `
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const { quickMatchFor } = await import("./lib/thread/sites.ts");
const { niche } = await import("./lib/niche/index.ts");
const qm = quickMatchFor(niche.id);
let html = "";
if (qm === "engine") { const { SideMatch } = await import("./app/thread/live/lists.tsx"); html = renderToStaticMarkup(h(SideMatch, { names: {} })); }
if (qm === "skin") { const { SkinMatchBox } = await import("./app/thread/live/skin-match.tsx"); html = renderToStaticMarkup(h(SkinMatchBox, { wire: [], names: {}, title: "See how you match" })); }
const labels = [...html.matchAll(/<button[^>]*>(?:<span[^>]*>[^<]*<\\/span>)?([^<]*)<\\/button>/g)].map(m => m[1]);
console.log(JSON.stringify({ qm, labels }));`;
const sidebar = (site: string): { qm: string | null; labels: string[] } => {
  const raw = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { env: { ...process.env, NICHE: site }, cwd: root, encoding: "utf8" });
  return JSON.parse(raw.trim().split("\n").pop()!);
};
const PADEL = ["Beginner", "Intermediate", "Advanced", "Any", "Control", "Balance", "Power", "Sore arm"];

test("ranking sidebar: padel keeps its quick match", () => {
  assert.deepEqual(sidebar("padel"), { qm: "engine", labels: PADEL });
});

test("ranking sidebar: no other site shows padel's picks; each shows its home's own, or no card", () => {
  const want: Record<string, { qm: string | null; labels: string[] }> = {
    pickleball: { qm: "engine", labels: ["Beginner", "Intermediate", "Advanced", "Any", "Control", "Balance", "Power", "Spin", "Sore arm"] },
    skin: { qm: "skin", labels: ["Dry", "Oily", "Combination", "Normal", "Any", "Hydrate", "Calm", "Clear skin", "Sensitive skin"] },
    discgolf: { qm: "engine", labels: ["Beginner", "Intermediate", "Advanced", "Any", "Understable", "Stable", "Overstable", "Slower arm"] },
    // No Thread quick match (StackRecs has its own pages; SimRacing and Audio aren't on Thread yet): no card.
    stackrecs: { qm: null, labels: [] }, simracing: { qm: null, labels: [] }, audio: { qm: null, labels: [] },
  };
  for (const [site, w] of Object.entries(want)) {
    const got = sidebar(site);
    assert.notDeepEqual(got.labels, PADEL, `${site} shows padel's picks`);
    assert.deepEqual(got, w, site);
  }
});

test("ranking page: the card and the list's match % follow the site's quick match", () => {
  const src = readFileSync(new URL("../app/thread/rankings/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(src, /const QM = quickMatchFor\(niche\.id\)/);
  assert.doesNotMatch(src, /<aside className="th-side">\s*<SideMatch/);
  assert.match(src, /QM !== "engine" \? \{ match: false \}/);
});
