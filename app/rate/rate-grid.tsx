"use client";
import { useEffect, useMemo, useState } from "react";
import { FollowUp, loadProfile, sendVote, verdictOf, VerdictButtons } from "../quick-vote";

type Item = { id: string; name: string; brand: string; href: string };
type Pick = { id: string; name: string; href: string; fans: number };

// "Rate what you've used" (2026-11-14 pivot). Each tap is saved at once; the row then opens the same "few words → tags"
// follow-up as the product page's card, one row at a time.
export default function RateGrid({ items, brands, plural, people, placeholder, nicknames }: {
  items: Item[]; brands: string[]; plural: string; people: { one: string; many: string }; placeholder: string; nicknames: string[];
}) {
  const [votes, setVotes] = useState<Record<string, number>>({}), [open, setOpen] = useState(""), [posted, setPosted] = useState<Record<string, boolean>>({});
  const [brand, setBrand] = useState(""), [query, setQuery] = useState(""), [error, setError] = useState(""), [also, setAlso] = useState<Pick[]>([]);

  useEffect(() => {
    fetch("/api/racket-votes", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { mine?: Record<string, number> } | null) => { if (b?.mine) setVotes(b.mine); }).catch(() => {});
  }, []);

  const loved = useMemo(() => Object.entries(votes).filter(([, v]) => v >= 4).map(([id]) => id), [votes]);
  useEffect(() => {
    if (!loved.length) return;
    const timer = setTimeout(() => fetch(`/api/racket-votes?loved=${loved.map(encodeURIComponent).join(",")}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { picks?: Pick[] } | null) => setAlso(b?.picks ?? [])).catch(() => {}), 400);
    return () => clearTimeout(timer);
  }, [loved]);

  async function vote(id: string, n: number) {
    const before = votes[id]; setError("");
    setVotes(prev => ({ ...prev, [id]: n }));
    if (!posted[id]) setOpen(id);
    try { await sendVote(id, n, loadProfile()); }
    catch (e) {
      setVotes(prev => { const next = { ...prev }; if (before) next[id] = before; else delete next[id]; return next; });
      setOpen(o => o === id ? "" : o); setError(e instanceof Error ? e.message : "Could not save your vote.");
    }
  }

  const one = plural.replace(/s$/, "");
  const q = query.trim().toLowerCase();
  const shown = items.filter(i => (!brand || i.brand === brand) && (!q || i.name.toLowerCase().includes(q)));
  const rated = Object.keys(votes).filter(id => items.some(i => i.id === id)).length;
  return <div className="rate">
    <div className="rate-filters">
      <input type="search" placeholder={`Find a ${one}`} value={query} onChange={e => setQuery(e.target.value)} aria-label={`Find a ${one}`}/>
      <div className="rate-brands">{["", ...brands.slice(0, 14)].map(b => <button type="button" key={b || "all"} aria-pressed={brand === b} onClick={() => setBrand(b)}>{b || "All brands"}</button>)}</div>
    </div>
    {error && <p className="qv-error" role="alert">{error}</p>}
    <ul className="rate-list">{shown.map(i => <li key={i.id} className={open === i.id ? "is-open" : undefined}>
      <div className="rate-row">
        <a href={i.href}>{i.name}</a>
        <span className="rate-right">
          {votes[i.id] && open !== i.id && <small className="rate-saved">{posted[i.id] ? "Saved with your review" : "Saved"}</small>}
          <VerdictButtons compact value={votes[i.id] ? verdictOf(votes[i.id]) : null} onPick={v => vote(i.id, v.rating)} name={i.name}/>
        </span>
      </div>
      {open === i.id && votes[i.id] && <FollowUp key={i.id} racketId={i.id} rating={votes[i.id]} label="Saved. Got a few words to say about it?"
        placeholder={placeholder} nicknames={nicknames} onDone={wrote => { setOpen(""); if (wrote) setPosted(p => ({ ...p, [i.id]: true })); }}/>}
    </li>)}</ul>
    {!shown.length && <p className="rate-hint">{`No ${plural} match that. Try another name.`}</p>}
    <section className="rate-summary" aria-live="polite">
      <p>{rated === 0 ? `Tap a verdict on every ${one} you've used. Each tap is saved straight away.` : <><b>{rated}</b>{` ${rated === 1 ? one : plural} rated · each one saved as you tap`}</>}</p>
      {loved.length > 0 && also.length > 0 && <div className="qv-also"><h3>{`${people.many[0].toUpperCase()}${people.many.slice(1)} who love the same ${plural} also love`}</h3>
        <ul>{also.map(a => <li key={a.id}><a href={a.href}>{a.name}</a><small>{`${a.fans} in common`}</small></li>)}</ul></div>}
    </section>
  </div>;
}
