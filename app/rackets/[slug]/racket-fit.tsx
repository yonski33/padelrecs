import type { ReactNode } from "react";
import Link from "next/link";
import "./racket-fit.css";
import { spans, sentimentWords, type QuickTake } from "../../../lib/quick-take";
import { fitVerdict, bestFor, levelBacking, levelSources } from "../../../lib/fit-verdict";
import { quickMatch, choiceHref, isDefault, LEVELS, STYLES, DEFAULT_CHOICE, type QuickChoice } from "../../../lib/quick-match";
import { matchContext } from "../../match-context";
import { reportLevels } from "../../../db/report-levels";
import { platformName } from "../../../lib/source-label";
import { phraseSegments } from "../../../lib/highlights";
import { displayName } from "../../../lib/brand-name";
import { productHref } from "../../../lib/niche";
import { shopPhoto, photoHidden } from "../../../lib/shop-photos";
import { amazonPhoto } from "../../../lib/amazon-photos";
import QuickTakeComposer, { QuickVoteLine } from "./quick-take-composer";
import type { QtReport, QtReview } from "./quick-take";

/** The racket fit page (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md; Claude Design layout, our data): a tight page with
 *  the important things and our recommendation. One fit-check box with two states: no picks asks "Is this the right racket
 *  for you?"; picks from the URL (?style=&level=&arm=1, the same as the home's quick match) get a verdict from
 *  lib/fit-verdict.ts. Shown for products with a quick-take block; the canonical stays the bare URL. */

function Rich({ text }: { text: string }) {
  return <>{spans(text).map((s, i) => s.mark || s.b ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>)}</>;
}
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
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
  const pills = <>
    <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{(picked ? pill : pickPill)(STYLE_WORD[s], { ...base, style: s }, picked && choice.style === s)}</span>)}</span>
    <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{(picked ? pill : pickPill)(l, { ...base, level: l }, picked && choice.level === l)}</span>)}</span>
    {(picked ? pill : pickPill)(`${picked && choice.arm ? "☑" : "☐"} ${picked ? "sore arm" : "I have a sore elbow / wrist"}`, { ...base, arm: !(picked && choice.arm) }, picked && choice.arm)}
  </>;

  // Six trait lines: the quick-take's own lines where it has them, else what the tag counts say. Text only, no dots.
  const row = (label: string) => qt?.plays?.rows.find(r => r.label.toLowerCase() === label.toLowerCase());
  const lineOf = (r?: { key?: string; line: string }) => r ? r.line : null;
  const tagLine = (tag: string, say: string) => (facts.tags[tag] ?? 0) >= 3 ? `${facts.tags[tag]} players ${say}.` : null;
  const traits = [
    ["Forgiveness", lineOf(row("Sweet spot")) ?? tagLine("forgiving", "call it forgiving")],
    ["Power", lineOf(row("Power")) ?? tagLine("easy power", "mention easy power")],
    ["Control", lineOf(row("Control")) ?? tagLine("good control", "praise the control")],
    ["Defence", qt?.plays?.court?.defence?.line ?? tagLine("great in defence", "say it's great in defence")],
    ["Arm comfort", lineOf(row("Comfort")) ?? ((facts.tags["arm-friendly"] ?? 0) + (facts.tags["vibrates on mishits"] ?? 0) >= 3 ? `${facts.tags["arm-friendly"] ?? 0} players call it arm-friendly, ${facts.tags["vibrates on mishits"] ?? 0} mention vibration.` : null)],
    ["Speed", lineOf(row("Handling")) ?? tagLine("fast at the net", "call it fast at the net")],
  ].filter((t): t is [string, string] => !!t[1]);

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
  const levelWord = choice.level === "advanced" ? "advanced players" : `${choice.level}s`;
  const tips = qt?.tips.slice(0, 2) ?? [];
  const total = reports.length;

  return <main className={`rf ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-strip">a free, ad-light side project · built by padel players · <a href="#how-we-read">how we make these →</a></div>
    <div className="rf-wrap">
      {picked ? <a className="rf-back" href={choiceHref(choice)}>← back to your matches</a> : props.crumbs}
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{props.photo ? <img src={props.photo} alt={props.name}/> : <span className="rf-tile">{props.shortName}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[props.shape, String(props.year)].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}</div>
            <h1>{`${props.shortName} review`}</h1>
            <p className="rf-name">{props.shortName}</p>
            {(qt || props.line) && <p className="rf-hook">{qt ? `${qt.hook.good} ${qt.hook.catch}` : props.line}</p>}
            <div className="rf-meta">
              {props.buy && <a className="rf-btn" href={props.buy.url} target="_blank" rel={props.buy.rel}>{props.buy.label} ↗</a>}
              <span>{`${total} player reports${mood ? ` · ${mood}` : ""}`}</span>
            </div>
            {props.buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>

        <div className={`rf-fit ${verdict ? `v-${verdict.kind}` : "ask"}`} id="fit">
          {!verdict ? <div className="rf-ask">
            <h2>Is this the right racket for you?</h2>
            <p>{`Two taps. We'll check it against ${total} player reports.`}</p>
            <div className="rf-grid"><span>I want</span><div>{pills}</div></div>
            {bestFor(facts).length > 0 && <p className="rf-best"><span>generally best for:</span>{bestFor(facts).map(b => <b key={b}>{b}</b>)}</p>}
            {backing && <p className="rf-lvl">{`level: ${backing}`}{maker && <> · <a href={maker.url} target="_blank" rel="noopener nofollow">brand page ↗</a></>}</p>}
          </div> : <>
            <div className="rf-bar"><span className="rf-k">fit check</span>{pills}</div>
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

      <div className="rf-body">
        <div className="rf-main">
          <section>
            <div className="rf-h"><h2>{levelView ? `What ${levelWord} said` : "What players said"}</h2><span>{levelView ? `${said.length} of ${total} reports are from ${levelWord}` : `all ${total} reports`}</span></div>
            <div className="rf-said">
              <div className="rf-sbar" role="img" aria-label={`${pos} positive, ${mix} mixed, ${neg} negative`}><i className="p" style={{ flex: pos }}/><i className="m" style={{ flex: mix }}/><i className="n" style={{ flex: neg }}/></div>
              <p className="rf-counts"><span>{`👍 ${pos} liked it`}</span><span>{`🤷 ${mix} mixed`}</span><span>{`👎 ${neg} not for them`}</span></p>
              {takes.length > 0 && <div className="rf-quotes">{takes.map(t => ({ t, ok: t.ok })).map(({ t, ok }) => <div key={t.id}>
                <span className={ok ? "ok" : "no"}>{ok ? "✓ worked for them" : "✗ not for them"}</span>
                <p>{t.verbatim ? `“${t.text}”` : t.text}</p>
                <small>{who(t.id)}</small>
              </div>)}</div>}
            </div>
          </section>

          {traits.length > 0 && <section>
            <h2 className="rf-h2">How it plays</h2>
            <div className="rf-traits">{traits.map(([k, v]) => <div key={k}><b>{k}</b><p><Rich text={v}/></p></div>)}</div>
          </section>}

          {tips.length > 0 && <section className="rf-tips">{tips.map((t, i) => <div key={i} className={t.label === "Heads up" ? "warn" : "tip"}>
            <h3>{t.label === "Heads up" ? "Heads up ⚠️" : `${t.label} 💡`}</h3><p><Rich text={t.text}/></p></div>)}</section>}

          {props.specs.length > 0 && <section><h2 className="rf-h2">Specs</h2><p className="rf-specs">{props.specs.map(s => <span key={s}>{s}</span>)}</p></section>}

          <details className="rf-all" id="community">
            <summary>{reviews.length ? `See all ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} from players here, or add yours` : "Add your take"}</summary>
            <QuickTakeComposer racketId={props.racketId} name={props.shortName} tags={props.tags} nicknames={props.nicknames} hasReviews={reviews.length > 0}/>
            {reviews.length > 0 && <ul className="rf-cms">{reviews.map(r => {
              const segs = r.highlights?.length ? phraseSegments(r.reviewText, r.highlights) : [{ text: r.reviewText }];
              return <li key={r.id}><p className="rf-cmh"><b>{r.alias || `A ${props.site} player`}</b>{[r.playerLevel, day(r.createdAt)].filter(Boolean).join(" · ")}</p>
                <p>{segs.map((s, i) => s.tone ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>)}</p></li>;
            })}</ul>}
          </details>
        </div>

        <aside className="rf-side">
          <section>
            <div className="rf-h"><h2>{picked && !isDefault(choice) ? "Better matches for you" : "Players also rate"}</h2><a href={choiceHref(picked ? choice : DEFAULT_CHOICE)}>all →</a></div>
            <ul className="rf-alts">{others.map(m => { const r = racketOf(m.product.id), sig = ctx.signal(r.id), pic = photoOf(r), top = m.reasons[0];
              const why = top ? `${top.tag} · ${top.count} players` : ctx.takes.get(r.id)?.hook ?? null;
              return <li key={r.id}><a href={`${productHref(r)}${picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : ""}`}>
                <span className="rf-apic">{pic ? <img src={pic} alt="" loading="lazy"/> : <span>{displayName(r.name, brand(r.brandId)).split(" ").slice(0, 2).join(" ")}</span>}</span>
                <span className="rf-abody"><b>{displayName(r.name, brand(r.brandId))}</b>{why && <span>{why}</span>}</span>
                {sig !== null && <span className="rf-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{sig}</span>}
              </a></li>; })}</ul>
          </section>
          <section className="rf-vote"><h2>Played it? One tap.</h2><QuickVoteLine racketId={props.racketId} name={props.shortName} label=""/></section>
        </aside>
      </div>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from ${total} player reports · every source linked · `}
          <details><summary>how we read this</summary><span>{` We sort each report as positive, mixed or negative, count what players say, and give our honest take. Every claim needs 3+ players; quote marks only on their exact words. We don't test rackets and no brand pays for placement. `}{qt && <>Thin spot: <Rich text={qt.thinSpot}/></>}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">made by people who own too many rackets 🎾</p>
      </footer>
    </div>
  </main>;
}
