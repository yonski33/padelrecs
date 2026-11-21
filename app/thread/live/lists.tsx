"use client";
// The Thread lists that follow the visitor's picks: the home's top rackets (re-ranked for the picks, curated picks first) and a
// ranking page's list (its order stays, the badges turn into match %). The server sends the first view; the rest is here.
import { useMemo, useState } from "react";
import { Row, type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { usePicks, usePayload, rankFor, pctsFor, rowFromCard, NO_PICKS, LEVEL_OPTS, STYLE_OPTS, TYPES, styleLabel, ARM_LABEL, type Picks, type Style } from "./picks";
import { cap } from "../ui";
import { niche } from "../../../lib/niche";
import { W } from "../../../lib/thread/words";
const { one: ONE, many: MANY } = niche.words;

// On the home a single pick is enough (owner 2026-11-19: "Any" is the default style), so a level alone re-ranks the list.
const picked = (p: Picks) => !!(p.level || p.style || p.arm);
/** The home also re-ranks for a type chip alone (DiscGolfRecs). */
const pickedHome = (p: Picks) => picked(p) || !!p.kind;
function useMatch(home = false) {
  const [picks, set] = usePicks();
  const on = home ? pickedHome(picks) : picked(picks);
  const payload = usePayload(on);
  return { picks, set, on, payload };
}

const STYLE_WORD: Record<Style, string> = { control: "control", balance: "all-round", power: "power", spin: "spin" };
/** "38 rackets for intermediate control players with a sore arm" (real counts at any size, owner 2026-11-19). */
function resultLine(picks: Picks, n: number | null, all: number) {
  if (TYPES.length) return discLine(picks, n, all);
  if (!picked(picks)) return all > 0 ? `Showing all ${all} ${MANY}` : "";
  const who = [picks.level, picks.style ? STYLE_WORD[picks.style] : null].filter(Boolean).join(" ");
  const forWho = `for ${who ? `${who} players` : "players"}${picks.arm ? " with a sore arm" : ""}`;
  return n == null ? `Finding ${MANY} ${forWho}…` : n > 0 ? `Showing ${n} ${n === 1 ? ONE : MANY} ${forWho}` : `No ${MANY} ${forWho} yet`;
}

/** DiscGolfRecs: "Showing 38 understable midranges for intermediate throwers with a slower arm", with the type chip's words. */
function discLine(picks: Picks, n: number | null, all: number) {
  const many = TYPES.find(t => t.key === picks.kind)?.many ?? MANY, one = many.replace(/s$/, "");
  const what = [picks.style ? styleLabel(picks.style).toLowerCase() : null, many].filter(Boolean).join(" ");
  const forWho = `${picks.level ? ` for ${picks.level} ${W.people}` : ""}${picks.arm ? " with a slower arm" : ""}`;
  if (!pickedHome(picks)) return all > 0 ? `Showing all ${all} ${MANY}` : "";
  return n == null ? `Finding ${what}${forWho}…` : n > 0 ? `Showing ${n} ${n === 1 ? what.replace(many, one) : what}${forWho}` : `No ${what}${forWho} yet`;
}

/** "Find my match" as one sentence (owner 2026-11-19, classic's energy in Thread style): the quick match tag, I'm [level pills]
 *  and I want [Any | Control | Balance | Power] [ ] Sore arm, then a live result line. Matching runs here on the cached payload. */
export function MatchBox({ title, names, listed = 0, home = false }: { title?: string; names: Record<string, string>; listed?: number; home?: boolean }) {
  const { picks, set, on, payload } = useMatch(home);
  const ranked = useMemo(() => on && payload ? rankFor(payload, picks, 1000, home) : null, [on, payload, picks, home]);
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
      <span className="th-seg th-qm-seg" role="group" aria-label="What you want">{([null, ...STYLE_OPTS] as (Style | null)[]).map(v => <button key={v ?? "any"} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: v })}>{v ? styleLabel(v) : "Any"}</button>)}</span>
      <button type="button" className="th-check" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>{ARM_LABEL}</button>
    </div>
    {line && <span className="th-qm-result"><span className="th-say" aria-live="polite">{line}{top && name && top.pct != null ? `. Top match: the ${name} at ${top.pct}%.` : line.endsWith("…") ? "" : "."}</span>{(home ? pickedHome(picks) : picked(picks)) && <button type="button" className="th-reset" onClick={() => set(NO_PICKS)}>Reset</button>}</span>}
  </div>;
}

type Sort = "score" | "reviews";
/** The home's top rackets: by Player score (or most reviewed); with picks, the engine's list for them, by match %. */
export function HomeList({ rows, reviewed, size = 10 }: { rows: ThreadRow[]; reviewed: ThreadRow[]; size?: number }) {
  const { picks, set, on, payload } = useMatch(true);
  const [sort, setSort] = useState<Sort>("score"), [open, setOpen] = useState(false);
  const personal = on && !!payload;
  const shown = useMemo(() => {
    if (personal && sort === "score") {
      const byId = new Map(rows.map(r => [r.id, r]));
      const sig = new Map(payload!.items.map(x => [x.id, x.signal]));
      return rankFor(payload!, picks, size, true).flatMap(x => { const r = byId.get(x.id) ?? (payload!.cards[x.id] ? rowFromCard(x.id, payload!.cards[x.id], sig.get(x.id) ?? null) : null); return r ? [{ r, pct: x.pct }] : []; });
    }
    const shape = TYPES.find(t => t.key === picks.kind)?.shape.toLowerCase();
    const list = (sort === "reviews" ? reviewed : rows).filter(r => !shape || r.shape?.toLowerCase() === shape);
    return list.slice(0, size).map(r => ({ r, pct: undefined as number | null | undefined }));
  }, [personal, sort, rows, reviewed, payload, picks, size]);
  const label = sort === "reviews" ? "Most reviewed" : personal ? "By your match" : `By ${W.score}`;
  const sortBox = <div className="th-sort" style={TYPES.length ? undefined : { marginBottom: 6 }}>
      <span className="lbl">Sort</span>
      <span className="th-dd">
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}<small aria-hidden="true">{open ? "▲" : "▼"}</small></button>
        {open && <div className="th-dd-menu" role="menu">
          {([["score", personal ? "By your match" : `By ${W.score}`], ["reviews", "Most reviewed"]] as const).map(([k, l]) =>
            <button key={k} type="button" role="menuitemradio" aria-checked={sort === k} onClick={() => { setSort(k); setOpen(false); }}>{l}<span aria-hidden="true">{sort === k ? "✓" : ""}</span></button>)}
        </div>}
      </span>
    </div>;
  return <section className="th-card th-list">
    {TYPES.length ? <div className="th-skin-listhead">
      {/* The type chips sit above the list next to Sort, not in the match sentence (owner 2026-11-20, as on SkinRecs). */}
      <div className="th-qm-cats" role="group" aria-label="Disc type">
        {[{ key: null as string | null, label: "All" }, ...TYPES.map(t => ({ key: t.key as string | null, label: cap(t.many) }))].map(t =>
          <button key={t.key ?? "all"} type="button" className="th-pick sm" aria-pressed={(picks.kind ?? null) === t.key} onClick={() => set({ kind: t.key })}>{t.label}</button>)}
      </div>
      {sortBox}
    </div> : sortBox}
    {shown.map(({ r, pct }, i) => <Row key={r.id} r={r} rank={i + 1} {...(pct !== undefined ? { badge: pct, badgeLabel: "your match", pct: true } : {})}/>)}
    <a className="th-link-b" href={th("/rankings")} style={{ margin: "4px 0 10px" }}>All rankings</a>
  </section>;
}

/** A ranking page's list: the ranking's own order (curated picks first), with match % badges once the picks are complete. */
export function RankingList({ rows, title, meta, ratings, match = true }: { rows: ThreadRow[]; title: string; meta: string;
  /** Padel category lists: the curated rating per row (lib/category-rating.ts) and its label. */ ratings?: { by: Record<string, number>; label: string };
  /** false: no "your match" % (a site without the level · style · arm quick match, lib/thread/sites.ts QUICK_MATCH). */ match?: boolean }) {
  const m = useMatch(), on = match && m.on, { picks, payload } = m;
  const pcts = useMemo(() => on && payload ? pctsFor(payload, picks) : null, [on, payload, picks]);
  return <section className="th-card th-list">
    <div className="th-head-row" style={{ marginBottom: 6 }}><span className="th-stitle" style={{ fontSize: 20 }}>{title}</span><span className="th-sub">{meta}</span></div>
    {rows.map((r, i) => { const n = ratings?.by[r.id];
      return <Row key={r.id} r={r} rank={i + 1} {...(n != null ? { rating: { n, label: ratings!.label } } : {})}
        {...(pcts ? { badge: pcts.get(r.id) ?? null, badgeLabel: "your match", pct: true } : {})}/>; })}
  </section>;
}

/** The ranking sidebar's "See how you match" card. */
export function SideMatch({ names }: { names: Record<string, string> }) {
  return <section className="th-card" style={{ padding: "12px 14px" }}><MatchBox title="See how you match" names={names}/></section>;
}
