"use client";
// A ranking's "your match" (speed batch, owner 2026-11-15: "/rankings … still slow on every tap"). The page is rendered on the
// server for the address's picks; a tap here changes the picks in the browser and works out every row's match % from the
// catalog items sent once with the page (lib/home-rank.ts matchPcts, the same function the server uses), then updates the
// address, with no round trip. The list's order is always its own (Player score); picks only add the %.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useInstantView } from "../../instant-view";
import { matchPcts, type RankItem } from "../../../lib/home-rank";
import { niche, mockLook } from "../../../lib/niche";
import { LEVELS, STYLES, type QuickChoice, type Level } from "../../../lib/quick-match";
import RankPicks from "./rank-picks";

export const MATCH_NOTE = "How well it fits your picks, from player reports. Not a % of happy players.";
type Picked = QuickChoice & { level: Level };
type State = { choice: Picked | null; showPct: boolean };
const Ctx = createContext<{ s: State; set: (s: State) => void; pct: (id: string) => number | null; picks: string; href: string } | null>(null);
const use = () => useContext(Ctx)!;

/** "?style=power&level=beginner&arm=1": the picks part of an address (every link on the page carries it). */
const picksQuery = (c: Picked | null) => c ? `?${new URLSearchParams([...(c.style !== "any" ? [["style", c.style]] : []), ["level", c.level], ...(c.arm ? [["arm", "1"]] : [])])}` : "";
function fromLocation(): State {
  const q = new URLSearchParams(location.search), style = q.get("style"), level = q.get("level");
  if (!level || !(LEVELS as readonly string[]).includes(level)) return { choice: null, showPct: false };
  return { choice: { style: STYLES.includes(style as QuickChoice["style"]) ? style as QuickChoice["style"] : "any", level: level as Level, arm: q.get("arm") === "1" }, showPct: q.get("pct") !== "0" };
}

export function RankingPicks({ items, first, href, children }: { items: RankItem[]; first: State; href: string; children: ReactNode }) {
  // Back and forward step through the picks (app/instant-view.ts).
  const [s, set] = useInstantView(first, fromLocation, next => { const q = new URLSearchParams(picksQuery(next.choice).slice(1)); if (next.choice && !next.showPct) q.set("pct", "0"); return q.size ? `${href}?${q}` : href; });
  const pcts = useMemo(() => s.choice && s.showPct ? matchPcts(items, s.choice, niche.fit?.levelGate, niche.fit?.engine) : null, [items, s]);
  return <Ctx.Provider value={{ s, set, pct: id => pcts?.get(id) ?? null, picks: picksQuery(s.choice), href }}>{children}</Ctx.Provider>;
}

/** A link that carries the current picks (rows, tabs, other rankings). */
export function PickLink({ href, children, ...rest }: { href: string; children: ReactNode; className?: string; tabIndex?: number; "aria-hidden"?: boolean | "true"; "aria-current"?: "page"; title?: string }) {
  return <a href={`${href}${use().picks}`} {...rest}>{children}</a>;
}

/** The row's match %, when picks are set and the % is on. */
export function RowPct({ id }: { id: string }) {
  const { s, pct } = use();
  if (!s.choice || !s.showPct) return null;
  const p = pct(id);
  return p === null ? <span className="rl2-pct thin" title="Too few reports from players like you for a match %">match: few reports</span>
    : <span className={`rl2-pct${p >= 85 ? " hi" : p >= 70 ? " mid" : ""}`} title={MATCH_NOTE}>{`${p}% match`}</span>;
}

/** The "your match" box: the picks, the show-% switch and the note. */
export function MatchBox({ finder }: { finder?: string }) {
  const { s, set, href } = use(), c = s.choice;
  const profileLine = c ? [c.level, c.style !== "any" ? c.style : null, c.arm ? "sore arm" : null].filter(Boolean).join(" · ") : "";
  return <section className="rl2-match" aria-label="Your match">
    <input type="checkbox" id="rl2-edit" className="rl2-edit-t"/>
    {c ? <>
      <span className="rl2-you"><span className="rl2-badge">⚡ your match</span><span>Showing how each fits <strong>{profileLine}</strong></span></span>
      <span className="rl2-ctl">
        <a className="rl2-sw" href={`${href}${picksQuery(c)}${s.showPct ? "&pct=0" : ""}`} role="switch" aria-checked={s.showPct}
          onClick={e => { e.preventDefault(); set({ ...s, showPct: !s.showPct }); }}><i aria-hidden="true"/>show match %</a>
        <label htmlFor="rl2-edit" className="rl2-edit-l"><span className="off">edit</span><span className="on">done ✓</span></label>
      </span>
      {s.showPct && <p className="rl2-note">{`match % = ${MATCH_NOTE.toLowerCase()}`}</p>}
    </> : <span className="rl2-none">
      <span><strong>{"#1 for everyone isn't always #1 for you."}</strong>{!mockLook && " Answer 2 questions to see your match % on every racket."}</span>
      <label htmlFor="rl2-edit" className="rl2-go"><span>find my match →</span></label>
    </span>}
    <div className="rl2-pane"><RankPicks key={JSON.stringify(c)} current={c} onPick={p => set({ choice: p, showPct: true })} finder={finder}/></div>
  </section>;
}
