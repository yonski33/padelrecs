"use client";
// The SkinRecs v11c product page in the browser (app/skin/skin-v11.tsx renders the rest). The picks live in the address
// (?skin=&goal=&sens=1&acne=1, the same as the home's quick match), so a page opened from the home already has its answer; a
// tap re-runs the answers here with no request (app/instant-view.ts). The last answers also stay in this browser, so "use my
// last answers" fills them in on the next product. Filters and picks stay client-side (owner rule).
import { skinSuitsLine } from "../../lib/suits-line";
import { useEffect, useState, type ReactNode } from "react";
import { useInstantView, instantClick } from "../instant-view";
import { productView, type ProductInput, type Listed } from "./product-view";
import { betterOf, othersOf, ranked, type SkinPeers } from "./skin-v11-view";
import { attrProfileFor } from "../../lib/attr-profile";
import { niche } from "../../lib/niche";
import { SKIN_TYPES, GOALS, readSkinChoice, skinHref, type SkinChoice } from "../../lib/skin-choice";
import { matchTone, scoreTone } from "../../lib/score-tone";
import { fitStep } from "../../lib/verdict-scale";
import { SAVED_PICKS_KEY } from "../../lib/saved-picks";
import type { Viz } from "./product-compare";

const types = niche.typePages ?? [];
const word = (n: number) => fitStep(n).word;
/** The fit card's headline (owner's skin mock; no em dashes). */
const HEAD = { good: "Yes, a good fit for your skin.", note: "Yes, with one note.", maybe: "Maybe, sample it first.", no: "Probably not this one.",
  thin: "Not enough reports from skin like yours yet." } as const;
/** "Matched for dry, sensitive skin" (owner: never a bare "Dry"). */
const matchedFor = (c: SkinChoice) => `Matched for ${[c.skin, c.concerns.includes("sensitive") ? "sensitive" : null, c.concerns.includes("acne") ? "acne-prone" : null].filter(Boolean).join(", ")} skin`;
type Saved = { skin: string; goal: string; sens: boolean; acne: boolean };

const Pic = ({ pic, name, w, h }: { pic: string | null; name: string; w: number; h: number }) => pic ? <img src={pic} alt="" width={w} height={h} loading="lazy" decoding="async"/>
  : <span className="sv-tile">{name.split(" ").slice(0, 2).join(" ")}</span>;
const Pill = ({ pct }: { pct: number }) => <span className={`sv-pill ${matchTone(pct)}`}>{`${pct}% · ${word(pct)}`}</span>;
const UserScore = ({ score }: { score: number | null }) => <span className="sv-oscore"><b className={scoreTone(score)}>{score ?? "new"}</b><span>user score</span></span>;

export function SkinV11Live({ input, peers, choice: first, summary, buy, self, hero, inside, reviews, tiles }: { input: ProductInput; peers: SkinPeers; choice: SkinChoice;
  summary: string | null; buy: { url: string; label: string; rel: string } | null; self: { name: string; pic: string | null; score: number | null; line: string | null; slug: string };
  hero: ReactNode; inside: ReactNode; reviews: ReactNode; tiles: ReactNode }) {
  const profile = attrProfileFor(niche)!;
  const at = (c: SkinChoice) => skinHref({ ...c, type: null, typeSlug: null }, input.here, "#sv-hero");
  const [choice, set] = useInstantView(first, q => readSkinChoice(Object.fromEntries(q), types), at, "replace");
  const v = productView(profile, input, choice);
  const { kind, pct } = v, goal = choice.goal, sensOn = choice.concerns.includes("sensitive"), acneOn = choice.concerns.includes("acne");
  const rows = v.answered ? ranked(profile, peers, choice) : null;
  const better = rows ? betterOf(rows, pct) : [];
  const others = better.length ? [] : othersOf(profile, peers, choice, rows);

  // The last answers in this browser (shared with the next product page); read after the first render so the HTML matches.
  const [saved, setSaved] = useState<Saved | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(SAVED_PICKS_KEY) || "null"); if (s && SKIN_TYPES.includes(s.skin) && GOALS.includes(s.goal)) setSaved(s); } catch { /* storage off */ } }, []);
  useEffect(() => { if (!choice.skin || !choice.goal) return;
    try { localStorage.setItem(SAVED_PICKS_KEY, JSON.stringify({ skin: choice.skin, goal: choice.goal, sens: sensOn, acne: acneOn })); } catch { /* storage off */ } }, [choice.skin, choice.goal, sensOn, acneOn]);

  const go = (next: SkinChoice, cls: string, on?: boolean) => ({ href: at(next), onClick: instantClick(() => set(next)), className: cls, "aria-current": on ? "true" as const : undefined });
  const pill = (label: string, next: SkinChoice, on: boolean, small = false) => <a key={label} {...go(next, `bp-pick${on ? " on" : ""}${small ? " sm" : ""}`, on)}>{label}</a>;
  const tick = (k: "sensitive" | "acne", on: boolean) => ({ ...choice, concerns: on ? choice.concerns.filter(x => x !== k) : [...choice.concerns, k], noConcerns: false });
  const typesRow = (small = false) => SKIN_TYPES.map(k => pill(k, { ...choice, skin: k }, choice.skin === k, small));
  const goalsRow = (small = false) => GOALS.map(g => pill(g, { ...choice, goal: g }, goal === g, small));
  const ticks = (small = false) => <>{([["sensitive", sensOn, "sensitive"], ["acne", acneOn, "acne-prone"]] as const).map(([k, on, label]) =>
    <a key={k} {...go(tick(k, on), `bp-sens${small ? " sm" : ""}`, on)}><i>{on ? "✓" : ""}</i>{label}{!small && <span> (optional)</span>}</a>)}</>;
  const start = readSkinChoice({}, types);
  const fromSaved = (s: Saved) => ({ ...start, skin: s.skin, goal: s.goal as SkinChoice["goal"], concerns: [...(s.sens ? ["sensitive"] : []), ...(s.acne ? ["acne"] : [])] });
  // A poor match says why it suits only when a Why yes point meets these picks (never "keeps dry skin comfortable" to oily skin).
  const why = kind === "no" && !v.yesL.some(x => x.forYou) ? null : v.why;
  const headline = !kind ? "" : kind === "good" ? (v.consider ? HEAD.note : HEAD.good) : HEAD[kind];
  const picksQ = (href: string) => `${href}${at(choice).replace(/^[^?#]*/, "").replace(/#.*$/, "")}`;

  // ── How it feels: the skin mock's drop rows (For your skin, Hydration, Gentleness, Clog-free), the texture slider and price.
  const feel = v.self.filter(r => !/^For /.test(r.name) && !/^Finish/.test(r.name));
  const forDrops = pct !== null ? Math.max(1, Math.round(pct / 20)) : 0;

  return <>
    <a className="bp-back" href={v.backHref}>{v.backLabel}</a>
    <section id="sv-hero" className="bp-hero sv-hero">
      {hero}
      <div className="bp-check">
        {!v.answered ? <div className="bp-ask">
          <div className="sv-askh"><span className="bp-tag">✦ skin check</span>
            {saved && <a {...go(fromSaved(saved), "sv-last")}>↺ use my last answers</a>}</div>
          <div><div className="bp-q">Is this right for <em>your</em> skin?</div>
            <div className="bp-sub">Two taps, the same answers as the home page match.</div></div>
          <div className="bp-steps">
            <div><span className="bp-sl">1. Your skin type</span><div className="bp-picks">{typesRow()}</div></div>
            <div><span className="bp-sl">2. Your goal</span><div className="bp-picks">{goalsRow()}</div></div>
            <div className="sv-ticks">{ticks()}</div>
          </div>
          {skinSuitsLine(v.bestFor) && <div className="bp-best">{skinSuitsLine(v.bestFor)}</div>}
        </div> : <div className="bp-ans" aria-live="polite">
          <div className="bp-ansh"><span className="bp-tag">✦ your match</span>
            {pct !== null ? <Pill pct={pct}/> : <span className="sv-pill">not enough reports</span>}</div>
          <div className="bp-q big">{headline}</div>
          {why && <div className="bp-why"><span>✓ Why it suits you</span><p>{why}</p></div>}
          {v.consider && <div className="bp-know"><span>◦ Worth knowing</span><p>{v.consider}{v.considerAlt && <> Try instead: <a href={v.considerAlt.href}>{v.considerAlt.name}</a>.</>}</p></div>}
          <input type="checkbox" id="bp-edit" className="bp-edit-t" aria-label="Edit your answers"/>
          <div className="bp-foot"><span>{matchedFor(choice)}</span>
            <span><label htmlFor="bp-edit" className="bp-editl"><span className="o">edit</span><span className="c">done ✓</span></label>{" · "}<a href={input.here} onClick={instantClick(() => set(start))}>start over</a></span></div>
          <div className="bp-editp"><div className="bp-picks">{typesRow(true)}</div><div className="bp-picks">{goalsRow(true)}</div><div className="bp-picks">{ticks(true)}</div></div>
        </div>}
      </div>
    </section>

    {better.length > 0 && <section className="sv-better" id="alternatives-top" aria-label="Better matches for your skin">
      <div className="sv-sh"><h2>Better matches for your skin</h2><span>this one isn&apos;t your best pick</span></div>
      <div className="sv-brow">{better.map(r => { const c = peers.cards[r.id]; return <div key={r.id} className="sv-bcard">
        <span className="sv-bpic"><Pic pic={c.pic} name={c.name} w={64} h={84}/></span>
        <div className="sv-bbody"><a className="sv-stretch" href={picksQ(c.href)}><b>{c.name}</b></a>
          {r.pct !== null && <Pill pct={r.pct}/>}
          {c.line && <span className="sv-bline">{c.line}</span>}
          {c.shop && <a className="sv-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}</div></div>; })}</div>
      <a className="sv-curious" href="#yes-no">Still curious about this one? Why yes, why not ↓</a>
    </section>}

    {!v.answered && (v.bottom ?? summary) && <p className="sv-bottom"><span className="bp-tag">the bottom line</span><b>{v.bottom ?? summary}</b></p>}

    {v.few ? <section id="yes-no" className="sv-yn-few"><div className="sv-sh"><h2>Why yes, why not</h2></div>
      <p>Few reports so far, not enough to say who it suits. The reviews below are the evidence so far.</p></section>
    : (v.yesL.length > 0 || v.noL.length > 0) && <section id="yes-no">
      {/* No heading (owner 2026-11-18): the boxes say Why yes / Why not; the source line sits small, right, above them. */}
      <p className="sv-ysrc">from forums, YouTube &amp; reviews</p>
      <div className="sv-yn">{([["yes", "Why yes", "✓", v.yesL], ["no", "Why not", "!", v.noL]] as const).map(([k, label, icon, list]) => list.length > 0 &&
        <div key={k} className={`sv-ycol ${k}`}><h3 className="sv-ych"><i aria-hidden="true">{icon}</i>{label}</h3>
          {list.slice(0, 3).map(p => <Point key={`${p.key}-${p.forYou}`} p={p}/>)}</div>)}</div>
    </section>}

    {feel.length > 0 && <section id="feels" className="sv-feels" aria-labelledby="sv-feels-t">
      <h2 id="sv-feels-t">How it feels</h2>
      <div className="sv-fgrid">
        <div className="sv-frow"><span className="sv-fh"><b>For your skin</b><small>{pct !== null ? `${pct}%` : v.answered ? "few reports" : "take the skin check"}</small></span>
          <Drops n={forDrops}/><span className="sv-fn">{pct !== null ? (v.consider ?? why ?? matchedFor(choice)) : "Answer two questions above to fill this in."}</span></div>
        {feel.map(r => <div key={r.name} className="sv-frow"><span className="sv-fh"><b>{r.name.replace(/ \(.*\)$/, "")}</b>{r.v?.kind === "drops" && <small>{`${r.v.n}/5`}</small>}</span>
          <FeelViz v={r.v}/><span className="sv-fn">{r.note === "price band" ? priceNote(r.v) : r.note}</span></div>)}
      </div>
    </section>}

    {inside}

    {others.length > 0 && <section className="sv-sec" id="alternatives">
      <div className="sv-sh"><h2>{rows ? "Other products for your skin" : "Other products to consider"}</h2><span>{rows ? "the best fits for your answers, by match" : "similar, and as well liked"}</span></div>
      <div className={`sv-others ${others.length > 1 ? "two" : "one"}`}>{others.map(o => { const c = peers.cards[o.id]; return <article key={o.id} className="sv-ocard">
        <a className="sv-opic" href={picksQ(c.href)} tabIndex={-1} aria-hidden="true"><Pic pic={c.pic} name={c.name} w={72} h={96}/></a>
        <div className="sv-obody">
          <div className="sv-otop"><a className="sv-oname" href={picksQ(c.href)}>{c.name}</a>{o.pct !== null ? <Pill pct={o.pct}/> : <UserScore score={c.score}/>}</div>
          <p className="sv-gain">{`✓ ${o.gain}`}</p><p className="sv-give">{`↗ ${o.give}`}</p>
          {c.shop && <a className="sv-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
        </div></article>; })}</div>
    </section>}

    {reviews}

    <section className="sv-decide" aria-label="Still deciding?">
      <div className="sv-dl"><span className="sv-dpic">{self.pic ? <img src={self.pic} alt="" width={50} height={70} loading="lazy" decoding="async"/> : null}</span>
        <span className="sv-dk">Still deciding?</span><b className="sv-dn">{self.name}</b>
        <span className="sv-dv">{pct !== null ? <Pill pct={pct}/> : <><UserScore score={self.score}/>{self.line && <span className="sv-dline">{self.line}</span>}</>}</span></div>
      <div className="sv-dlinks">
        {buy && <a href={buy.url} target="_blank" rel={buy.rel}>check price ↗</a>}
        <a href={`/compare?ids=${encodeURIComponent(self.slug)}`}>compare with another product →</a>
        <a href="#played" onClick={toPlayed}>tried it? add your verdict →</a>
      </div>
    </section>

    {tiles}

    {buy && <div className="sv-bar" aria-label="Your match">{pct !== null && <Pill pct={pct}/>}<a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a></div>}
  </>;
}

/** A Why yes / why not point: the title with + / −, open when it's "for your skin". */
function Point({ p }: { p: Listed }) {
  return <details className={`sv-yit${p.forYou ? " you" : ""}`} open={p.forYou}>
    <summary><b>{p.title}</b>{p.forYou && <span className="bp-tag sm">for your skin</span>}<i aria-hidden="true"/></summary>
    <p>{p.pre}<mark>{p.hl}</mark>{p.post}</p>
    {p.tip && <p className="sv-tip"><b>Tip:</b> {p.tip}</p>}
    {p.alt && <p className="sv-tip"><b>Try instead:</b> <a href={p.alt.href}>{p.alt.name}</a>. {p.alt.t}</p>}
  </details>;
}
const Drops = ({ n }: { n: number }) => <span className="sv-drops" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map(k => <i key={k} className={k <= n ? "on" : undefined}/>)}</span>;
function FeelViz({ v }: { v: Viz }) {
  if (!v) return <span className="sv-fnone">not enough said yet</span>;
  if (v.kind === "drops") return <Drops n={v.n}/>;
  if (v.kind === "axis") return <span className="sv-axis"><span className="sv-track"><i style={{ left: `${Math.max(4, Math.min(96, v.pct))}%` }}/></span><span className="sv-ends"><span>light</span><span>rich</span></span></span>;
  return <span className="sv-price" aria-label={`price ${v.text}`}>{["$", "$", "$"].map((d, i) => <span key={i} className={i < v.text.length ? "on" : undefined}>{d}</span>)}</span>;
}
const priceNote = (v: Viz) => v?.kind === "text" ? ({ $: "Budget: under about $15.", $$: "Mid-range: about $15 to $40.", $$$: "A splurge: over about $40." } as Record<string, string>)[v.text] ?? "Price band." : "Price band.";

/** "tried it? add your verdict →": a smooth scroll to the "Tried it?" box and focus on its first button (as padel's). */
function toPlayed(e: React.MouseEvent<HTMLAnchorElement>) {
  const box = document.getElementById("played"); if (!box) return;
  e.preventDefault();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  box.querySelector<HTMLButtonElement>(".rv-prow button")?.focus({ preventScroll: true });
  window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 90), behavior: still ? "auto" : "smooth" });
  try { history.replaceState(null, "", "#played"); } catch { /* sandboxed */ }
}
