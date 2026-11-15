"use client";
// The racket page's fit check in the browser (speed batch, owner 2026-11-15: "making the picks is slow"). The page is rendered
// on the server for the address's picks; a tap changes the picks here and works out the verdict, the match % and the reasons
// from data sent once with the page (this racket's facts, the catalog's slim items: lib/fit-verdict.ts fitVerdict,
// lib/home-rank.ts matchPcts and alternatives, the same functions the server uses), then updates the address with no round
// trip. "What players said" comes in its four level views, worked out on the server.
import { createContext, useContext, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { fitVerdict, MIN_FIT_REPORTS, FEW_FIT_REPORTS, type FitFacts } from "../../../lib/fit-verdict";
import { factsWith, matchPcts, alternatives, type RankItem } from "../../../lib/home-rank";
import { choiceHref, readChoice, isDefault, LEVELS, STYLES, DEFAULT_CHOICE, type QuickChoice } from "../../../lib/quick-match";
import { fineWords } from "../../../lib/fine-tune";
import { niche } from "../../../lib/niche";
import AskPicks, { RememberPicks } from "./ask-picks";
import { cardLines, type CardContent } from "../../../lib/fit-card";

const STYLE_WORD: Record<QuickChoice["style"], string> = { any: "any", control: "control", balance: "balance", power: "power" };
const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const SETUP = { ...niche.finder!, levelGate: niche.fit?.levelGate };
const PICK_KEYS = ["style", "level", "arm"];

type Picks = { choice: QuickChoice; picked: boolean };
const Ctx = createContext<{ p: Picks; set: (p: Picks) => void; href: string } | null>(null);
const use = () => useContext(Ctx)!;
const fromLocation = (): Picks => { const q = Object.fromEntries(new URLSearchParams(location.search)); return { choice: readChoice(q), picked: PICK_KEYS.some(k => k in q) }; };

export function FitPicks({ first, href, children }: { first: Picks; href: string; children: ReactNode }) {
  const [p, setP] = useState(first);
  useEffect(() => { const on = () => setP(fromLocation()); addEventListener("popstate", on); return () => removeEventListener("popstate", on); }, []);
  const set = (next: Picks) => {
    setP(next);
    const h = choiceHref(next.choice, "");
    history.pushState(null, "", !next.picked ? href : h === "/" ? `${href}?style=any` : `${href}${h.slice(1)}`);
  };
  return <Ctx.Provider value={{ p, set, href }}>{children}</Ctx.Provider>;
}

/** The picks' address on this page, and a click that applies them here. */
function useGo() {
  const { set, href } = use();
  const at = (c: QuickChoice) => { const h = choiceHref(c, ""); return h === "/" ? `${href}?style=any` : `${href}${h.slice(1)}`; };
  const to = (c: QuickChoice | null) => ({ href: c ? at(c) : href, onClick: (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); set(c ? { choice: c, picked: true } : { choice: DEFAULT_CHOICE, picked: false });
  } });
  return to;
}

export function FitBack({ all }: { all: { href: string; label: string } }) {
  const { p } = use();
  return p.picked ? <a className="rf-back" href={choiceHref(p.choice)}>← back to your matches</a> : <a className="rf-back" href={all.href}>{all.label}</a>;
}

/** The fit-check box: the two questions, or the answer for the picks. */
/** A racket's fit-card content (lib/fit-card.ts) with the linked rackets' names and addresses. */
export type FitCard = CardContent & { links: Record<string, { href: string; name: string }> };

export function FitBox({ id, items, facts, hook, total, bestLine, levelDisagree, card }: { id: string; items: RankItem[]; facts: FitFacts;
  hook: { good: string; catch: string } | null; total: number; bestLine: string | null; levelDisagree?: string; card?: FitCard | null }) {
  const { p: { choice, picked }, set } = use(), to = useGo();
  const verdict = picked ? fitVerdict(choice, factsWith(items, choice, facts, id)) : null;
  // The answer box (owner 2026-11-15, Claude Design tweak): the same match % as the home (lib/match-score.ts), a plain-words
  // headline, one "why it fits" and one "what to consider", from the fit check's reasons and the quick-take lines.
  const pct = verdict ? matchPcts(items, choice, SETUP.levelGate).get(id) ?? null : null;
  const verdictWord = verdict && verdict.kind !== "thin" ? { good: "Strong fit", maybe: "Decent fit", no: "Weak fit" }[verdict.kind] : null;
  const why = verdict ? (verdict.fits?.slice(0, 2).join(" ") || (hook ? hook.good : null)) : null;
  const consider = verdict ? (verdict.catches?.[0] ?? (hook ? hook.catch : null)) : null;
  // Racket-specific lines when we have them (owner 2026-11-15: real strengths and concrete catches, no level bookkeeping):
  // 2 strengths and 1 catch on a clean fit, up to 2 otherwise; a hard conflict without a racket line keeps the fit check's reason.
  const lines = verdict && card && verdict.kind !== "thin" ? cardLines(card, choice, { maxCatches: verdict.kind === "good" ? 1 : 2, hard: verdict.kind === "no" ? verdict.reasons[0] : undefined }) : null;
  const hasCatch = lines ? !!(lines.lead || lines.catches.length) : !!consider;
  const headline = !verdict ? "" : verdict.kind === "good" ? (hasCatch ? "Yes, with one catch." : "Yes — a clean fit.") : verdict.kind === "maybe" ? "Maybe — try it first." : verdict.kind === "no" ? "Probably not this one." : "Not enough reports from players like you yet.";
  const gameWords = [choice.level, choice.style === "any" ? null : choice.style, choice.arm ? "sore arm" : null, ...fineWords(choice.fine)].filter((x): x is string => !!x);
  // With no picks, a tap starts from the defaults (any style / no level / no arm) but always lands on a picked page.
  const base = picked ? choice : DEFAULT_CHOICE;
  const pill = (label: string, next: QuickChoice, on: boolean) => <a {...to(next)} aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</a>;
  const box = (on: boolean) => <i className="rf-box" aria-hidden="true">{on ? "✓" : ""}</i>;
  return <div className={`rf-fit ${verdict ? `v-${verdict.kind}` : "ask"}`} id="fit">
    {!verdict ? <div className="rf-ask">
      <div className="rf-asktitle"><h2>Is this the right racket for you?</h2>
        <p>{`Two taps and we'll check it against ${total} player ${total === 1 ? "review" : "reviews"}.`}</p></div>
      <AskPicks onPick={c => set({ choice: c, picked: true })}/>
      {bestLine && <p className="rf-best"><b>Generally best for</b>{` ${bestLine}.`}</p>}
      {levelDisagree && <p className="rf-lvl">{levelDisagree}</p>}
    </div> : <div className="rf-ans" aria-live="polite">
      {choice.level && <RememberPicks style={choice.style} level={choice.level} arm={choice.arm}/>}
      <div className="rf-chipsrow"><span className="rf-k">⚡ your match</span>
        <span className={`rf-vpill ${verdict.kind}`} title="How well it fits your picks, from player reports. Not a % of happy players.">{pct === null ? "— · not enough reports yet" : `${pct}% match · ${verdictWord}`}</span>
          {verdict.kind !== "thin" && total < FEW_FIT_REPORTS && <span className="rf-few">{`based on fewer reports (${total})`}</span>}</div>
      <h2>{headline}</h2>
      <p className="rf-for">{verdict.kind === "thin" ? (total < MIN_FIT_REPORTS ? `Only ${total} player ${total === 1 ? "report" : "reports"} so far, too few to answer for your ${gameWords.join(" · ")} game. The bars below show what we know.` : `Players haven't said enough about what you picked yet. The bars below show what we know.`) : `For your ${gameWords.join(" · ")} game, here's the short answer.`}</p>
      {lines ? <>
        {lines.strengths.length > 0 && <div className="rf-blk ok"><p className="rf-bk">{verdict.kind === "no" ? "✓ What works" : "✓ Why it fits"}</p>
          <ul className="rf-lines">{lines.strengths.map(l => <li key={l.t}>{l.t}</li>)}</ul></div>}
        {hasCatch && <div className="rf-blk warn"><p className="rf-bk">↗ What to consider</p>
          <ul className="rf-lines">{lines.lead && <li>{lines.lead}</li>}{lines.catches.map(l => <li key={l.t}>{l.t}
            {l.note?.kind === "tip" && <span className="rf-note"><b>{`💡 ${l.note.tip.label}:`}</b>{` ${l.note.tip.t}`}</span>}
            {l.note?.kind === "alt" && card!.links[l.note.alt.slug] && <span className="rf-note">{"→ "}<a href={card!.links[l.note.alt.slug].href}>{l.note.alt.t}</a></span>}
          </li>)}</ul></div>}
      </> : <>
        {why && <div className="rf-blk ok"><p className="rf-bk">{verdict.kind === "no" ? "✓ What works" : "✓ Why it fits"}</p><p>{why}</p></div>}
        {consider && <div className="rf-blk warn"><p className="rf-bk">↗ What to consider</p><p>{consider}</p></div>}
      </>}
      {/* Edit: a CSS-only toggle (checkbox + label), so the pills open under the footer row as in the mockup. */}
      <input type="checkbox" id="rf-edit-t" className="rf-edit-t" aria-label="Edit your picks"/>
      <div className="rf-afoot"><span>{gameWords.map(w => w[0].toUpperCase() + w.slice(1)).join("  ·  ")}</span>
        <span className="rf-acts"><label htmlFor="rf-edit-t" className="rf-editl"><span className="o">edit ↗</span><span className="c">done ✓</span></label>
        <a {...to(null)} className="rf-reset">start over</a></span></div>
      <div className="rf-bar rf-editp">
        <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(st => <span key={st}>{pill(STYLE_WORD[st], { ...choice, style: st }, choice.style === st)}</span>)}</span>
        <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, choice.level === l)}</span>)}</span>
        <a {...to({ ...base, arm: !choice.arm })} aria-current={choice.arm ? "true" : undefined} className="rf-arm">{box(choice.arm)}sore arm</a>
      </div>
    </div>}
  </div>;
}

export type SaidView = { title: string; sub: string; badge: { n: number; label: string } | null; pos: number; mix: number; neg: number;
  takes: { id: string; text: string; verbatim: boolean; tone: string; who: string | null }[] };
const QUOTE_TAG: Record<string, [string, string]> = { positive: ["✓ Worked for them", "ok"], negative: ["✗ Not for them", "no"], mixed: ["~ Mixed feelings", "mix"] };

/** "What players said": everyone, or players at the picked level once 5+ of them stated it (four views from the server). */
export function FitSaid({ views }: { views: Record<string, SaidView> }) {
  const { p } = use(), v = views[p.picked && p.choice.level ? p.choice.level : "none"] ?? views.none;
  return <div>
    <div className="rf-h"><h2>{v.title}</h2><span>{v.sub}</span></div>
    <div className="rf-said">
      <div className="rf-sum">
        {v.badge && <div className="rf-badge" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in."><b>{v.badge.n}</b><span>{v.badge.label}</span></div>}
        {v.pos + v.mix + v.neg > 0 && <div className="rf-sumr"><div className="rf-sbar" role="img" aria-label={`${v.pos} positive, ${v.mix} mixed, ${v.neg} negative`}><i className="p" style={{ flex: v.pos }}/><i className="m" style={{ flex: v.mix }}/><i className="n" style={{ flex: v.neg }}/></div>
          <p className="rf-counts"><span>{`👍 ${v.pos} loved`}</span><span>{`🤷 ${v.mix} mixed`}</span><span>{`👎 ${v.neg} nope`}</span></p></div>}
      </div>
      {v.takes.length > 0 && <div className="rf-quotes">{v.takes.map(t => { const [tag, cls] = QUOTE_TAG[t.tone] ?? QUOTE_TAG.mixed; return <div key={t.id} className={cls}>
        <span>{tag}</span>
        <p>{t.verbatim ? `“${t.text}”` : t.text}</p>
        <small>{t.who}</small>
      </div>; })}</div>}
    </div>
  </div>;
}

export type AltCard = { name: string; href: string; pic: string | null; why: string | null; score: number | null };
/** "Better matches for you" with picks (the home list's order for them); "Similar rackets" without (from the server). */
export function FitAlts({ id, items, facts, cards, similar, brandLink, similarTitle }: { id: string; items: RankItem[]; facts: FitFacts; cards: Record<string, Omit<AltCard, "score">>;
  similar: AltCard[]; brandLink: { href: string; label: string } | null; similarTitle: string }) {
  const { p: { choice, picked } } = use();
  const verdict = picked ? fitVerdict(choice, factsWith(items, choice, facts, id)) : null;
  const picks = picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : "";
  const rows: AltCard[] = picked ? alternatives(items, SETUP, BAD, choice, id).flatMap(r => cards[r.id] ? [{ ...cards[r.id], score: r.pct }] : []) : similar;
  const title = !picked ? similarTitle : verdict?.kind === "good" ? "Also worth a look" : "Better matches for you";
  return <div>
    <div className="rf-h"><h2>{title}</h2>{picked ? <a href={choiceHref(choice)}>all →</a> : brandLink && <a href={brandLink.href}>{brandLink.label}</a>}</div>
    <ul className="rf-alts">{rows.map(r => <li key={r.href}><a href={`${r.href}${picks}`}>
      <span className="rf-apic">{r.pic ? <img src={r.pic} alt="" width={408} height={620} decoding="async" loading="lazy"/> : <span>{r.name.split(" ").slice(0, 2).join(" ")}</span>}</span>
      <span className="rf-abody"><b>{r.name}</b>{r.why && <span>{r.why}</span>}</span>
      {picked ? <span className="rf-score" title="How well it fits your picks, from player reports. Not a % of happy players.">{r.score === null ? "—" : `${r.score}%`}</span>
        : r.score !== null && <span className="rf-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{r.score}</span>}
    </a></li>)}</ul>
  </div>;
}
