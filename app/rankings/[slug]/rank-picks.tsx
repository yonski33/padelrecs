"use client";
import { useState } from "react";

// The ranking page's "your match" picks (owner 2026-11-15, mockup): with no picks yet, a style or the sore-arm box only marks
// the choice and a level click shows the match % (the visitor isn't answered for a level they never chose). With picks, every
// click updates the list. Picks live in the URL like the home's quick match; ranking-picks.tsx applies them in the browser.
import { STYLES, LEVELS, levelLabel, type Style, type Level } from "../../../lib/quick-match";
type Pick = { style: Style; level: Level; arm: boolean };

export default function RankPicks({ current, onPick, finder }: { current: Pick | null; onPick: (p: Pick) => void; finder?: string }) {
  const [style, setStyle] = useState<Pick["style"] | null>(current?.style ?? null), [arm, setArm] = useState(current?.arm ?? false);
  const go = onPick;
  const pickStyle = (s: Pick["style"]) => { setStyle(s); if (current) go({ ...current, style: s }); };
  const pickArm = () => { setArm(a => !a); if (current) go({ ...current, arm: !arm }); };
  return <div className="rl2-picks">
    <span className="rl2-pk">I want</span>
    <span className="rl2-seg" role="group" aria-label="What you want most">{STYLES.map(s =>
      <button key={s} type="button" aria-pressed={style === s} onClick={() => pickStyle(s)}>{s}</button>)}</span>
    <span className="rl2-pk">{"and I'm"}</span>
    <span className="rl2-lv" role="group" aria-label="Your level: picking one shows your match">{LEVELS.map(l =>
      <button key={l} type="button" aria-pressed={current?.level === l} onClick={() => go({ style: style ?? "any", level: l, arm })}>{levelLabel(l)}</button>)}</span>
    <button type="button" className="rl2-arm" aria-pressed={arm} onClick={pickArm}><i aria-hidden="true">{arm ? "✓" : ""}</i>sore elbow / wrist</button>
    {finder && <a className="rl2-more" href={finder}>more preferences →</a>}
  </div>;
}
