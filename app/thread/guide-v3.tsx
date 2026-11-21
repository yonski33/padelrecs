// PadelRecs Guides v3 and Guide v3 (owner design 2026-11-21, design_handoff_padelrecs_v3). Padel only.
// Guide: an eyebrow (section · read time), the title and lead, the TL;DR, numbered H2 sections (today's steps, all kept), the
// guide's rackets with loved / mixed / not for me counts (no score), the v7b Discussion, and a sidebar: In this guide,
// Related rankings, Still not sure?, More guides. Guides: a title card and one card per guide.
import type { ReactNode } from "react";
import { th, GUIDE_PATHS, GUIDE_KEYS } from "../../lib/thread/look";
import { GUIDES, GUIDE_LINK_LABELS, GUIDE_UI, type GuideCopy } from "../../lib/thread/copy";
import { Discussion } from "./live/discussion";
import type { ThreadRow } from "./ui";

/** "n min read" for a guide: its lead, TL;DR and steps at about 200 words a minute. */
export function guideMinutes(g: GuideCopy) {
  const words = [g.tldrLead ?? "", ...g.tldr, ...g.steps.flatMap(s => [s.title, s.body])].join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
/** "31 loved · 12 mixed · 6 not for me": raw counts only (owner rule v3: no 0-100 score, no %). */
export const feelLine = (r: Pick<ThreadRow, "pos" | "mix" | "neg">) =>
  [[r.pos, "loved"], [r.mix, "mixed"], [r.neg, "not for me"]].filter(([n]) => (n as number) > 0).map(([n, w]) => `${n} ${w}`).join(" · ") || "No reviews yet";

export function CountsRow({ r }: { r: ThreadRow }) {
  const total = r.pos + r.mix + r.neg;
  return <a className="thg3-row" href={th(r.href)}>
    <span className="pic">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
    <span className="words"><strong>{r.name}</strong>
      {total > 0 && <span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>}
      <small>{feelLine(r)}</small></span>
    <span className="go">{GUIDE_UI.seeReviews}</span>
  </a>;
}

export function GuideV3({ g, picks, picksTitle, fullRanking, related, crumbs }: { g: GuideCopy; picks: { title?: string; rows: ThreadRow[] }[]; picksTitle: string;
  fullRanking: string; related: { label: string; href: string }[]; crumbs: ReactNode }) {
  const others = GUIDE_KEYS.filter(k => k !== g.key).map(k => ({ label: GUIDE_LINK_LABELS[k], href: GUIDE_PATHS[k] }));
  return <main className="th-main thg3">
    {crumbs}
    <div className="thg3-grid">
      <div className="thg3-main">
        <article className="th-card thg3-read">
          <span className="thg3-eyebrow">{`${g.crumb} · ${guideMinutes(g)} min read`}</span>
          <h1 className="th-h1">{g.title}</h1>
          {g.tldrLead && <p className="lead">{g.tldrLead}</p>}
          {g.tldr.length > 0 && <div className="thg3-tldr"><b>{GUIDE_UI.tldrLabel}</b><ul>{g.tldr.map(t => <li key={t}>{t}</li>)}</ul></div>}
          <h2 className="thg3-steps-h">{g.stepsTitle}</h2>
          {g.steps.map((s, i) => <section key={s.title} id={`tip-${i + 1}`}><h2>{`${i + 1}. ${s.title}`}</h2><p>{s.body}</p></section>)}
        </article>
        {picks.some(p => p.rows.length) && <section className="th-card thg3-picks">
          <div className="head"><h2 className="th-h2">{picksTitle}</h2><a href={th(fullRanking)}>{GUIDE_UI.fullRanking}</a></div>
          {picks.map((p, i) => p.rows.length > 0 && <div key={i}>{p.title && <h3>{p.title}</h3>}{p.rows.map(r => <CountsRow key={r.id} r={r}/>)}</div>)}
        </section>}
        <Discussion page={`guide:${g.key}`} model={g.title} words={{ heading: g.commentsTitle, sub: "", ask: g.composerPrompt, askIcon: "+",
          placeholder: g.composerPlaceholder, empty: "Nothing here yet. Start it off." }}/>
      </div>
      <aside className="thg3-side">
        {g.onThisPage.length > 0 && <section className="th-card thg3-box"><h3>In this guide</h3>
          {g.onThisPage.map((t, i) => <a key={t} href={`#tip-${i + 1}`}>{`${i + 1}. ${t}`}</a>)}</section>}
        {related.length > 0 && <section className="th-card thg3-box"><h3>Related rankings</h3>
          {related.map(r => <a key={r.href} className="arrow" href={th(r.href)}><span>{r.label}</span><span aria-hidden="true">→</span></a>)}</section>}
        <section className="th-card thg3-box lime"><h3>Still not sure?</h3><p>Answer three quick picks and see your best fits.</p>
          <a className="thg3-btn" href={th("/rackets")}>Find my match</a></section>
        <section className="th-card thg3-box"><h3>{GUIDE_UI.moreGuides}</h3>
          {others.map(o => <a key={o.href} className="arrow" href={th(o.href)}><span>{o.label}</span><span aria-hidden="true">→</span></a>)}</section>
      </aside>
    </div>
  </main>;
}

/** The Guides index (v3): a title card, then one card per guide (section, title, description, read time, Read guide →). */
export function GuidesIndexV3() {
  return <main className="th-main thg3">
    <section className="th-card thg3-title"><h1 className="th-h1">Guides</h1><p>Plain guides to picking and using a padel racket, built from what players report.</p></section>
    <div className="thg3-cards">{GUIDES.map(g => <a key={g.key} className="th-card thg3-card" href={th(GUIDE_PATHS[g.key])}>
      <span className="thg3-eyebrow">{g.crumb}</span><strong>{g.title}</strong><span className="desc">{g.tldrLead ?? g.description}</span>
      <span className="foot"><span>{`${guideMinutes(g)} min read`}</span><span className="go">Read guide →</span></span>
    </a>)}</div>
  </main>;
}
