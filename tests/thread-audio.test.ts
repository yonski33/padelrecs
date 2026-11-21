import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { guidePathsFor, threadDefaultFor, threadSite, GUIDE_KEYS } from "../lib/thread/look";
import { traitGroupsFor, voteBoardsFor, validTraitVote, audioGroupsFor } from "../lib/thread/traits";
import { pickCatsFor } from "../lib/thread/top-picks";
import { audioPicks, buildAudioPrefill } from "../lib/thread/audio-prefill";
import { AUDIO_GUIDES, AUDIO_GUIDE_LINK_LABELS, audioInfo } from "../lib/thread/copy-audio";
import { PADEL_COPY } from "../lib/thread/copy";
import { audioMatch, rankAudio, bestUses, NO_AUDIO_PICKS, type AudioWire } from "../lib/audio-match";
import { tagEvidence, audioKind, hasAnc } from "../lib/audio-profile";
import audioFile from "../db/thread/audio-traits.json";

// AudioRecs on the Thread pages (owner design handoff 2026-11-21): its own groups per kind, guides, words, prefill, match and
// copy; the other sites keep theirs (tests/thread-discgolf.test.ts and the rest).
test("audio: Thread site, go-live flag, its guide addresses", () => {
  assert.equal(threadSite("audio"), true);
  assert.equal(threadDefaultFor("audio"), true);
  const g = guidePathsFor("audio");
  assert.deepEqual(Object.keys(g), GUIDE_KEYS);
  assert.deepEqual(Object.values(g), ["/guide", "/guides/listening-tips", "/guides/open-or-closed-back", "/guides/earbuds-or-over-ear", "/guides/noise-cancelling"]);
});

test("audio: nine groups per kind, the mock's nine on a wireless noise cancelling pair; boards and lists point at real options", () => {
  const all = traitGroupsFor("audio");
  assert.deepEqual(audioGroupsFor({ kind: "Over-ear", wireless: true, anc: true }).map(x => x.title),
    ["Sound", "Noise cancelling", "Comfort", "Call quality", "Battery", "Build", "Best for", "With glasses", "Value"]);
  for (const k of [{ kind: "Over-ear", wireless: true, anc: false }, { kind: "Open-back", wireless: false, anc: false }, { kind: "IEM", wireless: false, anc: false },
    { kind: "Earbuds", wireless: true, anc: true }, { kind: "Earbuds", wireless: true, anc: false }]) {
    const gs = audioGroupsFor(k);
    assert.equal(gs.length, 9, JSON.stringify(k));
    assert.equal(new Set(gs.map(g => g.key)).size, 9);
    if (!k.wireless) for (const no of ["battery", "calls", "anc", "connection"]) assert.ok(!gs.some(g => g.key === no), `${k.kind} ${no}`);
    if (!k.anc) assert.ok(!gs.some(g => g.key === "anc"));
    for (const g of gs) assert.ok(all.some(a => a.key === g.key));
  }
  for (const g of all) { assert.match(g.key, /^[a-z_]{2,20}$/); for (const [k] of g.options) assert.match(k, /^[a-z_]{2,20}$/, `${g.key}.${k}`); }
  for (const b of voteBoardsFor("audio")) assert.ok(validTraitVote(b.trait, b.choice, all), b.title);
  for (const c of pickCatsFor("audio")) { assert.ok(validTraitVote(c.trait, c.choice, all), c.title); assert.match(c.href, /^\/rankings\/best-[a-z-]+$/, c.title); }
});

test("audio prefill: tags first, then words; one count per source and group; only the kind's groups", () => {
  const groups = audioGroupsFor({ kind: "Over-ear", wireless: true, anc: true }).map(g => g.key);
  assert.deepEqual(audioPicks({ tags: ["great noise cancelling", "comfortable", "warm"], text: "Great on the train to work.", negative: false }, groups),
    { sound: "warm", anc: "excellent", comfort: "all_day", best_for: "commute" });
  assert.deepEqual(audioPicks({ tags: ["uncomfortable"], text: "They hurt after two hours with my glasses on.", negative: true }, groups),
    { comfort: "few_hours", glasses: "painful" });
  assert.deepEqual(audioPicks({ tags: [], text: "The ANC is mediocre and the mic is muffled.", negative: false }, groups), { anc: "weak", calls: "poor" });
  const iem = audioGroupsFor({ kind: "IEM", wireless: false, anc: false }).map(g => g.key);
  assert.deepEqual(audioPicks({ tags: [], text: "Easy to drive straight from my phone. I had to swap the tips for a seal.", negative: false }, iem), { amp: "no", fit: "tips" });
  // A negation never counts as the claim.
  assert.deepEqual(audioPicks({ tags: [], text: "It doesn't need an amp.", negative: false }, iem), { amp: "no" });
  assert.deepEqual(audioPicks({ tags: ["long battery life"], text: "", negative: false }, iem), {});
  const out = buildAudioPrefill([{ id: "a", slug: "a", name: "A", kind: "Over-ear", wireless: true, anc: true }],
    [{ productId: "a", tags: ["great noise cancelling"], text: "", negative: false }, { productId: "a", tags: ["great noise cancelling", "comfortable"], text: "", negative: false }], "2026-11-21");
  assert.deepEqual(out.rackets.a.groups, { anc: { excellent: 2 }, comfort: { all_day: 1 } });
  assert.equal(out.rackets.a.sources, 2);
  // The built file only holds options its groups know.
  const all = traitGroupsFor("audio");
  const rs = Object.values((audioFile as { rackets: Record<string, { groups: Record<string, Record<string, number>> }> }).rackets);
  assert.ok(rs.length > 400);
  for (const r of rs) for (const [k, opts] of Object.entries(r.groups)) for (const o of Object.keys(opts)) assert.ok(validTraitVote(k, o, all), `${k}.${o}`);
});

test("audio profile: tags as evidence, the kind, noise cancelling from the specs, the name or listeners", () => {
  const rows = tagEvidence({ productId: "p", ref: "w:1", kind: "player_report", at: null, tags: ["great bass", "muddy", "comfortable"] });
  assert.deepEqual(rows.map(r => [r.attribute, r.value, r.strength]).sort(), [["bass", -1, 0.5], ["bass", 1, 1], ["comfort", 1, 1], ["detail", -1, 1], ["smooth", -1, 1]].sort());
  assert.equal(audioKind({ shape: "Headphones", balance: "Over-ear, open-back" }), "Open-back");
  assert.equal(audioKind({ shape: "Headphones", balance: "On-ear, closed-back" }), "On-ear");
  assert.equal(audioKind({ shape: "Headphones", balance: "Closed-back" }), "Over-ear");
  assert.equal(audioKind({ shape: "IEMs", balance: "In-ear" }), "IEM");
  const p = (name: string, extra: object = {}) => ({ name, shape: "Headphones", weight: "Wireless", balance: "Over-ear", surface: null, description: null, ...extra });
  assert.equal(hasAnc(p("Sony WH-1000XM4")), true);
  assert.equal(hasAnc(p("Bose QuietComfort Ultra Headphones")), true);
  assert.equal(hasAnc(p("Sony WH-CH520")), false);
  assert.equal(hasAnc(p("Sony WH-CH520"), 3), true);
  assert.equal(hasAnc(p("Sennheiser HD 600", { weight: "Wired" })), false);
  assert.equal(hasAnc(p("Bose Ultra Open Earbuds", { shape: "Earbuds" }), 5), false);
});

const w = (id: string, x: Partial<AudioWire>): AudioWire => ({ id, kind: "Over-ear", wireless: true, anc: true, signal: 80, n: 30, s: {}, ...x });
test("audio match: the listener score is the base, picks move it, catches hold it down and sort it last", () => {
  const xm = w("xm", { s: { anc: [95, 20], comfort: [80, 15], battery: [85, 6], connection: [60, 0], bass: [50, 3] } });
  const hd = w("hd", { kind: "Open-back", wireless: false, anc: false, signal: 90, s: { comfort: [85, 20], detail: [95, 30], build: [70, 2], value: [80, 9] } });
  assert.equal(audioMatch(xm, NO_AUDIO_PICKS).pct, 80);
  assert.ok(audioMatch(xm, { use: "commute", sound: null, anc: false }).pct! > 80);
  // Open-backs on the commute, or a pair without noise cancelling when it's ticked: held under Worth a look.
  assert.ok(audioMatch(hd, { use: "commute", sound: null, anc: false }).pct! <= 54);
  assert.equal(audioMatch(hd, { use: "home", sound: "detail", anc: true }).hard, true);
  assert.deepEqual(rankAudio([hd, xm], { use: "commute", sound: null, anc: false }).map(x => x.w.id), ["xm", "hd"]);
  assert.deepEqual(rankAudio([hd, xm], { use: "home", sound: "detail", anc: false }).map(x => x.w.id), ["hd", "xm"]);
  assert.equal(audioMatch(w("new", { signal: null }), { use: "home", sound: null, anc: false }).pct, null);
  assert.deepEqual(bestUses(hd), ["home"]);
  assert.ok(bestUses(xm).includes("commute"));
});

const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings)
  : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => k === "key" || k === "to" ? [] : strings(x)) : [];
test("audio copy follows the copy rules: no dashes, no we/us, no verdict, no padel words, lines ≤105, listeners", () => {
  const info = audioInfo(PADEL_COPY.INFO);
  const all = [...strings(AUDIO_GUIDES), ...Object.values(AUDIO_GUIDE_LINK_LABELS), ...strings(info)];
  assert.ok(all.length > 150);
  for (const t of all) {
    assert.doesNotMatch(t, /[—–]/, t);
    assert.doesNotMatch(t, /\b(we|us|our|we're|we've)\b/i, t);
    assert.doesNotMatch(t, /\bverdict\b/i, t);
    assert.doesNotMatch(t, /padel|racket|paddle|court|smash|\bplayers?\b|\bplay(ed|ing)?\b/i, t);
    assert.doesNotMatch(t, /[$€£]\s?\d/, t);
    assert.doesNotMatch(t, /\b(we|I) tested|lab[- ]tested|hands-on test/i, t);
  }
  // One-line copy (TL;DR bullets, "More guides" labels) stays within 105 characters.
  for (const t of [...AUDIO_GUIDES.flatMap(g => g.tldr), ...Object.values(AUDIO_GUIDE_LINK_LABELS)]) assert.ok(t.length <= 105, t);
  assert.equal(info.find(x => x.key === "about")!.title, "About AudioRecs");
  assert.ok(strings(info).some(t => /listener score/.test(t)));
});

test("audio process: words and routing on NICHE=audio", () => {
  const script = `
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("./proxy.ts");
    const { W } = await import("./lib/thread/words.ts");
    const out = { w: [W.people, W.score, W.reviews, W.traitsTitle, W.played] };
    for (const p of ["/", "/gear", "/headphones", "/iems/moondrop-blessing-3", "/headphones/sony-wh-1000xm5", "/rankings/best-iems", "/guides/noise-cancelling", "/?look=classic", "/compare"]) {
      const r = await proxy(new NextRequest(new URL(p, "https://www.audiorecs.com")));
      const to = r.headers.get("x-middleware-rewrite");
      out[p] = to ? new URL(to).pathname : r.headers.get("x-middleware-next") ? "next" : String(r.status);
    }
    console.log(JSON.stringify(out));`;
  const raw = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script],
    { env: { ...process.env, NICHE: "audio" }, cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
  const out = JSON.parse(raw.trim().split("\n").pop()!);
  assert.deepEqual(out.w, ["listeners", "listener score", "listener reviews", "How does it sound?", "listened to"]);
  assert.equal(out["/"], "/thread");
  assert.equal(out["/gear"], "/thread/rackets");
  assert.equal(out["/headphones"], "/thread/types/headphones");
  assert.equal(out["/iems/moondrop-blessing-3"], "/thread/rackets/moondrop-blessing-3");
  assert.equal(out["/headphones/sony-wh-1000xm5"], "/thread/rackets/sony-wh-1000xm5");
  assert.equal(out["/rankings/best-iems"], "/thread/rankings/best-iems");
  assert.equal(out["/guides/noise-cancelling"], "/thread/guides/elbow");
  assert.doesNotMatch(out["/?look=classic"], /^\/thread/);
  assert.doesNotMatch(out["/compare"], /^\/thread/);
});
