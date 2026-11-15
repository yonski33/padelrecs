"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// The "Is this the right racket for you?" pills (owner 2026-11-15): tapping a style or the sore-arm box only marks it; the
// verdict loads once a level is picked, so the visitor isn't sent to an answer for a level they never chose.
const STYLES = ["any", "control", "balance", "power"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function AskPicks({ href }: { href: string }) {
  const router = useRouter();
  const [style, setStyle] = useState<typeof STYLES[number]>("any"), [arm, setArm] = useState(false);
  const go = (level: string) => {
    const q = new URLSearchParams();
    if (style !== "any") q.set("style", style);
    q.set("level", level);
    if (arm) q.set("arm", "1");
    router.replace(`${href}?${q}`, { scroll: false });
  };
  return <div className="rf-grid">
    <span>I want</span>
    <span className="rf-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>
      <button type="button" aria-pressed={style === s} className={style === s ? "on" : undefined} onClick={() => setStyle(s)}>{s}</button></span>)}</span>
    <span>I&apos;m</span>
    <span className="rf-lv" role="group" aria-label="Your level: picking one shows the answer">{LEVELS.map(l => <span key={l}>
      <button type="button" onClick={() => go(l)}>{l}</button></span>)}</span>
    <span/>
    <button type="button" className="rf-arm" aria-pressed={arm} onClick={() => setArm(a => !a)}><i className="rf-box" aria-hidden="true">{arm ? "✓" : ""}</i>I have a sore elbow / wrist</button>
  </div>;
}
