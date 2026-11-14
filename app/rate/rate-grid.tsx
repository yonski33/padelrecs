"use client";
import { useEffect, useMemo, useState } from "react";
import { ChoiceRow, loadProfile, saveProfile, sendVote, verdictOf, VerdictButtons, type Profile } from "../quick-vote";

type Item = { id: string; name: string; brand: string; href: string };
type Pick = { id: string; name: string; href: string; fans: number };

export default function RateGrid({ items, brands, plural, people, levels, styles, sides }: {
  items: Item[]; brands: string[]; plural: string; people: { one: string; many: string }; levels: string[]; styles: string[]; sides: string[];
}) {
  const [profile, setProfile] = useState<Profile>({}), [votes, setVotes] = useState<Record<string, number>>({});
  const [brand, setBrand] = useState(""), [query, setQuery] = useState(""), [error, setError] = useState(""), [also, setAlso] = useState<Pick[]>([]);

  useEffect(() => {
    setProfile(loadProfile());
    fetch("/api/racket-votes", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { mine?: Record<string, number> } | null) => { if (b?.mine) setVotes(b.mine); }).catch(() => {});
  }, []);

  const loved = useMemo(() => Object.entries(votes).filter(([, v]) => v >= 4).map(([id]) => id), [votes]);
  useEffect(() => {
    if (!loved.length) { setAlso([]); return; }
    const timer = setTimeout(() => fetch(`/api/racket-votes?loved=${loved.map(encodeURIComponent).join(",")}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { picks?: Pick[] } | null) => setAlso(b?.picks ?? [])).catch(() => {}), 400);
    return () => clearTimeout(timer);
  }, [loved]);

  function setField(field: keyof Profile, value: string) { const p = { ...profile, [field]: value }; setProfile(p); saveProfile(p); }
  async function vote(id: string, n: number) {
    const before = votes[id]; setError("");
    setVotes(prev => ({ ...prev, [id]: n }));
    try { await sendVote(id, n, profile); }
    catch (e) { setVotes(prev => { const next = { ...prev }; if (before) next[id] = before; else delete next[id]; return next; }); setError(e instanceof Error ? e.message : "Could not save your rating."); }
  }

  const one = plural.replace(/s$/, "");
  const q = query.trim().toLowerCase();
  const shown = items.filter(i => (!brand || i.brand === brand) && (!q || i.name.toLowerCase().includes(q)));
  const rated = Object.keys(votes).filter(id => items.some(i => i.id === id)).length;
  return <div className="rate">
    <section className="rate-profile" aria-label="About you">
      <ChoiceRow label="Your level" options={levels} value={profile.level} onPick={v => setField("level", v)}/>
      <ChoiceRow label="Your style (optional)" options={styles} value={profile.style} onPick={v => setField("style", v)}/>
      <ChoiceRow label="Your side (optional)" options={sides} value={profile.side} onPick={v => setField("side", v)}/>
      <p className="rate-hint">{`Remembered on this device, so every rating counts toward the right ${people.many}.`}</p>
    </section>
    <div className="rate-filters">
      <input type="search" placeholder={`Find a ${one}`} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search"/>
      <div className="rate-brands">{["", ...brands.slice(0, 12)].map(b => <button type="button" key={b || "all"} aria-pressed={brand === b} onClick={() => setBrand(b)}>{b || "All"}</button>)}</div>
    </div>
    {error && <p className="qv-error" role="alert">{error}</p>}
    <ul className="rate-list">{shown.map(i => <li key={i.id}>
      <a href={i.href}>{i.name}</a>
      <VerdictButtons compact value={votes[i.id] ? verdictOf(votes[i.id]) : null} onPick={v => vote(i.id, v.rating)} name={i.name}/>
    </li>)}</ul>
    {!shown.length && <p className="rate-hint">{`No ${plural} match that. Try another name.`}</p>}
    <section className="rate-summary" aria-live="polite">
      <p><b>{rated}</b>{` ${rated === 1 ? one : plural} rated`}{rated === 0 ? " · tap a verdict on the ones you've played" : ""}</p>
      {also.length > 0 && <div className="qv-also"><h3>{`${people.many[0].toUpperCase()}${people.many.slice(1)} who love the same ${plural} also love`}</h3>
        <ul>{also.map(a => <li key={a.id}><a href={a.href}>{a.name}</a><small>{`${a.fans} in common`}</small></li>)}</ul></div>}
    </section>
  </div>;
}
