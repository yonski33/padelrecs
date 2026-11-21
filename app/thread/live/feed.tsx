"use client";
// "Latest player reviews" on the home: own reviews and labelled Reddit, YouTube and blog summaries, newest first, with the
// Loved it / Mixed / Not for me chips. Filtering and "More reviews" stay in the browser.
import { useState } from "react";
import { Ago } from "./ago";
import { th } from "../../../lib/thread/look";
import { VERDICT, SOURCE } from "../ui";
import { W } from "../../../lib/thread/words";

export type FeedCard = { id: string; kind: "player" | "youtube" | "blog" | "reddit" | "forum"; who: string; /** An unnamed review's level and side (no name shown). */ info?: string | null; text: string; when: string; /** When it was posted, for the live age and sorting. */ at?: string | null; verdict: "positive" | "mixed" | "negative" | null;
  url: string | null; racket: { name: string; href: string; pic: string | null } };

export function SourceLabel({ kind, who, url, info }: { kind: FeedCard["kind"]; who: string; url: string | null; info?: string | null }) {
  if (kind === "player") return who ? <strong>{who}</strong> : info ? <span className="th-rv-info">{info}</span> : null;
  const [label, cls] = SOURCE[kind];
  return <><span className={`th-tag ${cls}`}>{label}</span>{url ? <a href={url} target="_blank" rel="noopener nofollow" style={{ fontWeight: 700 }}>{`${who} ↗`}</a> : <strong>{who}</strong>}<span>· summarised</span></>;
}

export function Feed({ cards, step = 4, title = `Latest ${W.reviews}` }: { cards: FeedCard[]; step?: number; title?: string }) {
  const [v, setV] = useState<FeedCard["verdict"] | "all">("all"), [n, setN] = useState(step);
  const list = cards.filter(c => v === "all" || c.verdict === v);
  return <section className="th-card th-sec">
    <div className="th-head-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
      <h2 className="th-h2">{title}</h2>
      <div className="th-chipsf" role="group" aria-label="Filter reviews">
        {([["all", "All"], ["positive", "Loved it"], ["mixed", "Mixed"], ["negative", "Not for me"]] as const).map(([k, l]) =>
          <button key={k} type="button" className="th-chipf" aria-pressed={v === k} onClick={() => { setV(k); setN(step); }}>{l}</button>)}
      </div>
    </div>
    <div className="th-rv-list">
      {list.slice(0, n).map(c => <article key={c.id} className="th-rv">
        <a className="th-rv-racket" href={th(c.racket.href)}>{c.racket.pic && <img src={c.racket.pic} alt="" loading="lazy"/>}<b>{c.racket.name}</b></a>
        <div className="th-rv-who"><SourceLabel kind={c.kind} who={c.who} url={c.url} info={c.info}/>{c.verdict && <span className={`th-pill ${VERDICT[c.verdict][1]}`} style={{ fontSize: 12.5 }}>{VERDICT[c.verdict][0]}</span>}
          {c.when && <span className="th-rv-when">{"· "}<Ago at={c.at ?? null} initial={c.when}/></span>}</div>
        <p className="th-rv-text">{c.text}</p>
      </article>)}
      {list.length === 0 && <p className="th-empty">No reviews like that yet. <button type="button" onClick={() => setV("all")}>Show all</button></p>}
    </div>
    {list.length > n && <button type="button" className="th-btn th-center" onClick={() => setN(x => x + step * 2)}>More reviews</button>}
  </section>;
}
