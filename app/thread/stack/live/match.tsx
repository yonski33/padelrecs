"use client";
// StackRecs home: Find my match (I want to build or grow, I am, budget) and the top tools for it. The server renders the
// default view and sends every tool's match inputs once; a tap re-ranks here with lib/stack/match.ts and writes the address
// through app/instant-view.ts (no server round trip; the default view is the cached page). A shared link with picks is read once on load.
import { useEffect, useMemo, type ReactNode } from "react";
import { useInstantView } from "../../../instant-view";
import { Row, type ThreadRow } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { rankMatch, readPicks, picksHref, WHO, BUDGET, DEFAULT_PICKS, type MatchInput, type Picks, type Who } from "../../../../lib/stack/match";
import type { Side } from "../../../../lib/stack/catalog";

const SIDE_WORD: Record<Side, string> = { build: "Build", grow: "Grow" };
const FOR: Record<Who, string> = { non_coder: "for non-coders", some_code: "if you know some code", developer: "for developers",
  solo: "for solo site owners", agency: "for agencies", in_house: "for in-house teams" };

export function StackHome({ inputs, rows, size = 10, children }: { inputs: MatchInput[]; rows: Record<string, ThreadRow>; size?: number; children?: ReactNode }) {
  const [p, set] = useInstantView<Picks>(DEFAULT_PICKS, readPicks, x => picksHref(x), "replace");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const v = readPicks(new URLSearchParams(location.search)); if (picksHref(v) !== picksHref(DEFAULT_PICKS)) set(v); }, []);
  const ranked = useMemo(() => rankMatch(inputs, p), [inputs, p]);
  const top = ranked.slice(0, size).flatMap(x => rows[x.id] ? [{ r: rows[x.id], pct: x.pct }] : []);
  const best = p.who ? ranked.find(x => x.pct != null) : null;
  const who = p.who ? FOR[p.who] : null;
  const line = ranked.length === 0 ? "No tools fit these picks yet."
    : `${ranked.length} ${ranked.length === 1 ? "tool" : "tools"} to ${p.side}${who ? ` ${who}` : ""}${best && rows[best.id] ? `. Top match: ${rows[best.id].name} at ${best.pct}%.` : "."}`;
  const pick = (next: Partial<Picks>) => set(cur => {
    const v = { ...cur, ...next };
    // A side change clears "I am": the options differ between the sides.
    return next.side && next.side !== cur.side ? { ...v, who: null } : v;
  });
  return <>
    <section className="th-card th-hero">{children}<div className="th-match th-qm">
      <div className="th-qm-line">
        <span className="th-qm-tag">find my match</span>
        <span className="lbl">I want to</span>
        <span className="th-seg th-qm-seg" role="group" aria-label="Build or grow">{(["build", "grow"] as const).map(s =>
          <button key={s} type="button" aria-pressed={p.side === s} onClick={() => pick({ side: s })}>{SIDE_WORD[s]}</button>)}</span>
      </div>
      <div className="th-qm-line">
        <span className="lbl">I am</span>
        <span className="th-qm-group" role="group" aria-label="You are">{WHO[p.side].map(([k, l]) =>
          <button key={k} type="button" className="th-pick sm" aria-pressed={p.who === k} onClick={() => pick({ who: p.who === k ? null : k })}>{l}</button>)}</span>
        <span className="lbl">budget</span>
        <span className="th-seg th-qm-seg" role="group" aria-label="Budget">{BUDGET[p.side].map(([k, l]) =>
          <button key={k} type="button" aria-pressed={p.budget === k} onClick={() => pick({ budget: k })}>{l}</button>)}</span>
      </div>
      <span className="th-qm-result"><span className="th-say" aria-live="polite">{line}</span>
        {(p.who || p.budget !== "any") && <button type="button" className="th-reset" onClick={() => set({ ...DEFAULT_PICKS, side: p.side })}>Reset</button>}</span>
    </div></section>
    <section className="th-card th-list">
      <div className="th-head-row" style={{ marginBottom: 6 }}><span className="th-stitle">{`Top tools to ${p.side}`}</span>
        <span className="th-sub">{p.who ? "By your match" : "By score"}</span></div>
      {top.map(({ r, pct }, i) => <Row key={r.id} r={r} rank={i + 1}
        {...(p.who && pct != null ? { badge: pct, badgeLabel: "your match", pct: true } : { badgeLabel: "score" })}/>)}
      {top.length === 0 && <p className="th-empty">Nothing here yet.</p>}
      <a className="th-link-b" href={th(`/tools?side=${p.side}`)} style={{ margin: "4px 0 10px" }}>{`All ${SIDE_WORD[p.side]} tools`}</a>
    </section>
  </>;
}
