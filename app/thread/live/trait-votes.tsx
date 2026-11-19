"use client";
// "How does it play?" (Metalbone CTRL Thread v7): one vote per group, a second tap clears it, change it any time. Options sort
// by votes, the leader is lime and bold, yours has a dark outline. Counts show once a group has 5 votes (README global rule).
// Phones show 3 groups with Show more. Votes: /api/trait-votes (drizzle/0024).
import { useEffect, useState } from "react";
import { TRAIT_GROUPS, type TraitCounts } from "../../../lib/thread/traits";
import { MIN_SHOWN } from "../ui";

export function TraitVotes({ id }: { id: string }) {
  const [counts, setCounts] = useState<TraitCounts>({}), [mine, setMine] = useState<Record<string, string>>({}), [more, setMore] = useState(false), [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/trait-votes?racket=${encodeURIComponent(id)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { counts?: TraitCounts; mine?: Record<string, string> } | null) => { if (b?.counts) { setCounts(b.counts); setMine(b.mine ?? {}); } }).catch(() => {});
  }, [id]);
  async function vote(trait: string, choice: string) {
    const next = mine[trait] === choice ? null : choice, was = { counts, mine };
    // Shown at once; the server's counts replace it.
    const c = { ...counts, [trait]: { ...(counts[trait] ?? {}) } };
    if (mine[trait]) c[trait][mine[trait]] = Math.max(0, (c[trait][mine[trait]] ?? 1) - 1);
    if (next) c[trait][next] = (c[trait][next] ?? 0) + 1;
    setCounts(c); setMine(m => { const x = { ...m }; if (next) x[trait] = next; else delete x[trait]; return x; }); setErr("");
    try {
      const r = await fetch("/api/trait-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId: id, trait, choice: next }) });
      const b = await r.json() as { counts?: TraitCounts; mine?: Record<string, string>; error?: string };
      if (!r.ok || !b.counts) throw new Error(b.error || "Could not save your vote.");
      setCounts(b.counts); setMine(b.mine ?? {});
    } catch (e) { setCounts(was.counts); setMine(was.mine); setErr(e instanceof Error ? e.message : "Could not save your vote."); }
  }
  return <section id="play" className="th-card th-sec" style={{ scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h3">How does it play?</h2><span className="th-sub">Pick what fits. One vote per group, change it any time.</span></div>
    <div className="th-vgrid">{TRAIT_GROUPS.map((g, gi) => {
      const n = (k: string) => counts[g.key]?.[k] ?? 0, total = g.options.reduce((s, [k]) => s + n(k), 0), shown = total >= MIN_SHOWN, max = Math.max(1, ...g.options.map(([k]) => n(k)));
      const opts = shown ? [...g.options].sort((a, b) => n(b[0]) - n(a[0])) : g.options;
      return <div key={g.key} className={`th-vbox slim${gi >= 3 && !more ? " th-hide-m" : ""}`} role="group" aria-label={g.title}>
        <span className="th-vbox-head">{g.title}<small>{shown ? `${total} votes` : ""}</small></span>
        {opts.map(([k, label]) => { const top = shown && n(k) === max && n(k) > 0;
          return <button key={k} type="button" className={`th-vopt sm${top ? " top" : ""}`} aria-pressed={mine[g.key] === k} onClick={() => vote(g.key, k)}>
            <i style={{ width: shown ? `${Math.round(n(k) / max * 85)}%` : 0 }}/>
            <span>{label}</span>
            {shown && <b>{n(k)}</b>}
          </button>; })}
      </div>; })}</div>
    <button type="button" className="th-more th-only-m" style={{ justifyContent: "center", alignItems: "center" }} onClick={() => setMore(m => !m)}>{more ? "Show fewer" : `Show ${TRAIT_GROUPS.length - 3} more`}</button>
    {err && <span className="th-err">{err}</span>}
  </section>;
}
