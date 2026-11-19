"use client";
// "How does it play?" (Metalbone CTRL Thread v7): one vote per group, a second tap clears it, change it any time. Options sort
// by reviews + votes, the leader is lime and bold, yours has a dark outline. Until players vote, the bars come from what
// reviews say (lib/thread/trait-view.ts; an option shows at 5 mentions).
// Phones show 3 groups with Show more. Votes: /api/trait-votes (drizzle/0024).
import { useEffect, useState } from "react";
import { TRAIT_GROUPS, type TraitCounts } from "../../../lib/thread/traits";
import { groupView, groupNote, sectionNote } from "../../../lib/thread/trait-view";
import type { TraitSeed } from "../../../lib/thread/trait-seed";

export function TraitVotes({ id, seed }: { id: string; seed: TraitSeed | null }) {
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
  const voteTotal = Object.values(counts).reduce((s, o) => s + Object.values(o).reduce((a, b) => a + b, 0), 0);
  return <section id="play" className="th-card th-sec" style={{ scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h3">How does it play?</h2><span className="th-sub">{sectionNote(seed?.sources ?? 0, voteTotal)}</span></div>
    <div className="th-vgrid">{TRAIT_GROUPS.map((g, gi) => {
      const v = groupView(g.options, seed?.groups[g.key], counts[g.key], seed?.spec[g.key]), max = Math.max(1, ...v.opts.filter(o => o.shown).map(o => o.n));
      return <div key={g.key} className={`th-vbox slim${gi >= 3 && !more ? " th-hide-m" : ""}`} role="group" aria-label={g.title}>
        <span className="th-vbox-head">{g.title}<small>{groupNote(v)}</small></span>
        {v.opts.map(o => <button key={o.key} type="button" className={`th-vopt sm${o.top || o.spec ? " top" : ""}`} aria-pressed={mine[g.key] === o.key} onClick={() => vote(g.key, o.key)}>
            <i style={{ width: o.shown ? `${Math.round(o.n / max * 85)}%` : 0 }}/>
            <span>{o.label}</span>
            {o.shown && <b>{o.n}</b>}
          </button>)}
      </div>; })}</div>
    <button type="button" className="th-more th-only-m" style={{ justifyContent: "center", alignItems: "center" }} onClick={() => setMore(m => !m)}>{more ? "Show fewer" : `Show ${TRAIT_GROUPS.length - 3} more`}</button>
    {err && <span className="th-err">{err}</span>}
  </section>;
}
