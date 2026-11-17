"use client";
// The racket page's fit check in the browser (speed batch, owner 2026-11-15: "making the picks is slow"). The page is rendered
// on the server for the address's picks; a tap changes the picks here and works out the verdict, the match % and the reasons
// from data sent once with the page (this racket's facts, the catalog's slim items: lib/fit-verdict.ts fitVerdict,
// lib/home-rank.ts matchPcts and alternatives, the same functions the server uses), then updates the address with no round
// trip. "What players said" comes in its four level views, worked out on the server.
import { V11_HEADLINES } from "../../../lib/v11-words";
import { ownScore } from "../../../lib/niche";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useInstantView, instantClick } from "../../instant-view";
import { MIN_FIT_REPORTS, FEW_FIT_REPORTS, type FitFacts } from "../../../lib/fit-verdict";
import { matchPcts, alternatives, verdictFor, type RankItem } from "../../../lib/home-rank";
import { choiceHref, readChoice, isDefault, levelLabel, LEVELS, STYLES, STYLE_WORD, DEFAULT_CHOICE, type QuickChoice } from "../../../lib/quick-match";
import { fineWords } from "../../../lib/fine-tune";
import { niche } from "../../../lib/niche";
import { fitConfigFor, SITE_FIT } from "../../../lib/fit-config";
import AskPicks, { RememberPicks } from "./ask-picks";
import { cardLines, pickTags, wordCounts, type CardContent } from "../../../lib/fit-card";
import { evidenceLine, marked, mattersFor, SHOWN_ITEMS, SHORT_ITEMS, type PageItem, type PageTier } from "../../../lib/racket-page";
import { fitReasonParts, type ReasonPart } from "../../../lib/fit-reason";
import { RANK_SETUP, NEGATIVE_TAGS, sameChoice, type RankSeed } from "../../../lib/rank-seed";
import { SimilarSection, type SimilarTab } from "../../similar-section";
import { forgetSavedPicks } from "../../../lib/saved-picks";

/** A type-picker site (lib/fit-config.ts quick: DiscGolfRecs): its stability words, arm pick and compare words. Unset: padel's. */
const CFG = fitConfigFor(niche), QUICK = CFG?.quick ? CFG : null;
const styleWord = (s: QuickChoice["style"]) => QUICK && s !== "any" ? (QUICK.styleLabels[s] ?? STYLE_WORD[s]).toLowerCase() : STYLE_WORD[s];
const ARM_WORD = QUICK?.quick?.arm ?? "sore arm", USE_WORD = QUICK?.quick?.useWord ?? (QUICK ? "flies" : "plays");
const BAD = NEGATIVE_TAGS, SETUP = RANK_SETUP;
const PICK_KEYS = ["style", "level", "arm"];

type Picks = { choice: QuickChoice; picked: boolean };
const Ctx = createContext<{ p: Picks; set: (p: Picks) => void; href: string } | null>(null);
/** The engine's items for the picks (lib/home-rank.ts), loaded from /api/rank-items when the page opens: one cached file for
 *  every racket page (they were 270 KB of each page's HTML). Until they arrive, the server's answer for the address's picks
 *  (lib/rank-seed.ts) stands in; other picks made before then wait for them, and the box shows the questions. */
const ItemsCtx = createContext<{ items: RankItem[] | null; seed: RankSeed | null }>({ items: null, seed: null });
export const ITEMS_URL = "/api/rank-items";
/** The picks and their answers for this racket: from the items, or from the server's seed while they load. */
function useRank(id: string, facts?: FitFacts) {
  const { p: { choice, picked: asked } } = use(), { items, seed } = useContext(ItemsCtx);
  const s = !items && seed && sameChoice(seed.choice, choice) ? seed : null, picked = asked && (!!items || !!s);
  return {
    choice, picked,
    verdict: () => items && facts ? verdictFor(items, choice, facts, id, SETUP.levelGate, SETUP.engine) : s!.verdict,
    pct: () => items ? matchPcts(items, choice, SETUP.levelGate, SETUP.engine).get(id) ?? null : s!.pct,
    alts: (n: 4 | 6) => items ? alternatives(items, SETUP, BAD, choice, id, n) : n === 4 ? s!.alts4 : s!.alts6,
  };
}
const use = () => useContext(Ctx)!;
const fromLocation = (): Picks => { const q = Object.fromEntries(new URLSearchParams(location.search)); return { choice: readChoice(q), picked: PICK_KEYS.some(k => k in q) }; };

export function FitPicks({ first, href, seed = null, children }: { first: Picks; href: string; seed?: RankSeed | null; children: ReactNode }) {
  // Back and forward step through the picks (app/instant-view.ts).
  const [p, set] = useInstantView(first, fromLocation, next => { const h = choiceHref(next.choice, ""); return !next.picked ? href : h === "/" ? `${href}?style=any` : `${href}${h.slice(1)}`; });
  const [result, setResult] = useState<FitResult | null>(null);
  const [items, setItems] = useState<RankItem[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(ITEMS_URL).then(r => r.ok ? r.json() : null).then((x: RankItem[] | null) => { if (live && Array.isArray(x) && x.length) setItems(x); }, () => {});
    return () => { live = false; };
  }, []);
  return <Ctx.Provider value={{ p, set, href }}><ItemsCtx.Provider value={{ items, seed }}><ResultCtx.Provider value={{ result, setResult }}>{children}</ResultCtx.Provider></ItemsCtx.Provider></Ctx.Provider>;
}

/** The fit check's answer as FitBox works it out, shared so the sticky box shows the same % and word (one source). */
export type FitResult = { kind: "good" | "maybe" | "no" | "thin"; pct: number | null; word: string | null };
const ResultCtx = createContext<{ result: FitResult | null; setResult: (r: FitResult | null) => void }>({ result: null, setResult: () => {} });
function usePublish(r: FitResult | null) {
  const { setResult } = useContext(ResultCtx), key = r ? `${r.kind}|${r.pct}|${r.word}` : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setResult(r); }, [key]);
}

/** The picks' address on this page, and a click that applies them here. */
function useGo() {
  const { set, href } = use();
  const at = (c: QuickChoice) => { const h = choiceHref(c, ""); return h === "/" ? `${href}?style=any` : `${href}${h.slice(1)}`; };
  const to = (c: QuickChoice | null) => ({ href: c ? at(c) : href, onClick: instantClick(() => { if (!c) forgetSavedPicks(); set(c ? { choice: c, picked: true } : { choice: DEFAULT_CHOICE, picked: false }); }) });
  return to;
}

export function FitBack({ all }: { all: { href: string; label: string } }) {
  const { p } = use();
  return p.picked ? <a className="rf-back" href={choiceHref(p.choice)}>← back to your matches</a> : <a className="rf-back" href={all.href}>{all.label}</a>;
}

/** The fit-check box: the two questions, or the answer for the picks. */
/** A racket's fit-card content (lib/fit-card.ts) with the linked rackets' names and addresses. */
export type FitCard = CardContent & { links: Record<string, { href: string; name: string }> };

/** The try-instead line with the other racket's name in bold. The line names it its own way ("the Vertex 05 Hybrid", "the
 *  stiffer AT10 12K 2026"), so the bold goes on the longest run of 2+ words that are all in the catalog name. */
export function boldName(t: string, name: string): ReactNode {
  const inName = new Set(name.toLowerCase().split(/\s+/)), parts = t.split(/(\s+)/), clean = (w: string) => w.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
  let best: [number, number] | null = null;
  for (let a = 0; a < parts.length; a += 2) {
    let b = a; while (b < parts.length && inName.has(clean(parts[b]))) b += 2;
    const n = (b - a) / 2; if (n >= 2 && (!best || n > (best[1] - best[0]) / 2)) best = [a, b - 2];
  }
  if (!best) return t;
  const last = parts[best[1]], tail = last.match(/[^\w]+$/)?.[0] ?? "";
  const bold = [...parts.slice(best[0], best[1]), last.slice(0, last.length - tail.length)].join("");
  return <>{parts.slice(0, best[0]).join("")}<b>{bold}</b>{tail}{parts.slice(best[1] + 1).join("")}</>;
}

export function FitBox({ id, facts, hook, total, rated = total, yt = 0, bestLine, levelDisagree, card, yesNo }: { id: string; facts: FitFacts;
  hook: { good: string; catch: string } | null; total: number; /** The page's "N players rated it" count, so the two agree (audit #27). */ rated?: number; /** v11c: YouTube's share of `rated`, named apart. */ yt?: number; bestLine: string | null; levelDisagree?: string; card?: FitCard | null;
  /** The page's Why yes / Why not items: the reason line's source and the "See why ↓" target. */ yesNo?: { yes: PageItem[]; no: PageItem[] } | null }) {
  const { set } = use(), to = useGo(), rank = useRank(id, facts), { choice, picked } = rank;
  const verdict = picked ? rank.verdict() : null;
  // The answer box (owner 2026-11-15, Claude Design tweak): the same match % as the home (lib/match-score.ts), a plain-words
  // headline, one "why it fits" and one "what to consider", from the fit check's reasons and the quick-take lines.
  const pct = verdict ? rank.pct() : null;
  const verdictWord = verdict && verdict.kind !== "thin" ? { good: "Strong fit", maybe: "Worth a look", no: "Probably not" }[verdict.kind] : null;
  usePublish(verdict ? { kind: verdict.kind, pct, word: verdictWord } : null);
  // Fallback (no racket lines): the fit check's own reasons, with counts in words (owner: no player numbers).
  const why = verdict ? (verdict.fits?.slice(0, 2).map(wordCounts).join(" ") || (hook ? hook.good : null)) : null;
  const consider = verdict ? (verdict.catches?.[0] ? wordCounts(verdict.catches[0]) : (hook ? hook.catch : null)) : null;
  // Racket-specific lines when we have them (owner 2026-11-15: real strengths and concrete catches, no level bookkeeping):
  // 2 strengths and 1 catch on a clean fit, up to 2 otherwise; a hard conflict without a racket line keeps the fit check's reason.
  const lines = verdict && card && verdict.kind !== "thin" ? cardLines(card, choice, { maxCatches: verdict.kind === "good" ? 1 : 2, hard: verdict.kind === "no" ? verdict.reasons[0] : undefined }) : null;
  const hasCatch = lines ? !!(lines.lead || lines.catches.length) : !!consider;
  // Product page v11 (owner 2026-11-17): the handoff's headlines in the site's words, no em dashes (lib/v11-words.ts).
  const headline = !verdict ? "" : V11_HEADLINES[niche.id] ? V11_HEADLINES[niche.id][verdict.kind] : verdict.kind === "good" ? (hasCatch ? "Yes, with one catch." : "Yes — a clean fit.") : verdict.kind === "maybe" ? "Maybe — try it first." : verdict.kind === "no" ? "Probably not this one." : "Not enough reports from players like you yet.";
  // One reason line (owner 2026-11-16): "why this score, for you", from the Why yes / Why not items that matter for the picks
  // (the fit-card lines when the page has none) plus the level reason. Bullets are gone: Why yes, why not says the rest.
  const asItem = (l: { t: string; for: string[] }) => ({ title: l.t.includes(": ") ? l.t.split(": ")[0] : l.t, t: l.t.includes(": ") ? l.t.slice(l.t.indexOf(": ") + 2) : l.t, for: l.for });
  const src = yesNo ?? (card ? { yes: card.strengths.map(asItem), no: card.catches.map(asItem) } : null);
  const parts: ReasonPart[] = !verdict || verdict.kind === "thin" ? [] : src ? fitReasonParts(verdict.kind, src.yes, src.no, choice, verdict.catches) : [];
  // No page or fit-card lines: the fit check's own reasons, as the same two rows.
  const reason: ReasonPart[] = parts.length || !verdict || verdict.kind === "thin" ? parts : [
    ...(why ? [{ tone: "yes" as const, lead: verdict.kind === "no" ? "What works:" : "Why it fits:", text: why }] : []),
    ...(consider ? [{ tone: "no" as const, lead: verdict.kind === "good" ? "One thing to know:" : "The catch:", text: consider }] : [])];
  // The try-instead link ("Want it easier? The AT10 18K 2026…") from the top catch, when it names a racket we list.
  const alt = lines?.catches.map(l => l.note?.kind === "alt" ? l.note.alt : null).find(x => x && card?.links[x.slug]) ?? null;
  const gameWords = [choice.level && levelLabel(choice.level), choice.style === "any" ? null : styleWord(choice.style), choice.arm ? ARM_WORD : null, ...fineWords(choice.fine)].filter((x): x is string => !!x);
  // With no picks, a tap starts from the defaults (any style / no level / no arm) but always lands on a picked page.
  const base = picked ? choice : DEFAULT_CHOICE;
  const pill = (label: string, next: QuickChoice, on: boolean) => <a {...to(next)} aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</a>;
  const box = (on: boolean) => <i className="rf-box" aria-hidden="true">{on ? "✓" : ""}</i>;
  return <div className={`rf-fit ${verdict ? `v-${verdict.kind}` : "ask"}`} id="fit">
    {!verdict ? <div className="rf-ask">
      <div className="rf-asktitle"><h2>{`Is this the right ${niche.words.one} for you?`}</h2>
        <p>{`Two taps and we'll check it against ${[rated - yt > 0 || !yt ? `${rated - yt} player ${rated - yt === 1 ? "review" : "reviews"}` : null, yt > 0 ? `${yt} YouTube${rated - yt > 0 ? "" : yt === 1 ? " review" : " reviews"}` : null].filter(Boolean).join(" + ")}.`}</p></div>
      <AskPicks onPick={c => set({ choice: c, picked: true })}/>
      {bestLine && <p className="rf-best"><b>Generally best for</b>{` ${bestLine}.`}</p>}
      {levelDisagree && <p className="rf-lvl">{levelDisagree}</p>}
    </div> : <div className="rf-ans" aria-live="polite">
      {choice.level && <RememberPicks style={choice.style} level={choice.level} arm={choice.arm}/>}
      <div className="rf-chipsrow"><span className="rf-k">⚡ your match</span>
        <span className={`rf-vpill ${verdict.kind}`} title="How well it fits your picks, from player reports. Not a % of happy players.">{pct === null ? "— · not enough reports yet" : `${pct}% · ${verdictWord}`}</span>
          {verdict.kind !== "thin" && total < FEW_FIT_REPORTS && <span className="rf-few">{`based on fewer reports (${total})`}</span>}</div>
      <h2>{headline}</h2>
      {verdict.kind === "thin" ? <p className="rf-for">{total < MIN_FIT_REPORTS ? `Only ${total} player ${total === 1 ? "report" : "reports"} so far, too few to answer for your ${gameWords.join(" · ")} game. The bars below show what we know.` : `Players haven't said enough about what you picked yet. The bars below show what we know.`}</p>
        : <>{reason.length > 0 && <div className="rf-reason">{reason.map(r => <p key={r.tone} className={`rf-rrow ${r.tone}`}><i aria-hidden="true">{r.tone === "yes" ? "✓" : "!"}</i><span><b>{r.lead}</b>{` ${r.text}`}</span></p>)}</div>}
          {(alt || yesNo) && <p className="rf-reasonl">{alt && <a href={card!.links[alt.slug].href} className="rf-alt">{"→ "}{boldName(alt.t, card!.links[alt.slug].name)}</a>}{yesNo && <a href="#yes-no" className="rf-seewhy">See why ↓</a>}</p>}</>}
      {/* Edit: a CSS-only toggle (checkbox + label), so the pills open under the footer row as in the mockup. */}
      <input type="checkbox" id="rf-edit-t" className="rf-edit-t" aria-label="Edit your picks"/>
      <div className="rf-afoot"><span>{gameWords.map(w => w[0].toUpperCase() + w.slice(1)).join("  ·  ")}</span>
        <span className="rf-acts"><label htmlFor="rf-edit-t" className="rf-editl"><span className="o">edit ↗</span><span className="c">done ✓</span></label>
        <a {...to(null)} className="rf-reset">start over</a></span></div>
      <div className="rf-bar rf-editp">
        <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(st => <span key={st}>{pill(styleWord(st), { ...choice, style: st }, choice.style === st)}</span>)}</span>
        <span className="rf-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(levelLabel(l), { ...choice, level: l }, choice.level === l)}</span>)}</span>
        <a {...to({ ...base, arm: !choice.arm })} aria-current={choice.arm ? "true" : undefined} className="rf-arm">{box(choice.arm)}{ARM_WORD}</a>
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
        {v.badge && <div className="rf-badge" title={`${ownScore("Player score")}: not a % of happy players. It blends how much players like it with how many have weighed in.`}><b>{v.badge.n}</b><span>{v.badge.label}</span></div>}
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
export function FitAlts({ id, facts, cards, similar, brandLink, similarTitle }: { id: string; facts: FitFacts; cards: Record<string, Omit<AltCard, "score">>;
  similar: AltCard[]; brandLink: { href: string; label: string } | null; similarTitle: string }) {
  const rank = useRank(id, facts), { choice, picked } = rank;
  const verdict = picked ? rank.verdict() : null;
  const picks = picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : "";
  const rows: AltCard[] = picked ? rank.alts(4).flatMap(r => cards[r.id] ? [{ ...cards[r.id], score: r.pct }] : []) : similar;
  const title = !picked ? similarTitle : verdict?.kind === "good" ? "Also worth a look" : "Better matches for you";
  return <div>
    <div className="rf-h"><h2>{title}</h2>{picked ? <a href={choiceHref(choice)}>all →</a> : brandLink && <a href={brandLink.href}>{brandLink.label}</a>}</div>
    <ul className="rf-alts">{rows.map(r => <li key={r.href}><a href={`${r.href}${picks}`}>
      <span className="rf-apic">{r.pic ? <img src={r.pic} alt="" width={408} height={620} decoding="async" loading="lazy"/> : <span>{r.name.split(" ").slice(0, 2).join(" ")}</span>}</span>
      <span className="rf-abody"><b>{r.name}</b>{r.why && <span>{r.why}</span>}</span>
      {picked ? <span className="rf-score" title="How well it fits your picks, from player reports. Not a % of happy players.">{r.score === null ? "—" : `${r.score}%`}</span>
        : r.score !== null && <span className="rf-score" title={`${ownScore("Player score")}: not a % of happy players. It blends how much players like it with how many have weighed in.`}>{r.score}</span>}
    </a></li>)}</ul>
  </div>;
}

/** The sticky "your match" box beside the page (owner's final mock): the % and verdict word once picked, "Check your fit ↑"
 *  before, and Check price. On phones it is a bar fixed to the bottom of the screen (racket-fit.css). */
export function FitSticky({ buy, name }: { buy: { url: string; label: string; rel: string } | null; name: string }) {
  const { p: { picked } } = use(), { result } = useContext(ResultCtx);
  const shown = picked && result && result.kind !== "thin" && result.pct !== null ? result : null;
  // Shown once the hero (and its fit box) has scrolled out of view (the final mock: a floating card on desktop, a bar on phones).
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(".rf-top"); if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(hero); return () => io.disconnect();
  }, []);
  return <div className={`rp-stick${on ? " on" : ""}`} aria-label={`Your match with the ${name}`}>
    <div className="rp-sk">
      <span className="rp-k">⚡ your match</span>
      {shown ? <a href="#fit" className={`rp-pct ${shown.kind}`}><b>{`${shown.pct}%`}</b><span className="rp-vw">{shown.word}</span></a>
        : <a href="#fit" className="rp-check">{picked && result?.kind === "thin" ? "not enough reports yet" : "Check your fit ↑"}</a>}
    </div>
    {buy && <a className="rf-btn rp-buy" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a>}
  </div>;
}

/** One racket in the compare tabs: its name, link, photo and the six trait dots (0 = not rated), in TRAITS order. */
export type CompareCard = { name: string; short: string; href: string; pic: string | null; dots: number[]; reports: number };
/** The site's traits in dot order (lib/fit-config.ts; a type-picker site's hidden style traits have no dots), with the compare tabs' words. */
const DOTS = SITE_FIT.traits.filter(t => !t.hidden);
const DIFF: [string, string][] = DOTS.map(t => [t.key, t.diff ?? `more ${t.label.toLowerCase()}`]);
/** "more power": the trait where the other racket is furthest ahead; "similar" when it is ahead nowhere. */
/** Row i's trait: by its key when the rows say (per-type rows, SimRacingRecs), else the site's i-th dot trait. */
const at = (i: number, keys?: string[]) => keys ? DOTS.findIndex(t => t.key === keys[i]) : i;
const diffWord = (me: number[], other: number[], keys?: string[]) => { let best = -1, gap = 0; other.forEach((v, i) => { const g = v - (me[i] || 0); if (v && me[i] && g > gap) { gap = g; best = i; } }); return best < 0 ? "similar feel" : DIFF[at(best, keys)]?.[1] ?? "similar feel"; };
/** "Stick with this one if you…" / "Pick X if you…" (owner's final mock): the two traits where a racket's dots are furthest
 *  ahead, each as a player's need. Derived from the dots only, so the lines never disagree with the bars above them. */
const IF_YOU = DOTS.map(t => t.ifYou ?? `care about ${t.noun}`);
const aheadIn = (a: number[], b: number[], keys?: string[]) => a.map((v, i) => ({ i, g: v && b[i] ? v - b[i] : 0 })).filter(x => x.g > 0).sort((x, y) => y.g - x.g || x.i - y.i).slice(0, 2).map(x => IF_YOU[at(x.i, keys)]);
const Segs = ({ n }: { n: number }) => n ? <span className="rf-segs" role="img" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? `on t${n}` : undefined}/>)}</span> : <span className="rf-segs none"/>;

/** "How it plays & compares" (owner's final mock): tab one is this racket's six trait bars with a short note each; the other
 *  tabs set it beside an alternative. With picks, the alternatives are the visitor's better matches (lib/home-rank.ts, the
 *  home's order); without, similar rackets from the server. */
export function FitCompare({ id, me, rows, cards, similar }: { id: string; me: CompareCard;
  rows: { label: string; note: string; key?: string }[]; cards: Record<string, CompareCard>; similar: string[] }) {
  const keys = rows.every(r => r.key) ? rows.map(r => r.key!) : undefined;
  const rank = useRank(id), { choice, picked } = rank;
  const alts = (picked ? rank.alts(6).map(r => r.id) : similar).filter(x => cards[x] && x !== id).slice(0, 3);
  const [tab, setTab] = useState<string>("me");
  const cur = tab !== "me" && alts.includes(tab) ? cards[tab] : null;
  return <div className="rp-cmp">
    <div className="rp-tabs" role="tablist" aria-label="Compare">
      <button type="button" role="tab" aria-selected={!cur} onClick={() => setTab("me")}>
        <span className="rp-tpic">{me.pic && <img src={me.pic} alt="" width={36} height={54} loading="lazy"/>}</span><span><b>{`This ${niche.words.one}`}</b><small>{`how it ${USE_WORD}`}</small></span></button>
      {alts.map(a => <button key={a} type="button" role="tab" aria-selected={cur === cards[a]} onClick={() => setTab(a)}>
        <span className="rp-tpic">{cards[a].pic && <img src={cards[a].pic!} alt="" width={36} height={54} loading="lazy"/>}</span>
        <span><b>{cards[a].short}</b><small>{diffWord(me.dots, cards[a].dots, keys)}</small></span></button>)}
    </div>
    <div className="rp-panel" role="tabpanel">
      {!cur ? rows.map((r, i) => <div key={r.label} className="rp-row"><b>{r.label}</b><Segs n={me.dots[i]}/><span className="rp-note">{r.note.split("==").map((x, j) => j % 2 ? <mark key={j}>{x}</mark> : <span key={j}>{x}</span>)}</span></div>)
        : <>
          <div className="rp-row rp-vs"><span/>
            <span className="rp-who">{me.pic && <img src={me.pic} alt="" width={32} height={48} loading="lazy"/>}<span><b>{`This ${niche.words.one}`}</b><small>{`${me.reports} reviews`}</small></span></span><span/>
            <span className="rp-who">{cur.pic && <img src={cur.pic} alt="" width={32} height={48} loading="lazy"/>}<span><b>{cur.short}</b><small>{`${cur.reports} reviews`}</small></span></span></div>
          {rows.map((r, i) => <div key={r.label} className="rp-row rp-two"><b>{r.label}</b>
            <span className="rp-cside"><Segs n={me.dots[i]}/>{me.dots[i] > cur.dots[i] && cur.dots[i] > 0 && <em>▲ better</em>}</span><span/>
            <span className="rp-cside"><Segs n={cur.dots[i]}/>{cur.dots[i] > me.dots[i] && me.dots[i] > 0 && <em>▲ better</em>}</span></div>)}
        </>}
    </div>
    {cur && (() => { const stay = aheadIn(me.dots, cur.dots, keys), go = aheadIn(cur.dots, me.dots, keys), href = `${cur.href}${picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : ""}`;
      return <div className="rp-pick">
        <div className="rp-stay"><span className="rp-ph">stick with this one if you…</span>{stay.length ? stay.map(x => <span key={x} className="rp-pi"><i>→</i>{x}</span>) : <span className="rp-pi"><i>→</i>like how it plays: the two feel much alike</span>}</div>
        <div className="rp-go"><span className="rp-ph">{`pick ${cur.short} if you…`}</span>{go.length ? go.map(x => <span key={x} className="rp-pi"><i>→</i>{x}</span>) : <span className="rp-pi"><i>→</i>prefer its feel or price: the two play much alike</span>}
          <a href={href}>{`open ${cur.short} →`}</a></div>
      </div>; })()}
  </div>;
}

/** Product page v11 (owner 2026-11-17): the picks and every racket's match % once the items are in (undefined before a pick),
 *  for the sections that sort or badge by match. */
export function useMatchOf() {
  const { p: { choice, picked } } = use(), { items } = useContext(ItemsCtx);
  const m = picked && items ? matchPcts(items, choice, SETUP.levelGate, SETUP.engine) : null;
  return { picked: !!m, pctOf: (id: string) => m ? m.get(id) ?? null : undefined, picksHref: picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : "" };
}
/** v11: this racket's answer for the picks (null without one) and the better matches for them (the home's order). */
export function useAnswer(id: string, facts: FitFacts) {
  const rank = useRank(id, facts);
  if (!rank.picked) return null;
  return { pct: rank.pct(), kind: rank.verdict().kind, alts: rank.alts(4), picksHref: !isDefault(rank.choice) ? choiceHref(rank.choice, "").slice(1) : "" };
}

/** v11: the better matches for the picks, up to `n` (the home's order: curated list first, then the engine), once the items or
 *  the server's seed are in; null without a pick. */
export function useAlts(id: string, n = 8) {
  const { p: { choice, picked } } = use(), { items, seed } = useContext(ItemsCtx);
  if (!picked) return null;
  if (items) return alternatives(items, SETUP, BAD, choice, id, n);
  return seed && sameChoice(seed.choice, choice) ? seed.alts6 : null;
}

/** Children only before the visitor picks (owner's final mock: the bottom line shows before picks). Still in the HTML. */
export function BeforePicks({ children }: { children: ReactNode }) {
  const { p: { picked } } = use();
  return <div hidden={picked}>{children}</div>;
}

/** "Why yes, why not" (owner's final mock): 3 items per column and "+N more" (in the HTML, opened by a tap); with picks, up to 2
 *  items per column that speak to them get a "matters for you" tag. */
export function FitYesNo({ yes, no, tier = "full", research = false, fold = false }: { yes: PageItem[]; no: PageItem[]; /** "short" (6–9 reports): 1–2 items a side, no "+N more". */ tier?: PageTier;
  /** Research content (sources are web pages, not players): no "N players mention it" lines. */ research?: boolean;
  /** Product page v11: each point is its title, a tap opens it. */ fold?: boolean }) {
  const { p: { choice, picked } } = use(), picks = picked ? pickTags(choice) : [];
  return <div className="rp-yn">{([["yes", "✓", "Why yes", yes], ["no", "!", "Why not", no]] as const).map(([side, icon, title, items]) => {
    // A "matters for you" item never hides under "+N more": it takes the place of the last untagged one shown.
    const hot = mattersFor(items, picks), list = tier === "short" ? items.slice(0, SHORT_ITEMS) : [...items];
    for (const h of list.slice(SHOWN_ITEMS).filter(x => hot.has(x.title))) {
      const out = list.slice(0, SHOWN_ITEMS).reverse().find(x => !hot.has(x.title)); if (!out) break;
      list.splice(list.indexOf(h), 1); list.splice(list.indexOf(out), 0, h); }
    const rest = list.slice(SHOWN_ITEMS);
    const body = (it: PageItem) => <><p>{marked(it.t).map((x, i) => x.mark ? <mark key={i}>{x.text}</mark> : <span key={i}>{x.text}</span>)}</p>
      {!research && evidenceLine(it) && <small>{evidenceLine(it)}</small>}</>;
    if (fold) return <div key={side} className={`v11-ycol ${side}`}><p className="v11-ych"><i aria-hidden="true">{icon}</i>{title}</p>
      {list.map(it => <details key={it.title} className="v11-yit"><summary><b>{it.title}</b>{hot.has(it.title) && <span className="rp-hot">matters for you</span>}<i aria-hidden="true"/></summary>{body(it)}</details>)}</div>;
    const item = (it: PageItem) => <div key={it.title} className="rp-item"><b>{it.title}{hot.has(it.title) && <span className="rp-hot">matters for you</span>}</b>
      <p>{marked(it.t).map((x, i) => x.mark ? <mark key={i}>{x.text}</mark> : <span key={i}>{x.text}</span>)}</p>
      {!research && evidenceLine(it) && <small>{evidenceLine(it)}</small>}</div>;
    return <div key={side} className={`rp-col ${side}`}><p className="rp-ch"><i aria-hidden="true">{icon}</i>{title}</p>
      {list.slice(0, SHOWN_ITEMS).map(item)}
      {rest.length > 0 && <details className="rp-more"><summary>{`+ ${rest.length} more`}</summary>{rest.map(item)}</details>}
    </div>; })}</div>;
}

/** "Similar products" on the racket page (app/similar-section.tsx): with picks, each card's badge is the visitor's match % (from
 *  the engine's items, once loaded) and the cards carry the picks to their pages; without, the Player score. */
export function FitSimilar({ title, tabs, scoreLabel, look }: { title: string; tabs: SimilarTab[]; scoreLabel: string; look?: "soft" | "disc" }) {
  const { p: { choice, picked } } = use(), { items } = useContext(ItemsCtx);
  const ids = tabs.flatMap(t => t.items.map(x => x.id));
  const pct = picked && items ? (() => { const m = matchPcts(items, choice, SETUP.levelGate, SETUP.engine); return Object.fromEntries(ids.map(id => [id, m.get(id) ?? null])); })() : null;
  const picksHref = picked && !isDefault(choice) ? choiceHref(choice, "").slice(1) : "";
  return <SimilarSection title={title} tabs={tabs} scoreLabel={scoreLabel} look={look} pct={pct} picksHref={picksHref}/>;
}
