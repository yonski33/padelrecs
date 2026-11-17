import { productPhoto } from "../../visual";
import type { ReactNode } from "react";
import "./racket-fit.css";
import { spans, chipTone, type Chip, type QuickTake } from "../../../lib/quick-take";
import { type Trait } from "../../../lib/trait-score";
import { SITE_FIT } from "../../../lib/fit-config";
import { bestFor, styleLean, MIN_FIT_REPORTS } from "../../../lib/fit-verdict";
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
import { displayName } from "../../../lib/brand-name";
import { productHref, niche, catalogPath, v2copy, hasYears } from "../../../lib/niche";
import { shopPhoto, photoHidden } from "../../../lib/shop-photos";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { similarProducts, tagProfiles } from "../../../lib/similar";
import { rowOfFamily, modelFamily } from "../../../lib/compare-pairs";
import { SUITS_OK } from "../../../lib/fit-verdict";
import RacketReviews, { type ReviewCard } from "./racket-reviews";
import { plainSummary } from "../../../lib/plain-summary";
import { onePerChannel, videoOf } from "../../../lib/youtube-pick";
import { cardContent } from "../../../lib/fit-card-data";
import { pageContent, pageTier, cardFromPage, AXIS_CONTROL, AXIS_POWER, RESEARCH_LINE } from "../../../lib/racket-page";
import { hasAttribution } from "../../../lib/voice";
import { traitNote, TRAIT_SAY } from "../../../lib/trait-note";

/** A type-picker site (lib/fit-config.ts quick: DiscGolfRecs): its stability chips and score word. Unset: padel's page, unchanged. */
const QUICK = SITE_FIT.quick ? SITE_FIT : null;
const SCORE_WORD = v2copy.score ?? "player score";
import type { QtReport, QtReview } from "./quick-take";
import { scoreState } from "../../../lib/score-view";
import { NewPill, EarlyTag } from "../../score-tags";

/** The racket fit page (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md; Claude Design layout, our data): a tight page with
 *  the important things and our recommendation. One fit-check box with two states: no picks asks "Is this the right racket
 *  for you?"; picks from the URL (?style=&level=&arm=1, the same as the home's quick match) get a verdict from
 *  lib/fit-verdict.ts. Shown for products with a quick-take block; the canonical stays the bare URL. */

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
const SITE_TRAITS = SITE_FIT.traits.filter(t => !t.hidden).map(t => t.key), SITE_LABEL: Record<string, string> = Object.fromEntries(SITE_FIT.traits.map(t => [t.key, t.label]));

/** The line under a bar from the evidence store: [praise (many, one), fault (many, one)] per trait. */


export default async function RacketFit(props: {
  /** The quick-take block; null for the beginner pilots that have none yet (their lines come from tag counts). */
  qt: QuickTake | null; line?: string | null; quotes?: { id: string; text: string; verbatim: boolean; ok: boolean }[]; racketId: string; slug: string; href: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; site: string; specs: string[]; buy: { url: string; label: string; rel: string } | null;
  fontClass: string; tags: string[]; nicknames: string[]; choice: QuickChoice; picked: boolean; jsonLd: object;
}) {
  const { qt, reports, reviews, choice, picked } = props;
  const [ctx, payload] = await Promise.all([matchContext(), homePayload()]);
  const facts = ctx.facts(props.racketId);
  // The style chip follows the match engine's control ↔ power axis (one story with the fit check and the dots; maker labels
  // bound it), with the tag-count lean only where the engine has no place for the racket.
  const axis = engineAxis(payload.items, niche.fit?.engine).get(props.racketId);
  const lean = axis === undefined ? styleLean(facts).lean : axis < AXIS_CONTROL ? "control" : axis > AXIS_POWER ? "power" : "balance";
  const leanWord = lean ? QUICK ? QUICK.styleLabels[lean].toLowerCase() : lean === "balance" ? "all-round" : lean : null;
  // "beginner → intermediate control players, and sore arms." (owner 2026-11-15, mockup): the level band and lean as one phrase.
  const armWords = QUICK ? "slower arms" : "sore arms";
  const bf = bestFor(facts), bfArm = bf.includes(armWords), bfLevel = bf.find(b => /beginner|intermediate|advanced/.test(b)), bfLean = QUICK ? null : lean ? `${lean === "balance" ? "all-round" : lean} players` : bf.find(b => / players$/.test(b));
  const bfWho = [bfLevel, bfLean ?? (bfLevel ? "players" : null)].filter(Boolean).join(" ");
  const bestLine = bfWho ? `${bfWho}${bfArm ? `, and ${armWords}` : ""}` : bfArm ? armWords : null;
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
  const traits = SITE_TRAITS.map(t => {
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
  const similarIds: string[] = (() => {
    // No picks (audit 2026-11-15, #7): really similar rackets, not the home's top 4 on every page. Same shape, same style lean
    // and a level in common, one row per model (the year that takes the family's row), described most like this one by
    // players; the best Player scores fill in when too few are close.
    const me = ctx.data.rackets.find(r => r.id === props.racketId)!, myShape = ctx.fineOf(me.id)?.shape ?? null, myLean = styleLean(facts).lean;
    const levelsOf = (id: string) => { const su = ctx.facts(id).suits; return su ? LEVELS.filter(l => su[l] >= SUITS_OK) : []; };
    const myLevels = levelsOf(me.id);
    const reportsOf = (id: string) => ctx.facts(id).reports;
    // A type-picker site (DiscGolfRecs) keeps to the disc's own type (putter, mid …); padel and pickleball items have none.
    const kindOf = (id: string) => payload.items.find(x => x.id === id)?.kind, myKind = kindOf(me.id);
    const base = ctx.data.listed.filter(x => modelFamily(x) !== modelFamily(me) && reportsOf(x.id) >= MIN_FIT_REPORTS && (!myKind || kindOf(x.id) === myKind)
      && rowOfFamily(x, ctx.data.listed, y => reportsOf(y.id) >= MIN_FIT_REPORTS).shown.id === x.id && (!myShape || ctx.fineOf(x.id)?.shape === myShape));
    const sameLean = (x: (typeof base)[number]) => !myLean || styleLean(ctx.facts(x.id)).lean === myLean;
    const sameLevel = (x: (typeof base)[number]) => !myLevels.length || levelsOf(x.id).some(l => myLevels.includes(l));
    // Strictest first; with fewer than 4, the level and then the style lean are let go (the shape always holds).
    const pool = [base.filter(x => sameLean(x) && sameLevel(x)), base.filter(sameLean), base].find(p => p.length >= 4) ?? base;
    const close = similarProducts(me, pool, tagProfiles([...ctx.data.reviews, ...ctx.data.external]), 4);
    const fill = [...pool].sort((a, b) => (ctx.signal(b.id) ?? -1) - (ctx.signal(a.id) ?? -1)).filter(x => !close.includes(x));
    return [...close, ...fill].slice(0, 4).map(x => x.id);
  })();
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
  const badge = levelScore !== null ? { n: levelScore, label: `Player score · ${lv === "advanced" ? "advanced players" : `${lv}s`}` } : overallScore !== null && scoreState(rated0) !== "new" ? { n: overallScore, label: "Player score" } : null;
  // At the visitor's level: one real quote each way from players at that level (their own words, English, card length).
  // English only: some stored excerpts have no language set, so common Spanish/Italian/French words rule a text out too.
    const english = (t?: string | null) => !!t && /^[\x00-\x7F’‘“”–—…é]+$/.test(t) && t.length >= 40 && t.length <= 240 && !/\b(pero|que|muy|una?|poco|tengo|est[aá]|para|con|del|los|las|molto|della|questa|perch[eé]|tr[eè]s|avec|mais|pour)\b/i.test(t);
  const levelTake = (ok: boolean) => {
    const fits = (x: QtReport) => ok ? x.sentiment === "positive" : x.sentiment === "negative" || x.sentiment === "mixed";
    const own = reviews.find(x => atLevel.some(a => a.id === x.id && fits(a)) && english(x.reviewText));
    if (own) return { id: own.id, text: own.reviewText, verbatim: true, ok };
    const web = atLevel.filter(fits).map(a => ({ a, w: webLevels.get(a.id) })).find(({ w }) => w?.english && english(w.excerpt));
    return web ? { id: web.a.id, text: web.w!.excerpt!, verbatim: true, ok } : null;
  };
  const levelTakes = levelView ? [levelTake(true), levelTake(false)].filter((x): x is NonNullable<typeof x> => !!x) : [];
  // Quotes (owner 2026-11-15): our own players' words first, then YouTube's, then the quick-take's picks; verbatim only.
  const pool = levelView ? atLevel : reports, inPool = new Set(pool.map(r => r.id));
  const ownQuote = (want: string[]) => reviews.find(x => inPool.has(x.id) && want.includes(ratingVerdictOf(x.rating)) && english(x.reviewText));
  const ytQuote = (want: string[]) => ctx.data.external.find(e => e.racketId === props.racketId && inPool.has(e.id) && e.sourcePlatform === "YouTube" && e.sentiment && want.includes(e.sentiment) && !e.sourceLanguage && english(e.excerpt));
  const quoteOf = (want: string[]) => { const o = ownQuote(want); if (o) return { id: o.id, text: o.reviewText, verbatim: true, tone: ratingVerdictOf(o.rating) };
    const y = ytQuote(want); return y ? { id: y.id, text: y.excerpt!, verbatim: true, tone: y.sentiment! } : null; };
  const toneOf = (ok: boolean) => ok ? "positive" : "negative";
  const preferred = [quoteOf(["positive"]), quoteOf(["negative", "mixed"])];
  const fallback = (levelTakes.length ? levelTakes : d ? [{ ...d.for, ok: true }, { ...d.against, ok: false }] : props.quotes ?? []).map(t => ({ id: t.id, text: t.text, verbatim: t.verbatim, tone: byId.get(t.id)?.sentiment ?? toneOf(t.ok) }));
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
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  // How many products each YouTube video is filed under (a video about one racket alone, or a comparison / round-up).
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of ctx.data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const dated: { at: string; card: ReviewCard }[] = [
    ...reviews.map(r => ({ at: r.createdAt, card: { id: r.id, kind: "player" as const, who: r.alias || `A ${props.site} player`, meta: lv(r.playerLevel), verdict: ratingVerdictOf(r.rating), when: ago(r.createdAt), text: r.reviewText, verbatim: false } })),
    // Owner 2026-11-15: the Reviews section lists our own reviews and the YouTube summaries only, no forum (Reddit) or blog reports.
    // One card per channel (lib/youtube-pick.ts): its video about this racket alone where there is one; every row still counts.
    ...onePerChannel(ctx.data.external.filter(e => e.racketId === props.racketId && e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => {
      const english = !e.sourceLanguage || e.sourceLanguage === "en";
      const text = e.summary ? plainSummary(e.summary) : (!english && e.excerptTranslation) || e.excerpt || "";
      const verbatim = !e.summary && english && !!e.excerpt;
      const base = { id: e.id, verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl };
      const card: ReviewCard = e.sourcePlatform === "YouTube"
        ? { ...base, kind: "youtube", who: e.sourceName, video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? sentences(text).slice(0, 4) : [text] }
        : { ...base, kind: "player", who: "A player", initial: (e.sourceName.replace(/^r\//, "")[0] ?? "P").toUpperCase(), meta: lv(webLevels.get(e.id)?.level), source: e.sourceName, text, verbatim };
      return { at: e.sourceDate ?? "", card };
    }).filter(x => x.card.kind === "youtube" ? !!x.card.points?.[0] : !!x.card.text),
  ];
  const cards = dated.sort((a, b) => b.at.localeCompare(a.at)).map(x => x.card);

  // The fit card's racket-specific lines (lib/fit-card.ts, owner 2026-11-15): only this racket's entry goes to the browser,
  // with names and links for the rackets its catches point to. None yet: FitBox keeps the fit check's own reasons.
  // The fit card's lines: the racket's own fit-card entry, else its page items (the same evidence, already counted), so a
  // racket with page content never falls back to the generic reasons (owner 2026-11-16: one story across the page).
  const pageForCard = pageContent(props.slug);
  const cardData = cardContent(props.slug) ?? (pageForCard ? cardFromPage(pageForCard) : null);
  const card = cardData ? { ...cardData, links: Object.fromEntries(cardData.catches.flatMap(c => c.alt ? [c.alt.slug] : []).flatMap(slug => {
    const r = ctx.data.rackets.find(x => x.slug === slug); return r ? [[slug, { href: productHref(r), name: displayName(r.name, brand(r.brandId)) }]] : []; })) } : null;
  // The page's own words (lib/racket-page.ts): tagline, bottom line, Why yes / Why not. Rackets without them keep the hook.
  const page = pageContent(props.slug), tier = pageTier(page);
  // The compare tabs: six trait dots per racket (lib/trait-score.ts), this one and every racket an alternative can be.
  const dotsOf = (rid: string) => { const sc = ctx.traits(rid).scores; return SITE_TRAITS.map(t => sc?.[t as Trait]?.dots ?? 0); };
  const shortOf = (r: ReturnType<typeof racketOf>) => displayName(r.name, brand(r.brandId)).replace(/\s+(19|20)\d\d$/, "");
  const cardOf = (rid: string): CompareCard => { const r = racketOf(rid); return { name: displayName(r.name, brand(r.brandId)), short: shortOf(r), href: productHref(r), pic: photoOf(r), dots: dotsOf(rid), reports: ctx.facts(rid).reports }; };
  const compareMe = cardOf(props.racketId);
  const compareCards: Record<string, CompareCard> = Object.fromEntries([...new Set([...Object.keys(payload.cards), ...similarIds])].filter(cid => ctx.data.rackets.some(r => r.id === cid)).map(cid => [cid, cardOf(cid)]));
  // Every judged report's sentiment: the hero's quiet score line and the Reviews header (no %).
  const mood = { pos: saidViews.none.pos, mix: saidViews.none.mix, neg: saidViews.none.neg }, rated = mood.pos + mood.mix + mood.neg;
  // "2025 version →" (owner's final mock): the newest older year of the same model, when the catalog lists one.
  const olderRow = ctx.data.listed.filter(x => modelFamily(x) === modelFamily(racketOf(props.racketId)) && x.year < props.year).sort((a, b) => b.year - a.year)[0];
  const older = olderRow ? { year: olderRow.year, href: productHref(olderRow) } : null;
  // "Similar products" at the foot of the page (owner 2026-11-16, app/similar-section.tsx): the similar rackets above as cards,
  // each with the trait it is furthest ahead on, and on DiscGolfRecs a second tab with the discs that complete the bag.
  const simCfg = niche.similar;
  const dotWords = SITE_FIT.traits.filter(t => !t.hidden).map(t => t.diff ?? `more ${t.label.toLowerCase()}`);
  const kindOfId = (id: string) => payload.items.find(x => x.id === id)?.kind;
  const quickTypes = QUICK?.quick?.types ?? [];
  const typeOf = (kind: string | undefined) => quickTypes.find(t => t.key === kind);
  const tagOf = (id: string) => { const c = payload.cards[id]; return c?.flight ? c.flight.join(" ") : c?.shape ?? racketOf(id).shape?.toLowerCase() ?? niche.words.one; };
  // One line per card: the racket's own tagline (lib/racket-page.ts, expert voice), else its home line or short line.
  const lineOf = (id: string) => [pageContent(racketOf(id).slug)?.tagline, payload.cards[id]?.line, shortLine(racketOf(id)), listLine(racketOf(id))]
    .map(expertLine).find((t): t is string => !!t) ?? null;
  const byScore = (ids: string[]) => [...ids].sort((a, b) => (ctx.signal(b) ?? -1) - (ctx.signal(a) ?? -1));
  const simItem = (id: string, i: number, why: string | null): SimilarItem => ({ id, name: cardOf(id).name, href: cardOf(id).href, tag: tagOf(id), photo: payload.cards[id]?.pic ?? productPhoto(racketOf(id))?.src ?? null, tint: tint(i), why, line: lineOf(id), score: ctx.signal(id) });
  const myKindType = typeOf(kindOfId(props.racketId));
  const groupWord = myKindType ? myKindType.many.toLowerCase() : `${leanWord ? `${leanWord} ` : ""}${niche.words.many}`;
  const listFor = (word: string | undefined) => withModelYears(niche.topLists ?? []).find(l => word && l.slug.includes(word)) ?? withModelYears(niche.topLists ?? [])[0];
  const simList = listFor(myKindType?.key ?? (lean && lean !== "balance" ? lean : undefined));
  const simTabs: SimilarTab[] = simCfg ? [{ key: "sim", label: `similar ${groupWord}`, sub: `other ${groupWord} ${niche.people.many} compare it with`, subPicked: `other ${groupWord}, sorted by your match`,
    items: byScore(similarIds).map((id, i) => simItem(id, i, aheadWord(compareMe.dots, cardOf(id).dots, dotWords))),
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

  return <><FitPicks first={{ choice, picked }} href={props.href} seed={picked ? rankSeed(payload.items, choice, facts, props.racketId) : null}><main className={`rf ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-wrap">
      <FitBack all={{ href: catalogPath, label: `← all ${niche.words.many}` }}/>
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{props.photo ? <img src={props.photo} alt={props.name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span className="rf-tile">{props.shortName}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[leanWord, props.shape, hasYears ? String(props.year) : null].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}
              {older && <a className="rp-older" href={older.href}>{`${older.year} version →`}</a>}</div>
            {/* H1 "<name> review" for search (owner spec); the year is in the chips. */}
            <h1>{`${props.shortName} review`}</h1>
            {(page || qt || props.line) && <p className="rf-hook">{page ? page.tagline : qt ? `${qt.hook.good} ${qt.hook.catch}` : props.line}</p>}
            {/* The Player score as a quiet line with its bar (owner's final mock), then Check price. */}
            {page?.source === "research" ? <p className="rp-score">{RESEARCH_LINE}</p> :
            <a className="rp-score" href="#reviews" title={`${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}: not a % of happy players. It blends how much players like it with how many have weighed in.`}>
              {scoreState(rated) === "new" ? <NewPill n={rated}/> : <span>{overallScore !== null && <b>{overallScore}</b>}{`${overallScore !== null ? ` ${SCORE_WORD} · ` : ""}${rated} rated`}{scoreState(rated) === "early" && <EarlyTag/>}</span>}
              {rated > 0 && <span className="rf-sbar" aria-hidden="true"><i className="p" style={{ flex: mood.pos }}/><i className="m" style={{ flex: mood.mix }}/><i className="n" style={{ flex: mood.neg }}/></span>}</a>}
            {props.buy && <div className="rf-meta"><a className="rf-btn" href={props.buy.url} target="_blank" rel={props.buy.rel}>{props.buy.label} ↗</a></div>}
            {props.buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>

        <FitBox id={props.racketId} facts={facts} hook={qt ? qt.hook : null} total={total} bestLine={bestLine} levelDisagree={facts.levelDisagree} card={card} yesNo={page ? { yes: page.yes, no: page.no } : null}/>
      </section>

      {/* After the hero, one centred 880px column (owner 2026-11-16: "copy this exactly", the final mock): the bottom line, Why yes /
          why not and How it plays share a group; Reviews and Specs follow. The match box floats once the hero scrolls away. */}
      <section className="rp-body">
        <div className="rp-main">
          {page && tier && <BeforePicks><p className="rp-bottom"><span className="rp-bl">bottom line</span><b>{page.bottom}</b></p></BeforePicks>}
          {page && tier && <div id="yes-no">
            <div className="rf-h"><h2>Why yes, why not</h2><span>{page.source === "research" ? RESEARCH_LINE.toLowerCase() : tier === "short" ? `based on ${total} reports` : "from player reports & YouTube"}</span></div>
            <FitYesNo yes={page.yes} no={page.no} tier={tier} research={page.source === "research"}/>
          </div>}

          <div id="compare">
            {/* Under 3 reports there is no verdict word or dots (audit 2026-11-15, #15): every claim needs 3+ players. */}
            <div className="rf-h"><h2>How it plays &amp; compares</h2><span>{page?.source === "research" ? `from specs and expert ratings, compared with other ${niche.words.many}` : total < 3 ? `too few reports to rate yet (${total})` : `from player reports, compared with other ${niche.words.many}`}</span></div>
            <FitCompare id={props.racketId} me={compareMe} rows={traits.map(([label, note]) => ({ label, note }))} cards={compareCards} similar={similarIds}/>
          </div>
        </div>

          <section id="reviews" className="rv">
            <RacketReviews racketId={props.racketId} name={props.shortName} cards={cards} nicknames={props.nicknames} total={total}
              mood={{ ...mood, score: scoreState(rated) === "new" ? null : overallScore }}{...(QUICK ? { words: { levelLead: "I'm", levels: ["Beginner", "Intermediate", "Advanced"].map(v => ({ value: v, label: v.toLowerCase() })), score: `${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}`, ask: "Thrown it?", people: "players", peopleTab: "players" } } : {})}/>
          </section>

          {props.specs.length > 0 && <details className="rp-specs"><summary><h2>Specs</h2></summary>
            <p className="rf-specs">{props.specs.map(s => { const [k, ...v] = s.split(" "); return <span key={s}><span>{k}</span>{` ${v.join(" ")}`}</span>; })}</p></details>}

          {simTabs.length > 0 && <FitSimilar title="Also worth a look" tabs={simTabs} scoreLabel={SCORE_WORD} look={simCfg?.look}/>}
      </section>

      <FitSticky buy={props.buy} name={props.shortName}/>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from YouTube reviews, reviews sent to us and ${v2copy.forum} reports · every source linked · `}
          <details><summary>how we read this</summary><span>{` We sort each report as positive, mixed or negative, count what players say, and give our honest take. Every claim needs 3+ players; quote marks only on their exact words. We don't test ${niche.words.many} and no brand pays for placement. `}{qt && <>Thin spot: <Rich text={qt.thinSpot}/></>}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">{v2copy.madeBy}</p>
      </footer>
    </div>
  </main></FitPicks><V2Footer/></>;
}
