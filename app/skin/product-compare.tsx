"use client";
import { useState } from "react";

/** "How it feels & compares" on the beauty product page (owner's design 2026-11-16): tab one is this product's rows; the other
 *  tabs set it beside an alternative, with "stay with this one if you…" / "pick X if you…" from the real differences. All rows
 *  come from the server (lib/attr-score.ts scores); this only switches tabs. */
export type Viz = { kind: "drops"; n: number } | { kind: "axis"; pct: number; word: string } | { kind: "text"; text: string } | null;
export type CmpRow = { name: string; a: Viz; b: Viz; aWin: boolean; bWin: boolean };
export type CmpTab = { key: string; short: string; why: string; photo: string | null; href: string; total: number; rows: CmpRow[]; stayIf: string[]; pickIf: string[] };
export type SelfRow = { name: string; v: Viz; note: string };

function Show({ v }: { v: Viz }) {
  if (!v) return <span className="bp-v none">not enough said</span>;
  if (v.kind === "text") return <span className="bp-v text">{v.text}</span>;
  if (v.kind === "axis") return <span className="bp-v"><span className="bp-track" role="img" aria-label={v.word}><span className="bp-knob" style={{ left: `${v.pct}%` }}/></span></span>;
  return <span className="bp-v"><span className="bp-drops" role="img" aria-label={`${v.n} of 5`}>{[1, 2, 3, 4, 5].map(k => <i key={k} className={k <= v.n ? "on" : undefined}/>)}</span></span>;
}

export default function ProductCompare({ self, tabs, selfTotal, photo }: { self: SelfRow[]; tabs: CmpTab[]; selfTotal: number; photo: string | null }) {
  const [tab, setTab] = useState("self");
  const cmp = tabs.find(t => t.key === tab);
  const thumb = (src: string | null) => <span className="bp-tthumb">{src && <img src={src} alt="" loading="lazy"/>}</span>;
  return <div className="bp-card bp-cmp">
    <div className="bp-tabs" role="tablist" aria-label="Compare">
      <button type="button" role="tab" aria-selected={tab === "self"} onClick={() => setTab("self")}>{thumb(photo)}<span><b>This one</b><small>how it feels</small></span></button>
      {tabs.map(t => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>{thumb(t.photo)}<span><b>{t.short}</b><small>{t.why}</small></span></button>)}
    </div>
    {!cmp ? <div className="bp-rows">{self.map(r => <div key={r.name} className="bp-row"><b>{r.name}</b><Show v={r.v}/><span className="bp-note">{r.note}</span></div>)}</div>
      : <>
        <div className="bp-rows">
          <div className="bp-crow head"><span/><span className="bp-who"><span className="bp-tthumb">{photo && <img src={photo} alt="" loading="lazy"/>}</span><span><em>This one</em><small>{`${selfTotal} reviews`}</small></span></span>
            <span className="bp-who">{thumb(cmp.photo)}<span><em>{cmp.short}</em><small>{`${cmp.total} reviews`}</small></span></span></div>
          {cmp.rows.map(r => <div key={r.name} className="bp-crow"><b>{r.name}</b>
            <span className="bp-cv"><Show v={r.a}/>{r.aWin && <small className="bp-win">better</small>}</span>
            <span className="bp-cv"><Show v={r.b}/>{r.bWin && <small className="bp-win">better</small>}</span></div>)}
        </div>
        {(cmp.stayIf.length > 0 || cmp.pickIf.length > 0) && <div className="bp-ifs">
          {cmp.stayIf.length > 0 && <div className="bp-if stay"><span>stay with this one if you…</span>{cmp.stayIf.map(p => <p key={p}><i>→</i>{p}</p>)}</div>}
          {cmp.pickIf.length > 0 && <div className="bp-if pick"><span>{`pick ${cmp.short} if you…`}</span>{cmp.pickIf.map(p => <p key={p}><i>→</i>{p}</p>)}<a href={cmp.href}>{`open ${cmp.short} →`}</a></div>}
        </div>}
      </>}
  </div>;
}
