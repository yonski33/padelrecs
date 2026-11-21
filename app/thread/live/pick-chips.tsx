"use client";
import { cap } from "../ui";
import { LEVEL_OPTS, STYLE_OPTS, styleLabel, ARM_LABEL, type Picks } from "./picks";

/** I'm [Beginner | Intermediate | Advanced] · I want [Control | Balance | Power] · [ ] Sore arm. A second tap clears a pick. */
export function PickChips({ picks, set, small, armLabel = ARM_LABEL, labels = ["I'm", "I want"] }: { picks: Picks; set: (p: Partial<Picks>) => void; small?: boolean; /** PadelRecs v7b: "Arm comfort". */ armLabel?: string;
  /** The two row labels; the PadelRecs racket page uses "Your level" and "What matters most?" (owner mock 2026-11-21). */ labels?: [string, string] }) {
  const cls = `th-pick${small ? " sm" : ""}`;
  return <>
    <div className="th-picks" role="group" aria-label="Your level"><span className="lbl">{labels[0]}</span>
      {LEVEL_OPTS.map(v => <button key={v} type="button" className={cls} aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}
    </div>
    <div className="th-picks" role="group" aria-label="What you want"><span className="lbl">{labels[1]}</span>
      {STYLE_OPTS.map(v => <button key={v} type="button" className={cls} aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
      <button type="button" className="th-check" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>{armLabel}</button>
    </div>
  </>;
}
