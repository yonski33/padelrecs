"use client";
// The Thread lists that follow the visitor's picks: the home's top rackets (re-ranked for the picks, curated picks first) and a
// ranking page's list (its order stays, the badges turn into match %). The server sends the first view; the rest is here.
import { useMemo, useState } from "react";
import { Row, type ThreadRow } from "../ui";
import { PickChips } from "./pick-chips";
import { usePicks, usePayload, complete, rankFor, pctsFor, rowFromCard, NO_PICKS } from "./picks";

function useMatch() {
  const [picks, set] = usePicks();
  const on = complete(picks);
  const payload = usePayload(on);
  return { picks, set, on, payload };
}

/** "Find my match" (home hero, ranking sidebar "See how you match"). */
export function MatchBox({ title = "Find my match", names }: { title?: string; names: Record<string, string> }) {
  const { picks, set, on, payload } = useMatch();
  const top = useMemo(() => on && payload ? rankFor(payload, picks, 1)[0] : null, [on, payload, picks]);
  const any = !!(picks.level || picks.style || picks.arm);
  const name = top ? names[top.id] ?? payload?.cards[top.id]?.name : null;
  return <div className="th-match">
    <span className="th-match-head"><span>{title}</span>{any && <button type="button" className="th-reset" onClick={() => set(NO_PICKS)}>Reset</button>}</span>
    <PickChips picks={picks} set={set}/>
    {(picks.level || picks.style) && <span className="th-say" aria-live="polite">{!on ? "Pick one more to get your match %."
      : !payload ? "Working out your matches…"
      : top && name && top.pct != null ? `Your top match is the ${name} at ${top.pct}%. The list is now sorted for you.` : "No clear match for these picks yet. Try another level or style."}</span>}
  </div>;
}

type Sort = "score" | "reviews";
/** The home's top rackets: by Player score (or most reviewed); with picks, the engine's list for them, by match %. */
export function HomeList({ rows, reviewed, size = 10 }: { rows: ThreadRow[]; reviewed: ThreadRow[]; size?: number }) {
  const { picks, on, payload } = useMatch();
  const [sort, setSort] = useState<Sort>("score"), [open, setOpen] = useState(false);
  const personal = on && !!payload;
  const shown = useMemo(() => {
    if (personal && sort === "score") {
      const byId = new Map(rows.map(r => [r.id, r]));
      const sig = new Map(payload!.items.map(x => [x.id, x.signal]));
      return rankFor(payload!, picks, size).flatMap(x => { const r = byId.get(x.id) ?? (payload!.cards[x.id] ? rowFromCard(x.id, payload!.cards[x.id], sig.get(x.id) ?? null) : null); return r ? [{ r, pct: x.pct }] : []; });
    }
    const list = sort === "reviews" ? reviewed : rows;
    return list.slice(0, size).map(r => ({ r, pct: undefined as number | null | undefined }));
  }, [personal, sort, rows, reviewed, payload, picks, size]);
  const label = sort === "reviews" ? "Most reviewed" : personal ? "By your match" : "By player score";
  return <section className="th-card th-list">
    <div className="th-sort" style={{ marginBottom: 6 }}>
      <span className="lbl">Sort</span>
      <span className="th-dd">
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}<small aria-hidden="true">{open ? "▲" : "▼"}</small></button>
        {open && <div className="th-dd-menu" role="menu">
          {([["score", personal ? "By your match" : "By player score"], ["reviews", "Most reviewed"]] as const).map(([k, l]) =>
            <button key={k} type="button" role="menuitemradio" aria-checked={sort === k} onClick={() => { setSort(k); setOpen(false); }}>{l}<span aria-hidden="true">{sort === k ? "✓" : ""}</span></button>)}
        </div>}
      </span>
    </div>
    {shown.map(({ r, pct }, i) => <Row key={r.id} r={r} rank={i + 1} {...(pct !== undefined ? { badge: pct, badgeLabel: "your match", pct: true } : {})}/>)}
    <a className="th-link-b" href="/rankings?look=thread" style={{ margin: "4px 0 10px" }}>All rankings</a>
  </section>;
}

/** A ranking page's list: the ranking's own order (curated picks first), with match % badges once the picks are complete. */
export function RankingList({ rows, title, meta }: { rows: ThreadRow[]; title: string; meta: string }) {
  const { picks, on, payload } = useMatch();
  const pcts = useMemo(() => on && payload ? pctsFor(payload, picks) : null, [on, payload, picks]);
  return <section className="th-card th-list">
    <div className="th-head-row" style={{ marginBottom: 6 }}><span className="th-stitle" style={{ fontSize: 20 }}>{title}</span><span className="th-sub">{meta}</span></div>
    {rows.map((r, i) => <Row key={r.id} r={r} rank={i + 1} {...(pcts ? { badge: pcts.get(r.id) ?? null, badgeLabel: "your match", pct: true } : {})}/>)}
  </section>;
}

/** The ranking sidebar's "See how you match" card. */
export function SideMatch({ names }: { names: Record<string, string> }) {
  return <section className="th-card" style={{ padding: "12px 14px" }}><MatchBox title="See how you match" names={names}/></section>;
}
