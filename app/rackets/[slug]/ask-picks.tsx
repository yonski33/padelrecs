"use client";
import { useEffect, useState } from "react";

// The racket page's fit check before an answer (owner 2026-11-15, Claude Design mockup): two numbered questions as pills and
// the optional sore-arm box. The answer loads once both a style and a level are picked, never for a level the visitor didn't
// choose. The last answers stay in this browser, so "use my last answers" fills them in on the next racket.
import { STYLES, LEVELS, levelLabel, styleWordOf, ARM_PICK, type Style, type Level } from "../../../lib/quick-match";
import { niche } from "../../../lib/niche";
import { fitConfigFor } from "../../../lib/fit-config";
// A site with no style picks (SimRacingRecs) asks only the level; one whose arm pick is a hard filter (console) leaves it to the home.
const NO_STYLE = STYLES.length < 2, NO_ARM = !!fitConfigFor(niche)?.quick?.armFilter;
type Saved = { style: Style; level: Level; arm: boolean };
import { SAVED_PICKS_KEY } from "../../../lib/saved-picks";
const KEY = SAVED_PICKS_KEY;

function readSaved(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Saved> | null;
    return s && STYLES.includes(s.style as Style) && LEVELS.includes(s.level as Level) ? { style: s.style as Style, level: s.level as Level, arm: !!s.arm } : null;
  } catch { return null; }
}
function saveProfile(p: Saved) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage off */ } }

export default function AskPicks({ onPick }: { onPick: (p: Saved) => void }) {
  const [style, setStyle] = useState<Style | null>(NO_STYLE ? STYLES[0] ?? "any" : null), [level, setLevel] = useState<Level | null>(null), [arm, setArm] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  // Browser storage is read after the first render, so the server and client HTML match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSaved(readSaved()); }, []);
  // Applied in the browser (fit-live.tsx): the verdict for the picks shows with no round trip.
  const go = (p: Saved) => { saveProfile(p); onPick(p); };
  const pickStyle = (s: Style) => { setStyle(s); if (level) go({ style: s, level, arm }); };
  const pickLevel = (l: Level) => { setLevel(l); if (style) go({ style, level: l, arm }); };
  return <>
    <div className="rf-askhead"><span className="rf-badge">⚡ fit check</span>
      {saved && <button type="button" className="rf-last" onClick={() => go(saved)} title={`${styleWordOf(saved.style)} · ${levelLabel(saved.level)}${saved.arm ? ` · ${ARM_PICK === "sore elbow / wrist" ? "sore arm" : ARM_PICK}` : ""}`}>↺ use my last answers</button>}</div>
    {/* The title (racket-fit.tsx) sits between the badge row and the questions: .rf-ask orders them with CSS. */}
    <div className="rf-q">
      {!NO_STYLE && <div className="rf-qrow"><span>1. What do you want more of?</span>
        <div role="group" aria-label="What you want more of">{STYLES.map(s =>
          <button key={s} type="button" aria-pressed={style === s} onClick={() => pickStyle(s)}>{styleWordOf(s)}</button>)}</div></div>}
      <div className="rf-qrow"><span>{NO_STYLE ? "What's your level?" : "2. What's your level?"}</span>
        <div role="group" aria-label="Your level">{LEVELS.map(l =>
          <button key={l} type="button" aria-pressed={level === l} onClick={() => pickLevel(l)}>{levelLabel(l)}</button>)}</div></div>
      {!NO_ARM && <button type="button" className="rf-arm2" aria-pressed={arm} onClick={() => setArm(a => !a)}><i aria-hidden="true">{arm ? "✓" : ""}</i><span>{`I have a ${ARM_PICK}`} <small>(optional)</small></span></button>}
    </div>
  </>;
}

/** Keeps the picks a visitor answered with (also from the edit bar's links), for "use my last answers" on the next racket. */
export function RememberPicks(p: Saved) {
  useEffect(() => { saveProfile(p); }, [p.style, p.level, p.arm]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
