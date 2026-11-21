"use client";
// PadelRecs Search v3 (owner design 2026-11-21): one box; rackets (with loved / mixed / not for me counts, no score),
// discussions and stories that match, filtered here in the browser from the cached page's index (app/thread/search-data.ts).
// The words stay in the address (?q=) so a search can be shared.
import { useEffect, useMemo, useState } from "react";
import { th } from "../../../lib/thread/look";
import type { SearchIndex } from "../search-data";

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const has = (hay: string, words: string[]) => { const h = norm(hay); return words.every(w => h.includes(w)); };
const feel = (r: { pos: number; mix: number; neg: number }) => [[r.pos, "loved"], [r.mix, "mixed"], [r.neg, "not for me"]].filter(([n]) => (n as number) > 0).map(([n, w]) => `${n} ${w}`).join(" · ") || "No reviews yet";
const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

export function SearchV3({ index }: { index: SearchIndex }) {
  const [q, setQ] = useState("");
  useEffect(() => { const v = new URLSearchParams(location.search).get("q"); if (v) setQ(v); }, []);
  useEffect(() => { const u = new URL(location.href); if (q.trim()) u.searchParams.set("q", q.trim()); else u.searchParams.delete("q"); history.replaceState(null, "", u); }, [q]);
  const words = norm(q).split(/\s+/).filter(Boolean);
  const found = useMemo(() => words.length === 0 ? null : {
    rackets: index.rackets.filter(r => has(`${r.name} ${r.brand} ${r.shape ?? ""}`, words)).sort((a, b) => b.n - a.n).slice(0, 12),
    talk: index.talk.filter(c => has(`${c.text} ${c.where}`, words)).slice(0, 8),
    stories: index.stories.filter(s => has(`${s.title} ${s.who} ${s.mentions.join(" ")}`, words)).slice(0, 6),
  }, [index, words.join(" ")]); // eslint-disable-line react-hooks/exhaustive-deps
  const none = found && !found.rackets.length && !found.talk.length && !found.stories.length;
  return <>
    <section className="th-card ths4-head">
      <label className="ths4-box"><svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search rackets, discussions and stories" aria-label="Search" autoFocus/></label>
      <span className="sum" aria-live="polite">{!found ? "Type a racket, a brand or a topic." : none ? `Nothing found for "${q.trim()}". Try a brand or a shorter word.`
        : `${n(found.rackets.length, "racket")}, ${n(found.talk.length, "discussion")} and ${n(found.stories.length, "story", "stories")} for "${q.trim()}"`}</span>
    </section>
    {found && found.rackets.length > 0 && <section className="th-card ths4-sec"><h2 className="th-h2">Rackets</h2>
      {found.rackets.map(r => { const total = r.pos + r.mix + r.neg;
        return <a key={r.id} className="ths4-rk" href={th(r.href)}><span className="pic">{r.pic ? <img src={r.pic} alt=""/> : <span className="th-ph" aria-hidden="true"/>}</span>
          <span className="words"><span className="top"><strong>{r.name}</strong>{r.shape && <span className="shape">{r.shape}</span>}</span>
            <span className="feel">{total > 0 && <span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>}{feel(r)}</span></span></a>; })}
    </section>}
    {found && found.talk.length > 0 && <section className="th-card ths4-sec"><h2 className="th-h2">Discussions</h2>
      {found.talk.map(c => <a key={c.id} className="ths4-item" href={th(c.href)}><strong>{c.text}</strong><span>{`${c.where} · ${n(c.replies, "reply", "replies")}`}</span></a>)}
    </section>}
    {found && found.stories.length > 0 && <section className="th-card ths4-sec"><h2 className="th-h2">Stories</h2>
      {found.stories.map(s => <a key={s.id} className="ths4-item" href={th(s.href)}><strong>{s.title}</strong>
        <span>{[s.who, s.mentions.length ? `mentions the ${s.mentions.slice(0, 2).join(" and ")}` : null].filter(Boolean).join(" · ")}</span></a>)}
    </section>}
  </>;
}
