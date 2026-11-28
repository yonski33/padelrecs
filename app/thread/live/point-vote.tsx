"use client";
// "Players voted" inside an open What they agree on row (owner mock 2026-11-28): the point's own vote group as three
// full-width bars, the count on the right, the leading option filled yellow; tap to vote, tap again to take it back. The
// counts and the saving are the site's vote boxes' own (/api/trait-votes), so a vote here also shows in Community.
import { useEffect, useState } from "react";

type Counts = Record<string, Record<string, number>>;
type Overrides = { counts: Counts; frozen: string[] };

export function PointVote({ id, trait, options, base }: { id: string; trait: string; options: [string, string][];
  /** The counts the server rendered with (the vote boxes' stored and admin-set counts plus live votes). */ base: Record<string, number> }) {
  const [counts, setCounts] = useState<Record<string, number>>(base), [mine, setMine] = useState<string | null>(null), [closed, setClosed] = useState(false);
  useEffect(() => {
    fetch(`/api/trait-votes?racket=${encodeURIComponent(id)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { counts?: Counts; mine?: Record<string, string>; overrides?: Overrides } | null) => {
        if (!b) return;
        setMine(b.mine?.[trait] ?? null);
        setClosed(!!b.overrides && (b.overrides.frozen.includes("_all") || b.overrides.frozen.includes(trait)));
      }).catch(() => {});
  }, [id, trait]);
  async function vote(choice: string) {
    if (closed) return;
    const next = mine === choice ? null : choice, was = { counts, mine };
    const c = { ...counts };
    if (mine) c[mine] = Math.max(0, (c[mine] ?? 1) - 1);
    if (next) c[next] = (c[next] ?? 0) + 1;
    setCounts(c); setMine(next);
    try {
      const r = await fetch("/api/trait-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId: id, trait, choice: next }) });
      if (!r.ok) throw new Error();
    } catch { setCounts(was.counts); setMine(was.mine); }
  }
  const total = options.reduce((a, [k]) => a + (counts[k] ?? 0), 0);
  const lead = options.reduce((a, [k]) => (counts[k] ?? 0) > (counts[a] ?? 0) ? k : a, options[0]![0]);
  return <div className="v13-pv">
    <span className="h"><strong>Players voted</strong><span>{`${total.toLocaleString("en-US")} ${total === 1 ? "vote" : "votes"}`}</span></span>
    {options.map(([k, label]) => <button key={k} type="button" className={k === lead && total > 0 ? "lead" : undefined} aria-pressed={mine === k} disabled={closed} onClick={() => vote(k)}>
      <i style={{ width: `${total ? Math.round(100 * (counts[k] ?? 0) / total) : 0}%` }} aria-hidden="true"/><span>{label}</span><b>{counts[k] ?? 0}</b></button>)}
    <span className="t">{closed ? "Voting closed" : mine ? "Tap again to take your vote back" : "Tap to vote"}</span>
  </div>;
}
