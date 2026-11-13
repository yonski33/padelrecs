"use client";

import { useEffect, useMemo, useState } from "react";
import { niche } from "../../lib/niche";
import { decodeAnswers, encodeAnswers, fitsShape, matchFinder, visibleQuestions, type FinderMatch, type FinderProduct } from "../../lib/finder";
import { ProductIcon } from "../icons";

export type FinderCard = FinderProduct & {
  name: string; brand: string; href: string; line: string | null; own: string | null;
  amazonUrl: string | null; amazonImage: string | null; siteUrl: string | null; siteLabel: string | null; siteAffiliate: boolean;
  signal: number | null; category: string | null;
};


/** A result in the same row as the home page, rankings and catalogue (owner, 2026-11-13), plus the topics that matched. */
function Result({ match, rank }: { match: FinderMatch<FinderCard>; rank: number }) {
  const c = match.product;
  const shop = c.amazonUrl ? { url: c.amazonUrl, label: "Check price on Amazon", short: "Check Amazon price", rel: "sponsored nofollow noopener" }
    : c.siteUrl ? { url: c.siteUrl, label: c.siteLabel ?? "Visit site", short: c.siteLabel ?? "Visit site", rel: c.siteAffiliate ? "sponsored nofollow noopener" : "noopener" } : null;
  const judged = c.positive + c.mixed + c.negative;
  const img = c.own ?? c.amazonImage;
  return <li className="lt-slot">
    <div className="lt-row v2">
      <span className="lt-rank">{`#${rank}`}</span>
      <span className="lt-art">{img ? <span className="art"><img src={img} alt="" loading="lazy"/></span> : <span className="art art-none"><ProductIcon shape={c.shape} brand={c.brand}/></span>}</span>
      <span className="lt-body">
        <a className="lt-name" href={c.href}>{c.name}</a>
        {c.line && <span className="lt-line">{c.line}</span>}
        {(match.reasons.length > 0 || match.watch) && <span className="lt-extra lf-tags">
          {match.reasons.map(r => <span key={r.tag} className="lf-tag pos">{r.tag}<b>{r.count}</b></span>)}
          {match.watch && <span className="lf-tag neg">{match.watch.tag}<b>{match.watch.count}</b></span>}
        </span>}
        {shop && <a className="lt-shop" href={shop.url} target="_blank" rel={shop.rel}>{shop.label} <span aria-hidden="true">›</span></a>}
      </span>
      <span className="lt-sig">{c.signal ? <><b>{c.signal}</b><small>Signal score</small></> : <small>new</small>}</span>
      <span className="lt-posbar">{judged > 0 && <><span className="lt-posn">{`${c.positive} positive ${c.positive === 1 ? "review" : "reviews"}`}</span>
        <span className="sbar"><span className="sbar-track" role="img" aria-label={`${c.positive} positive, ${c.mixed} mixed, ${c.negative} negative`}>
          {c.positive > 0 && <i className="s-positive" style={{ width: `${c.positive / judged * 100}%` }}/>}
          {c.mixed > 0 && <i className="s-mixed" style={{ width: `${c.mixed / judged * 100}%` }}/>}
          {c.negative > 0 && <i className="s-negative" style={{ width: `${c.negative / judged * 100}%` }}/>}
        </span></span></>}</span>
      <a className="lt-total" href={`${c.href}#reviews`}><b>{c.reviews.toLocaleString("en-US")}</b><span>{c.reviews === 1 ? "review" : "reviews"}</span></a>
    </div>
  </li>;
}

export function FinderFlow({ cards, negativeTags }: { cards: FinderCard[]; negativeTags: string[] }) {
  const finder = niche.finder!, questions = finder.questions;
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [step, setStep] = useState(0);
  // A shared link carries the answers (?a=01210), so it opens straight on the results.
  useEffect(() => {
    const saved = decodeAnswers(new URLSearchParams(window.location.search).get("a"), finder);
    const shown = visibleQuestions(finder, saved);
    if (shown.every(i => saved[i] !== null)) { setAnswers(saved); setStep(shown.length); }
  }, [finder]);
  // Which questions apply depends on the answers so far; `step` counts through these.
  const shown = useMemo(() => visibleQuestions(finder, answers), [finder, answers]);
  const done = step >= shown.length;
  const given = useMemo(() => shown.flatMap(i => answers[i] === null ? [] : [questions[i].options[answers[i]!]]), [shown, answers, questions]);
  const matches = useMemo(() => done ? matchFinder(cards, given, negativeTags, undefined, finder.rankWeight) : [], [done, cards, given, negativeTags, finder.rankWeight]);
  const shapes = given.flatMap(o => o.shapes ?? []);
  const offShape = shapes.length > 0 && matches.some(m => !fitsShape(m.product.shape, shapes));
  const remember = (next: (number | null)[], finished: boolean) => {
    const url = new URL(window.location.href);
    if (finished) url.searchParams.set("a", encodeAnswers(next)); else url.searchParams.delete("a");
    window.history.replaceState(null, "", url);
  };
  const choose = (option: number) => {
    const current = shown[step];
    const picked = answers.map((a, i) => i === current ? option : a);
    // A changed answer can retire later questions, so their old answers go too.
    const applies = visibleQuestions(finder, picked);
    const next = picked.map((a, i) => applies.includes(i) ? a : null);
    setAnswers(next); setStep(step + 1); remember(next, step + 1 >= applies.length);
  };
  const restart = () => { const blank = questions.map(() => null); setAnswers(blank); setStep(0); remember(blank, false); };

  if (done) return <section className="finder-results" aria-live="polite">
    <div className="finder-summary">
      <h2>{`Your best ${matches.length === 1 ? "match" : "matches"}`}</h2>
      {offShape && <p>{`Not enough ${niche.words.many} of that kind qualify yet, so these are the closest matches overall.`}</p>}
      <button type="button" className="finder-link" onClick={restart}>Start again</button>
    </div>
    <ol className="lt-list lf-list">{matches.map((m, i) => <Result key={m.product.id} match={m} rank={i + 1}/>)}</ol>
  </section>;

  const q = questions[shown[step]];
  return <section className="finder-card" aria-live="polite">
    <div className="finder-progress" role="progressbar" aria-valuemin={1} aria-valuemax={shown.length} aria-valuenow={step + 1} aria-label={`Question ${step + 1} of ${shown.length}`}>
      {shown.map((x, i) => <i key={x} className={i <= step ? "on" : undefined}/>)}
    </div>
    {/* The total isn't known until the first answer on finders with follow-up questions. */}
    <p className="finder-count">{step === 0 && questions.some(x => x.onlyIf) ? "Question 1" : `Question ${step + 1} of ${shown.length}`}</p>
    <h2>{q.question}</h2>
    <div className="finder-options">
      {q.options.map((o, i) => <button key={o.label} type="button" aria-pressed={answers[shown[step]] === i} onClick={() => choose(i)}>
        <b>{o.label}</b>{o.hint && <span>{o.hint}</span>}
      </button>)}
    </div>
    {step > 0 && <button type="button" className="finder-link" onClick={() => setStep(step - 1)}>← Back</button>}
  </section>;
}
