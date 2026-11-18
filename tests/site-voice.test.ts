import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_VOICES, withVoiceFaq } from "../lib/site-voice";
import { ALL_TAGLINES } from "../lib/voice-taglines";
import summariesPadel from "../db/summaries/padel.json";
import summariesPickleball from "../db/summaries/pickleball.json";
import summariesTennis from "../db/summaries/tennis.json";
import summariesSimracing from "../db/summaries/simracing.json";
import summariesDiscgolf from "../db/summaries/discgolf.json";
import summariesSkin from "../db/summaries/skin.json";
import summariesCoffee from "../db/summaries/coffee.json";

const SITES = ["padel", "pickleball", "tennis", "simracing", "discgolf", "skin", "coffee"];
const SUMMARIES: Record<string, { slug: string }[]> = { padel: summariesPadel, pickleball: summariesPickleball, tennis: summariesTennis,
  simracing: summariesSimracing, discgolf: summariesDiscgolf, skin: summariesSkin, coffee: summariesCoffee };
// The voice rules (PADEL-VOICE.md, VOICES.md): no "we/us" service phrasing, no em dashes, no testing claims, no counts.
const WE = /\b(we|we've|we're|we'll|us|our)\b/i, TESTED = /\b(tested|i played|i used|in my testing)\b/i, COUNT = /\b\d+\s+(players|users|people|owners|reviews|racers|throwers)\b/i;

test("every active site has a voice and taglines", () => {
  for (const s of SITES) { assert.ok(ALL_VOICES[s], s); assert.ok(Object.keys(ALL_TAGLINES[s] ?? {}).length > 0, s); }
});

test("taglines: known slugs, 105 characters or less, voice rules", () => {
  for (const s of SITES) {
    const known = new Set(SUMMARIES[s].map(x => x.slug));
    for (const [slug, t] of Object.entries(ALL_TAGLINES[s])) {
      assert.ok(known.has(slug), `${s}/${slug} not in db/summaries`);
      assert.ok(t.length >= 20 && t.length <= 105, `${s}/${slug}: ${t.length}`);
      assert.ok(!/[—–]/.test(t), `${s}/${slug} dash`);
      assert.ok(!WE.test(t) && !TESTED.test(t) && !COUNT.test(t), `${s}/${slug}: ${t}`);
    }
  }
});

test("owner edits (AFTER-RESET item 8) are in", () => {
  assert.match(ALL_TAGLINES.pickleball["paddletek-bantam-esq-c"], /14\.3mm.*12\.7mm/);
  assert.match(ALL_TAGLINES.skin["cerave-moisturizing-cream"], /breakouts/i);
  assert.match(ALL_TAGLINES.skin["cosrx-ultimate-nourishing-rice-overnight-spa-mask"], /breakouts/i);
  const padel = Object.fromEntries(ALL_VOICES.padel.faq.map(f => [f.q, f.a]));
  assert.equal(padel["How is the order picked?"], "Each pick starts with a hand-picked top 10, then the rest sort by how well they fit "
    + "what you told it, using player reviews and specs. Nobody can pay to move up.");
  assert.match(padel["Can I trust a racket with few reviews?"], /^With only a few reviews, the score can swing, so read the reviews too\..*one happy club/);
  assert.ok(!/"New"|marked New/.test(padel["Can I trust a racket with few reviews?"]));
  for (const s of SITES) assert.equal(ALL_VOICES[s].faq.find(f => f.q === "Why no exact prices?")?.a,
    "Prices change by the day and by the shop, so the \"check price\" button takes you to today's real one.", s);
});

test("extras: lines 105 characters or less, voice rules", () => {
  for (const s of SITES) {
    const v = ALL_VOICES[s];
    const lines = [...Object.values(v.empty), ...v.thanks, ...Object.values(v.cards)];
    for (const t of lines) { assert.ok(t.length <= 105, `${s}: ${t}`); assert.ok(!/[—–]/.test(t) && !WE.test(t) && !TESTED.test(t), `${s}: ${t}`); }
    for (const f of v.faq) assert.ok(!/[—–]/.test(f.a + f.q) && !WE.test(f.a) && !TESTED.test(f.a), `${s}: ${f.q}`);
    assert.equal(v.thanks.length, 3, s);
  }
});

test("withVoiceFaq drops the site's own sponsored question and adds the voice FAQ after its questions", () => {
  const out = withVoiceFaq([{ q: "Best racket for beginners?", a: "x" }, { q: "Is anything sponsored?", a: "old" }], f => ({ q: f.q, a: f.a }), "padel");
  assert.equal(out[0].q, "Best racket for beginners?");
  assert.equal(out.filter(f => f.q === "Is anything sponsored?").length, 1);
  assert.notEqual(out.find(f => f.q === "Is anything sponsored?")?.a, "old");
  assert.equal(withVoiceFaq([{ q: "a", a: "b" }], f => f, "golf").length, 1);
});
