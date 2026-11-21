"use client";
// SkinRecs' "Find my match" and home list in the Thread look (owner 2026-11-20: SkinRecs on Thread). The skin engine ranks
// (app/skin/rank.ts rankSkin and skinMatch, the live skin home's own functions) on the ranking inputs sent with the page
// (app/skin/payload.ts wireOf), so a tap re-ranks here without a request (instant filters, tests/instant-views.test.ts).
// The picks are kept on this device and shared with the product page's "Is it right for me?".
import { useEffect, useMemo, useState } from "react";
import { Row, type ThreadRow } from "../ui";
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
    {shown.list.map(({ r, pct }, i) => <Row key={r.id} r={r} rank={i + 1} {...(pct !== undefined ? { badge: pct, badgeLabel: "your match", pct: true } : {})}/>)}
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
