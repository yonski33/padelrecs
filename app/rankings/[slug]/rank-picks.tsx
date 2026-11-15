"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// The ranking page's "your match" picks (owner 2026-11-15, mockup): with no picks yet, a style or the sore-arm box only marks
// the choice and a level click shows the match % (the visitor isn't answered for a level they never chose). With picks, every
// click updates the list. Picks live in the URL like the home's quick match.
const STYLES = ["any", "control", "balance", "power"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type Pick = { style: typeof STYLES[number]; level: typeof LEVELS[number]; arm: boolean };

export default function RankPicks({ href, current, finder }: { href: string; current: Pick | null; finder?: string }) {
  const router = useRouter();
  const [style, setStyle] = useState<Pick["style"] | null>(current?.style ?? null), [arm, setArm] = useState(current?.arm ?? false);
  const go = (p: Pick) => {
    const q = new URLSearchParams();
    if (p.style !== "any") q.set("style", p.style);
    q.set("level", p.level);
    if (p.arm) q.set("arm", "1");
    router.replace(`${href}?${q}`, { scroll: false });
  };
  const pickStyle = (s: Pick["style"]) => { setStyle(s); if (current) go({ ...current, style: s }); };
  const pickArm = () => { setArm(a => !a); if (current) go({ ...current, arm: !arm }); };
  return <div className="rl2-picks">
    <span className="rl2-pk">I want</span>
    <span className="rl2-seg" role="group" aria-label="What you want most">{STYLES.map(s =>
      <button key={s} type="button" aria-pressed={style === s} onClick={() => pickStyle(s)}>{s}</button>)}</span>
    <span className="rl2-pk">{"and I'm"}</span>
    <span className="rl2-lv" role="group" aria-label="Your level: picking one shows your match">{LEVELS.map(l =>
      <button key={l} type="button" aria-pressed={current?.level === l} onClick={() => go({ style: style ?? "any", level: l, arm })}>{l}</button>)}</span>
    <button type="button" className="rl2-arm" aria-pressed={arm} onClick={pickArm}><i aria-hidden="true">{arm ? "✓" : ""}</i>sore elbow / wrist</button>
    {finder && <a className="rl2-more" href={finder}>more preferences →</a>}
  </div>;
}
