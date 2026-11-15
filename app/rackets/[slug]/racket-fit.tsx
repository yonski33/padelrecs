import type { ReactNode } from "react";
import Link from "next/link";
import "./racket-fit.css";
import { spans, sentimentWords, chipTone, type Chip, type QuickTake } from "../../../lib/quick-take";
import { TRAITS, TRAIT_LABEL, type Trait } from "../../../lib/trait-score";
import { fitVerdict, bestFor, levelBacking, levelSources, styleLean } from "../../../lib/fit-verdict";
import { quickMatch, choiceHref, isDefault, LEVELS, STYLES, DEFAULT_CHOICE, type QuickChoice } from "../../../lib/quick-match";
import { matchContext } from "../../match-context";
import { reportLevels } from "../../../db/report-levels";
import { V2Footer } from "../../v2-footer";
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
  const mood = sentimentWords(...(["positive", "mixed", "negative"].map(k => reports.filter(r => r.sentiment === k).length) as [number, number, number]))?.lead.toLowerCase();
  const who = (id: string) => { const r = byId.get(id); if (!r) return null;
    return r.platform === props.site ? [r.nickname || `A ${props.site} player`, r.level].filter(Boolean).join(" · ") : [platformName(r.platform), r.sourceName && r.sourceName !== r.platform ? r.sourceName : null, r.level].filter(Boolean).join(" · "); };
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
  const others = quickMatch(ctx.pool, ctx.finder, picked ? choice : DEFAULT_CHOICE, { signal: ctx.signal, negativeTags: ctx.bad, level: ctx.level, count: 5, rankWeight: ctx.finder.rankWeight })
    .filter(m => m.product.id !== props.racketId).slice(0, 4);
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
  const takes = levelTakes.length ? levelTakes : d ? [{ ...d.for, ok: true }, { ...d.against, ok: false }] : props.quotes ?? [];
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
  const tips = qt?.tips.slice(0, 2) ?? [];
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
            <h1>{`${props.shortName} (${props.year})`}</h1>
            {(qt || props.line) && <p className="rf-hook">{qt ? `${qt.hook.good} ${qt.hook.catch}` : props.line}</p>}
            <div className="rf-meta">
              {props.buy && <a className="rf-btn" href={props.buy.url} target="_blank" rel={props.buy.rel}>{props.buy.label} ↗</a>}
              <a href="#reviews">{`${total} reviews${mood ? ` · ${mood}` : ""}`}</a>
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
          </div> : <>
            <div className="rf-bar"><span className="rf-k">fit check</span>
              <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pill(STYLE_WORD[s], { ...choice, style: s }, choice.style === s)}</span>)}</span>
              <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, choice.level === l)}</span>)}</span>
              {armLink("sore arm")}
            </div>
            <div className="rf-verdict" aria-live="polite">
              <span className="rf-icon" aria-hidden="true">{verdict.icon}</span>
              <div><h2>{verdict.label}</h2>
                {verdict.reasons.length > 0 && <ul>{verdict.reasons.map(r => <li key={r}>{r}</li>)}</ul>}
                {maker && <p className="rf-lvl"><a href={maker.url} target="_blank" rel="noopener nofollow">{`brand page: “${maker.words}” ↗`}</a></p>}
                <Link href={props.href} scroll={false} replace className="rf-reset">start over</Link></div>
            </div>
          </>}
        </div>
      </section>

      <section className="rf-body">
        <div className="rf-main">
          <div>
            <div className="rf-h"><h2>{levelView ? `What ${levelWord} said` : "What players said"}</h2><span>{peerSub}</span></div>
            <div className="rf-said">
              <div className="rf-sum">
                <div className="rf-sbar" role="img" aria-label={`${pos} positive, ${mix} mixed, ${neg} negative`}><i className="p" style={{ flex: pos }}/><i className="m" style={{ flex: mix }}/><i className="n" style={{ flex: neg }}/></div>
                <p className="rf-counts"><span>{`👍 ${pos} loved it`}</span><span>{`🤷 ${mix} mixed`}</span><span>{`👎 ${neg} nope`}</span></p>
              </div>
              {takes.length > 0 && <div className="rf-quotes">{takes.map(t => <div key={t.id}>
                <span className={t.ok ? "ok" : "no"}>{t.ok ? "✓ worked for them" : "✗ not for them"}</span>
                <p>{t.verbatim ? `“${t.text}”` : t.text}</p>
                <small>{who(t.id)}</small>
              </div>)}</div>}
            </div>
          </div>

          {traits.length > 0 && <div>
            <h2 className="rf-h2">How it plays</h2>
            <div className="rf-traits">{traits.map(([k, v, dots]) => <div key={k}><div className="rf-th"><b>{k}</b>{dots && <span aria-label={`${dots.length - dots.replace(/●/g, "").length} of 5`}>{dots}</span>}</div><p><Rich text={v}/></p></div>)}</div>
          </div>}

          {tips.length > 0 && <div className="rf-tips">{tips.map((t, i) => <div key={i} className={t.label === "Heads up" ? "warn" : "tip"}>
            <h3>{t.label === "Heads up" ? "Heads up ⚠️" : `${t.label} 💡`}</h3><p><Rich text={t.text}/></p></div>)}</div>}

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
                {sig !== null && <span className="rf-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{sig}</span>}
              </a></li>; })}</ul>
          </div>
          <div className="rf-vote"><p className="rf-vt">Played it? <a href="#reviews">Leave a review ↓</a></p><QuickVoteLine racketId={props.racketId} name={props.shortName} label="" wordsHref="#reviews" words={{ positive: "👍 yes", mixed: "🤷 mixed", negative: "👎 nope" }}/></div>
        </aside>
      </section>

      <section id="reviews" className="rv"><RacketReviews racketId={props.racketId} name={props.shortName} cards={cards}/></section>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from ${total} player reports · every source linked · `}
          <details><summary>how we read this</summary><span>{` We sort each report as positive, mixed or negative, count what players say, and give our honest take. Every claim needs 3+ players; quote marks only on their exact words. We don't test rackets and no brand pays for placement. `}{qt && <>Thin spot: <Rich text={qt.thinSpot}/></>}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">made by people who own too many rackets 🎾</p>
      </footer>
    </div>
  </main><V2Footer/></>;
}
