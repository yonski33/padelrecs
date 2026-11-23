"use client";
// SkinRecs' "Find my match" and home list in the Thread look (owner 2026-11-20: SkinRecs on Thread). The skin engine ranks
// (app/skin/rank.ts rankSkin and skinMatch, the live skin home's own functions) on the ranking inputs sent with the page
// (app/skin/payload.ts wireOf), so a tap re-ranks here without a request (instant filters, tests/instant-views.test.ts).
// The picks are kept on this device and shared with the product page's "Is it right for me?".
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Row, topMatch, tone, type ThreadRow } from "../ui";
import type { ListMatch } from "./padel-list";
import { RankRows, type V5Row } from "./ranking-v5";
import { th } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { attrProfileFor } from "../../../lib/attr-profile";
import { readSkinChoice, type SkinChoice } from "../../../lib/skin-choice";
import { rankSkin, skinMatch, wireCtx, reasonOf, type SkinWire } from "../../skin/rank";
import { verdictOf } from "../../../lib/attr-score";
import { W } from "../../../lib/thread/words";

export type SkinPicks = { skin: "dry" | "oily" | "combination" | "normal" | null; goal: "hydrate" | "calm" | "clear" | null; sens: boolean; type: string | null };
export const NO_SKIN_PICKS: SkinPicks = { skin: null, goal: null, sens: false, type: null };
const KEY = "skinrecs-thread-picks", EVENT = "thread-skin-picks";
const read = (): SkinPicks => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { skin: v.skin ?? null, goal: v.goal ?? null, sens: !!v.sens, type: v.type ?? null }; } catch { return NO_SKIN_PICKS; } };

/** The visitor's picks, the same on every Thread page. Starts empty so the server's HTML and the first render agree. */
export function useSkinPicks() {
  const [picks, setPicks] = useState<SkinPicks>(NO_SKIN_PICKS);
  useEffect(() => {
    setPicks(read());
    const on = () => setPicks(read());
    addEventListener(EVENT, on); addEventListener("storage", on);
    return () => { removeEventListener(EVENT, on); removeEventListener("storage", on); };
  }, []);
  const set = (next: Partial<SkinPicks>) => {
    const v = { ...read(), ...next };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: the picks still apply on this page */ }
    setPicks(v); dispatchEvent(new Event(EVENT));
  };
  return [picks, set] as const;
}

const TYPES = niche.typePages ?? [];
/** The picks as the skin engine's choice (lib/skin-choice.ts), with or without the category. */
export const skinChoiceOf = (p: SkinPicks, withType = true): SkinChoice =>
  readSkinChoice({ ...(p.skin ? { skin: p.skin } : {}), ...(p.goal ? { goal: p.goal } : {}), ...(p.sens ? { sens: "1" } : {}), ...(withType && p.type ? { type: p.type } : {}) }, TYPES);
export const skinPickedAny = (p: SkinPicks) => !!(p.skin || p.goal || p.sens);
export const SKIN_OPTS = [["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["normal", "Normal"]] as const;
export const GOAL_OPTS = [["hydrate", "Hydrate"], ["calm", "Calm"], ["clear", "Clear skin"]] as const;
/** The home's category chips (the skin mock): the types with the most products. */
const CATS = ["moisturizers", "serums", "cleansers", "sunscreens", "toners", "treatments"].flatMap(s => TYPES.find(t => t.slug === s) ?? []);
const profile = attrProfileFor(niche);
const useCtx = (wire: SkinWire[]) => useMemo(() => profile ? wireCtx(profile, wire) : null, [wire]);

function resultLine(p: SkinPicks, n: number, cat: string | null) {
  const what = cat ? cat.toLowerCase() : niche.words.many;
  const who = [p.skin ? `${p.skin} skin` : null, p.sens ? "sensitive skin" : null].filter(Boolean).join(", ");
  const goal = p.goal ? ` that ${p.goal === "clear" ? "help clear skin" : p.goal === "calm" ? "calm skin" : "hydrate"}` : "";
  if (!skinPickedAny(p)) return `Showing all ${n} ${what}`;
  return n > 0 ? `Showing ${n} ${n === 1 ? niche.words.one : what}${who ? ` for ${who}` : ""}${goal}` : `No ${what}${who ? ` for ${who}` : ""} yet`;
}

/** "Find my match" as one sentence (padel's Thread home): the quick match tag, I'm [skin type] and I want [goal], a
 *  sensitive-skin box and a live result line. The category chips sit above the list (SkinHomeList, owner 2026-11-20). */
export function SkinMatchBox({ wire, names, title }: { wire: SkinWire[]; names: Record<string, string>; /** The ranking sidebar's "See how you match". */ title?: string }) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const ranked = useMemo(() => ctx ? rankSkin(ctx, skinChoiceOf(picks)) : [], [ctx, picks]);
  const top = skinPickedAny(picks) ? ranked.find(x => x.pct !== null) : null;
  const cat = picks.type ? TYPES.find(t => t.slug === picks.type)?.label ?? null : null;
  const line = resultLine(picks, ranked.length, cat);
  return <div className="th-match th-qm">
    {title && <span className="th-match-head"><span>{title}</span></span>}
    <div className="th-qm-line">
      <span className="th-qm-tag">quick match</span>
      <span className="lbl">I&apos;m</span>
      <span className="th-qm-group" role="group" aria-label="Your skin type">{SKIN_OPTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.skin === v} onClick={() => set({ skin: picks.skin === v ? null : v })}>{l}</button>)}</span>
      <span className="lbl">and I want to</span>
      <span className="th-seg th-qm-seg" role="group" aria-label="What you want">{([[null, "Any"], ...GOAL_OPTS] as [SkinPicks["goal"], string][]).map(([v, l]) => <button key={v ?? "any"} type="button" aria-pressed={picks.goal === v} onClick={() => set({ goal: v })}>{l}</button>)}</span>
      <button type="button" className="th-check" aria-pressed={picks.sens} onClick={() => set({ sens: !picks.sens })}><span aria-hidden="true">{picks.sens ? "✓" : ""}</span>Sensitive skin</button>
    </div>
    <span className="th-qm-result"><span className="th-say" aria-live="polite">{line}{top && top.pct != null ? `. Top match: the ${names[top.r.id] ?? top.r.name} at ${top.pct}%.` : "."}</span>
      {(skinPickedAny(picks) || picks.type) && <button type="button" className="th-reset" onClick={() => set(NO_SKIN_PICKS)}>Reset</button>}</span>
  </div>;
}

type Sort = "score" | "reviews";
/** The home's top products: by user score (or most reviewed); with picks, the skin engine's order with match % badges. */
export function SkinHomeList({ wire, rows, size = 10 }: { wire: SkinWire[]; rows: ThreadRow[]; size?: number }) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const [sort, setSort] = useState<Sort>("score"), [open, setOpen] = useState(false);
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);
  const personal = skinPickedAny(picks);
  const shown = useMemo(() => {
    if (!ctx) return { n: 0, list: [] };
    const ranked = rankSkin(ctx, skinChoiceOf(picks)).flatMap(x => { const r = byId.get(x.r.id); return r ? [{ r, pct: personal ? x.pct : undefined }] : []; });
    return { n: ranked.length, list: (sort === "reviews" ? [...ranked].sort((a, b) => b.r.n - a.r.n) : ranked).slice(0, size) };
  }, [ctx, picks, byId, sort, size, personal]);
  const label = sort === "reviews" ? "Most reviewed" : personal ? "By your match" : `By ${W.score}`;
  const topId = topMatch(shown.list.map(x => ({ id: x.r.id, pct: x.pct })));
  return <section className="th-card th-list">
    <div className="th-skin-listhead">
    <div className="th-qm-cats" role="group" aria-label="Category">
      {[{ slug: null as string | null, label: "All" }, ...CATS.map(t => ({ slug: t.slug as string | null, label: t.label }))].map(t => {
        const on = picks.type === t.slug;
        return <button key={t.slug ?? "all"} type="button" className="th-pick sm" aria-pressed={on} onClick={() => set({ type: t.slug })}>{t.label}{on && ctx && <span className="th-cat-n">{shown.n}</span>}</button>; })}
    </div>
    <div className="th-sort">
      <span className="lbl">Sort</span>
      <span className="th-dd">
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}<small aria-hidden="true">{open ? "▲" : "▼"}</small></button>
        {open && <div className="th-dd-menu" role="menu">
          {([["score", personal ? "By your match" : `By ${W.score}`], ["reviews", "Most reviewed"]] as const).map(([k, l]) =>
            <button key={k} type="button" role="menuitemradio" aria-checked={sort === k} onClick={() => { setSort(k); setOpen(false); }}>{l}<span aria-hidden="true">{sort === k ? "✓" : ""}</span></button>)}
        </div>}
      </span>
    </div>
    </div>
    {shown.list.map(({ r, pct }, i) => <Row key={r.id} r={r} rank={i + 1} {...(pct !== undefined ? { badge: pct, badgeLabel: "your match", pct: true, top: r.id === topId } : {})}/>)}
    <a className="th-link-b" href={th("/rankings")} style={{ margin: "4px 0 10px" }}>All rankings</a>
  </section>;
}

/** The product page's "Is it right for me?" on SkinRecs: the same picks, this product's match % and the reason it rests on. */
export function useSkinFit(wire: SkinWire[], id: string) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const m = useMemo(() => ctx && skinPickedAny(picks) ? skinMatch(ctx, id, skinChoiceOf(picks, false)) : null, [ctx, picks, id]);
  return { picks, set, match: m };
}

const FIT_HEAD = { good: "Yes, a strong fit.", maybe: "Maybe. Patch test it first.", no: "Probably not this one.", thin: "Not enough reports to say yet." } as const;
/** "Is it right for my skin?" (the skin product mock): My skin, Help with and Sensitive skin, then this product's match %,
 *  the reason it rests on (app/skin/rank.ts reasonOf) and, under 80%, up to 2 better fits of the same type (padel's rule). */
export function SkinFitCheck({ id, wire, links }: { id: string; wire: SkinWire[]; links: Record<string, { name: string; href: string }> }) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const res = useMemo(() => {
    if (!ctx || !skinPickedAny(picks)) return null;
    const choice = skinChoiceOf(picks, false), m = skinMatch(ctx, id, choice);
    const shape = wire.find(w => w.id === id)?.shape ?? null;
    const better = m.pct != null && m.pct < 80 ? rankSkin(ctx, choice, r => r.shape === shape && r.id !== id)
      .filter(x => x.pct != null && x.pct >= m.pct! + 10 && links[x.r.id]).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, reason: reasonOf(ctx, m), better };
  }, [ctx, picks, id, wire, links]);
  const verdict = res ? verdictOf(res.m.pct) : null;
  return <div className="th-fit">
    <span className="th-fit-title">{W.fitTitle}</span>
    <div className="th-picks" role="group" aria-label="Your skin type"><span className="lbl">My skin</span>
      {SKIN_OPTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.skin === v} onClick={() => set({ skin: picks.skin === v ? null : v })}>{l}</button>)}
    </div>
    <div className="th-picks" role="group" aria-label="Help with"><span className="lbl">Help with</span>
      {GOAL_OPTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.goal === v} onClick={() => set({ goal: picks.goal === v ? null : v })}>{l}</button>)}
      <button type="button" className="th-check" aria-pressed={picks.sens} onClick={() => set({ sens: !picks.sens })}><span aria-hidden="true">{picks.sens ? "✓" : ""}</span>Sensitive skin</button>
    </div>
    {res && <div className="th-fit-out" aria-live="polite">
      <span><b>{FIT_HEAD[verdict ?? "thin"]}</b>{res.m.pct != null && <><span className={`th-badge xs ${res.m.pct >= 85 ? "g" : res.m.pct >= 70 ? "y" : "w"}`}>{`${res.m.pct}%`}</span><small>your match</small></>}</span>
      {res.reason && <p>{`${res.reason[0].toUpperCase()}${res.reason.slice(1)}.`}</p>}
      {res.better.length > 0 && <p className="th-fit-better">{"Better for you: "}{res.better.map((b, i) => <span key={b.r.id}>{i > 0 && " or "}<a href={th(links[b.r.id].href)}>{links[b.r.id].name}</a>{` (${b.pct}%)`}</span>)}.</p>}
    </div>}
  </div>;
}

// SkinRecs on the PadelRecs v3 pages (v3 rollout 2026-11-21): the same picks and engine in the v3 markup. The match re-orders by
// "% your match" and hides nothing (home and catalogue), names the best fit and never reorders (rankings), and checks one
// product (product page). All in the browser on the inputs the page sent (instant, tests/instant-views.test.ts). No score.
const NONE: SkinWire[] = [];
const clearPicks = (set: (p: Partial<SkinPicks>) => void) => set({ skin: null, goal: null, sens: false });

/** The v3 match bar in its classes (live/padel-list.tsx MatchBar): My skin … | I want to … · Sensitive skin · Reset. */
function SkinBar({ picks, set, tag, after, ft, setFt }: { picks: SkinPicks; set: (p: Partial<SkinPicks>) => void; tag?: string; after?: ReactNode; ft: boolean; setFt: (x: boolean) => void }) {
  return <div className="tc-qm" role="group" aria-label="Find my match">
    {tag && <span className="tc-qm-tag">{tag}</span>}
    <span className="tc-qm-l">My skin</span>
    {SKIN_OPTS.map(([v, l]) => <button key={v} type="button" className="tc-pill" aria-pressed={picks.skin === v} onClick={() => set({ skin: picks.skin === v ? null : v })}>{l}</button>)}
    <span className="tc-qm-sep" aria-hidden="true"/>
    <span className="tc-qm-l">I want to</span>
    {GOAL_OPTS.map(([v, l]) => <button key={v} type="button" className="tc-pill" aria-pressed={picks.goal === v} onClick={() => set({ goal: picks.goal === v ? null : v })}>{l}</button>)}
    <button type="button" className="th-check tc-arm" aria-pressed={picks.sens} onClick={() => set({ sens: !picks.sens })}><span aria-hidden="true">{picks.sens ? "✓" : ""}</span>Sensitive skin</button>
    {after}
    {skinPickedAny(picks) && <button type="button" className="tc-link" onClick={() => clearPicks(set)}>Reset</button>}
    <button type="button" className="tc-ft" aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
  </div>;
}

/** The home's and catalogue's match (live/padel-list.tsx useRacketList `match`): each product's % for the picks, null where too
 *  few reports back it. Undefined off SkinRecs (no inputs sent). */
export function useSkinListMatch(wire: SkinWire[] | undefined): ListMatch | undefined {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire ?? NONE), mine = skinPickedAny(picks);
  const pcts = useMemo(() => { if (!wire || !ctx || !mine) return null; const c = skinChoiceOf(picks, false);
    return new Map(wire.map(w => [w.id, skinMatch(ctx, w.id, c).pct])); }, [wire, ctx, mine, picks]);
  return wire ? { mine, pcts, bar: o => <SkinBar picks={picks} set={set} {...o}/> } : undefined;
}

/** "Is it right for my skin?" in the v3 FitCard's markup (live/racket-v7b.tsx): My skin, Help with and Sensitive skin, then this
 *  product's match %, the reason it rests on and, under 80%, up to 2 better fits of the same type. `wire`: this type only. */
export function SkinFitCard({ id, wire, links }: { id: string; wire: SkinWire[]; links: Record<string, { name: string; href: string }> }) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const res = useMemo(() => {
    if (!ctx || !skinPickedAny(picks)) return null;
    const choice = skinChoiceOf(picks, false), m = skinMatch(ctx, id, choice);
    const shape = wire.find(w => w.id === id)?.shape ?? null;
    const better = m.pct != null && m.pct < 80 ? rankSkin(ctx, choice, r => r.shape === shape && r.id !== id)
      .filter(x => x.pct != null && x.pct >= m.pct! + 10 && links[x.r.id]).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, reason: reasonOf(ctx, m), better };
  }, [ctx, picks, id, wire, links]);
  return <section className="th-card th7-card th7-fit">
    <div className="th7-hd"><h2 className="th-h2">{W.fitTitle}</h2><span className="th-sub">Pick your skin and what you want help with, for a quick fit from what people report.</span></div>
    <div className="th-fit">
      <div className="th-picks" role="group" aria-label="Your skin type"><span className="lbl">My skin</span>
        {SKIN_OPTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.skin === v} onClick={() => set({ skin: picks.skin === v ? null : v })}>{l}</button>)}</div>
      <div className="th-picks" role="group" aria-label="Help with"><span className="lbl">Help with</span>
        {GOAL_OPTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.goal === v} onClick={() => set({ goal: picks.goal === v ? null : v })}>{l}</button>)}
        <button type="button" className="th-check" aria-pressed={picks.sens} onClick={() => set({ sens: !picks.sens })}><span aria-hidden="true">{picks.sens ? "✓" : ""}</span>Sensitive skin</button></div>
    </div>
    {res && <div aria-live="polite"><div className="th7-match">
      {res.m.pct != null && <span className="th7-match-pct"><span className={`th-badge ${tone(res.m.pct)}`}>{`${res.m.pct}%`}</span><small>your match</small></span>}
      <span className="th7-match-body"><b>{FIT_HEAD[verdictOf(res.m.pct) ?? "thin"]}</b>
        {res.reason && <span>{`${res.reason[0].toUpperCase()}${res.reason.slice(1)}.`}</span>}
        {res.better.length > 0 && <span className="th-fit-better">{"Better for you: "}{res.better.map((b, i) => <span key={b.r.id}>{i > 0 && " or "}<a href={th(links[b.r.id].href)}>{links[b.r.id].name}</a>{` (${b.pct}%)`}</span>)}.</span>}
      </span>
    </div></div>}
  </section>;
}

const GOOD = 80;
/** The best fit in a ranking for the picks (highest match %, ties to the higher rank), or null without picks. */
function useSkinBest(rows: V5Row[], wire: SkinWire[]) {
  const [picks] = useSkinPicks(), ctx = useCtx(wire);
  return useMemo(() => {
    if (!ctx || !skinPickedAny(picks)) return null;
    const c = skinChoiceOf(picks, false), ids = new Set(wire.map(w => w.id));
    let best: { row: V5Row; pct: number; reason: string | null } | null = null;
    for (const row of rows) { if (!ids.has(row.id)) continue; const m = skinMatch(ctx, row.id, c);
      if (m.pct != null && (!best || m.pct > best.pct)) best = { row, pct: m.pct, reason: reasonOf(ctx, m) }; }
    return best;
  }, [ctx, picks, rows, wire]);
}
/** A ranking's rows with "Your best fit here" from the skin match (live/ranking-v5.tsx RankRows). */
export function SkinRankRows({ wire, ...p }: Omit<Parameters<typeof RankRows>[0], "wire" | "fitId"> & { wire: SkinWire[] }) {
  const best = useSkinBest(p.rows, wire);
  return <RankRows {...p} fitId={best?.row.id ?? null}/>;
}
/** The ranking sidebar's "Quick match: find your fit" with the skin picks (live/ranking-v5.tsx QuickMatch's markup). */
export function SkinRankMatch({ rows, wire }: { rows: V5Row[]; wire: SkinWire[] }) {
  const [picks, set] = useSkinPicks(), best = useSkinBest(rows, wire), good = best != null && best.pct >= GOOD;
  return <section className="th-card rk5-qm">
    <div className="head"><h3>Quick match: find your fit</h3>
      {skinPickedAny(picks) && <button type="button" className="reset" onClick={() => clearPicks(set)}>Reset</button>}</div>
    <p>Pick your skin. The list keeps its order.</p>
    <span className="lbl">My skin</span>
    <div className="opts">{SKIN_OPTS.map(([v, l]) => <button key={v} type="button" aria-pressed={picks.skin === v} onClick={() => set({ skin: picks.skin === v ? null : v })}>{l}</button>)}</div>
    <span className="lbl">I want to</span>
    <div className="opts">{GOAL_OPTS.map(([v, l]) => <button key={v} type="button" aria-pressed={picks.goal === v} onClick={() => set({ goal: picks.goal === v ? null : v })}>{l}</button>)}</div>
    <button type="button" className="arm" aria-pressed={picks.sens} onClick={() => set({ sens: !picks.sens })}><span aria-hidden="true">{picks.sens ? "✓" : ""}</span>Sensitive skin</button>
    {best && <div className="fit">
      <span className={good ? "ic good" : "ic"} aria-hidden="true">{good ? "✓" : "~"}</span>
      <span className="words"><strong>{good ? "A good match for your skin" : "The closest fit in this list"}</strong>
        <span>Best fit here: <b>{best.row.name}</b>. {good ? best.reason ? `${best.reason[0].toUpperCase()}${best.reason.slice(1)}.` : "" : "Nothing here fits every pick. This one comes closest."}</span>
        <a href={th(best.row.href)}>See more details →</a></span>
    </div>}
  </section>;
}

/** The creator page's skin fit check (owner 2026-11-23: "style this the same like on pickleball"): the compact one-row bar
 *  of live/creator-fit.tsx CompactFit (bold title, "My skin" and "Help with" chips in one line with a divider, Sensitive skin
 *  as the check), then the match pill, one bold line, the reason, better fits and Reset. Same picks and engine as SkinFitCheck. */
export function SkinCompactFit({ id, wire, links, side = false }: { id: string; wire: SkinWire[]; links: Record<string, { name: string; href: string }>;
  /** The head's right column under Check price (owner mock 2026-11-23): "My skin is" chips, a rule, the match pill and one line. */ side?: boolean }) {
  const [picks, set] = useSkinPicks();
  const ctx = useCtx(wire);
  const res = useMemo(() => {
    if (!ctx || !skinPickedAny(picks)) return null;
    const choice = skinChoiceOf(picks, false), m = skinMatch(ctx, id, choice);
    const shape = wire.find(w => w.id === id)?.shape ?? null;
    const better = m.pct != null && m.pct < 80 ? rankSkin(ctx, choice, r => r.shape === shape && r.id !== id)
      .filter(x => x.pct != null && x.pct >= m.pct! + 10 && links[x.r.id]).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, reason: reasonOf(ctx, m), better };
  }, [ctx, picks, id, wire, links]);
  const fitKind = res ? verdictOf(res.m.pct) : null;
  const tone = res?.m.pct == null ? "" : res.m.pct >= 85 ? " g" : res.m.pct >= 70 ? " y" : " r";
  const chip = (on: boolean, label: string, onClick: () => void) =>
    <button key={label} type="button" className="thc-chip" aria-pressed={on} onClick={onClick}>{label}</button>;
  if (side) return <section className="thc-box1 thc-skinside">
    <h2>Right for my skin?</h2>
    <b className="thc-skinside-l">My skin is</b>
    <div className="thc-skinside-chips">{(["dry", "normal", "oily", "combination"] as const).map(v => SKIN_OPTS.find(o => o[0] === v)!).map(([v, l]) => chip(picks.skin === v, l, () => set({ skin: picks.skin === v ? null : v })))}</div>
    <div className="thc-skinside-out" aria-live="polite">
      <span className={`thc-fit-pct${res?.m.pct != null ? tone : " none"}`}>{res?.m.pct != null ? `${res.m.pct}% match` : "?% match"}</span>
      <span className="thc-skinside-t">{!res ? "Pick your skin type to see how reviews rate it for you."
        : <><strong>{FIT_HEAD[fitKind ?? "thin"]}</strong>{res.reason && ` ${res.reason[0]!.toUpperCase()}${res.reason.slice(1)}.`}
          {res.better.length > 0 && <>{" Better for you: "}{res.better.map((b, i) => <span key={b.r.id}>{i > 0 && " or "}<a className="thc-fit-alt" href={th(links[b.r.id]!.href)}>{links[b.r.id]!.name}</a></span>)}.</>}</>}</span>
    </div>
  </section>;
  return <section className="thc-box1 thc-fit bar">
    <h2>{W.fitTitle}</h2>
    <div className="thc-fit-line">
      <b>My skin</b>{SKIN_OPTS.map(([v, l]) => chip(picks.skin === v, l, () => set({ skin: picks.skin === v ? null : v })))}
      <span className="thc-fit-sep" aria-hidden="true"/>
      <b>Help with</b>{GOAL_OPTS.map(([v, l]) => chip(picks.goal === v, l, () => set({ goal: picks.goal === v ? null : v })))}
      <label className="thc-arm"><input type="checkbox" checked={picks.sens} onChange={() => set({ sens: !picks.sens })}/><span>Sensitive skin</span></label>
    </div>
    {skinPickedAny(picks) && <div className="thc-fit-out" aria-live="polite">
      {!res ? <span className="thc-fit-note">Working out your match…</span> : <>
        {res.m.pct != null && <span className={`thc-fit-pct${tone}`}>{`${res.m.pct}% your match`}</span>}
        <strong>{FIT_HEAD[fitKind ?? "thin"]}</strong>
        {res.reason && <span className="thc-fit-why">{`${res.reason[0]!.toUpperCase()}${res.reason.slice(1)}.`}</span>}
        {res.better.length > 0 && <span className="thc-fit-why">{"Better for you: "}{res.better.map((b, i) => <span key={b.r.id}>{i > 0 && " or "}<a className="thc-fit-alt" href={th(links[b.r.id]!.href)}>{links[b.r.id]!.name}</a>{` (${b.pct}%)`}</span>)}.</span>}
      </>}
      <button type="button" className="thc-fit-reset" onClick={() => clearPicks(set)}>Reset</button>
    </div>}
  </section>;
}
