import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { threadPath, th, guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS, THREAD_DEFAULT, GUIDE_PATHS } from "../lib/thread/look";
import { traitGroupsFor, voteBoardsFor, validTraitVote, TRAIT_GROUPS, VOTE_BOARDS } from "../lib/thread/traits";
import { pickCatsFor, PICK_CATS } from "../lib/thread/top-picks";
// app/thread/live/picks.ts STYLE_OPTS is the site's STYLES without "any" (a client file, so the source is checked here).
import { STYLES } from "../lib/quick-match";
const STYLE_OPTS = STYLES.filter(x => x !== "any");
import { GUIDE_UI } from "../lib/thread/copy";

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

test("padel: Find my match keeps Control, Balance and Power; the footer line is unchanged", () => {
  assert.deepEqual(STYLE_OPTS, ["control", "balance", "power"]);
  assert.equal(GUIDE_UI.footerTagline, "a free, ad-light side project · built by padel players");
});

test("pickleball: Thread is the default look (go-live); its own guide addresses", () => {
  assert.equal(threadSite("pickleball"), true);
  assert.equal(threadDefaultFor("pickleball"), true, "go-live: Thread is pickleball's default look (set to false to roll back)");
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

test("pickleball proxy: the normal addresses are served by Thread; ?look=classic gets today's live routing", () => {
  // The site is chosen at import time, so pickleball runs in its own process.
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const out = {};
    out.styles = (await import("./lib/quick-match.ts")).STYLES.filter(x => x !== "any");
    out.footer = (await import("./lib/thread/copy.ts")).GUIDE_UI.footerTagline;
    const { reviewerName } = await import("./lib/thread/display-name.ts");
    out.names = [reviewerName({ level: "Intermediate", side: "Doubles" }), reviewerName({ side: "Both" }), reviewerName({ level: "Competitive" }), reviewerName({ alias: "Gali A", side: "Singles" })];
    for (const p of ["/", "/paddles", "/paddles/joola-perseus-16mm", "/guides/doubles-or-singles", "/rankings/best-spin-pickleball-paddles", "/brands/selkirk", "/compare",
      "/?look=thread", "/?look=classic", "/paddles/joola-perseus-16mm?look=classic", "/about?look=classic"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.pickleballrecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "pickleball" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.deepEqual(out.styles, ["control", "balance", "power", "spin"], "Spin is a 4th I want option (owner 2026-11-19)");
  assert.equal(out.footer, "a free, ad-light side project · built by pickleball players");
  assert.deepEqual(out.names, ["Intermediate, mostly doubles", "Plays singles and doubles", "Competitive player", "Gali A"]);
  assert.equal(out["/"], "/thread");
  assert.equal(out["/paddles"], "/thread/rackets");
  assert.equal(out["/paddles/joola-perseus-16mm"], "/thread/rackets/joola-perseus-16mm");
  assert.equal(out["/guides/doubles-or-singles"], "/thread/guides/side");
  assert.equal(out["/rankings/best-spin-pickleball-paddles"], "/thread/rankings/best-spin-pickleball-paddles");
  assert.equal(out["/brands/selkirk"], "/thread/brands/selkirk");
  assert.doesNotMatch(out["/compare"], /^\/thread/, "compare keeps its live page");
  assert.equal(out["/?look=thread"], "/thread");
  // The rollback look: the live routing (the cached quick-match home and product views), never a Thread page.
  assert.match(out["/?look=classic"], /^\/quick\//);
  assert.doesNotMatch(out["/paddles/joola-perseus-16mm?look=classic"], /^\/thread/);
  assert.doesNotMatch(out["/about?look=classic"], /^\/thread/);
});

// PR 3: the paddle page. Prefill rules, the Spin advice and the pickleball bylines.
import { buildPrefill, sourcePicks, specLeans, GAME } from "../lib/thread/trait-prefill";
import { adviceLine, fitsOf } from "../lib/thread/fit-advice";
import type { EvidenceRow } from "../lib/evidence";
import pbFile from "../db/thread/pickleball-traits.json";
const ev = (attribute: string, value: number, strength: 0.5 | 1 | 1.5 = 1, extra: Partial<EvidenceRow> = {}): EvidenceRow => ({ productId: "a", sourceKind: "player_report",
  sourceRef: "w:1#reader", authorKey: null, attribute, value, valueText: null, strength, quote: null, saidAt: null, extractedBy: "reader-v1", ...extra });

test("pickleball prefill: Spin and Pop from evidence, Game type from words, no padel groups, no specs", () => {
  assert.equal(sourcePicks([ev("spin", 1)], "pickleball").spin, "lots");
  assert.equal(sourcePicks([ev("spin", 1, 0.5)], "pickleball").spin, "some");
  assert.equal(sourcePicks([ev("spin", -1)], "pickleball").spin, "little");
  assert.equal(sourcePicks([ev("pop", 1)], "pickleball").pop, "high");
  assert.equal(sourcePicks([ev("pop", -1)], "pickleball").pop, "low");
  assert.equal(sourcePicks([ev("speed", 1)], "pickleball").maneuver, undefined);
  assert.equal(sourcePicks([ev("speed", 1)]).maneuver, "very", "padel keeps Maneuverable");
  assert.equal(sourcePicks([ev("spin", 1)]).spin, undefined, "padel has no Spin group");
  const pick = (t: string) => GAME.find(([, re]) => re.test(t))?.[0] ?? null;
  assert.equal(pick("Great for doubles at the kitchen."), "doubles");
  assert.equal(pick("I mostly play singles with it."), "singles");
  assert.equal(pick("Works for singles and doubles alike."), "both");
  assert.deepEqual(specLeans({ shape: "Elongated", core: "16 mm", balance: "115" }, "pickleball"), {});
  const out = buildPrefill([{ id: "a", slug: "a", name: "A", shape: "Hybrid", core: "16 mm", balance: null }], [ev("spin", 1)],
    [{ productId: "a", key: "w:1", negative: false, text: "Soft feel, lots of bounce, great in doubles, on the left side." },
      { productId: "a", key: "w:2", negative: true, text: "Bought it for singles, regret it." }], "2026-11-19", "pickleball");
  assert.deepEqual(out.rackets.a.groups.game_type, { doubles: 1 }, "a negative review's format is left out");
  assert.deepEqual(out.rackets.a.groups.feel, { soft: 1 });
  assert.equal(out.rackets.a.groups.trampoline, undefined);
  assert.equal(out.rackets.a.groups.side, undefined);
  assert.deepEqual(out.rackets.a.spec, {});
});

test("pickleball prefill file: only pickleball groups and options", () => {
  const groups = traitGroupsFor("pickleball");
  for (const r of Object.values((pbFile as { rackets: Record<string, { groups: Record<string, Record<string, number>> }> }).rackets))
    for (const [g, opts] of Object.entries(r.groups)) for (const k of Object.keys(opts)) assert.ok(validTraitVote(g, k, groups), `${g}.${k}`);
});

test("Is it right for me? with Spin: strong or short on spin from the Spin bar", () => {
  const p = { level: "intermediate" as const, style: "spin" as const, arm: false };
  assert.ok(fitsOf(p, { styleDots: { power: 3, control: 3, spin: 5 } }).includes("strong on spin"));
  assert.match(adviceLine(p, { styleDots: { power: 3, control: 3, spin: 5 }, suits: { beginner: 40, intermediate: 80, advanced: 60 } }, 85), /strong on spin/i);
  assert.match(adviceLine(p, { styleDots: { power: 3, control: 3, spin: 1 } }, 50), /short on spin/);
});

// PR 4: catalogue, brands and rankings words.
import { brandIntro } from "../lib/thread/brand-intro";
test("brand intro: padel's words by default, the site's word when given", () => {
  assert.equal(brandIntro("Nox", 0, 0, null), "Nox rackets that players have reviewed.");
  assert.equal(brandIntro("Nox", 3, 12, null), "Nox: 3 current rackets, 12 player reviews.");
  assert.equal(brandIntro("Selkirk", 2, 1, { name: "Vanguard", score: 88 }, "paddle"), "Selkirk: 2 current paddles, 1 player review. Top player score: 88, the Vanguard.");
});

// PR 5: guides and info pages.
import { GUIDES, GUIDE_LINK_LABELS, INFO, INFO_UI, PADEL_COPY } from "../lib/thread/copy";
import { PB_GUIDES, PB_GUIDE_LINK_LABELS, pickleballInfo } from "../lib/thread/copy-pickleball";
const COPY = JSON.parse(readFileSync(new URL("./fixtures/thread-padel-copy.json", import.meta.url), "utf8"));
const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => k === "key" || k === "to" ? [] : strings(x)) : []; // ids are never shown

test("padel: guide and info copy exactly as on main", () => {
  assert.deepEqual(plain(GUIDES), COPY.GUIDES);
  assert.deepEqual(plain(GUIDE_LINK_LABELS), COPY.GUIDE_LINK_LABELS);
  assert.deepEqual(plain(INFO), COPY.INFO);
  assert.deepEqual(plain(INFO_UI), COPY.INFO_UI);
  assert.deepEqual(plain(PADEL_COPY.INFO), COPY.INFO);
});

test("pickleball copy follows the copy rules: no dashes, no we/us, no padel words, no prices", () => {
  const pbInfo = pickleballInfo(PADEL_COPY.INFO);
  const all = [...strings(PB_GUIDES), ...Object.values(PB_GUIDE_LINK_LABELS), ...strings(pbInfo)];
  assert.ok(all.length > 150);
  for (const t of all) {
    assert.doesNotMatch(t, /[—–]/, t);
    assert.doesNotMatch(t, /\b(we|us|our|we're|we've)\b/i, t);
    assert.doesNotMatch(t, /padel|racket|(?<!all-)\bround\b|teardrop|diamond|glass|left side|right side|trampoline|\bEVA\b/i, t);
    assert.doesNotMatch(t, /[$€£]\s?\d/, t);
    assert.doesNotMatch(t, /\b(we|I) tested|lab[- ]tested|hands-on test/i, t);
  }
  // The Amazon statement keeps its legal wording with the site's name.
  const amazon = (pbInfo.find(x => x.key === "affiliate")!.extra as { amazon: { body: string } }).amazon.body;
  assert.match(amazon, /^PickleballRecs is a participant in the Amazon Services LLC Associates Program/);
  assert.equal(pbInfo.find(x => x.key === "about")!.title, "About PickleballRecs");
  assert.deepEqual(PB_GUIDES.map(g => g.key), ["racket", "beginner", "shape", "side", "elbow"]);
  for (const g of PB_GUIDES) assert.deepEqual(g.onThisPage, g.steps.map(s => s.title), g.key);
});

// Accounts (#516) stay padel-only until pickleball gets its accounts table (owner: accounts later).
import { accountSite } from "../lib/thread/sites";
test("optional accounts: PadelRecs, PickleballRecs and SkinRecs", () => {
  assert.equal(accountSite("padel"), true);
  assert.equal(accountSite("pickleball"), true);
  assert.equal(accountSite("skin"), true);
  assert.equal(accountSite("tennis"), false);
});
