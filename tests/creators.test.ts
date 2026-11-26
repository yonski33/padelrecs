import { test } from "node:test";
import assert from "node:assert/strict";
import { attrSummary, bigPicture, cardChips, checkedDay, howItPlays, lowestOffer, marks, splitSummary, usd, takeaway, sortReviews, stanceCounts, measuredLine, initials, WORDS } from "../lib/thread/creators";
import { fixturePage as creatorPage, fixtureHome } from "../lib/thread/creator-data";
import fixture from "../db/creators/pickleball.json";
const creatorSlugs = (site: string) => site === "pickleball" ? Object.keys((fixture as { paddles: Record<string, unknown> }).paddles) : [];
import { creatorPageFor, CREATOR_PAGE_SLUGS } from "../lib/thread/sites";

const pages = creatorSlugs("pickleball").map(s => [s, creatorPage("pickleball", s)!] as const);

test("creator page: the fixture and the proxy's slug list agree", () => {
  assert.deepEqual(creatorSlugs("pickleball").sort(), [...CREATOR_PAGE_SLUGS.pickleball!].sort());
  assert.ok(creatorPageFor("pickleball", "11six24-vapor-power-2"));
  assert.ok(!creatorPageFor("pickleball", "joola-perseus-pro-iv"));
  assert.ok(!creatorPageFor("padel", "11six24-vapor-power-2"));
  assert.equal(creatorPage("padel", "11six24-vapor-power-2"), null);
});

// Owner decisions 2026-11-22: weak sources dropped, Pickleheads scores hidden, real quotes only, site copy rules.
test("creator page: the owner's data rules hold in the fixture", () => {
  const dropped = ["FORWRD", "Man vs Debt", "REDTACKLE", "PickleballCentral", "Pickleball Hustle"];
  for (const [slug, p] of pages) {
    assert.ok(p.reviews.length >= 8, slug);
    const text = JSON.stringify(p);
    assert.doesNotMatch(text, /verdict/i, slug);
    assert.doesNotMatch(text, /—/, slug);
    assert.doesNotMatch(text, /\bowners?\b/i, slug);
    for (const r of p.reviews) {
      assert.ok(!dropped.includes(r.creator), `${slug}: ${r.creator} should be dropped`);
      if (r.creator === "Pickleheads") { assert.equal(r.score, null); for (const t of [r.summary, r.more ?? "", r.short]) assert.doesNotMatch(t, /\d(\.\d)? out of 5|stars/); }
      for (const h of r.highlights) assert.ok(r.summary.includes(h), `${slug}: ${r.creator} highlight not in summary`);
      if (r.quote) assert.ok(r.quote.split(/\s+/).length < 15, `${slug}: ${r.creator} quote too long`);
      for (const w of Object.values(r.attrs)) assert.ok((WORDS as readonly string[]).includes(w!), `${slug}: ${r.creator} ${w}`);
      for (const [s, t] of r.chapters) { assert.ok(s > 0); assert.doesNotMatch(t, /\b(intro|verdict|discount|code)\b/i); }
      assert.equal(new Set(p.reviews.map(x => x.id)).size, p.reviews.length, `${slug}: ids unique`);
    }
  }
});

test("creator page: helpers", () => {
  const rs = [{ attrs: { spin: "Excellent" as const } }, { attrs: { spin: "Great" as const } }, { attrs: {} }];
  assert.deepEqual(attrSummary(rs, "spin"), { counts: [1, 1, 0, 0, 0], n: 2, word: "Great", share: 1 }); // a tie goes to the lower word
  assert.equal(attrSummary(rs, "power"), null);
  assert.deepEqual(splitSummary("One. Two two. Three."), ["One. Two two.", "Three."]);
  assert.equal(takeaway("Calls it 3.5 and up. Then more."), "Calls it 3.5 and up.");
  assert.deepEqual(stanceCounts([{ stance: "pos" }, { stance: "mix" }, { stance: "pos" }]), { pos: 2, mix: 1, neg: 0 });
  assert.deepEqual(sortReviews([{ stance: "mix", date: "2026-03-01" }, { stance: "pos", date: "2025-01-01" }, { stance: "pos", date: "2026-01-01" }], "stance")
    .map(x => x.date), ["2026-01-01", "2025-01-01", "2026-03-01"]);
  assert.equal(measuredLine({ swing_weight: 111, spin_rpm: 2113, other: 1 }), "Swing weight 111 · Spin 2113 rpm");
  assert.equal(initials("Rackets & Runners - Pickleball"), "RR");
  const many = [{ attrs: { spin: "Excellent" as const, control: "Okay" as const } }, { attrs: { spin: "Excellent" as const, control: "Good" as const } },
    { attrs: { spin: "Excellent" as const, control: "Weak" as const } }, { attrs: { spin: "Great" as const, control: "Great" as const } }];
  assert.deepEqual(bigPicture(many), { likes: ["Excellent spin"], concerns: ["Control Okay or weaker for 2 of 4"] });
  assert.deepEqual(howItPlays(many).find(h => h.k === "control"), { k: "control", label: "Control", word: "Okay", line: "1 of 4 call it Excellent or Great; 2 Okay or weaker." });
  assert.equal(howItPlays(many).find(h => h.k === "spin")!.word, "Excellent");
  assert.deepEqual(cardChips({ control: "Okay", spin: "Excellent", power: "Good" }), [{ tone: "pos", text: "Excellent spin" }, { tone: "neg", text: "Okay control" }]);
  assert.deepEqual(marks("a big hit, a soft touch", ["big hit", "soft"]), [{ t: "a ", on: false }, { t: "big hit", on: true }, { t: ", a ", on: false }, { t: "soft", on: true }, { t: " touch", on: false }]);
  const o = (shop: string, price: number, inStock = true) => ({ shop, url: "https://x.test", price, inStock, edition: null, affiliate: false });
  assert.deepEqual(lowestOffer([o("A", 159), o("B", 159.99), o("Brand", 99.99, false)])?.shops.map(x => x.shop), ["A"]);
  assert.equal(lowestOffer([o("A", 110), o("B", 110), o("C", 200)])?.shops.length, 2);
  assert.equal(lowestOffer([o("Brand", 99.99, false)]), null);
  assert.equal(usd(110), "$110"); assert.equal(usd(159.99), "$159.99"); assert.equal(checkedDay("2026-11-22"), "Nov 22, 2026");
});

test("creator page: prices are USD snapshots, sold-out rows last and never the lowest", () => {
  for (const [slug, p] of pages) {
    const offers = p.prices?.offers ?? [];
    assert.ok(offers.length > 0, slug);
    const firstOut = offers.findIndex(x => !x.inStock);
    if (firstOut >= 0) assert.ok(offers.slice(firstOut).every(x => !x.inStock), `${slug}: sold out rows last`);
    const low = lowestOffer(offers)!;
    assert.ok(low.shops.every(x => x.inStock), slug);
  }
});

test("creators home: fixture rules and the boards", async () => {
  const { boards, praiseLine } = await import("../lib/thread/creator-home");
  const h = fixtureHome("pickleball")!;
  assert.equal(Object.keys(h.paddles).length, 20);
  const text = JSON.stringify(h);
  assert.doesNotMatch(text, /verdict|—|\bowners?\b/i);
  for (const [slug, p] of Object.entries(h.paddles)) {
    assert.equal(p.pos + p.mix + p.neg, p.reviews, slug);
    if (p.praise) assert.ok(p.praise.n >= 2 && p.praise.n <= p.reviews, slug);
    if (p.price) assert.ok(p.price.usd > 0 && /^https:\/\//.test(p.price.url), slug);
  }
  assert.equal(h.total, Object.values(h.paddles).reduce((a, p) => a + p.reviews, 0));
  assert.equal(praiseLine({ ...h.paddles["11six24-vapor-power-2"]!, praise: { key: "spin", words: "spin", n: 14 } }), "Praised for spin in 14 reviews");
  const b = boards(h.paddles);
  assert.equal(b.length, 6);
  for (const x of b) { assert.ok(x.rows.length <= 3); for (let i = 1; i < x.rows.length; i++) assert.ok(x.rows[i - 1]!.n >= x.rows[i]!.n); }
  // The latest summaries are YouTube, newest first.
  for (let i = 1; i < h.latest.length; i++) assert.ok(h.latest[i - 1]!.date >= h.latest[i]!.date);
});

test("creator page: TikTok short takes (Coral Pro demo) follow the copy rules and count once per channel", async () => {
  const { tiktokStances } = await import("../lib/thread/creators");
  const p = creatorPage("pickleball", "six-zero-coral-pro-16mm")!;
  assert.ok(p.tiktok, "Coral Pro has the strip");
  assert.equal(p.tiktok!.unverified, true, "stays flagged until the quotes pass a caption check");
  for (const t of p.tiktok!.takes) {
    const n = t.take.split(/\s+/).length;
    assert.ok(n >= 40 && n <= 70, `${t.id}: ${n} words`);
    assert.doesNotMatch(` ${t.take} `, /—|verdict|\b(he|his|him|we|us)\b|Jeff|Marcus|Samson/i, t.id);
    assert.ok(t.tags.length >= 2 && t.tags.length <= 3, t.id);
    assert.match(t.date, /^2026-\d\d-\d\d$/);
  }
  // Six takes, five channels (@identify.as.a.5.0 twice).
  assert.equal(p.tiktok!.takes.length, 6);
  assert.deepEqual(tiktokStances(p.tiktok!.takes), { pos: 5, mix: 0, neg: 0 });
  // Not in the other demo paddles.
  assert.equal(creatorPage("pickleball", "11six24-vapor-power-2")!.tiktok, undefined);
});

test("creator page: TikTok takes are reviews, counted once per channel", async () => {
  const { reviewLists } = await import("../lib/thread/creators");
  const p = creatorPage("pickleball", "six-zero-coral-pro-16mm")!;
  const { feed, counted } = reviewLists(p);
  assert.equal(feed.length, 15 + 6, "every TikTok video has a card");
  assert.equal(counted.length, 15 + 5, "@identify.as.a.5.0 counts once");
  const idn = counted.filter(r => r.handle === "@identify.as.a.5.0");
  assert.equal(idn.length, 1); assert.equal(idn[0]!.date, "2026-11-19", "by its newest take");
  for (const t of feed.filter(r => r.kind === "tiktok")) { assert.deepEqual(t.attrs, {}); assert.equal(t.stood, null); assert.equal(t.chapters.length, 0); }
  // Paddle page v3: one card per counted review, the older take linked from the newest one.
  const { cardList } = await import("../lib/thread/creators");
  const cards = cardList(p);
  assert.equal(cards.length, counted.length);
  assert.equal(cards.find(r => r.handle === "@identify.as.a.5.0")!.earlier!.length, 1);
  // The other demo paddles are unchanged.
  const v = reviewLists(creatorPage("pickleball", "11six24-vapor-power-2")!);
  assert.equal(v.feed.length, v.counted.length);
});

test("creator data from the database: row mappers and the home's counts", async () => {
  const { reviewFromRow, takeFromRow, pageFromRows, offersFromRows } = await import("../db/creator-reviews");
  const { homeFromPages } = await import("../lib/thread/creator-home");
  const yt = { id: "a", racket_id: "r1", url: "https://youtube.com/watch?v=x", platform: "youtube", review_type: "long-term", creator: "Studio",
    channel_url: null, language: "en", published_on: "2026-10-01", duration_s: 600, video_id: "x", stance: "pos", summary: "Finds big spin. Likes it.",
    summary_more: null, summary_short: "Finds big spin.", highlights: ["big spin", "not in text"], quote: "Big spin.", quote_at_s: 12,
    chapters: [[30, "Spin"]], attributes: { spin: "Excellent", forgiveness: "Great", value: "Good", power: "Huge" }, tags: [],
    score_value: "4.5", score_scale: "5", score_label: "Overall", score_hidden: true, measured: {}, also_url: null, version: null, note: null,
    brand_tie: null, disclosure: "Gifted", stood_out: "Spin", trade_off: null, compared_to: null, status: "live" };
  const r = reviewFromRow(yt);
  assert.equal(r.score, null, "a hidden score never shows");
  assert.equal(reviewFromRow({ ...yt, score_hidden: false }).score!.value, 4.5);
  assert.deepEqual(r.attrs, { spin: "Excellent", sweet: "Great" }, "forgiveness is the sweet spot; unknown words and value are left out");
  assert.deepEqual(r.highlights, ["big spin"], "only exact substrings of the summary");
  assert.equal(r.channel, yt.url, "no channel url: link the video");
  assert.equal(r.type, "long-term");
  const tt = (id: string, handle: string, date: string) => ({ ...yt, id, platform: "tiktok", review_type: "short_update", handle, published_on: date, tags: ["+ Spin", "- Price", "+ Grit", "+ Extra"] });
  assert.deepEqual(takeFromRow(tt("t1", "@a", "2026-11-01")).tags, ["+ Spin", "- Price", "+ Grit"]);
  const page = pageFromRows({ tldr: "Spin.", group_pos: "Loved", group_mix: null, group_neg: null }, [yt, tt("t1", "@a", "2026-11-01"), tt("t2", "@a", "2026-11-09"), tt("t3", "@b", "2026-10-01")],
    [{ shop: "B", url: "https://b", price: "120.00", currency: "USD", in_stock: true, edition: null, affiliate: false, checked_at: "2026-11-22T08:00:00Z" },
     { shop: "A", url: "https://a", price: "99.99", currency: "USD", in_stock: false, edition: null, affiliate: false, checked_at: "2026-11-21T08:00:00Z" }], "Paddle");
  assert.equal(page.reviews.length, 1); assert.equal(page.tiktok!.takes.length, 3);
  assert.deepEqual(page.prices!.offers.map(o => o.shop), ["B", "A"], "in stock first");
  assert.equal(page.prices!.checked, "2026-11-22");
  assert.equal(offersFromRows([]), null);
  const home = homeFromPages(new Map([["paddle", page]]));
  assert.equal(home.paddles.paddle!.reviews, 3, "1 review + 2 TikTok channels");
  assert.equal(home.total, 3);
  assert.equal(home.paddles.paddle!.price!.usd, 120, "the lowest in-stock price, never a sold-out one");
});

// Played it? Vote and rate it (PR #649): the site's ranking categories, the count line.
import { creatorVoteGroups } from "../lib/thread/creator-votes";
import { voteCountLine } from "../lib/thread/vote-count";
import { rankingTraits } from "../lib/category-rating";
test("creator votes ask the pickleball ranking categories, no padel-only group", () => {
  assert.deepEqual(rankingTraits("pickleball"), ["plays_like", "spin", "arm", "level"]);
  const keys = creatorVoteGroups("pickleball").map(g => g.key);
  // Paddle page v3 (owner handoff 2026-11-26): four boxes only; Spin and Feel left out.
  assert.deepEqual(keys, ["plays_like", "level", "sweet_spot", "arm"]);
  assert.deepEqual(creatorVoteGroups("pickleball").map(g => g.title), ["Control or power", "Level", "Sweet spot size", "Arm comfort"]);
  assert.ok(!keys.includes("side") && !keys.includes("game_type"));
  assert.deepEqual(creatorVoteGroups("discgolf").map(g => g.key), ["stability", "glide", "arm_speed", "wind", "grip", "durability"]);
});
test("vote count line: plain counts, never 0 votes", () => {
  assert.equal(voteCountLine(0), "Be the first to vote");
  assert.equal(voteCountLine(1), "1 vote");
  assert.equal(voteCountLine(3), "3 votes");
});

// What reviewers agree on (owner 2026-11-22): phrases, 2+ reviews behind each, never counts.
import { agreeChips, stanceLine, reviewLists as lists } from "../lib/thread/creators";
test("agree chips: phrases backed by 2+ reviews, no count wording", () => {
  const r = (attrs: Record<string, string>) => ({ attrs } as never);
  const out = agreeChips([r({ spin: "Excellent", power: "Okay" }), r({ spin: "Great", power: "Weak" }), r({ spin: "Good", durability: "Great" })]);
  assert.deepEqual(out.likes, ["Strong spin"]);
  assert.deepEqual(out.concerns, ["Low on power for some"]);
  for (const [, p] of pages) { const c = agreeChips(lists(p).counted);
    for (const t of [...c.likes, ...c.concerns]) assert.ok(!/\d|Okay|weaker|creator|—/.test(t), t);
    assert.ok(c.likes.length <= 3 && c.concerns.length <= 3); }
});
test("stance line: one review gives its key point, none says so", () => {
  const x = { attrs: {}, stance: "neg", keyPoint: "Too stiff for touch.", short: "x", date: "2026-01-01" } as never;
  assert.equal(stanceLine([x], "neg"), "Too stiff for touch.");
  assert.equal(stanceLine([x], "pos"), "None of the reviews.");
});

// Site sentiment (owner 2026-11-22): the bar and counts come from site votes, never creator stances.
import { siteSentiment, countsLine, opinionsLabel, sentimentSentence, shareLine } from "../lib/thread/site-sentiment";
import { rowExtras, homePaddle, praiseLine as praise } from "../lib/thread/creator-home";
test("site sentiment: counts, lines and the empty case", () => {
  const s = siteSentiment({ pos: 155, mix: 64, neg: 65 });
  assert.equal(s.total, 284);
  assert.equal(countsLine(s), "155 loved · 64 mixed · 65 not for me");
  assert.equal(opinionsLabel(1, "player"), "1 player opinion");
  assert.equal(sentimentSentence(s, "players"), "155 of 284 players loved it, 64 were mixed and 65 found it not for them.");
  assert.equal(sentimentSentence(siteSentiment(null), "players"), null);
  assert.equal(shareLine(155, s, "players"), "55% of players");
});
test("home extras keep the row's own votes and add only praise and price", () => {
  const [slug, page] = pages[0]!; const p = homePaddle(page);
  const rows = [{ id: "a", slug, href: `/paddles/${slug}`, pos: 9, mix: 1, neg: 0 }, { id: "b", slug: "none", href: "/paddles/none", pos: 2, mix: 0, neg: 0 }];
  const x = rowExtras(rows, { [slug]: p }, { b: "Lots of spin · 4 players" }, (_s, h) => h);
  assert.equal(x.a!.pill, praise(p) ?? null);
  assert.equal(x.b!.pill, "Lots of spin · 4 players");
  assert.ok(!("pos" in x.a!));
});

// Similar paddles mentioned (Hybrid v19): real names only, a later generation is a different paddle.
import { mentions } from "../lib/thread/mentions";
test("mentions: full and distinctive model names, never the self, never a generation mix-up", () => {
  const rows = [{ id: "a", name: "11SIX24 Vapor Power 2", brand: "11SIX24" }, { id: "b", name: "11SIX24 Vapor Power", brand: "11SIX24" },
    { id: "c", name: "Joola Perseus Pro IV", brand: "Joola" }, { id: "d", name: "Six Zero Coral (2025)", brand: "Six Zero" }, { id: "e", name: "Honolulu J6CR", brand: "Honolulu" }];
  const out = mentions([{ summary: "Better than the Vapor Power 2 and the Perseus Pro IV." }, { summary: "vs Vapor Power 2, a coral, the J6CR" }], rows, "c");
  assert.deepEqual(out.map(m => [m.row.id, m.n]), [["a", 2], ["e", 1]]);
});

// The feed's mix (owner 2026-11-22): three others first, then one TikTok after every two, never TikToks in a row.
import { mixTikToks } from "../lib/thread/creators";
test("mixTikToks: three others first, TikToks spread evenly, stance groups kept", () => {
  const r = (id: string, kind: string, stance = "pos") => ({ id, kind, stance } as never as { id: string; kind: "youtube" | "tiktok"; stance: "pos" });
  const xs = [r("y1", "youtube"), r("y2", "youtube"), r("y3", "youtube"), r("y4", "youtube"), r("y5", "youtube"), r("t1", "tiktok"), r("t2", "tiktok"), r("t3", "tiktok")];
  const m = mixTikToks(xs, "newest").map(x => x.id);
  assert.deepEqual(m.slice(0, 3), ["y1", "y2", "y3"]);
  assert.equal(m.length, 8);
  const tts = mixTikToks([r("y1", "youtube"), r("y2", "youtube"), r("y3", "youtube"), ...[1, 2, 3, 4, 5, 6].map(i => r(`y${i + 3}`, "youtube")), r("t1", "tiktok"), r("t2", "tiktok"), r("t3", "tiktok")], "newest").map(x => x.kind).join(",");
  assert.ok(!tts.includes("tiktok,tiktok"), tts);
  const g = [r("a", "youtube"), r("b", "tiktok"), r("c", "youtube", "mix" as "pos")];
  assert.deepEqual(mixTikToks(g, "stance").map(x => x.id), ["a", "b", "c"]);
});

test("the measured line never shows a price (owner 2026-11-24)", async () => {
  const { measuredLine, PRICE_TEXT } = await import("../lib/thread/creators");
  const line = measuredLine({ Weight: "3.5 pounds", Price: "$1,299", "Price with discount code": "$135", Width: "8 in" } as never, "laptop");
  assert.equal(line, "Weight: 3.5 pounds · Width: 8 in");
  assert.ok(PRICE_TEXT.test("question the 390 euro list price") && PRICE_TEXT.test("at $92 with a code") && !PRICE_TEXT.test("pricey for what it offers"));
});

test("padel's creator page asks its ranking groups plus Best on, Sweet spot and Trampoline", () => {
  assert.deepEqual(creatorVoteGroups("padel").map(g => g.key), ["plays_like", "arm", "level", "side", "sweet_spot", "trampoline"]);
  assert.deepEqual(creatorVoteGroups("padel").find(g => g.key === "side")?.options.map(o => o[1]), ["Right side", "Left side", "Both sides"]);
});
