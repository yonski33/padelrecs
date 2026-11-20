import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS } from "../lib/thread/look";
import { traitGroupsFor, traitGroupsForType, SIMRACING_TRAIT_GROUPS, voteBoardsFor, validTraitVote } from "../lib/thread/traits";
import { pickCatsFor } from "../lib/thread/top-picks";
import { sourcePicks } from "../lib/thread/trait-prefill";
import { SR_GUIDES, SR_GUIDE_LINK_LABELS, simracingInfo } from "../lib/thread/copy-simracing";
import { PADEL_COPY } from "../lib/thread/copy";
import type { EvidenceRow } from "../lib/evidence";
import srFile from "../db/thread/simracing-traits.json";

// SimRacingRecs on the Thread pages (owner 2026-11-20): vote groups per gear type, its guides, words, prefill and copy; the
// other sites keep theirs (their own test files).
test("simracing: Thread site, go-live flag, its guide addresses", () => {
  assert.equal(threadSite("simracing"), true);
  assert.equal(threadDefaultFor("simracing"), true);
  const g = guidePathsFor("simracing");
  assert.deepEqual(Object.keys(g), GUIDE_KEYS);
  assert.deepEqual(Object.values(g), ["/guide", "/guides/beginner-tips", "/guides/direct-drive-belt-or-gear", "/guides/load-cell-pedals", "/guides/desk-or-rig"]);
});

test("simracing: the wheelbase mock's nine groups (Heat, not the stray Pop); every type's groups are valid votes", () => {
  assert.deepEqual(traitGroupsForType("simracing", "Wheelbase").map(x => x.title),
    ["Best in", "Torque", "Detail", "Best for", "Desk friendly", "Durability", "Heat", "Noise", "Software"]);
  assert.deepEqual(Object.keys(SIMRACING_TRAIT_GROUPS), ["Wheelbase", "Pedals", "Wheel", "Cockpit", "Shifter / handbrake"]);
  const all = traitGroupsFor("simracing");
  for (const gs of Object.values(SIMRACING_TRAIT_GROUPS)) for (const g of gs) for (const [k] of g.options) assert.ok(validTraitVote(g.key, k, all), `${g.key}.${k}`);
  for (const b of voteBoardsFor("simracing")) assert.ok(validTraitVote(b.trait, b.choice, all), b.title);
  for (const c of pickCatsFor("simracing")) { assert.ok(validTraitVote(c.trait, c.choice, all), c.title); assert.match(c.href, /^\/rankings\/best-[a-z-]*sim-racing-[a-z-]+$/, c.title); }
});

test("simracing prefill: its own quality and suits rows only", () => {
  const row = (attribute: string, value: number) => ({ attribute, value, strength: 1 } as unknown as EvidenceRow);
  assert.deepEqual(sourcePicks([row("ffb_detail", 1), row("ffb_strength", -1), row("brake_feel", 1), row("rigidity", 1), row("build", -1), row("quiet", 1), row("software", -1), row("suits_new", 1)], "simracing"),
    { detail: "sharp", torque: "too_light", brake_feel: "realistic", flex: "none", durability: "wears_fast", noise: "quiet", software: "frustrating", level: "beginner" });
  assert.deepEqual(sourcePicks([row("power", 1), row("forgiveness", 1)], "simracing"), {});
  const all = traitGroupsFor("simracing");
  for (const r of Object.values((srFile as { rackets: Record<string, { groups: Record<string, Record<string, number>> }> }).rackets))
    for (const [k, opts] of Object.entries(r.groups)) for (const o of Object.keys(opts)) assert.ok(validTraitVote(k, o, all), `${k}.${o}`);
});

const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings)
  : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => k === "key" || k === "to" ? [] : strings(x)) : [];
test("simracing copy follows the copy rules and has none of the mock's padel leftovers", () => {
  const info = simracingInfo(PADEL_COPY.INFO);
  const all = [...strings(SR_GUIDES), ...Object.values(SR_GUIDE_LINK_LABELS), ...strings(info)];
  assert.ok(all.length > 150);
  for (const t of all) {
    assert.doesNotMatch(t, /[—–]/, t);
    assert.doesNotMatch(t, /\b(we|us|our|we're|we've)\b/i, t);
    assert.doesNotMatch(t, /padel|racket|paddle|\bcourt\b|smash|\bplay(ed|er|ers)?\b|which (shape|side)|verdict/i, t);
    assert.doesNotMatch(t, /[$€£]\s?\d/, t);
    assert.doesNotMatch(t, /\b(we|I) tested|lab[- ]tested|hands-on test/i, t);
  }
  assert.ok(!SR_GUIDES.some(g => g.crumb === "Playing"));
  assert.equal(info.find(x => x.key === "about")!.title, "About SimRacingRecs");
});

test("simracing process: words and routing on NICHE=simracing", () => {
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const { W } = await import("./lib/thread/words.ts");
    const out = { w: [W.people, W.score, W.reviews, W.traitsTitle, W.played] };
    for (const p of ["/", "/gear", "/wheelbases", "/wheelbases/fanatec-csl-dd-8-nm", "/rankings/best-sim-racing-wheelbases", "/guides/desk-or-rig", "/add-review", "/?look=classic", "/compare"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.simracingrecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "simracing" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.deepEqual(out.w, ["racers", "racer score", "racer reviews", "How does it drive?", "raced with"]);
  assert.equal(out["/"], "/thread");
  assert.equal(out["/gear"], "/thread/rackets");
  assert.equal(out["/wheelbases"], "/thread/types/wheelbases");
  assert.equal(out["/wheelbases/fanatec-csl-dd-8-nm"], "/thread/rackets/fanatec-csl-dd-8-nm");
  assert.equal(out["/rankings/best-sim-racing-wheelbases"], "/thread/rankings/best-sim-racing-wheelbases");
  assert.equal(out["/guides/desk-or-rig"], "/thread/guides/elbow");
  assert.equal(out["/add-review"], "/thread/add-review");
  assert.doesNotMatch(out["/?look=classic"], /^\/thread/);
  assert.doesNotMatch(out["/compare"], /^\/thread/);
});
