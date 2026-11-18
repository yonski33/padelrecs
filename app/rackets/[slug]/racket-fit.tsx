import { withoutYear } from "../../../lib/brand-name";
import { suitsLine } from "../../../lib/suits-line";
import { productPhoto } from "../../visual";
import { ownScore } from "../../../lib/niche";
import type { ReactNode } from "react";
import "./racket-fit.css";
import { spans, chipTone, type Chip, type QuickTake } from "../../../lib/quick-take";
import { type Trait } from "../../../lib/trait-score";
import { SITE_FIT } from "../../../lib/fit-config";
import { bestFor, styleLean, styleOf, MIN_FIT_REPORTS } from "../../../lib/fit-verdict";
import { LEVELS, type QuickChoice } from "../../../lib/quick-match";
import { matchContext } from "../../match-context";
import { reportLevels } from "../../../db/report-levels";
import { V2Footer } from "../../v2-footer";
import { FitPicks, FitBack, FitBox, FitSticky, FitCompare, FitYesNo, FitSimilar, BeforePicks, type SaidView, type CompareCard } from "./fit-live";
import type { SimilarItem, SimilarTab } from "../../similar-section";
import { aheadWord, tint, completeBag, flightOf, expertLine, type Disc } from "../../../lib/similar-picks";
import { withModelYears, rankingHref as listHref } from "../../../lib/top-lists";
import { shortLine } from "../../../lib/short-lines";
import { listLine } from "../../../lib/list-lines";
import { homePayload } from "../../home-payload";
import { rankSeed } from "../../../lib/rank-seed";
import { engineAxis } from "../../../lib/home-rank";
import { signals } from "../../../lib/signal";
import { score } from "../../../db/data";
import { signalCategory } from "../../signals";
import { platformName } from "../../../lib/source-label";
import { isComplete } from "../../../lib/complete-text";
import { displayName } from "../../../lib/brand-name";
import { productHref, niche, catalogPath, v2copy, hasYears } from "../../../lib/niche";
import { shopPhoto, photoHidden } from "../../../lib/shop-photos";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { similarProducts, tagProfiles } from "../../../lib/similar";
import { modelFamily } from "../../../lib/compare-pairs";
import { SUITS_OK } from "../../../lib/fit-verdict";
import RacketReviews, { type ReviewCard } from "./racket-reviews";
import { plainSummary } from "../../../lib/plain-summary";
import { onePerChannel, videoOf } from "../../../lib/youtube-pick";
import { cardContent } from "../../../lib/fit-card-data";
import { pageContent, pageTier, cardFromPage, AXIS_CONTROL, AXIS_POWER, RESEARCH_LINE } from "../../../lib/racket-page";
import { hasAttribution } from "../../../lib/voice";
import { traitNote, TRAIT_SAY } from "../../../lib/trait-note";
import "./v11.css";
import "../../review-card.css";
import { V11Better, V11Others, V11More, V11Plays, V11BuildCards, V11Decide, type V11Card, type V11Pool } from "./v11";
import { rankedLists } from "../../rankings/lists";
import Link from "next/link";

/** The date n days back (YYYY-MM-DD), for "new this week". */
/** Reports a newer year needs before it replaces the older one (as the curated lists, lib/engine newestAt). */
const NEWEST_AT = 10;
const isoDaysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
import { listYear } from "../../../lib/top-lists";
import { scoreTone as v11Tone } from "../../../lib/score-tone";
import { V11_SITES } from "../../../lib/v11-site";
import { V11Works, type WorksGroup } from "./v11-works";
import simPairs from "../../../db/compat/simracing-pairs.json";
import { distinctEdges } from "../../../lib/other-picks";
import { claimBlock, factFor, sameFlightFact } from "../../../lib/claim-guard";
import { refName } from "../../../lib/compare-names";
import { suggestionFloor } from "../../../lib/suggestion-floor";
import { contradicts, padelWords, claims } from "../../../lib/content-consistency";
import { alternatives } from "../../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../../lib/rank-seed";
import { STYLES } from "../../../lib/quick-match";
import { plain } from "../../../lib/quick-take";

/** A type-picker site (lib/fit-config.ts quick: DiscGolfRecs): its stability chips and score word. Unset: padel's page, unchanged. */
const QUICK = SITE_FIT.quick ? SITE_FIT : null;
const SCORE_WORD = v2copy.score ?? "player score";
/** Product page v11 (owner 2026-11-17, design_handoff_product_page_v11): padel, pickleball and disc golf, each in its own words
 *  (lib/v11-site.ts); the other sites keep their page. PADEL: the padel-only wording passes (padelWords, its bar nuances). */
/** "Still deciding?" link wording per site (owner 2026-11-18): each site's own verb, played it? by default. */
const ASK_LINK: Record<string, string> = { discgolf: "thrown it?", simracing: "raced on it?" };
const V11_SITE = V11_SITES[niche.id] ?? null, V11 = !!V11_SITE, PADEL = niche.id === "padel";
/** Who reviews on this page, in the site's words (lib/niche reviewers, else people): disc golf's throwers. */
const RV = niche.reviewers ?? { one: SITE_FIT.words?.person ?? niche.people.one, many: niche.people.many };
const SCORE_CAP = `${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}`;
/** v11 "How it plays": three bands (trait key, label). */
const V11_BANDS_OF = (shape: string | null): [string, string][] => { const b = V11_SITE?.bands; return typeof b === "function" ? b(shape) : b ?? []; };
/** v11 other-racket cards: what you give up, per trait where the other racket is behind (padel's words). */
/** A strong bar's words when a Why not says the opposite (audit 2026-11-17). */
const BAR_NUANCE: Record<string, string> = { power: "Power when you swing; little free power.", control: "Precise, though fast balls can fly.",
  forgiveness: "Forgiving, though off-centre hits lose some pace." };
const GIVE_UP: Record<string, string> = V11_SITE?.giveUp ?? {};
import type { QtReport, QtReview } from "./quick-take";
import { scoreState } from "../../../lib/score-view";
import { NewPill } from "../../score-tags";
import { voiceTagline } from "../../../lib/voice-taglines";

/** The racket fit page (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md; Claude Design layout, our data): a tight page with
 *  the important things and our recommendation. One fit-check box with two states: no picks asks "Is this the right racket
 *  for you?"; picks from the URL (?style=&level=&arm=1, the same as the home's quick match) get a verdict from
 *  lib/fit-verdict.ts. Shown for products with a quick-take block; the canonical stays the bare URL. */

/** The trait a "try X instead" line names, by its words (first match wins). */
const ALT_TRAITS: [string, RegExp][] = [["power", /\b(power|harder|hits? hard|pace|punch|put-aways?)\b/i], ["pop", /\bpop(py)?\b/i], ["spin", /\b(spin|grit|bite)\b/i],
  ["forgiveness", /\b(forgiv\w*|sweet spot|mishits?)\b/i], ["arm", /\b(arm|elbow|comfort\w*)\b/i], ["control", /\b(control\w*|touch|softer|plush|muted|dwell)\b/i],
  ["speed", /\b(quick\w*|hands|faster)\b/i]];
/** Raw markdown left in stored words ("**NOX AT10 Pro Cup Soft 2026**", audit 2026-11-17 #29): the words without the marks. */
const unmd = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*\*|__/g, "");
function Rich({ text }: { text: string }) {
  return <>{spans(text).map((s, i) => s.mark || s.b ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>)}</>;
}
/** "5d ago", "3 mo ago", "1 yr ago" for a card. */
function ago(iso?: string | null) {
  if (!iso) return null; const d = Math.max(0, (Date.now() - Date.parse(iso)) / 864e5); if (!Number.isFinite(d)) return null;
  return d < 1 ? "today" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
const ratingVerdictOf = (n: number) => n >= 4 ? "positive" as const : n === 3 ? "mixed" as const : "negative" as const;
/** Reports at the picked level needed before "What players said" narrows to them. */
const LEVEL_SAID_MIN = 5;
/** The site's dot traits and labels, in order (lib/fit-config.ts; padel's are TRAITS). */
const SITE_TRAITS = SITE_FIT.traits.filter(t => !t.hidden).map(t => t.key),
  /** A site whose traits apply to some product types only (SimRacingRecs: FFB on wheelbases): rows and compares stay within
   *  the type. Every other site: all its rows, as before. */
  PER_TYPE = SITE_FIT.traits.some(t => t.appliesTo),
  traitsFor = (shape: string | null) => PER_TYPE ? SITE_TRAITS.filter(k => { const a = SITE_FIT.traits.find(t => t.key === k)?.appliesTo; return !a || (!!shape && a.includes(shape)); }) : SITE_TRAITS, SITE_LABEL: Record<string, string> = Object.fromEntries(SITE_FIT.traits.map(t => [t.key, t.label]));

/** The line under a bar from the evidence store: [praise (many, one), fault (many, one)] per trait. */


export default async function RacketFit(props: {
  /** The quick-take block; null for the beginner pilots that have none yet (their lines come from tag counts). */
  qt: QuickTake | null; line?: string | null; quotes?: { id: string; text: string; verbatim: boolean; ok: boolean }[]; /** The "works with" tab (SimRacingRecs, niche.similar.pairs "works"), built on the product page. */ pairsTab?: SimilarTab | null;
  racketId: string; slug: string; href: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; site: string; specs: string[]; buy: { url: string; label: string; rel: string } | null;
  fontClass: string; tags: string[]; nicknames: string[]; choice: QuickChoice; picked: boolean; jsonLd: object;
}) {
  const { qt, reports, reviews, choice, picked } = props;
  const [ctx, payload] = await Promise.all([matchContext(), homePayload()]);
  const facts = ctx.facts(props.racketId);
  // The style chip follows the match engine's control ↔ power axis (one story with the fit check and the dots; maker labels
  // bound it), with the tag-count lean only where the engine has no place for the racket.
  const axis = engineAxis(payload.items, niche.fit?.engine).get(props.racketId);
  // Padel (owner audit 2026-11-17): the one style every page uses, from the bars it shows (lib/fit-verdict styleOf).
  const lean = PADEL ? styleOf(facts) : axis === undefined ? styleLean(facts).lean : axis < AXIS_CONTROL ? "control" : axis > AXIS_POWER ? "power" : "balance";
  const leanWord = lean && !SITE_FIT.noLeanChip ? QUICK ? QUICK.styleLabels[lean].toLowerCase() : lean === "balance" ? "all-round" : lean : null;
  // "beginner → intermediate control players, and sore arms." (owner 2026-11-15, mockup): the level band and lean as one phrase.
  // A site whose arm pick is a hard filter (SimRacingRecs: console) has no arm words in "best for".
  const armWords = SITE_FIT.quick?.armFilter ? "\u0000" : QUICK ? "slower arms" : "sore arms";
  // A product the maker no longer sells (SimRacingRecs, Grok audit 2026-11-17 #8): a visible badge, and "used only" for the price.
  // Not shipping yet (CoffeeRecs' Decent Bengle): out of the match like a gone product, but labelled as pre-release, and its shop
  // link stays a plain one.
  const soon = !!payload.items.find(x => x.id === props.racketId)?.ff?.soon;
  const gone = !!payload.items.find(x => x.id === props.racketId)?.ff?.gone, buy = gone && !soon && props.buy ? { ...props.buy, label: "used only" } : props.buy;
  const bf = bestFor(facts), bfArm = bf.includes(armWords), bfLevel = bf.find(b => /beginner|intermediate|advanced/.test(b) || (!!SITE_FIT.levelPeople && Object.values(SITE_FIT.levelLabels ?? {}).some(w => b.split(" → ").includes(w)))), bfLean = QUICK ? null : lean ? `${lean === "balance" ? "all-round" : lean} players` : bf.find(b => / players$/.test(b));
  // A site with its own level words (SimRacingRecs: new / serious / all-in; bestFor says them) says its own people ("drivers").
  const ownLevels = SITE_FIT.levelPeople ? SITE_FIT.levelLabels : undefined;
  const bfWho = [bfLevel, bfLean ?? (bfLevel ? ownLevels ? niche.people.many : "players" : null)].filter(Boolean).join(" ");
  // "Usually best for …" before the picks (owner 2026-11-19), in the site's people word; a type-picker site (disc golf) adds
  // what its lean is good for. None without a level, a lean or the arm.
  const bfUse = QUICK ? bf.find(b => b !== bfLevel && b !== armWords) ?? null : null;
  const bestLine = bfWho || bfArm || bfUse ? suitsLine({ level: bfLevel ?? null, lean: bfLean ? bfLean.replace(/ players$/, "") : null, use: bfUse,
    arm: bfArm ? armWords : null, people: ownLevels || QUICK?.words ? niche.people.many : "players" }) : null;
  // Players' own stated levels: own reviews carry one; web reports get one when the writer states it (migration 0021).
  const webLevels = await reportLevels(props.racketId);
  const levelOf = (r: QtReport) => { const v = r.level ?? webLevels.get(r.id)?.level; return v === "Competitive" ? "advanced" : v?.toLowerCase(); };
  const byId = new Map(reports.map(r => [r.id, { ...r, level: r.level ?? webLevels.get(r.id)?.level ?? null }]));
  const who = (id: string) => { const r = byId.get(id); if (!r) return null;
    // True source, neutral words (owner 2026-11-15): our own players by nickname, YouTube by channel, forums and blogs by kind.
    const src = r.platform === props.site ? r.nickname || `A ${props.site} player` : r.platform === "YouTube" ? `YouTube · ${r.sourceName ?? "video"}` : r.platform === "Reddit" ? v2copy.forum : platformName(r.platform) === "Blog" ? v2copy.blog : platformName(r.platform).toLowerCase();
    return [src, r.level?.toLowerCase()].filter(Boolean).join(" · "); };
  // Six trait rows (owner 2026-11-15): dots from the calculated trait scores (lib/trait-score.ts, every racket alike), text
  // from the quick-take's own line where it has one and it agrees with the dots, else what the tag counts say.
  const row = (label: string) => qt?.plays?.rows.find(r => r.label.toLowerCase() === label.toLowerCase());
  const tr = ctx.traits(props.racketId);
  const qtRow: Partial<Record<string, { chip: string; line: string }>> = { forgiveness: row("Sweet spot"), power: row("Power"), control: row("Control"), defence: qt?.plays?.court?.defence, arm: row("Comfort"), speed: row("Handling") };
  const TRAITS = traitsFor(props.shape);
  const traits = TRAITS.map(t => {
    const sc = tr.scores?.[t] ?? null, q = qtRow[t];
    // The hand-written line must agree with the dots: a strong chip beside 1–2 dots, or a weak/divided one beside 4–5, loses.
    const tone = q ? chipTone(q.chip as Chip) : null;
    const agrees = !q || !sc || !((sc.dots <= 2 && tone === "g") || (sc.dots >= 4 && (tone === "b" || q.chip === "Divided" || q.chip === "Tricky")));
    const ev = sc?.people;
    // The note (owner 2026-11-16, expert voice): an admin edit, else the quick take's own line when it agrees with the dots and
    // doesn't say who said it, else a plain statement from the dots (lib/trait-note.ts), with both sides named on a real split.
    const stated = sc ? traitNote(t, sc.dots, ev ? ev.players.plus + ev.reviewers.plus : 0, ev ? ev.players.minus + ev.reviewers.minus : 0, SITE_LABEL[t],
      SITE_FIT.traits.find(d => d.key === t)?.say ?? (SITE_FIT.sport === "padel" ? TRAIT_SAY[t as Trait] : undefined)) : null;
    const text = tr.edits?.traits[t as Trait]?.text ?? (q && agrees && !hasAttribution(q.line) ? q.line : null) ?? stated ?? "Too few reports to call it yet.";
    return [SITE_LABEL[t], text, sc ? "●".repeat(sc.dots) + "○".repeat(5 - sc.dots) : null] as [string, string, string | null];
  });

  // Similar rackets (no picks): really similar rackets, not the home's top 4 on every page. With picks, "Better matches for you"
  // is worked out in the browser (fit-live.tsx FitAlts, lib/home-rank.ts alternatives).
  // A wider pool (10) behind the 4 similar rackets, so a card with nothing new to say can give way to the next (lib/other-picks.ts).
  // The same few top scorers filled the cards on 50+ pages (audit 2026-11-17, #26: Tour X on 68). Fill and wide picks sort by
  // score band (5 points), then a fixed per-page order, so close scorers take turns; a clearly better score still leads.
  const spread = (a: string, b: string) => { let h = 2166136261; for (const ch of `${props.slug}|${a}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    let k = 2166136261; for (const ch of `${props.slug}|${b}`) k = Math.imul(k ^ ch.charCodeAt(0), 16777619); return (h >>> 0) - (k >>> 0); };
  const band = (id: string) => Math.floor((ctx.signal(id) ?? -5) / 5);
  // Newest version wins (owner 2026-11-17, the curated lists' rule: "the new version, if it has enough reviews", 10+): no card,
  // strip or alternative is an older year of a model whose newer year has 10+ reports; this year's models come first, older
  // ones only to fill.
  const famNewest = new Map<string, number>();
  for (const x of ctx.data.listed) if (ctx.facts(x.id).reports >= NEWEST_AT) { const k = modelFamily(x); famNewest.set(k, Math.max(famNewest.get(k) ?? 0, x.year)); }
  const superseded = (id: string) => { const x = ctx.data.rackets.find(y => y.id === id); return !!x && x.year < (famNewest.get(modelFamily(x)) ?? x.year); };
  const thisYear = Number(isoDaysAgo(0).slice(0, 4));
  const current = (id: string) => Number((ctx.data.rackets.find(y => y.id === id)?.year ?? 0) >= thisYear);
  // Quality floor (owner 2026-11-17): a suggestion needs a real Player score of at least min(this one's score − 10, 80); a
  // product without a score yet asks 75. Fewer cards (or none) rather than weak ones.
  const realScore = (id: string) => scoreState(score(ctx.data, id).judged) === "new" ? null : ctx.signal(id);
  const scoreFloor = suggestionFloor(realScore(props.racketId));
  const goodEnough = (id: string) => (realScore(id) ?? -1) >= scoreFloor;
  const simPool: string[] = (() => {
    // No picks (audit 2026-11-15, #7): really similar rackets, not the home's top 4 on every page. Same shape, same style lean
    // and a level in common, one row per model (the year that takes the family's row), described most like this one by
    // players; the best Player scores fill in when too few are close.
    const me = ctx.data.rackets.find(r => r.id === props.racketId)!, myShape = ctx.fineOf(me.id)?.shape ?? null, myLean = styleOf(facts);
    const levelsOf = (id: string) => { const su = ctx.facts(id).suits; return su ? LEVELS.filter(l => su[l] >= SUITS_OK) : []; };
    const myLevels = levelsOf(me.id);
    const reportsOf = (id: string) => ctx.facts(id).reports;
    // A type-picker site (DiscGolfRecs) keeps to the disc's own type (putter, mid …); padel and pickleball items have none.
    const kindOf = (id: string) => payload.items.find(x => x.id === id)?.kind, myKind = kindOf(me.id);
    const base = ctx.data.listed.filter(x => modelFamily(x) !== modelFamily(me) && reportsOf(x.id) >= MIN_FIT_REPORTS && (!myKind || kindOf(x.id) === myKind)
      && !superseded(x.id) && goodEnough(x.id) && (!myShape || ctx.fineOf(x.id)?.shape === myShape));
    const sameLean = (x: (typeof base)[number]) => !myLean || styleOf(ctx.facts(x.id)) === myLean;
    const sameLevel = (x: (typeof base)[number]) => !myLevels.length || levelsOf(x.id).some(l => myLevels.includes(l));
    // Strictest first; with fewer than 4, the level and then the style lean are let go (the shape always holds).
    const pool = [base.filter(x => sameLean(x) && sameLevel(x)), base.filter(sameLean), base].find(p => p.length >= 4) ?? base;
    const close = similarProducts(me, pool, tagProfiles([...ctx.data.reviews, ...ctx.data.external]), 4);
    const fill = [...pool].sort((a, b) => band(b.id) - band(a.id) || spread(a.id, b.id)).filter(x => !close.includes(x));
    return [...close, ...fill].sort((a, b) => current(b.id) - current(a.id)).slice(0, 10).map(x => x.id);
  })();
  const similarIds = simPool.slice(0, 4);
  // Past the similar pool, well-reviewed rackets of the same shape, then any, so every card can bring its own gain.
  const meR = ctx.data.rackets.find(r => r.id === props.racketId)!, meShape = ctx.fineOf(meR.id)?.shape ?? null;
  const lvOf = (id: string) => { const su = ctx.facts(id).suits; return su ? LEVELS.filter(l => su[l] >= SUITS_OK) : []; };
  const myLv = lvOf(props.racketId), sharesLevel = (id: string) => !myLv.length || lvOf(id).some(l => myLv.includes(l));
  const widePool = [...simPool, ...ctx.data.listed.filter(x => modelFamily(x) !== modelFamily(meR) && ctx.facts(x.id).reports >= 10 && !simPool.includes(x.id)
    && !superseded(x.id) && goodEnough(x.id))
    // No cap (owner 2026-11-18: one lone card on pages where the first 30 had no honest pair of lines): the cards stop at the first
    // that pass, so the rest is only read when needed. Same shape first, then a shared level, then the rest by score.
    .sort((a, b) => current(b.id) - current(a.id) || Number(ctx.fineOf(b.id)?.shape === meShape) - Number(ctx.fineOf(a.id)?.shape === meShape)
      || Number(sharesLevel(b.id)) - Number(sharesLevel(a.id)) || band(b.id) - band(a.id) || spread(a.id, b.id)).map(x => x.id)];
  const racketOf = (id: string) => ctx.data.rackets.find(r => r.id === id)!;
  const brand = (id: string) => ctx.data.brands.find(b => b.id === id)?.name;
  const photoOf = (r: ReturnType<typeof racketOf>) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  // The cards the alternatives use: similar rackets (no picks) here; with picks, the home's cards (lib/home-rank.ts rows).
  const d = qt?.catch.debate;
  const overallScore = ctx.signal(props.racketId), rated0 = score(ctx.data, props.racketId).judged;
  const total = reports.length;
  // "What players said" for each level the visitor can pick, and for none (fit-live.tsx FitSaid shows the one that applies).
  const saidFor = (lv: (typeof LEVELS)[number] | null): SaidView => {
  // "What players at your level said" once 5+ reports at the picked level state it; else everyone (owner 2026-11-15).
  const atLevel = lv ? reports.filter(r => levelOf(r) === lv) : [];
  const levelView = atLevel.length >= LEVEL_SAID_MIN;
  const said = levelView ? atLevel : reports;
  const count = (k: string) => said.filter(r => r.sentiment === k).length;
  const [pos, mix, neg] = [count("positive"), count("mixed"), count("negative")];
  // The badge in "What players said" (owner 2026-11-15): the Player score, not a %. At a level (5+ level-tagged reports), the
  // same formula (lib/signal.ts) run on only those reports against the rest of the catalog; else the overall score.
  const levelScore = levelView ? signals(ctx.data.listed.map(r => { const sc = score(ctx.data, r.id);
    return r.id === props.racketId ? { id: r.id, category: signalCategory(r), positive: pos, mixed: mix, judged: pos + mix + neg }
      : { id: r.id, category: signalCategory(r), positive: sc.positive, mixed: sc.mixed, judged: sc.judged, override: r.signalOverride }; })).get(props.racketId)?.signal ?? null : null;
  const badge = levelScore !== null ? { n: levelScore, label: `${ownScore("Player score")} · ${lv === "advanced" ? "advanced players" : `${lv}s`}` } : overallScore !== null && scoreState(rated0) !== "new" ? { n: overallScore, label: "Player score" } : null;
  // At the visitor's level: one real quote each way from players at that level (their own words, English, card length).
  // English only: some stored excerpts have no language set, so common Spanish/Italian/French words rule a text out too.
    const english = (t?: string | null) => !!t && /^[\x00-\x7F’‘“”–—…é]+$/.test(t) && t.length >= 40 && t.length <= 240 && !/\b(pero|que|muy|una?|poco|tengo|est[aá]|para|con|del|los|las|molto|della|questa|perch[eé]|tr[eè]s|avec|mais|pour)\b/i.test(t);
  const levelTake = (ok: boolean) => {
    const fits = (x: QtReport) => ok ? x.sentiment === "positive" : x.sentiment === "negative" || x.sentiment === "mixed";
    const own = reviews.find(x => atLevel.some(a => a.id === x.id && fits(a)) && english(x.reviewText));
    if (own) return { id: own.id, text: own.reviewText, verbatim: true, ok };
    const web = atLevel.filter(fits).map(a => ({ a, w: webLevels.get(a.id) })).find(({ w }) => w?.english && english(w.excerpt));
    return web ? { id: web.a.id, text: unmd(web.w!.excerpt!), verbatim: true, ok } : null;
  };
  const levelTakes = levelView ? [levelTake(true), levelTake(false)].filter((x): x is NonNullable<typeof x> => !!x) : [];
  // Quotes (owner 2026-11-15): our own players' words first, then YouTube's, then the quick-take's picks; verbatim only.
  const pool = levelView ? atLevel : reports, inPool = new Set(pool.map(r => r.id));
  const ownQuote = (want: string[]) => reviews.find(x => inPool.has(x.id) && want.includes(ratingVerdictOf(x.rating)) && english(x.reviewText));
  const ytQuote = (want: string[]) => ctx.data.external.find(e => e.racketId === props.racketId && inPool.has(e.id) && e.sourcePlatform === "YouTube" && e.sentiment && want.includes(e.sentiment) && !e.sourceLanguage && english(e.excerpt));
  const quoteOf = (want: string[]) => { const o = ownQuote(want); if (o) return { id: o.id, text: o.reviewText, verbatim: true, tone: ratingVerdictOf(o.rating) };
    const y = ytQuote(want); return y ? { id: y.id, text: unmd(y.excerpt!), verbatim: true, tone: y.sentiment! } : null; };
  const toneOf = (ok: boolean) => ok ? "positive" : "negative";
  const preferred = [quoteOf(["positive"]), quoteOf(["negative", "mixed"])];
  const fallback = (levelTakes.length ? levelTakes : d ? [{ ...d.for, ok: true }, { ...d.against, ok: false }] : props.quotes ?? []).map(t => ({ id: t.id, text: unmd(t.text), verbatim: t.verbatim, tone: byId.get(t.id)?.sentiment ?? toneOf(t.ok) }));
  const takes = [preferred[0] ?? fallback.find(t => t.tone === "positive"), preferred[1] ?? fallback.find(t => t.tone !== "positive")].filter((x): x is NonNullable<typeof x> => !!x);
    const levelWord = lv === "advanced" ? "advanced players" : `${lv}s`;
    const peerSub = levelView ? `${said.length} of ${total} reviews · from players at your level` : `${total} ${total === 1 ? "review" : "reviews"} · forums, YouTube & ${props.site.toLowerCase()}`;
    return { title: levelView ? `What ${levelWord} said` : "What players said", sub: peerSub, badge, pos, mix, neg, takes: takes.map(t => ({ id: t.id, text: t.text, verbatim: !!t.verbatim, tone: t.tone, who: who(t.id) })) };
  };
  const saidViews: Record<string, SaidView> = { none: saidFor(null), ...Object.fromEntries(LEVELS.map(l => [l, saidFor(l)])) };
  // The Reviews section's cards (RACKET-REVIEWS-SECTION.md): our own reviews and stored reports, newest first. YouTube
  // reports get the video card; everything else is a player card. Real data only: no author handles are stored, so web
  // reports say "A player" and link their source; a verdict pill only where the sentiment was judged.
  const lv = (v?: string | null) => v ? (v === "Competitive" ? "competitive" : v.toLowerCase()) : null;
  // v11c: a card's second line is the writer's own level · court side, only what they gave us (never inferred).
  const sideWord = (v?: string | null) => !v ? null : /^both$/i.test(v) ? "both sides" : `${v.toLowerCase()} side`;
  const givenMeta = (r: QtReview) => [lv(r.playerLevel), V11 ? sideWord(r.playingSide) : null].filter(Boolean).join(" · ") || null;
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  // How many products each YouTube video is filed under (a video about one racket alone, or a comparison / round-up).
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of ctx.data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const blogCards = () => {
    const shortEnglish = (t?: string | null) => !!t && t.length >= 30 && t.length <= 320 && /^[\x00-\x7F’‘“”–—…é]+$/.test(t);
    // A blog is a website: chat channels and social groups filed as blogs (Padelzoom on Telegram, Facebook groups) stay out like
    // forums. One card per site (its host), so a blog stored under two names shows once.
    const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
    const SOCIAL = /(^|\.)(t\.me|telegram\.org|facebook\.com|instagram\.com|x\.com|twitter\.com|reddit\.com|tiktok\.com|discord\.(gg|com))$/;
    const rows = ctx.data.external.filter(e => e.racketId === props.racketId && e.sourcePlatform === "Blog" && !SOCIAL.test(host(e.sourceUrl))).map(e => {
      const english = !e.sourceLanguage || e.sourceLanguage === "en";
      const text = e.summary ? unmd(PADEL ? padelWords(plainSummary(e.summary)) : plainSummary(e.summary)) : english && shortEnglish(e.excerpt) && isComplete(unmd(e.excerpt!)) ? unmd(e.excerpt!) : "";
      return { e, text, verbatim: !e.summary };
    }).filter(x => x.text).sort((a, b) => (b.e.sourceDate ?? "").localeCompare(a.e.sourceDate ?? ""));
    const seen = new Set<string>();
    return rows.filter(({ e }) => { const k = host(e.sourceUrl) || e.sourceName.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .map(({ e, text, verbatim }) => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "blog" as const, who: e.sourceName, verdict: e.sentiment ?? null, when: ago(e.sourceDate),
        url: e.sourceUrl, tags: e.tags ?? [], text, verbatim } satisfies ReviewCard }));
  };
  const redditCards = () => {
    // 60+ characters (owner 2026-11-18): a one-liner like "Been maining it for 6 months" says nothing; the next comment fills the slot.
    // Whole comments only (owner 2026-11-18): a stored excerpt cut mid-sentence is skipped and the next pick fills the slot.
    const ok = (t?: string | null) => !!t && t.length >= 60 && t.length <= 300 && /^[\x00-\x7F’‘“”–—…é]+$/.test(t) && isComplete(unmd(t));
    const rows = ctx.data.external.filter(e => e.racketId === props.racketId && e.sourcePlatform === "Reddit" && !e.adminEditedAt
      && (!e.sourceLanguage || e.sourceLanguage === "en") && ok(e.excerpt)).sort((a, b) => (b.sourceDate ?? "").localeCompare(a.sourceDate ?? ""));
    // Variety first (the newest loved, mixed and nope comment where there is one), then the newest of the rest; at most 5.
    const pick = (["positive", "mixed", "negative"] as const).flatMap(v => rows.filter(e => e.sentiment === v).slice(0, 1));
    for (const e of rows) { if (pick.length >= 5) break; if (!pick.includes(e)) pick.push(e); }
    const sub = (url: string, name: string) => url.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? name;
    return pick.slice(0, 5).map(e => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "reddit" as const, who: "Reddit user", source: sub(e.sourceUrl, e.sourceName),
      verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl, tags: e.tags ?? [], text: unmd(e.excerpt!), verbatim: true } satisfies ReviewCard }));
  };
  const dated: { at: string; card: ReviewCard }[] = [
    ...reviews.map(r => ({ at: r.createdAt, card: { id: r.id, kind: "player" as const, who: r.alias || `A ${props.site} player`, meta: givenMeta(r), played: V11 ? r.timeWithRacket ?? null : null, tags: r.tags, verdict: ratingVerdictOf(r.rating), when: ago(r.createdAt), text: unmd(r.reviewText), verbatim: false } })),
    // Owner 2026-11-15: the Reviews section lists our own reviews and the YouTube summaries only, no forum (Reddit) or blog reports.
    // One card per channel (lib/youtube-pick.ts): its video about this racket alone where there is one; every row still counts.
    ...onePerChannel(ctx.data.external.filter(e => e.racketId === props.racketId && e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => {
      const english = !e.sourceLanguage || e.sourceLanguage === "en";
      // Our own summaries speak padel ("sweet spot"); a player's verbatim words stay as they wrote them.
      const text = unmd(e.summary ? (PADEL ? padelWords(plainSummary(e.summary)) : plainSummary(e.summary)) : (!english && e.excerptTranslation) || e.excerpt || "");
      const verbatim = !e.summary && english && !!e.excerpt;
      const base = { id: e.id, verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl, tags: e.tags ?? [] };
      const card: ReviewCard = e.sourcePlatform === "YouTube"
        ? { ...base, kind: "youtube", who: e.sourceName, video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? (V11 ? sentences(text) : sentences(text).slice(0, 4)) : [text] }
        : { ...base, kind: "player", who: "A player", initial: (e.sourceName.replace(/^r\//, "")[0] ?? "P").toUpperCase(), meta: V11 ? null : lv(webLevels.get(e.id)?.level), source: e.sourceName, text, verbatim };
      return { at: e.sourceDate ?? "", card };
    }).filter(x => x.card.kind === "youtube" ? !!x.card.points?.[0] : !!x.card.text),
    // Blogs (owner 2026-11-18, reversing part of the 11-15 rule): v11c lists blog reviews too (platform Blog, websites only;
    // "Other", Telegram and Facebook sources stay out, like forums), one card per blog, its newest
    // row that has our summary or a short English excerpt (quoted, verbatim). Forum reports still count in the score only.
    ...(V11 ? blogCards() : []),
    // Reddit (owner 2026-11-18): up to 5 comments, the commenter's exact words only (English, short, never edited by us).
    ...(V11 ? redditCards() : []),
  ];
  const cards = dated.sort((a, b) => b.at.localeCompare(a.at)).map(x => x.card);

  // The fit card's racket-specific lines (lib/fit-card.ts, owner 2026-11-15): only this racket's entry goes to the browser,
  // with names and links for the rackets its catches point to. None yet: FitBox keeps the fit check's own reasons.
  // The fit card's lines: the racket's own fit-card entry, else its page items (the same evidence, already counted), so a
  // racket with page content never falls back to the generic reasons (owner 2026-11-16: one story across the page).
  // One story (owner 2026-11-17): on padel a content line its own trait bars contradict is left out (the trait data wins), and
  // "hitting zone" reads "sweet spot". A tagline that loses gives way to the quick take's hook.
  const dotsNow = Object.fromEntries(["forgiveness", "power", "control", "arm"].map(k => [k, tr.scores?.[k as Trait]?.dots ?? 0]));
  const clean = (c: ReturnType<typeof pageContent>) => !c || !PADEL ? c : { ...c,
    tagline: contradicts(c.tagline, dotsNow) ? (qt ? `${qt.hook.good} ${qt.hook.catch}` : c.tagline) : padelWords(c.tagline), bottom: padelWords(c.bottom),
    yes: c.yes.filter(i => !contradicts(`${i.title}. ${i.t}`, dotsNow)).map(i => ({ ...i, title: padelWords(i.title), t: padelWords(i.t) })),
    no: c.no.filter(i => !contradicts(`${i.title}. ${i.t}`, dotsNow)).map(i => ({ ...i, title: padelWords(i.title), t: padelWords(i.t) })) };
  const pageForCard = clean(pageContent(props.slug));
  const cardData0 = cardContent(props.slug) ?? (pageForCard ? cardFromPage(pageForCard) : null);
  // A "try X instead" link holds only when X's own bar beats this one on the trait the line names, and X isn't held back for the
  // address's level or sore arm (Grok pickleball audit 2026-11-17, #14: "hits much harder" at the same Power 3/5). Padel keeps
  // its own page's rules.
  const altOk = (alt: { slug: string; t: string }) => {
    if (PADEL) return true;
    const r = ctx.data.rackets.find(x => x.slug === alt.slug); if (!r) return false;
    const k = ALT_TRAITS.find(([, re]) => re.test(alt.t))?.[0], mine = tr.scores?.[k as Trait]?.dots, theirs = ctx.traits(r.id).scores?.[k as Trait]?.dots;
    if (k && mine !== undefined && theirs !== undefined && theirs <= mine) return false;
    const f = ctx.facts(r.id), lv = props.choice.level;
    if (lv === "beginner" && f.hard?.beginner) return false;
    if (props.choice.arm && f.hard?.arm) return false;
    return !(lv && f.suits && f.suits[lv] < SUITS_OK);
  };
  const cardData = cardData0 && { ...cardData0, catches: cardData0.catches.map(c => c.alt && !altOk(c.alt) ? { ...c, alt: undefined } : c) };
  const card = cardData ? { ...cardData, links: Object.fromEntries(cardData.catches.flatMap(c => c.alt ? [c.alt.slug] : []).flatMap(slug => {
    const r = ctx.data.rackets.find(x => x.slug === slug); return r ? [[slug, { href: productHref(r), name: displayName(r.name, brand(r.brandId)) }]] : []; })) } : null;
  // The page's own words (lib/racket-page.ts): tagline, bottom line, Why yes / Why not. Rackets without them keep the hook.
  const page = pageForCard, tier = pageTier(page);
  // The site-voice tagline (owner 2026-11-18, lib/voice-taglines.ts) leads, unless padel's trait bars contradict it (one story).
  const voiced = voiceTagline(props.slug), voiceOk = voiced && !(PADEL && contradicts(voiced, dotsNow)) ? voiced : null;
  const tagline = voiceOk ?? (page ? page.tagline : qt ? `${qt.hook.good} ${qt.hook.catch}` : props.line ?? null);
  // The compare tabs: six trait dots per racket (lib/trait-score.ts), this one and every racket an alternative can be.
  const dotsOf = (rid: string) => { const sc = ctx.traits(rid).scores; return TRAITS.map(t => sc?.[t as Trait]?.dots ?? 0); };
  const shortOf = (r: ReturnType<typeof racketOf>) => withoutYear(displayName(r.name, brand(r.brandId)));
  const cardOf = (rid: string): CompareCard => { const r = racketOf(rid); return { name: displayName(r.name, brand(r.brandId)), short: shortOf(r), href: productHref(r), pic: photoOf(r), dots: dotsOf(rid), reports: ctx.facts(rid).reports }; };
  const compareMe = cardOf(props.racketId);
  const compareCards: Record<string, CompareCard> = Object.fromEntries([...new Set([...Object.keys(payload.cards), ...similarIds])].filter(cid => ctx.data.rackets.some(r => r.id === cid)).map(cid => [cid, cardOf(cid)]));
  // Every judged report's sentiment: the hero's quiet score line and the Reviews header (no %).
  const mood = { pos: saidViews.none.pos, mix: saidViews.none.mix, neg: saidViews.none.neg }, rated = mood.pos + mood.mix + mood.neg;
  // One count everywhere (v11c): the hero's "N rated it", the fit check's "N player reviews + M YouTube" and the reviews' score
  // row are all the judged reports, YouTube's share named in the fit check.
  const ytRated = reports.filter(r => r.platform === "YouTube" && r.sentiment).length;
  const weekAgo = isoDaysAgo(7);
  const freshN = reviews.filter(x => x.createdAt.slice(0, 10) >= weekAgo).length + reports.filter(x => x.platform === "YouTube" && (x.date ?? "") >= weekAgo).length;
  // "2025 version →" (owner's final mock): the newest older year of the same model, when the catalog lists one.
  const olderRow = ctx.data.listed.filter(x => modelFamily(x) === modelFamily(racketOf(props.racketId)) && x.year < props.year).sort((a, b) => b.year - a.year)[0];
  const older = olderRow ? { year: olderRow.year, href: productHref(olderRow) } : null;
  // "Similar products" at the foot of the page (owner 2026-11-16, app/similar-section.tsx): the similar rackets above as cards,
  // each with the trait it is furthest ahead on, and on DiscGolfRecs a second tab with the discs that complete the bag.
  const simCfg = niche.similar;
  // In the order of the dots (TRAITS: this product type's own bars on a per-type site, every bar elsewhere).
  const dotWords = TRAITS.map(k => SITE_FIT.traits.find(t => t.key === k)!).map(t => t.diff ?? `more ${t.label.toLowerCase()}`);
  const kindOfId = (id: string) => payload.items.find(x => x.id === id)?.kind;
  const quickTypes = QUICK?.quick?.types ?? [];
  const typeOf = (kind: string | undefined) => quickTypes.find(t => t.key === kind);
  const tagOf = (id: string) => { const c = payload.cards[id]; return c?.flight ? c.flight.join(" ") : c?.shape ?? racketOf(id).shape?.toLowerCase() ?? niche.words.one; };
  // One line per card: the racket's own tagline (lib/racket-page.ts, expert voice), else its home line or short line.
  const lineOf = (id: string) => [voiceTagline(racketOf(id).slug), pageContent(racketOf(id).slug)?.tagline, payload.cards[id]?.line, shortLine(racketOf(id)), listLine(racketOf(id))]
    .map(expertLine).find((t): t is string => !!t) ?? null;
  // A gain on a disc card must hold in its flight numbers (site audit 2026-11-17 #8, #14): "better in wind" only with more fade or
  // less turn than this disc; "easier for a slower arm" never from a disc its page or its numbers warn slower arms off.
  const flightOfId = (id: string) => flightOf(racketOf(id).weight);
  const gainOk = !QUICK ? undefined : (oid: string, key: string) => { const a = flightOfId(oid), m = flightOfId(props.racketId), f = ctx.facts(oid);
    // Flight as [speed, glide, turn, fade].
    if (key === "wind") return !!a && !!m && a[2] + a[3] > m[2] + m[3]; // more stable overall: more fade or less turn
    if (key === "arm") return !f.hard?.arm && !f.warn?.arm && (!a || a[3] < 3);
    return true; };
  const byBand = (ids: string[]) => [...ids].sort((a, b) => current(b) - current(a) || band(b) - band(a));
  const byScore = (ids: string[]) => [...ids].sort((a, b) => (ctx.signal(b) ?? -1) - (ctx.signal(a) ?? -1));
  const simItem = (id: string, i: number, why: string | null): SimilarItem => ({ id, name: cardOf(id).name, href: cardOf(id).href, tag: tagOf(id), photo: payload.cards[id]?.pic ?? productPhoto(racketOf(id))?.src ?? null, tint: tint(i), why, line: lineOf(id), score: ctx.signal(id) });
  const myKindType = typeOf(kindOfId(props.racketId));
  const groupWord = myKindType ? myKindType.many.toLowerCase() : `${leanWord ? `${leanWord} ` : ""}${niche.words.many}`;
  const listFor = (word: string | undefined) => withModelYears(niche.topLists ?? []).find(l => word && l.slug.includes(word)) ?? withModelYears(niche.topLists ?? [])[0];
  const simList = listFor(myKindType?.key ?? (lean && lean !== "balance" ? lean : undefined));
  const simTabs: SimilarTab[] = simCfg ? [{ key: "sim", label: `similar ${groupWord}`, sub: `other ${groupWord} ${niche.people.many} compare it with`, subPicked: `other ${groupWord}, sorted by your match`,
    // Each card's word is its own main gain over this one, never the same twice (owner 2026-11-17); "similar feel" only when no
    // card in the pool beats it anywhere.
    items: (() => { const edges = distinctEdges(compareMe.dots, [...byBand(simPool), ...widePool.slice(simPool.length)].map(id => ({ id, dots: cardOf(id).dots })), TRAITS, 4, "arm", gainOk);
      return edges.length ? edges.map((e, i) => simItem(e.id, i, dotWords[e.gain])) : byScore(similarIds).map((id, i) => simItem(id, i, aheadWord(compareMe.dots, cardOf(id).dots, dotWords))); })(),
    more: simList ? { href: listHref(simList.slug), label: `all ${groupWord}, ranked →` } : null }] : [];
  if (simCfg?.pairs === "bag") {
    const levelsOf = (id: string) => { const su = ctx.facts(id).suits; return su ? LEVELS.filter(l => su[l] >= SUITS_OK) : []; };
    const mine = levelsOf(props.racketId);
    const discs: Disc[] = payload.items.filter(x => x.kind && payload.cards[x.id] && x.facts.reports >= MIN_FIT_REPORTS).map(x => ({ id: x.id, kind: x.kind!, flight: flightOf(payload.cards[x.id].flight),
      signal: x.signal, levelOk: !mine.length || levelsOf(x.id).some(l => mine.includes(l)) }));
    const me = discs.find(d => d.id === props.racketId);
    const bag = me ? completeBag(me, discs, k => (typeOf(k)?.shape ?? k).toLowerCase()) : [];
    const beginners = withModelYears(niche.topLists ?? []).find(l => l.slug.includes("beginner"));
    simTabs.push({ key: "pairs", label: simCfg.pairLabel ?? "complete your bag", sub: `what ${niche.people.many} carry next to the ${props.shortName}`,
      items: bag.map((b, i) => ({ ...simItem(b.id, i, b.why), tag: ({ distance: "driver", midrange: "mid", fairway: "fairway" } as Record<string, string>)[kindOfId(b.id) ?? ""] ?? kindOfId(b.id) ?? tagOf(b.id) })),
      more: beginners ? { href: listHref(beginners.slug), label: `${beginners.label.toLowerCase()}, ranked →` } : null });
  }

  if (simCfg?.pairs === "works" && props.pairsTab?.items.length) simTabs.push(props.pairsTab);

  // ── Product page v11 (padel) ──────────────────────────────────────────────────────────────────────────────────────────
  const shopOf = (id: string) => payload.cards[id]?.shop ?? null;
  // This racket's shortest name beside another one (#435 rule, lib/compare-names refName): "than the 12K", "than the Adidas".
  const modelOf = (rid: string) => { const x = racketOf(rid), b = brand(x.brandId) ?? ""; return { brand: b, model: shortOf(x).replace(new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "") }; };
  const refOf = (otherId: string) => refName(0, [modelOf(props.racketId), modelOf(otherId)]);
  // The better-matches strip's cards: every racket the strip can show for any pick (the alternatives for each style × level ×
  // sore arm), so a pick in the browser never waits for more data.
  // "More X than the Y" holds only on a dot gap from enough reports with no spec against it (owner 2026-11-18,
  // lib/claim-guard.ts), plus the disc golf flight check; the same answer goes to the browser per pool racket.
  const specOf = (rid: string) => { const x = racketOf(rid); return { shape: x.shape, core: x.core, surface: x.surface, balance: x.balance, weight: x.weight, flight: QUICK ? flightOfId(rid) : null }; };
  // Disc golf (owner 2026-11-18): a 1+ point flight gap stands in for the dots on distance, arm, glide and wind (capped at 2 so it
  // doesn't always win the card), and the line carries the numbers.
  // …and on every site a clear spec gap does the same (owner 2026-11-18): weight, balance, shape, core and face, head size,
  // stiffness, torque (lib/claim-guard.ts specFact).
  const flightOn = (oid: string, i: number) => { const f = factFor(niche.id, TRAITS[i], specOf(oid), specOf(props.racketId)); return f && Math.abs(f.gap) >= 1 ? f : null; };
  const gapOf = (oid: string, i: number) => { const f = flightOn(oid, i); return f ? Math.max(-2, Math.min(2, f.gap)) : undefined; };
  const noteOf = (oid: string, i: number) => { const f = flightOn(oid, i); return f ? ` (${f.note()})` : ""; };
  const allow = (oid: string, i: number, dir: 1 | -1) => { const k = TRAITS[i];
    if (dir > 0 && gainOk && !gainOk(oid, k)) return false;
    return claimBlock(niche.id, k, dir, { spec: specOf(oid), tr: ctx.traits(oid).scores?.[k as Trait] }, { spec: specOf(props.racketId), tr: tr.scores?.[k as Trait] }) === null; };
  const okOf = (oid: string) => ({ gain: TRAITS.flatMap((_, i) => allow(oid, i, 1) ? [i] : []), give: TRAITS.flatMap((_, i) => allow(oid, i, -1) ? [i] : []),
    gap: Object.fromEntries(TRAITS.flatMap((_, i) => { const g = gapOf(oid, i); return g === undefined ? [] : [[i, g]]; })),
    note: Object.fromEntries(TRAITS.flatMap((_, i) => { const n = noteOf(oid, i); return n ? [[i, n]] : []; })) });
  const v11Strip: V11Pool = {};
  if (V11) for (const style of STYLES) for (const level of [undefined, ...LEVELS]) for (const arm of [false, true]) {
    for (const a of alternatives(payload.items, RANK_SETUP, NEGATIVE_TAGS, { style, ...(level ? { level } : {}), arm }, props.racketId, 8)) {
      if (v11Strip[a.id] || !ctx.data.rackets.some(x => x.id === a.id) || superseded(a.id) || !goodEnough(a.id)) continue;
      const c = cardOf(a.id), bf = bestFor(ctx.facts(a.id));
      v11Strip[a.id] = { name: c.name, href: c.href, pic: c.pic, line: lineOf(a.id), shop: shopOf(a.id), score: ctx.signal(a.id), best: bf.length ? bf.join(", ") : null, dots: c.dots, ref: refOf(a.id), ok: okOf(a.id) };
    }
  }
  const DOT_KEYS = TRAITS, TRAIT_DEF = Object.fromEntries(SITE_FIT.traits.map(t => [t.key, t]));
  // Each card leads with its own main gain and at most one give-up, none repeated in the section (lib/other-picks.ts).
  // Only rackets we can write both lines for (owner 2026-11-18: no blank cards); the next candidate takes a blocked one's place.
  const v11Cards: V11Card[] = V11 ? distinctEdges(compareMe.dots, [...byBand(simPool), ...widePool.slice(simPool.length)].map(id => ({ id, dots: cardOf(id).dots })), DOT_KEYS, 3, "arm", gainOk, allow, true, gapOf, (g, v) => sameFlightFact(niche.id, DOT_KEYS[g], DOT_KEYS[v])).map(({ id: oid, gain, give }) => {
    const c = cardOf(oid), t = TRAIT_DEF[DOT_KEYS[gain]] ?? null, d = give !== null ? DOT_KEYS[give] : null;
    const bf = bestFor(ctx.facts(oid));
    const me = refOf(oid);
    return { id: oid, name: c.name, href: c.href, pic: c.pic, line: lineOf(oid), best: bf.length ? bf.join(", ") : null, score: ctx.signal(oid), shop: shopOf(oid), ref: me,
      vs: t ? (t.diff ?? `more ${t.label.toLowerCase()}`) : null, pick: t ? `Pick it if you ${t.ifYou ?? `want more ${t.label.toLowerCase()}`}.` : null,
      gain: t ? `${(t.diff ?? `more ${t.label.toLowerCase()}`).replace(/^./, x => x.toUpperCase())} than the ${me}${noteOf(oid, gain)}.` : null,
      give: d ? `${(GIVE_UP[d] ?? `less ${TRAIT_DEF[d]?.label.toLowerCase()}`).replace(/^./, x => x.toUpperCase())} than the ${me}${noteOf(oid, give!)}.` : null };
  }) : [];
  // "How it plays": three bands from the trait dots and their notes; the strongest is marked. A rule of thumb only from a tip
  // with 2+ players behind it.
  const bandRows = V11_BANDS_OF(props.shape).map(([k, label]) => { const i = TRAITS.indexOf(k), row = traits[i]; const sc = tr.scores?.[k as Trait];
    // A strong bar beside a Why not that says the opposite ("Easy power" over "little free power") reads the nuance instead.
    const nuance = (sc?.dots ?? 0) >= 4 && (page?.no ?? []).some(n => claims(`${n.title}. ${n.t}`).some(c => c.trait === k && c.dir < 0)) ? (PADEL ? BAR_NUANCE[k] : null) : null;
    return { k, label, dots: sc?.dots ?? 0, note: nuance ?? (row ? row[1].replace(/==/g, "") : null) }; }).filter(b => b.dots > 0);
  const topDots = Math.max(0, ...bandRows.map(b => b.dots));
  const tip = qt?.tips.find(t => t.reports.length >= 2);
  // Advice only (owner rule: no "N players said" inside advice): the tip's sentences that don't count people, ≤ 105 characters.
  const tipText = tip ? plain(tip.text).split(/(?<=[.!?])\s+/).filter(x => !/\b(players?|reviewers?|people|testers?)\b/i.test(x)).join(" ").trim() : "";
  const builds = V11_SITE ? V11_SITE.builds(racketOf(props.racketId), tr.scores?.arm?.dots, { pop: tr.scores?.["pop" as Trait]?.dots, power: tr.scores?.power?.dots }) : [];
  // The thin-spot note was written about the quick take's own compare cards; v11 shows other cards (audit 2026-11-17, #13:
  // "the ST4 card rests on few players" with no ST4 card on the page). A note about cards that aren't shown is left out.
  const cardWords = (qt?.compare?.cards ?? []).filter(c => !v11Cards.some(v => v.href.split(/[?#]/)[0].endsWith(`/${c.slug}`)))
    .flatMap(c => c.name.split(/\s+/).filter(w => w.length >= 3 && /\d|[A-Z]{2}/.test(w)));
  const staleThin = !!qt && V11 && (/\b(cards?|comparison)\b/i.test(qt.thinSpot) || cardWords.some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(qt.thinSpot)));
  // v11c (owner 2026-11-17): How it plays is one slim box (bars, build chips, rule of thumb); no forum quotes block and no FAQ.
  // "Explore the rankings" (v11c): up to 6 lists, each with its top three photos.
  const tiles = V11 ? (await rankedLists()).lists.filter((l, i, a) => l.entries.length > 0 && a.findIndex(x => x.list.slug === l.list.slug) === i).slice(0, 6).map(l => ({
    href: listHref(l.list.slug), title: l.list.maxAgeYears === 0 && !l.list.trait ? `Best of ${listYear(l.list)}` : l.list.label.replace(/\{year\}/, String(listYear(l.list))),
    sub: `${l.entries.length} ${niche.words.many}`, pics: l.entries.slice(0, 3).map(e => { const x = ctx.data.rackets.find(y => y.id === e.product.id); return x ? photoOf(x) : null; }) })) : [];
  // A site with its own words (SimRacingRecs) says "Other gear to consider" (its catalogue word), not "Other products".
  const edgeWords = { me: compareMe.dots, keys: TRAITS, words: SITE_FIT.words ? { ...niche.words, many: v2copy.catalogNav ?? niche.words.many } : niche.words, scoreWord: SCORE_CAP,
    gainWord: TRAITS.map(k => TRAIT_DEF[k]?.diff ?? `more ${TRAIT_DEF[k]?.label.toLowerCase()}`), giveWord: TRAITS.map(k => GIVE_UP[k] ?? `less ${TRAIT_DEF[k]?.label.toLowerCase()}`) };
  // "Works with" (SimRacingRecs, owner 2026-11-18): only the makers' compatibility pairs, listed and still sold products,
  // grouped by type, the best-liked first, four a group at most.
  const WORKS_LABEL: Record<string, string> = { Wheelbase: "Wheelbases", Wheel: "Wheels & rims", Pedals: "Pedals", "Shifter / handbrake": "Shifters & handbrakes" };
  const worksGroups: WorksGroup[] = niche.id !== "simracing" ? [] : (() => {
    const mine = (simPairs as Record<string, { name: string; shape: string; note?: string }[]>)[racketOf(props.racketId).name] ?? [];
    const listed = mine.flatMap(p => { const x = ctx.data.listed.find(y => y.name === p.name); return x && !/^Discontinued\b/i.test(x.surface ?? "") ? [{ p, x }] : []; });
    return Object.keys(WORKS_LABEL).flatMap(shape => {
      const all = listed.filter(({ p }) => p.shape === shape).sort((a, b) => (ctx.signal(b.x.id) ?? -1) - (ctx.signal(a.x.id) ?? -1));
      if (!all.length) return [];
      return [{ label: WORKS_LABEL[shape], more: Math.max(0, all.length - 4), items: all.slice(0, 4).map(({ p, x }) => ({ name: displayName(x.name, brand(x.brandId)), href: productHref(x), pic: photoOf(x), score: ctx.signal(x.id), ...(p.note ? { note: p.note } : {}) })) }];
    });
  })();
  // How it plays keeps its compact bars; the build is back as full explained cards below it (owner 2026-11-18).
  const v11Body = V11 ? <>
    <V11Plays bands={bandRows} top={topDots} {...(SITE_FIT.words ? { title: `How it ${SITE_FIT.words.howIt}` } : {})} tip={tipText}/>
    <V11BuildCards head={V11_SITE!.buildHead(props.shortName)} cards={builds} ring={niche.id === "discgolf"}/>
  </> : null;

  return <><FitPicks first={{ choice, picked }} href={props.href} seed={picked ? rankSeed(payload.items, choice, facts, props.racketId) : null}><main className={`rf ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-wrap">
      <FitBack all={{ href: catalogPath, label: `← all ${niche.words.many}` }}/>
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{props.photo ? <img src={props.photo} alt={props.name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span className="rf-tile">{props.shortName}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[soon ? "not shipping yet" : gone ? "discontinued" : null, leanWord, props.shape, hasYears && !V11 ? String(props.year) : null].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}
              {older && <a className="rp-older" href={older.href}>{`${older.year} version →`}</a>}</div>
            {/* H1 "<name> review" for search (owner spec); the year is in the chips. */}
            <h1>{V11 ? (hasYears ? `${props.shortName} (${props.year})` : props.shortName) : `${props.shortName} review`}</h1>
            {tagline && <p className="rf-hook">{tagline}</p>}
            {/* Owner 2026-11-18: people who came for opinions skip straight down (the score box links there too). */}
            {V11 && cards.length > 0 && <a className="v11-jump" href="#reviews">{`Jump to reviews (${cards.length}) ↓`}</a>}
            {/* The Player score as a quiet line with its bar (owner's final mock), then Check price. */}
            {!V11 && (page?.source === "research" ? <p className="rp-score">{RESEARCH_LINE}</p> :
            <a className="rp-score" href="#reviews" title={`${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}: not a % of happy players. It blends how much players like it with how many have weighed in.`}>
              {scoreState(rated) === "new" ? <NewPill n={rated}/> : <span>{overallScore !== null && <b>{overallScore}</b>}{`${overallScore !== null ? ` ${SCORE_WORD} · ` : ""}${rated} rated`}</span>}
              {rated > 0 && <span className="rf-sbar" aria-hidden="true"><i className="p" style={{ flex: mood.pos }}/><i className="m" style={{ flex: mood.mix }}/><i className="n" style={{ flex: mood.neg }}/></span>}</a>)}
            {!V11 && buy && <div className="rf-meta"><a className="rf-btn" href={buy.url} target="_blank" rel={buy.rel}>{buy.label} ↗</a></div>}
            {!V11 && buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
          {V11 && <div className="v11-score">
              {page?.source === "research" ? <span className="v11-sres">{RESEARCH_LINE}</span> : <a className="v11-sl" href="#reviews">
                {scoreState(rated) === "new" ? <NewPill n={rated}/> : <b className={`v11-sq ${v11Tone(overallScore)}`}>{overallScore ?? "–"}</b>}
                <span className="v11-sm"><b>{SCORE_CAP}</b>
                  {rated > 0 && <span className="v11-sbar" aria-hidden="true"><i className="p" style={{ flex: mood.pos }}/><i className="m" style={{ flex: mood.mix }}/><i className="n" style={{ flex: mood.neg }}/></span>}
                  <small>{ytRated > 0 ? `${rated} rated it` : `${rated} ${rated === 1 ? RV.one : RV.many} rated it`}</small></span></a>}
              {buy && <a className="v11-buy" href={buy.url} target="_blank" rel={buy.rel}>{buy.label} ↗</a>}
              {/* No "compare with…" here (owner 2026-11-18): it sent people off the page they just landed on. Compare lives in the
                  "Still deciding?" card and on the Other rackets cards. */}
            </div>}
          {V11 && buy && <p className="rf-aff v11-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
        </div>

        <FitBox id={props.racketId} facts={facts} hook={qt ? qt.hook : null} total={total} rated={rated || total} yt={V11 ? ytRated : 0} bestLine={bestLine} levelDisagree={facts.levelDisagree} card={card} yesNo={page ? { yes: page.yes, no: page.no } : null}/>
      </section>
      {V11 && <V11Better id={props.racketId} facts={facts} cards={v11Strip} words={niche.words}/>}

      {/* After the hero, one centred 880px column (owner 2026-11-16: "copy this exactly", the final mock): the bottom line, Why yes /
          why not and How it plays share a group; Reviews and Specs follow. The match box floats once the hero scrolls away. */}
      <section className="rp-body">
        {/* v11c: the bottom line runs the full content width (owner 2026-11-18). Every section above the reviews is the full, centred
            content width again (owner 2026-11-18: the right-rail fit card is gone; desktop has the bottom bar, as phones). */}
        {V11 && page && tier && <p className="rp-bottom"><span className="rp-bl">bottom line</span><b>{page.bottom}</b></p>}
        <div className="rp-main">
          {!V11 && page && tier && <BeforePicks><p className="rp-bottom"><span className="rp-bl">bottom line</span><b>{page.bottom}</b></p></BeforePicks>}
          {page && tier && <div id="yes-no">
            {/* No heading (owner 2026-11-18): the two boxes say Why yes / Why not; the source line sits small, right, above them. */}
            <p className="v11-ysrc">{page.source === "research" ? RESEARCH_LINE.toLowerCase() : tier === "short" ? `based on ${total} reports` : `from ${RV.one} reports & YouTube`}</p>
            <FitYesNo yes={page.yes} no={page.no} tier={tier} research={page.source === "research"} fold={V11}/>
          </div>}

          {V11 && v11Body}
          {!V11 && <div id="compare">
            {/* Under 3 reports there is no verdict word or dots (audit 2026-11-15, #15): every claim needs 3+ players. */}
            <div className="rf-h"><h2>{`How it ${SITE_FIT.words?.howIt ?? "plays"} & compares`}</h2><span>{page?.source === "research" ? `from specs and expert ratings, compared with other ${niche.words.many}` : total < 3 ? `too few reports to rate yet (${total})` : `from ${SITE_FIT.words?.person ?? "player"} reports, compared with other ${niche.words.many}`}</span></div>
            <FitCompare id={props.racketId} me={compareMe} rows={traits.map(([label, note], i) => ({ label, note, ...(PER_TYPE ? { key: TRAITS[i] } : {}) }))} cards={compareCards} similar={similarIds}/>
          </div>}
        </div>

          {V11 && v11Cards.length > 0 && <V11Others id={props.racketId} slug={props.slug} facts={facts} better={v11Strip} cards={v11Cards} pool={v11Strip} {...edgeWords}/>}
          {V11 && worksGroups.length > 0 && <V11Works groups={worksGroups} short={props.shortName}/>}
          <section id="reviews" className="rv">
            {soon && <p className="rv-soon">Not shipping yet: the maker says first units arrive in December 2026, so these are pre-release impressions, not owner reviews.</p>}
            <RacketReviews racketId={props.racketId} name={props.shortName} cards={cards} nicknames={props.nicknames} total={total} v11c={V11 ? { fresh: freshN, thin: rated < 10, tone: Object.fromEntries(niche.tags.map(t => [t.label, t.tone === "pos" ? "pos" : t.tone === "neg" ? "neg" : "neutral"])) } : undefined}
              mood={{ ...mood, score: scoreState(rated) === "new" ? null : overallScore }}{...(QUICK ? { words: { levelLead: "I'm", levels: ["Beginner", "Intermediate", "Advanced"].map(v => ({ value: v, label: SITE_FIT.levelPeople ? SITE_FIT.levelLabels?.[v.toLowerCase() as "beginner"] ?? v.toLowerCase() : v.toLowerCase() })), score: `${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}`, ask: niche.copy.ui.triedIt, people: RV.many, peopleTab: RV.many } } : {})}/>
          </section>

          {/* v11c: the closing card and the rankings, after the reviews. */}
          {/* Not-a-fit state only: the next best fits after the Better matches strip (owner 2026-11-17). */}
          {V11 && <V11More id={props.racketId} slug={props.slug} facts={facts} better={v11Strip} pool={v11Strip} {...edgeWords}/>}
          {V11 && <V11Decide id={props.racketId} facts={facts} name={hasYears ? `${props.shortName} (${props.year})` : props.shortName} pic={props.photo}
            score={scoreState(rated) === "new" ? null : overallScore} line={voiceOk ?? (page ? page.tagline : props.line ?? null)} buy={buy}
            compare={{ href: `${catalogPath}?compare=1`, pick: { id: props.racketId, slug: props.slug, name: props.name, pic: props.photo } }}
            one={niche.words.one} ask={`${ASK_LINK[niche.id] ?? "played it?"} add your review →`}/>}
          {V11 && tiles.length > 0 && <section className="v11-rt" aria-labelledby="v11-rt-t">
            <div className="v11-sh"><h2 id="v11-rt-t">Explore the rankings</h2><Link href="/rankings">all rankings →</Link></div>
            <div className="v11-rtgrid">{tiles.map(t => <Link key={t.href} href={t.href}><span className="t"><b>{t.title}<span aria-hidden="true"> →</span></b><em>{t.sub}</em></span>
              <span className="v11-rtpics" aria-hidden="true">{t.pics.map((p, j) => p && <img key={j} className={`p${j}`} src={p} alt="" loading="lazy" decoding="async"/>)}</span></Link>)}</div>
          </section>}

          {!V11 && props.specs.length > 0 && <details className="rp-specs"><summary><h2>Specs</h2></summary>
            <p className="rf-specs">{props.specs.map(s => { const [k, ...v] = s.split(" "); return <span key={s}><span>{k}</span>{` ${v.join(" ")}`}</span>; })}</p></details>}

          {!V11 && simTabs.length > 0 && <FitSimilar title="Also worth a look" tabs={simTabs} scoreLabel={SCORE_WORD} look={simCfg?.look}/>}
      </section>

      <FitSticky buy={buy} name={props.shortName}/>

      {V11 ? <footer className="rf-foot v11-foot" id="how-we-read"><p>{`Run by ${[v2copy.sport, niche.people.many].filter(Boolean).join(" ")}, not a shop. Built from ${niche.people.one} reviews, forums and YouTube. No brand pays to be here. Spotted a mistake? `}<a href="/contact">Report it →</a></p></footer>
      : <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from YouTube reviews, reviews sent to us and ${v2copy.forum} reports · every source linked · `}
          <details><summary>how we read this</summary><span>{` We sort each report as positive, mixed or negative, count what players say, and give our honest take. Every claim needs 3+ players; quote marks only on their exact words. We don't test ${niche.words.many} and no brand pays for placement. `}{qt && !staleThin && <>Thin spot: <Rich text={qt.thinSpot}/></>}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">{v2copy.madeBy}</p>
      </footer>}
    </div>
  </main></FitPicks><V2Footer/></>;
}
