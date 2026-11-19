"use client";
// The Thread lists that follow the visitor's picks: the home's top rackets (re-ranked for the picks, curated picks first) and a
// ranking page's list (its order stays, the badges turn into match %). The server sends the first view; the rest is here.
import { useMemo, useState } from "react";
import { Row, type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { usePicks, usePayload, rankFor, pctsFor, rowFromCard, NO_PICKS, LEVEL_OPTS, STYLE_OPTS, type Picks, type Style } from "./picks";
import { cap } from "../ui";

// On the home a single pick is enough (owner 2026-11-19: "Any" is the default style), so a level alone re-ranks the list.
const picked = (p: Picks) => !!(p.level || p.style || p.arm);
function useMatch() {
  const [picks, set] = usePicks();
  const on = picked(picks);
  const payload = usePayload(on);
  return { picks, set, on, payload };
}

const STYLE_WORD: Record<Style, string> = { control: "control", balance: "all-round", power: "power" };
/** "38 rackets for intermediate control players with a sore arm" (counts under 5 hidden). */
function resultLine(picks: Picks, n: number | null, all: number) {
  if (!picked(picks)) return all >= 5 ? `Showing all ${all} rackets` : "";
  const who = [picks.level, picks.style ? STYLE_WORD[picks.style] : null].filter(Boolean).join(" ");
  const forWho = `for ${who ? `${who} players` : "players"}${picks.arm ? " with a sore arm" : ""}`;
  return n == null ? `Finding rackets ${forWho}…` : n >= 5 ? `Showing ${n} rackets ${forWho}` : `Showing the best rackets ${forWho}`;
}

/** "Find my match" as one sentence (owner 2026-11-19, classic's energy in Thread style): the quick match tag, I'm [level pills]
 *  and I want [Any | Control | Balance | Power] [ ] Sore arm, then a live result line. Matching runs here on the cached payload. */
export function MatchBox({ title, names, listed = 0 }: { title?: string; names: Record<string, string>; listed?: number }) {
  const { picks, set, on, payload } = useMatch();
  const ranked = useMemo(() => on && payload ? rankFor(payload, picks, 1000) : null, [on, payload, picks]);
  const top = ranked?.[0] ?? null;
  const name = top ? names[top.id] ?? payload?.cards[top.id]?.name : null;
  const line = resultLine(picks, ranked ? ranked.length : null, listed);
  return <div className="th-match th-qm">
    {title && <span className="th-match-head"><span>{title}</span></span>}
    <div className="th-qm-line">
      <span className="th-qm-tag">quick match</span>
      <span className="lbl">I&apos;m</span>
      <span className="th-qm-group" role="group" aria-label="Your level">{LEVEL_OPTS.map(v => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}</span>
      <span className="lbl">and I want</span>
      <span className="th-seg th-qm-seg" role="group" aria-label="What you want">{([null, ...STYLE_OPTS] as (Style | null)[]).map(v => <button key={v ?? "any"} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: v })}>{v ? cap(v) : "Any"}</button>)}</span>
      <button type="button" className="th-check" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Sore arm</button>
    </div>
    {line && <span className="th-qm-result"><span className="th-say" aria-live="polite">{line}{top && name && top.pct != null ? `. Top match: the ${name} at ${top.pct}%.` : line.endsWith("…") ? "" : "."}</span>{picked(picks) && <button type="button" className="th-reset" onClick={() => set(NO_PICKS)}>Reset</button>}</span>}
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
    <a className="th-link-b" href={th("/rankings")} style={{ margin: "4px 0 10px" }}>All rankings</a>
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
