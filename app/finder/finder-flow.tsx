"use client";

import { useEffect, useMemo, useState } from "react";
import { niche } from "../../lib/niche";
import { decodeAnswers, encodeAnswers, fitsShape, matchFinder, visibleQuestions, type FinderMatch, type FinderProduct } from "../../lib/finder";
import { ProductIcon } from "../icons";

export type FinderCard = FinderProduct & {
  name: string; brand: string; href: string; line: string | null; own: string | null;
  amazonUrl: string | null; amazonImage: string | null; siteUrl: string | null; siteLabel: string | null; siteAffiliate: boolean;
};

const pct = (n: number, total: number) => `${n / total * 100}%`;

function Result({ match, rank }: { match: FinderMatch<FinderCard>; rank: number }) {
  const c = match.product;
  const parts = [["positive", c.positive], ["mixed", c.mixed], ["negative", c.negative]] as const;
  const label = parts.filter(([, n]) => n).map(([s, n]) => `${n} ${s}`).join(", ");
  return <li className="top-entry">
    <span className="top-rank" aria-label={`Match ${rank}`}>{rank}</span>
    {c.own ? <a className="thumb top-thumb own" href={c.href} aria-hidden="true" tabIndex={-1}><img src={c.own} alt="" loading="lazy"/></a> : c.amazonImage
      ? <a className="thumb top-thumb photo" href={c.href} aria-hidden="true" tabIndex={-1}><img src={c.amazonImage} alt="" loading="lazy"/></a>
      : <a className="thumb top-thumb" href={c.href} aria-hidden="true" tabIndex={-1}><ProductIcon shape={c.shape} brand={c.brand}/></a>}
    <div className="top-body">
      <div className="top-head"><h2><a className="racket-link" href={c.href}><span className="model">{c.name}</span></a></h2></div>
      {c.amazonUrl
        ? <a className="top-amazon" href={c.amazonUrl} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon<span aria-hidden="true"> ↗</span></a>
        : c.siteUrl && <a className="top-amazon" href={c.siteUrl} target="_blank" rel={c.siteAffiliate ? "sponsored nofollow noopener" : "noopener"}>{c.siteLabel}<span aria-hidden="true"> ↗</span></a>}
      {c.line && <p className="top-line">{c.line}</p>}
      <div className="top-split">
        <div className="stack" role="img" aria-label={label}>
          {parts.map(([s, n]) => n ? <i key={s} className={`s-${s}`} style={{ width: pct(n, c.reviews) }}/> : null)}
        </div>
        <p className="top-stat" title={label}><b>{c.positive} positive</b> out of {c.reviews} reviews</p>
      </div>
      {(match.reasons.length > 0 || match.watch) && <div className="tags">
        {match.reasons.map(r => <span key={r.tag} className="tag pos">{r.tag}<span className="c">{r.count}</span></span>)}
        {match.watch && <span className="tag neg">{match.watch.tag}<span className="c">{match.watch.count}</span></span>}
      </div>}
      <a className="top-more" href={c.href}>{`Read all ${c.reviews} reviews →`}</a>
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
    <ol className="top-list">{matches.map((m, i) => <Result key={m.product.id} match={m} rank={i + 1}/>)}</ol>
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
