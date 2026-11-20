import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS } from "../lib/thread/look";
import { traitGroupsFor, voteBoardsFor, validTraitVote } from "../lib/thread/traits";
import { pickCatsFor } from "../lib/thread/top-picks";
import { discSpecs, sourcePicks } from "../lib/thread/trait-prefill";
import { DG_GUIDES, DG_GUIDE_LINK_LABELS, discgolfInfo } from "../lib/thread/copy-discgolf";
import { PADEL_COPY } from "../lib/thread/copy";
import type { EvidenceRow } from "../lib/evidence";
import dgFile from "../db/thread/discgolf-traits.json";

// DiscGolfRecs on the Thread pages (owner 2026-11-20): its own groups, guides, words, prefill and copy; padel, pickleball and
// skin keep theirs (tests/thread-pickleball.test.ts, tests/thread-skin.test.ts).
test("discgolf: Thread site, go-live flag, its guide addresses", () => {
  assert.equal(threadSite("discgolf"), true);
  assert.equal(threadDefaultFor("discgolf"), true);
  const g = guidePathsFor("discgolf");
  assert.deepEqual(Object.keys(g), GUIDE_KEYS);
  assert.deepEqual(Object.values(g), ["/guide", "/guides/beginner-tips", "/guides/disc-types", "/guides/backhand-or-forehand", "/guides/slow-arm-speed"]);
});

test("discgolf: the mock's nine vote groups; boards and lists point at real options and its own pages", () => {
  const groups = traitGroupsFor("discgolf");
  assert.deepEqual(groups.map(x => x.title), ["Best for", "Stability", "Glide", "Grip", "In the wind", "Arm speed", "Fade", "Durability", "Best throw"]);
  for (const g of groups) { assert.match(g.key, /^[a-z_]{2,20}$/); for (const [k] of g.options) assert.match(k, /^[a-z_]{2,20}$/, `${g.key}.${k}`); }
  for (const b of voteBoardsFor("discgolf")) assert.ok(validTraitVote(b.trait, b.choice, groups), b.title);
  for (const c of pickCatsFor("discgolf")) {
    if (!c.score) assert.ok(validTraitVote(c.trait, c.choice, groups), c.title);
    assert.match(c.href, /^\/rankings\/best-disc-golf-[a-z-]+$/, c.title);
  }
});

test("discgolf prefill: flight numbers settle the flight groups, evidence counts its own attributes only", () => {
  assert.deepEqual(discSpecs("5 / 4 / -1 / 1"), { stability: "stable", glide: "medium", fade: "gentle", arm_speed: "any" });
  assert.deepEqual(discSpecs("12 / 5 / -1 / 3"), { stability: "stable", glide: "lots", fade: "hard", arm_speed: "fast" });
  assert.deepEqual(discSpecs("9 / 5 / -3 / 1"), { stability: "understable", glide: "lots", fade: "gentle", arm_speed: "medium" });
  assert.deepEqual(discSpecs("4 / 3 / 0 / 3"), { stability: "overstable", glide: "little", fade: "hard", arm_speed: "any" });
  assert.deepEqual(discSpecs(null), {});
  const row = (attribute: string, value: number, strength: 0.5 | 1 = 1) => ({ attribute, value, strength } as unknown as EvidenceRow);
  assert.deepEqual(sourcePicks([row("stability", -1), row("glide", 1), row("wind", -1), row("forehand", 1), row("suits_beginner", 1), row("suits_arm_slow", 1), row("beat_in", -1)], "discgolf"),
    { stability: "understable", glide: "lots", durability: "holds_up", wind: "flips", throw: "forehand", level: "beginner", arm_speed: "any" });
  // Padel's attributes mean nothing here.
  assert.deepEqual(sourcePicks([row("power", 1), row("forgiveness", 1)], "discgolf"), {});
  const groups = traitGroupsFor("discgolf");
  for (const r of Object.values((dgFile as { rackets: Record<string, { groups: Record<string, Record<string, number>>; spec: Record<string, string> }> }).rackets)) {
    for (const [k, opts] of Object.entries(r.groups)) for (const o of Object.keys(opts)) assert.ok(validTraitVote(k, o, groups), `${k}.${o}`);
    for (const [k, o] of Object.entries(r.spec)) assert.ok(validTraitVote(k, o, groups), `spec ${k}.${o}`);
  }
});

const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings)
  : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => k === "key" || k === "to" ? [] : strings(x)) : [];
test("discgolf copy follows the copy rules: no dashes, no we/us, no padel words, no prices, no testing claims", () => {
  const info = discgolfInfo(PADEL_COPY.INFO);
  const all = [...strings(DG_GUIDES), ...Object.values(DG_GUIDE_LINK_LABELS), ...strings(info)];
  assert.ok(all.length > 150);
  for (const t of all) {
    assert.doesNotMatch(t, /[—–]/, t);
    assert.doesNotMatch(t, /\b(we|us|our|we're|we've)\b/i, t);
    assert.doesNotMatch(t, /padel|racket|paddle|court|smash|\bnet\b/i, t);
    assert.doesNotMatch(t, /[$€£]\s?\d/, t);
    assert.doesNotMatch(t, /\b(we|I) tested|lab[- ]tested|hands-on test/i, t);
  }
  assert.equal(info.find(x => x.key === "about")!.title, "About DiscGolfRecs");
});

test("discgolf process: words, picks and routing on NICHE=discgolf", () => {
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const { W } = await import("./lib/thread/words.ts");
    // The pick labels and type chips the client reads (app/thread/live/picks.ts styleLabel, ARM_LABEL, TYPES) come from here.
    const { SITE_FIT } = await import("./lib/fit-config.ts");
    const L = SITE_FIT.styleLabels;
    const out = { w: [W.people, W.score, W.reviews, W.traitsTitle, W.played], picks: [L.control, L.balance, L.power, SITE_FIT.quick ? "Slower arm" : "Sore arm"],
      types: (SITE_FIT.quick?.types ?? []).map(t => t.key) };
    for (const p of ["/", "/discs", "/discs/discraft-buzzz", "/putters", "/rankings/best-disc-golf-putters", "/guides/slow-arm-speed", "/?look=classic", "/compare"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.discgolfrecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "discgolf" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.deepEqual(out.w, ["throwers", "thrower score", "thrower reviews", "How does it fly?", "threw"]);
  assert.deepEqual(out.picks, ["Understable", "Stable", "Overstable", "Slower arm"]);
  assert.deepEqual(out.types, ["putter", "midrange", "fairway", "distance"]);
  assert.equal(out["/"], "/thread");
  assert.equal(out["/discs"], "/thread/rackets");
  assert.equal(out["/discs/discraft-buzzz"], "/thread/rackets/discraft-buzzz");
  assert.equal(out["/putters"], "/thread/types/putters");
  assert.equal(out["/rankings/best-disc-golf-putters"], "/thread/rankings/best-disc-golf-putters");
  assert.equal(out["/guides/slow-arm-speed"], "/thread/guides/elbow");
  assert.doesNotMatch(out["/?look=classic"], /^\/thread/);
  assert.doesNotMatch(out["/compare"], /^\/thread/);
});

test("disc golf accounts: on, Level and Throw as the profile, staff-like name kept", () => {
  const script = `const { accountSite } = await import("./lib/thread/sites.ts"); const { accountNameProblem } = await import("./lib/thread/account-name.ts");
    const { profileLine } = await import("./lib/thread/display-name.ts"); const { niche } = await import("./lib/niche/index.ts");
    console.log(JSON.stringify({ on: accountSite("discgolf"), staff: accountNameProblem("DiscGolfRecs"), labels: [niche.profile.playerLevel.label, niche.profile.playingSide.label],
      lines: [profileLine("Intermediate", "RHBH"), profileLine(null, "LHFH"), profileLine("Advanced", null)] }));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "discgolf" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.equal(out.on, true);
  assert.equal(out.staff, "That name is kept for the site. Pick another.");
  assert.deepEqual(out.labels, ["Level", "Throw"]);
  assert.deepEqual(out.lines, ["Intermediate, throws RHBH", "Throws LHFH", "Advanced player"]);
});
