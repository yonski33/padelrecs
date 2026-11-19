"use client";
// "How does it play?" (Metalbone CTRL Thread v7): one vote per group, a second tap clears it, change it any time. Options sort
// by reviews + votes, the leader is lime and bold, yours has a dark outline. Until players vote, the bars come from what
// reviews say (lib/thread/trait-view.ts; real counts at any size).
// Four groups first (2 columns, 1 on phones), the other five behind "See all player ratings". Votes: /api/trait-votes (drizzle/0024).
import { useEffect, useState } from "react";
import { TRAIT_GROUPS, type TraitCounts } from "../../../lib/thread/traits";
import { groupView, sectionNote, sectionNoteShort } from "../../../lib/thread/trait-view";
import type { TraitSeed } from "../../../lib/thread/trait-seed";

/** The owner's fixes (admin Traits tab, db/trait-admin.ts): review counts that replace the file's, and frozen groups. */
type Overrides = { counts: Record<string, Record<string, number>>; frozen: string[] };

// The owner's mock (2026-11-19): four groups first, in this order, and the other five behind "See all player ratings".
const FIRST_KEYS = ["plays_like", "level", "arm", "sweet_spot"];
const FIRST = FIRST_KEYS.map(k => TRAIT_GROUPS.find(g => g.key === k)!);
const REST = TRAIT_GROUPS.filter(g => !FIRST_KEYS.includes(g.key));
const OPEN_KEY = "th-traits-open";

export function TraitVotes({ id, seed }: { id: string; seed: TraitSeed | null }) {
  const [counts, setCounts] = useState<TraitCounts>({}), [ov, setOv] = useState<Overrides>({ counts: {}, frozen: [] }), [mine, setMine] = useState<Record<string, string>>({}), [more, setMore] = useState(false), [err, setErr] = useState("");
  // Open or closed stays for this visit (sessionStorage; private mode just forgets it).
  useEffect(() => { try { if (sessionStorage.getItem(OPEN_KEY) === "1") setMore(true); } catch { /* storage off */ } }, []);
  const toggleMore = () => setMore(m => { const next = !m; try { sessionStorage.setItem(OPEN_KEY, next ? "1" : "0"); } catch { /* storage off */ } return next; });
  useEffect(() => {
    fetch(`/api/trait-votes?racket=${encodeURIComponent(id)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { counts?: TraitCounts; mine?: Record<string, string>; overrides?: Overrides } | null) => { if (b?.counts) { setCounts(b.counts); setMine(b.mine ?? {}); if (b.overrides) setOv(b.overrides); } }).catch(() => {});
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
      const b = await r.json() as { counts?: TraitCounts; mine?: Record<string, string>; overrides?: Overrides; error?: string };
      if (!r.ok || !b.counts) throw new Error(b.error || "Could not save your vote.");
      setCounts(b.counts); setMine(b.mine ?? {}); if (b.overrides) setOv(b.overrides);
    } catch (e) { setCounts(was.counts); setMine(was.mine); setErr(e instanceof Error ? e.message : "Could not save your vote."); }
  }
  const voteTotal = Object.values(counts).reduce((s, o) => s + Object.values(o).reduce((a, b) => a + b, 0), 0);
  return <section id="play" className="th-card th-sec" style={{ scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h3">How does it play?</h2><span className="th-sub"><span className="th-only-d">{sectionNote(seed?.sources ?? 0, voteTotal)}</span><span className="th-only-m-inline">{sectionNoteShort(seed?.sources ?? 0, voteTotal)}</span></span></div>
    <div className="th-vgrid2">{[...FIRST, ...(more ? REST : [])].map(g => {
      const closed = ov.frozen.includes("_all") || ov.frozen.includes(g.key);
      const v = groupView(g.options, ov.counts[g.key] ?? seed?.groups[g.key], counts[g.key], seed?.spec[g.key]), max = Math.max(1, ...v.opts.filter(o => o.shown).map(o => o.n));
      return <div key={g.key} className="th-vbox" role="group" aria-label={g.title}>
        <span className="th-vbox-head">{g.title}<small>{[v.specOnly ? "From the specs" : "", closed ? "Voting closed" : ""].filter(Boolean).join(" · ")}</small></span>
        {v.opts.map(o => <button key={o.key} type="button" className={`th-vopt${o.top || o.spec ? " top" : ""}`} aria-pressed={mine[g.key] === o.key} disabled={closed} onClick={() => vote(g.key, o.key)}>
            <i style={{ width: o.shown ? `${Math.round(o.n / max * 85)}%` : 0 }}/>
            <span>{o.label}</span>
            {o.shown && <b>{o.n}</b>}
          </button>)}
      </div>; })}</div>
    <button type="button" className="th-more" aria-expanded={more} onClick={() => toggleMore()}>{more ? "Show fewer" : "See all player ratings"}</button>
    {err && <span className="th-err">{err}</span>}
  </section>;
}
