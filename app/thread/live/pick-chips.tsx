"use client";
import { cap } from "../ui";
import { LEVEL_OPTS, STYLE_OPTS, styleLabel, ARM_LABEL, type Picks } from "./picks";

/** I'm [Beginner | Intermediate | Advanced] · I want [Control | Balance | Power] · [ ] Arm comfort. A second tap clears a pick. */
export function PickChips({ picks, set, small }: { picks: Picks; set: (p: Partial<Picks>) => void; small?: boolean }) {
  const cls = `th-pick${small ? " sm" : ""}`;
  return <>
    <div className="th-picks" role="group" aria-label="Your level"><span className="lbl">I'm</span>
      {LEVEL_OPTS.map(v => <button key={v} type="button" className={cls} aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}
    </div>
    <div className="th-picks" role="group" aria-label="What you want"><span className="lbl">I want</span>
      {STYLE_OPTS.map(v => <button key={v} type="button" className={cls} aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
      <button type="button" className="th-check" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>{ARM_LABEL}</button>
    </div>
  </>;
}
