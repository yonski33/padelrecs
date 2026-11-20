import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS } from "../lib/thread/look";
import { traitGroupsFor, voteBoardsFor, validTraitVote } from "../lib/thread/traits";
import { pickCatsFor } from "../lib/thread/top-picks";
import { W } from "../lib/thread/words";
import { skinGroups } from "../lib/thread/trait-prefill";
import { SKIN_GUIDES, SKIN_GUIDE_LINK_LABELS, skinInfo } from "../lib/thread/copy-skin";
import { PADEL_COPY } from "../lib/thread/copy";
import skinFile from "../db/thread/skin-traits.json";

// SkinRecs on the Thread pages (owner 2026-11-20): its own groups, guides, words, prefill and copy; padel and pickleball keep
// theirs (tests/thread-pickleball.test.ts snapshots).
test("padel words unchanged: players, player score", () => {
  assert.equal(process.env.NICHE ?? "padel", "padel");
  assert.deepEqual([W.people, W.score, W.reviews, W.traitsTitle, W.fitTitle, W.opinions, W.played], ["players", "player score", "player reviews", "How does it play?", "Is it right for me?", "player opinions", "played"]);
});

test("skin: Thread site, go-live flag, its guide addresses", () => {
  assert.equal(threadSite("skin"), true);
  assert.equal(threadDefaultFor("skin"), true);
  const g = guidePathsFor("skin");
  assert.deepEqual(Object.keys(g), GUIDE_KEYS);
  assert.deepEqual(Object.values(g), ["/guide", "/guides/beginner-routine", "/guides/cream-vs-lotion-vs-gel", "/guides/morning-or-night", "/guides/sensitive-skin"]);
});

test("skin: the mock's nine vote groups, boards and lists point at real options", () => {
  const groups = traitGroupsFor("skin");
  assert.deepEqual(groups.map(x => x.title), ["Skin type", "Texture", "Finish", "Irritation", "Under makeup", "Results in", "Scent", "Value", "Best used"]);
  for (const g of groups) { assert.match(g.key, /^[a-z_]{2,20}$/); for (const [k] of g.options) assert.match(k, /^[a-z_]{2,20}$/, `${g.key}.${k}`); }
  for (const b of voteBoardsFor("skin")) assert.ok(validTraitVote(b.trait, b.choice, groups), b.title);
  for (const c of pickCatsFor("skin")) { assert.ok(validTraitVote(c.trait, c.choice, groups), c.title); assert.doesNotMatch(c.href, /padel|racket|pickleball/); }
});

test("skin prefill: only counts the engine holds, only skin groups", () => {
  const g = skinGroups({ suits_dry: { score: 80, n: 12, plus: 9, minus: 1 }, gentle: { score: 70, n: 20, plus: 14, minus: 3 }, texture: { score: 75, n: 8 }, finish: { score: 30, n: 4 } });
  assert.deepEqual(g.groups, { skin_type: { dry: 9 }, irritation: { none: 14, a_little: 3 }, texture: { rich: 8 }, finish: { matte: 4 } });
  assert.deepEqual(skinGroups({}).groups, {});
  const groups = traitGroupsFor("skin");
  for (const r of Object.values((skinFile as { rackets: Record<string, { groups: Record<string, Record<string, number>> }> }).rackets))
    for (const [k, opts] of Object.entries(r.groups)) for (const o of Object.keys(opts)) assert.ok(validTraitVote(k, o, groups), `${k}.${o}`);
});

const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings)
  : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => k === "key" || k === "to" ? [] : strings(x)) : [];
test("skin copy follows the copy rules: no dashes, no we/us, no padel or sport words, no prices, no testing claims", () => {
  const info = skinInfo(PADEL_COPY.INFO);
  const all = [...strings(SKIN_GUIDES), ...Object.values(SKIN_GUIDE_LINK_LABELS), ...strings(info)];
  assert.ok(all.length > 150);
  for (const t of all) {
    assert.doesNotMatch(t, /[—–]/, t);
    assert.doesNotMatch(t, /\b(we|us|our|we're|we've)\b/i, t);
    assert.doesNotMatch(t, /padel|racket|paddle|player|court|smash|\bnet\b/i, t);
    assert.doesNotMatch(t, /[$€£]\s?\d/, t);
    assert.doesNotMatch(t, /\b(we|I) tested|lab[- ]tested|hands-on test/i, t);
  }
  assert.equal(info.find(x => x.key === "about")!.title, "About SkinRecs");
  assert.match((info.find(x => x.key === "affiliate")!.extra as { amazon: { body: string } }).amazon.body, /^SkinRecs is a participant in the Amazon Services LLC Associates Program/);
});

test("skin process: words, bylines and routing on NICHE=skin", () => {
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const { W } = await import("./lib/thread/words.ts");
    const { reviewerName } = await import("./lib/thread/display-name.ts");
    const out = { w: [W.people, W.score, W.traitsTitle, W.fitTitle], names: [reviewerName({ level: "Dry", side: "Dryness" }), reviewerName({ level: "Oily" }), reviewerName({ alias: "mira_k" })] };
    for (const p of ["/", "/moisturizers", "/moisturizers/cerave-moisturizing-cream", "/guides/morning-or-night", "/?look=classic", "/compare"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.skinrecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "skin" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.deepEqual(out.w, ["people", "user score", "How does it work for you?", "Is it right for my skin?"]);
  assert.deepEqual(out.names, ["Dry skin, for dryness", "Oily skin", "mira_k"]);
  assert.equal(out["/"], "/thread");
  assert.equal(out["/moisturizers"], "/thread/types/moisturizers");
  assert.equal(out["/moisturizers/cerave-moisturizing-cream"], "/thread/rackets/cerave-moisturizing-cream");
  assert.equal(out["/guides/morning-or-night"], "/thread/guides/side");
  assert.doesNotMatch(out["/?look=classic"], /^\/thread/);
  assert.doesNotMatch(out["/compare"], /^\/thread/);
});

test("skin accounts: on, skin type and main concern as the profile, staff-like name kept", () => {
  const script = `const { accountSite } = await import("./lib/thread/sites.ts"); const { accountNameProblem } = await import("./lib/thread/account-name.ts");
    const { profileLine } = await import("./lib/thread/display-name.ts"); const { niche } = await import("./lib/niche/index.ts");
    console.log(JSON.stringify({ on: accountSite("skin"), staff: accountNameProblem("SkinRecs"), labels: [niche.profile.playerLevel.label, niche.profile.playingSide.label],
      lines: [profileLine("Dry", "Acne"), profileLine(null, "Redness"), profileLine("Oily", null)] }));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "skin" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.equal(out.on, true);
  assert.equal(out.staff, "That name is kept for the site. Pick another.");
  assert.deepEqual(out.labels, ["Skin type", "Main concern"]);
  assert.deepEqual(out.lines, ["Dry skin, for acne", "For redness", "Oily skin"]);
});
