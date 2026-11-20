"use client";
// The compare page (owner 2026-11-17, Claude Design mock "Compare v3"): quick match, "the short answer for you", small cards, why yes /
// why not, where they differ, specs side by side. The products' facts come from the server (app/compare/compare-v2.tsx); the
// match % and the verdict are worked out here on every pick change (lib/home-rank matchPcts, lib/compare-verdict), so picks
// stay instant and the address keeps the products only.
import { scoreBox, matchBox } from "../../lib/score-tone";
import { useMemo, useState } from "react";
import { matchPcts, type RankItem } from "../../lib/home-rank";
import { hardOnLevelOrArm, SUITS_OK } from "../../lib/fit-verdict";
import { niche } from "../../lib/niche";
import { STYLES, LEVELS, levelLabel, STYLE_WORD, type QuickChoice, type Level, ARM_SHORT } from "../../lib/quick-match";
import { compareVerdict, differRows, type VProduct, type VTrait, type VPick, type VLine } from "../../lib/compare-verdict";
import { scoreState, COMPARE_SHOWS_SCORE } from "../../lib/score-view";
import { NewPill } from "../score-tags";

export type CProduct = VProduct & { /** Reviews with a verdict (thin-score display). */ judged: number; name: string; slug: string; href: string; pic: string | null; shop: { url: string; rel: string } | null;
  yes: string[]; no: string | null; specs: (string | null)[] };

const NOTE = `How well it fits your picks. Not a % of happy ${niche.people.many}.`;
const levelsWord = (it: RankItem | undefined) => {
  const su = it?.level?.suits; if (!su) return null;
  const ok = (LEVELS as readonly Level[]).filter(l => (su[l] ?? 0) >= SUITS_OK).map(l => levelLabel(l));
  return ok.length ? ok.length > 1 ? `${ok[0]} to ${ok[ok.length - 1]}` : ok[0] : null;
};

export function CompareVerdict({ products, traits, items, specLabels, scoreWord, removeHref }: { products: CProduct[]; traits: VTrait[];
  /** The catalog's match items (engine sites); none: no quick match, the verdict before picks. */ items: RankItem[] | null;
  specLabels: string[]; scoreWord: string; removeHref: Record<string, string> }) {
  const [c, setC] = useState<QuickChoice>({ style: "any", arm: false });
  const picks = useMemo<Record<string, VPick> | null>(() => {
    if (!items || !c.level) return null;
    const pcts = matchPcts(items, c, niche.fit?.levelGate, niche.fit?.engine), byId = new Map(items.map(x => [x.id, x]));
    return Object.fromEntries(products.map(p => { const it = byId.get(p.id);
      const hard = it && c.level && hardOnLevelOrArm({ ...c, arm: false }, it.facts) ? "level" : it && c.arm && hardOnLevelOrArm({ style: "any", arm: true }, it.facts) ? "arm" : null;
      return [p.id, { pct: pcts.get(p.id) ?? null, hard, levelWord: levelsWord(it) }]; }));
  }, [items, c, products]);
  const v = useMemo(() => compareVerdict(products, traits, picks, scoreWord), [products, traits, picks, scoreWord]);
  const byId = new Map(products.map(p => [p.id, p])), shown = v.order.map(id => byId.get(id)!);
  const diffs = differRows(shown, traits);
  const cols = { "--n": shown.length } as React.CSSProperties;
  const L = (l: VLine, big = false) => <p className={big ? "cx-head" : "cx-line"}>{l.pre}{big ? <mark>{l.name}</mark> : <strong>{l.name}</strong>}{l.post}</p>;
  const style = (s: QuickChoice["style"]) => setC(x => ({ ...x, style: x.style === s ? "any" : s }));
  return <>
    {items && <section className="cx-qm" aria-label="Quick match">
      <span className="cx-tag">find my match</span>
      <span className="cx-seg">{STYLES.filter(s => s !== "any").map(s => <button key={s} type="button" aria-pressed={c.style === s} onClick={() => style(s)}>{STYLE_WORD[s] ?? s}</button>)}</span>
      <span className="cx-seg">{(LEVELS as readonly Level[]).map(l => <button key={l} type="button" aria-pressed={c.level === l} onClick={() => setC(x => ({ ...x, level: x.level === l ? undefined : l }))}>{levelLabel(l)}</button>)}</span>
      <button type="button" className="cx-arm" aria-pressed={c.arm} onClick={() => setC(x => ({ ...x, arm: !x.arm }))}><i aria-hidden="true">{c.arm ? "✓" : ""}</i>{ARM_SHORT}</button>
      <span className="cx-hint">{v.picked ? "updated for you" : "pick a level for a straight answer"}</span>
    </section>}

    <section className="cx-verdict" aria-live="polite">
      <span className="cx-kicker">{v.picked ? "the short answer for you" : items ? "the short answer, before your picks" : "the short answer"}</span>
      {L(v.head, true)}
      {v.rest.map((l, i) => <div key={i}>{L(l)}</div>)}
    </section>

    <section className="cx-cards" style={cols}>{shown.map((p, i) => { const pk = picks?.[p.id], num = v.picked ? pk?.pct ?? null : p.signal;
      return <article key={p.id} className="cx-card">
        <span className="cx-pic">{p.pic ? <img src={p.pic} alt={p.name} loading={i < 2 ? "eager" : "lazy"} decoding="async"/> : <i aria-hidden="true">{p.short.slice(0, 1)}</i>}</span>
        <div className="cx-mid">
          <span className="cx-pickrow">{i === 0 && <span className="cx-pick">{v.picked ? "our pick for you" : "top rated"}</span>}</span>
          <a className="cx-name" href={p.href} title={p.name}>{p.short}</a>
          {p.shop && <a className="cx-buy" href={p.shop.url} target="_blank" rel={p.shop.rel}>check price ↗</a>}
        </div>
        {!v.picked && !COMPARE_SHOWS_SCORE ? <span className="cx-num" title="Reviews with a clear opinion"><b>{p.judged.toLocaleString("en-US")}</b><small>{p.judged === 1 ? "review" : "reviews"}</small></span>
          : !v.picked && scoreState(p.judged) === "new" ? <span className="cx-num"><NewPill n={p.judged}/></span> : <span className="cx-num" title={v.picked ? NOTE : undefined}><b className={(v.picked ? matchBox(num) : scoreBox(num)) || undefined}>{num === null ? "–" : v.picked ? `${num}%` : num}</b><small>{v.picked ? "match" : scoreWord}</small></span>}
        {removeHref[p.id] && <a className="cx-x" href={removeHref[p.id]} aria-label={`Remove ${p.name}`}>✕</a>}
      </article>; })}</section>

    {shown.some(p => p.yes.length || p.no) && <section className="cx-sec">
      <h2>Why yes, why not</h2>
      <div className="cx-yn" style={cols}>{shown.map(p => <div key={p.id} className="cx-ynbox">
        <b className="cx-ynname">{p.short}</b>
        <div className="cx-yes">{p.yes.map((y, i) => <span key={i}><i aria-hidden="true">✓</i>{y}</span>)}</div>
        {p.no && <div className="cx-no"><span><i aria-hidden="true">!</i>{p.no}</span></div>}
      </div>)}</div>
    </section>}

    {diffs.length > 0 && <section className="cx-sec cx-narrow">
      <h2>Where they differ</h2>
      <div className="cx-diffs">{diffs.map(d => <div key={d.label}><span>{d.label}</span><b>{byId.get(d.id)!.short}</b></div>)}</div>
    </section>}

    {specLabels.length > 0 && <section className="cx-sec">
      {/* Always open (owner 2026-11-17): the page is short enough without a toggle. */}
      <h2 className="cx-spech">Specs side by side</h2>
      <div className="cx-specs" style={cols}>
        <div className="cx-sr cx-srh"><span/>{shown.map(p => <b key={p.id}>{p.short}</b>)}</div>
        {specLabels.map((label, k) => { const vals = shown.map(p => p.specs[k]), differ = new Set(vals.map(x => x ?? "")).size > 1;
          return <div key={label} className="cx-sr"><span>{label}</span>{vals.map((x, i) => <span key={i}><em className={differ ? "d" : undefined}>{x ? x.replace(/\//g, "/\u200b") : "not listed"}</em></span>)}</div>; })}
        <div className="cx-srf"><em className="d">highlighted</em> = they differ here</div>
      </div>
    </section>}
  </>;
}

/** "← change …": back to the catalogue in compare mode with these products still picked (the tray's tab storage). */
export function ChangeLink({ href, label, picks }: { href: string; label: string; picks: { id: string; slug: string; name: string; pic: string | null }[] }) {
  return <a href={href} onClick={() => { try { sessionStorage.setItem("compare-picks", JSON.stringify({ on: true, picks })); } catch { /* private mode */ } }}>{label}</a>;
}
