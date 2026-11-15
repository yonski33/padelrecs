import type { ReactNode } from "react";
import Link from "next/link";
import "./racket-fit.css";
import { spans, chipTone, type Chip, type QuickTake } from "../../../lib/quick-take";
import { TRAITS, TRAIT_LABEL, type Trait } from "../../../lib/trait-score";
import { fitVerdict, bestFor, levelBacking, levelSources, styleLean } from "../../../lib/fit-verdict";
import { quickMatch, choiceHref, isDefault, LEVELS, STYLES, DEFAULT_CHOICE, type QuickChoice } from "../../../lib/quick-match";
import { matchContext } from "../../match-context";
import { reportLevels } from "../../../db/report-levels";
import { V2Footer } from "../../v2-footer";
import { matchScore } from "../../../lib/match-score";
import { platformName } from "../../../lib/source-label";
import { displayName } from "../../../lib/brand-name";
import { productHref, niche, catalogPath } from "../../../lib/niche";
import { shopPhoto, photoHidden } from "../../../lib/shop-photos";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { QuickVoteLine } from "./quick-take-composer";
import RacketReviews, { type ReviewCard } from "./racket-reviews";
import { plainSummary } from "../../../lib/plain-summary";
import type { QtReport, QtReview } from "./quick-take";

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
const STYLE_WORD: Record<QuickChoice["style"], string> = { any: "any", control: "control", balance: "balance", power: "power" };

export default async function RacketFit(props: {
  /** The quick-take block; null for the beginner pilots that have none yet (their lines come from tag counts). */
  qt: QuickTake | null; line?: string | null; quotes?: { id: string; text: string; verbatim: boolean; ok: boolean }[]; racketId: string; slug: string; href: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; site: string; specs: string[]; buy: { url: string; label: string; rel: string } | null;
  fontClass: string; tags: string[]; nicknames: string[]; choice: QuickChoice; picked: boolean; jsonLd: object;
}) {
  const { qt, reports, reviews, choice, picked } = props;
  const ctx = await matchContext();
  const facts = ctx.facts(props.racketId);
  const verdict = picked ? fitVerdict(choice, facts) : null;
  // The answer box (owner 2026-11-15, Claude Design tweak): the same match % as the home (lib/match-score.ts), a plain-words
  // headline, one "why it fits" and one "what to consider", from the fit check's reasons and the quick-take lines.
  const trs = ctx.traits(props.racketId).scores, lvE = ctx.level(props.racketId);
  const pct = verdict ? matchScore(choice, { verdict, control: trs?.control?.score ?? null, power: trs?.power?.score ?? null, arm: trs?.arm?.score ?? null, band: lvE?.band, likedAtLevel: lvE?.liked[choice.level] ?? 0, signal: ctx.signal(props.racketId) }) : null;
  const verdictWord = verdict && verdict.kind !== "thin" ? { good: "Strong fit", maybe: "Worth a look", no: "Probably not" }[verdict.kind] : null;
  const why = verdict ? (verdict.fits?.slice(0, 2).join(" ") || (qt ? qt.hook.good : null)) : null;
  const consider = verdict ? (verdict.catches?.[0] ?? (qt ? qt.hook.catch : null)) : null;
  const headline = !verdict ? "" : verdict.kind === "good" ? (consider ? "Yes, with one catch." : "Yes — a clean fit.") : verdict.kind === "maybe" ? "Maybe — demo it first." : verdict.kind === "no" ? "Probably not for you." : "Not enough reports from players like you yet.";
  const gameWords = [choice.level, choice.style === "any" ? null : choice.style === "balance" ? "all-round" : choice.style, choice.arm ? "sore arm" : null].filter((x): x is string => !!x);
  // What backs the level band (brand, reviewers, players), with the brand's page linked (owner 2026-11-15).
  const backing = levelBacking(facts), maker = levelSources(facts).maker;
  // Players' own stated levels: own reviews carry one; web reports get one when the writer states it (migration 0021).
  const webLevels = await reportLevels(props.racketId);
  const levelOf = (r: QtReport) => { const v = r.level ?? webLevels.get(r.id)?.level; return v === "Competitive" ? "advanced" : v?.toLowerCase(); };
  const byId = new Map(reports.map(r => [r.id, { ...r, level: r.level ?? webLevels.get(r.id)?.level ?? null }]));
  // "What players at your level said" once 5+ reports at the picked level state it; else everyone (owner 2026-11-15).
  const atLevel = picked ? reports.filter(r => levelOf(r) === choice.level) : [];
  const levelView = atLevel.length >= LEVEL_SAID_MIN;
  const said = levelView ? atLevel : reports;
  const count = (k: string) => said.filter(r => r.sentiment === k).length;
  const [pos, mix, neg] = [count("positive"), count("mixed"), count("negative")];
  const who = (id: string) => { const r = byId.get(id); if (!r) return null;
    // True source, neutral words (owner 2026-11-15): our own players by nickname, YouTube by channel, forums and blogs by kind.
    const src = r.platform === props.site ? r.nickname || `A ${props.site} player` : r.platform === "YouTube" ? `YouTube · ${r.sourceName ?? "video"}` : r.platform === "Reddit" ? "padel forum" : platformName(r.platform) === "Blog" ? "padel blog" : platformName(r.platform).toLowerCase();
    return [src, r.level?.toLowerCase()].filter(Boolean).join(" · "); };
  const at = (c: QuickChoice) => { const h = choiceHref(c, ""); return `${props.href}${h === "/" ? "" : h.slice(1)}`; };
  const pill = (label: string, next: QuickChoice, on: boolean) => <Link href={at(next)} scroll={false} replace aria-pressed={on} className={on ? "on" : undefined}>{label}</Link>;
  // With no picks, a tap starts from the defaults (any / intermediate / no arm) but always lands on a picked page.
  const base = picked ? choice : DEFAULT_CHOICE;
  const pickHref = (c: QuickChoice) => { const h = at(c); return h.includes("?") ? h : `${h}?level=${c.level}`; };
  const pickPill = (label: string, next: QuickChoice, on: boolean) => <Link href={pickHref(next)} scroll={false} replace aria-pressed={on} className={on ? "on" : undefined}>{label}</Link>;

  // Six trait rows (owner 2026-11-15): dots from the calculated trait scores (lib/trait-score.ts, every racket alike), text
  // from the quick-take's own line where it has one and it agrees with the dots, else what the tag counts say.
  const row = (label: string) => qt?.plays?.rows.find(r => r.label.toLowerCase() === label.toLowerCase());
  const tr = ctx.traits(props.racketId), tc = (t: string) => tr.tags[t] ?? 0;
  // "1 player mentions" / "3 players mention": the count with its verb.
  const ppl = (k: number, verb: string) => k === 1 ? `1 player ${verb.replace(/^(\w+)/, w => w === "say" ? "says" : w === "find" ? "finds" : `${w}s`)}` : `${k} players ${verb}`;
  // Counts in words: never "0 mention …" (owner: no slashed zeros, say "no one").
  const countLine: Record<Trait, () => string | null> = {
    forgiveness: () => { const p = tc("forgiving"), m = tc("small sweet spot") + tc("demanding"); return p || m ? [p ? ppl(p, "call it forgiving") : "No one calls it forgiving", m ? ppl(m, "find the sweet spot small or call it demanding") : "no one calls it demanding"].join(", ") + "." : null; },
    power: () => { const p = tc("easy power"), s = tc("great on smashes"); return p || s ? `${p ? ppl(p, "mention easy power") : "No one mentions easy power"}${s ? `, ${ppl(s, "say it's great on smashes")}` : ""}.` : null; },
    control: () => { const p = tc("good control"), m = tc("head-heavy"); return p || m ? `${p ? ppl(p, "praise the control") : "No one praises the control"}${m ? `, ${ppl(m, "find it head-heavy")}` : ""}.` : null; },
    defence: () => { const p = tc("great in defence"); return p ? `${ppl(p, "say it's great in defence")}.` : null; },
    arm: () => { const p = tc("arm-friendly"), m = tc("vibrates on mishits"); return p || m ? `${p ? ppl(p, "call it arm-friendly") : "No one calls it arm-friendly"}, ${m ? ppl(m, "mention vibration") : "no one mentions vibration"}.` : null; },
    speed: () => { const p = tc("fast at the net"), m = tc("head-heavy") + tc("tiring in long matches"); return p || m ? `${p ? ppl(p, "call it fast at the net") : "No one calls it fast at the net"}${m ? `, ${ppl(m, "find it head-heavy or tiring")}` : ""}.` : null; },
  };
  const qtRow: Record<Trait, { chip: string; line: string } | undefined> = { forgiveness: row("Sweet spot"), power: row("Power"), control: row("Control"), defence: qt?.plays?.court?.defence, arm: row("Comfort"), speed: row("Handling") };
  // Lines the owner wrote in the admin area stay even when the data is thin.
  const manualText = new Set(TRAITS.map(t => tr.edits?.traits[t]?.text).filter((x): x is string => !!x));
  const traits = TRAITS.map(t => {
    const sc = tr.scores?.[t] ?? null, q = qtRow[t];
    // The hand-written line must agree with the dots: a strong chip beside 1–2 dots, or a weak/divided one beside 4–5, loses.
    const tone = q ? chipTone(q.chip as Chip) : null;
    const agrees = !q || !sc || !((sc.dots <= 2 && tone === "g") || (sc.dots >= 4 && (tone === "b" || q.chip === "Divided" || q.chip === "Tricky")));
    // A count line says where the dots put it, so "5 players say it's great in defence" never sits beside 1 dot unexplained.
    const counted = countLine[t](), rel = sc && !sc.set ? (sc.dots <= 2 ? " Fewer than most rackets get for their number of reports." : sc.dots >= 4 ? " More than most rackets get for their number of reports." : "") : "";
    // The owner's own line (admin area) wins over everything.
    const text = tr.edits?.traits[t]?.text ?? (q && agrees ? q.line : null) ?? (counted ? counted + rel : null) ?? (sc ? null : "Not enough reports on this yet.");
    return [TRAIT_LABEL[t], text ?? "Not enough reports on this yet.", sc ? "●".repeat(sc.dots) + "○".repeat(5 - sc.dots) : null] as [string, string, string | null];
  });

  // Better matches: quick match with the visitor's picks (or the default order), from the catalog, without this racket.
  // With picks, the 4 alternatives with the best match % (the same number the home shows); without, quick match's order.
  const pctOf = (id: string) => { const fv = fitVerdict(choice, ctx.facts(id)), ts = ctx.traits(id).scores, le = ctx.level(id);
    return matchScore(choice, { verdict: fv, control: ts?.control?.score ?? null, power: ts?.power?.score ?? null, arm: ts?.arm?.score ?? null, band: le?.band, likedAtLevel: le?.liked[choice.level] ?? 0, signal: ctx.signal(id) }); };
  const others = (() => {
    const c = quickMatch(ctx.pool, ctx.finder, picked ? choice : DEFAULT_CHOICE, { signal: ctx.signal, negativeTags: ctx.bad, level: ctx.level, count: picked ? 25 : 5, rankWeight: ctx.finder.rankWeight }).filter(m => m.product.id !== props.racketId);
    return (picked ? c.map((m, i) => ({ m, i, p: pctOf(m.product.id) })).sort((a, b) => (b.p ?? -1) - (a.p ?? -1) || a.i - b.i).map(x => x.m) : c).slice(0, 4);
  })();
  const racketOf = (id: string) => ctx.data.rackets.find(r => r.id === id)!;
  const brand = (id: string) => ctx.data.brands.find(b => b.id === id)?.name;
  const photoOf = (r: ReturnType<typeof racketOf>) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const d = qt?.catch.debate;
  // At the visitor's level: one real quote each way from players at that level (their own words, English, card length).
  const english = (t?: string | null) => !!t && /^[\x00-\x7F’‘“”–—…é]+$/.test(t) && t.length >= 40 && t.length <= 240;
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
  const QUOTE_TAG: Record<string, [string, string]> = { positive: ["✓ Worked for them", "ok"], negative: ["✗ Not for them", "no"], mixed: ["~ Mixed feelings", "mix"] };
  // The Reviews section's cards (RACKET-REVIEWS-SECTION.md): our own reviews and stored reports, newest first. YouTube
  // reports get the video card; everything else is a player card. Real data only: no author handles are stored, so web
  // reports say "A player" and link their source; a verdict pill only where the sentiment was judged.
  const lv = (v?: string | null) => v ? (v === "Competitive" ? "competitive" : v.toLowerCase()) : null;
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  const dated: { at: string; card: ReviewCard }[] = [
    ...reviews.map(r => ({ at: r.createdAt, card: { id: r.id, kind: "player" as const, who: r.alias || `A ${props.site} player`, meta: lv(r.playerLevel), verdict: ratingVerdictOf(r.rating), when: ago(r.createdAt), text: r.reviewText, verbatim: false } })),
    // Owner 2026-11-15: the Reviews section lists our own reviews and the YouTube summaries only, no forum (Reddit) or blog reports.
    ...ctx.data.external.filter(e => e.racketId === props.racketId && e.sourcePlatform === "YouTube").map(e => {
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
  const levelWord = choice.level === "advanced" ? "advanced players" : `${choice.level}s`;
  // Heads up and player tip (owner 2026-11-15): only from the quick-take's notes with 2+ reports behind them, and the catch's
  // bullets; split into a title (first sentence) and a detail. Nothing real: the box is hidden.
  const split = (t: string) => { const m = /^(.+?[.!?])\s+(.+)$/.exec(t.trim()); return m ? { t: m[1], d: m[2] } : { t: t.trim(), d: "" }; };
  const heads = [...(qt?.tips.filter(x => (x.label === "Heads up" || x.label === "Weather check") && x.reports.length >= 2).map(x => split(x.text)) ?? []),
    ...((qt?.catch.reports.length ?? 0) >= 2 ? qt!.catch.bullets.map(b => split(b)) : [])].slice(0, 3);
  const tipNote = qt?.tips.find(x => (x.label === "Player tip" || x.label === "Setup tip") && x.reports.length >= 2);
  const tip = tipNote ? { ...split(tipNote.text), n: new Set(tipNote.reports).size, other: qt!.tips.find(x => x !== tipNote && (x.label === "Player tip" || x.label === "Setup tip") && x.reports.length >= 2) } : null;
  const total = reports.length;

  const lean = styleLean(facts).lean;
  const peerSub = levelView ? `${said.length} of ${total} reviews · from players at your level` : `${total} reviews · forums, YouTube & ${props.site.toLowerCase()}`;
  const altTitle = !verdict ? "Similar rackets" : verdict.kind === "good" ? "Also worth a look" : "Better matches for you";
  const box = (on: boolean) => <i className="rf-box" aria-hidden="true">{on ? "✓" : ""}</i>;
  const armLink = (label: string) => <Link href={picked ? at({ ...base, arm: !choice.arm }) : pickHref({ ...base, arm: true })} scroll={false} replace aria-pressed={picked && choice.arm} className="rf-arm">{box(picked && choice.arm)}{label}</Link>;

  return <><main className={`rf ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-wrap">
      {picked ? <a className="rf-back" href={choiceHref(choice)}>← back to your matches</a> : <a className="rf-back" href={catalogPath}>{`← all ${niche.words.many}`}</a>}
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{props.photo ? <img src={props.photo} alt={props.name}/> : <span className="rf-tile">{props.shortName}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[lean ? (lean === "balance" ? "all-round" : lean) : null, props.shape, String(props.year)].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}</div>
            {/* H1 keeps "<name> review" for search (owner); the big name sits under it. */}
            <h1>{`${props.shortName} review`}</h1>
            <p className="rf-name">{`${props.shortName} (${props.year})`}</p>
            {(qt || props.line) && <p className="rf-hook">{qt ? `${qt.hook.good} ${qt.hook.catch}` : props.line}</p>}
            <div className="rf-meta">
              {props.buy && <a className="rf-btn" href={props.buy.url} target="_blank" rel={props.buy.rel}>{props.buy.label} ↗</a>}
              {ctx.signal(props.racketId) !== null && <span className="rf-sig" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{ctx.signal(props.racketId)}</span>}
              <a href="#reviews">{`${total} player reports`}</a>
            </div>
            {props.buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>

        <div className={`rf-fit ${verdict ? `v-${verdict.kind}` : "ask"}`} id="fit">
          {!verdict ? <div className="rf-ask">
            <div><h2>Is this the right racket for you?</h2>
              <p>{`Two taps. We'll check it against ${total} player reviews.`}</p></div>
            <div className="rf-grid">
              <span>I want</span>
              <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pickPill(STYLE_WORD[s], { ...base, style: s }, false)}</span>)}</span>
              <span>I&apos;m</span>
              <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pickPill(l, { ...base, level: l }, false)}</span>)}</span>
              <span/>
              {armLink("I have a sore elbow / wrist")}
            </div>
            {backing && <p className="rf-lvl">{`level: ${backing}`}{maker && <> · <a href={maker.url} target="_blank" rel="noopener nofollow">brand page ↗</a></>}</p>}
            {bestFor(facts).length > 0 && <p className="rf-best"><span>generally best for:</span>{bestFor(facts).map(b => <b key={b}>{b}</b>)}</p>}
          </div> : <div className="rf-ans" aria-live="polite">
            <div className="rf-chipsrow"><span className="rf-k">⚡ your match</span>
              <span className={`rf-vpill ${verdict.kind}`}>{pct === null ? "—" : `${pct}% match`}{verdictWord && ` · ${verdictWord}`}</span></div>
            <h2>{headline}</h2>
            <p className="rf-for">{`For your ${gameWords.join(" · ")} game, here's the short answer.`}</p>
            {why && <div className="rf-blk ok"><p className="rf-bk">{verdict.kind === "no" ? "✓ what works" : "✓ why it fits"}</p><p>{why}</p></div>}
            {consider && <div className="rf-blk warn"><p className="rf-bk">↗ what to consider</p><p>{consider}</p></div>}
            <div className="rf-afoot"><span>{gameWords.map(w => w[0].toUpperCase() + w.slice(1)).join(" · ")}</span>
              <details className="rf-edit"><summary>edit ↗</summary><div className="rf-bar">
                <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(st => <span key={st}>{pill(STYLE_WORD[st], { ...choice, style: st }, choice.style === st)}</span>)}</span>
                <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, choice.level === l)}</span>)}</span>
                {armLink("sore arm")}
              </div></details>
              <Link href={props.href} scroll={false} replace className="rf-reset">start over</Link></div>
          </div>}
        </div>
      </section>

      <section className="rf-body">
        <div className="rf-main">
          <div>
            <div className="rf-h"><h2>{levelView ? `What ${levelWord} said` : "What players said"}</h2><span>{peerSub}</span></div>
            <div className="rf-said">
              <div className="rf-sum">
                <div className="rf-sbar" role="img" aria-label={`${pos} positive, ${mix} mixed, ${neg} negative`}><i className="p" style={{ flex: pos }}/><i className="m" style={{ flex: mix }}/><i className="n" style={{ flex: neg }}/></div>
                <p className="rf-counts"><span>{`👍 ${pos} loved`}</span><span>{`🤷 ${mix} mixed`}</span><span>{`👎 ${neg} nope`}</span></p>
              </div>
              {takes.length > 0 && <div className="rf-quotes">{takes.map(t => { const [tag, cls] = QUOTE_TAG[t.tone] ?? QUOTE_TAG.mixed; return <div key={t.id} className={cls}>
                <span>{tag}</span>
                <p>{t.verbatim ? `“${t.text}”` : t.text}</p>
                <small>{who(t.id)}</small>
              </div>; })}</div>}
            </div>
          </div>

          <div>
            <div className="rf-h"><h2>How it plays</h2><span>from player reports, compared with other rackets</span></div>
            <div className="rf-plays">{traits.map(([k, v, dots]) => { const n = dots ? dots.replace(/○/g, "").length : 0;
              return <div key={k} className="rf-prow"><b>{k}</b>
                {n ? <span className="rf-segs" role="img" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? "on" : undefined}/>)}</span> : <span className="rf-segs none"/>}
                <span className="rf-pnote">{n ? <em className={`t${n}`}>{n === 5 ? "standout" : n === 4 ? "strong" : n === 3 ? "so-so" : "below most"}</em> : null}<span><Rich text={n || manualText.has(v) ? v : "Not enough reports yet."}/></span></span>
              </div>; })}</div>
          </div>

          {(heads.length > 0 || tip) && <div className="rf-boxes">
            {heads.length > 0 && <div className="rf-box2"><span className="rf-lab warn">⚠ heads up</span>{heads.map((h, i) => <div key={i} className="rf-hd"><b>{h.t}</b>{h.d && <span>{h.d}</span>}</div>)}</div>}
            {tip && <div className="rf-box2"><span className="rf-lab tip">💡 player tip</span>
              <p className="rf-tipt">{tip.t}</p>
              {tip.d && <div className="rf-why"><strong>Why:</strong> {tip.d}</div>}
              {tip.other && <div className="rf-also"><strong>Also:</strong> {tip.other.text}</div>}
              <small className="rf-src">{`from ${tip.n} player reports`}</small></div>}
          </div>}

          {props.specs.length > 0 && <div><h2 className="rf-h2">Specs</h2><p className="rf-specs">{props.specs.map(s => { const [k, ...v] = s.split(" "); return <span key={s}><span>{k}</span>{` ${v.join(" ")}`}</span>; })}</p></div>}
        </div>

        <aside className="rf-side">
          <div>
            <div className="rf-h"><h2>{altTitle}</h2><a href={choiceHref(picked ? choice : DEFAULT_CHOICE)}>all →</a></div>
            <ul className="rf-alts">{others.map(m => { const r = racketOf(m.product.id), sig = ctx.signal(r.id), pic = photoOf(r), top = m.reasons[0];
              const why = top ? `${top.tag} · ${top.count} players` : ctx.takes.get(r.id)?.hook ?? null;
              return <li key={r.id}><a href={`${productHref(r)}${picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : ""}`}>
                <span className="rf-apic">{pic ? <img src={pic} alt="" loading="lazy"/> : <span>{displayName(r.name, brand(r.brandId)).split(" ").slice(0, 2).join(" ")}</span>}</span>
                <span className="rf-abody"><b>{displayName(r.name, brand(r.brandId))}</b>{why && <span>{why}</span>}</span>
                {picked ? (() => { const p = pctOf(r.id);
                  return <span className="rf-score" title="How well it fits your picks, from player reports. Not a % of happy players.">{p === null ? "—" : `${p}%`}</span>; })()
                : sig !== null && <span className="rf-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{sig}</span>}
              </a></li>; })}</ul>
          </div>
          <div className="rf-vote"><p className="rf-vt">Played it? <a href="#reviews">Leave a review ↓</a></p><QuickVoteLine racketId={props.racketId} name={props.shortName} label="" wordsHref="#reviews" words={{ positive: "👍 yes", mixed: "🤷 mixed", negative: "👎 nope" }}/></div>
        </aside>
      </section>

      <section id="reviews" className="rv"><RacketReviews racketId={props.racketId} name={props.shortName} cards={cards}/></section>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{"built from YouTube reviews, reviews sent to us and padel forum reports · every source linked · "}
          <details><summary>how we read this</summary><span>{` We sort each report as positive, mixed or negative, count what players say, and give our honest take. Every claim needs 3+ players; quote marks only on their exact words. We don't test rackets and no brand pays for placement. `}{qt && <>Thin spot: <Rich text={qt.thinSpot}/></>}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">made by people who own too many rackets 🎾</p>
      </footer>
    </div>
  </main><V2Footer/></>;
}
