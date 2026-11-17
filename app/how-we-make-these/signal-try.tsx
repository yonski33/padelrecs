"use client";
import { NEW_UNDER } from "../../lib/score-view";
import { niche, siteColor } from "../../lib/niche";
import { useState } from "react";
import { signals, type SignalInput } from "../../lib/signal";

/** "Try it": the real signal formula (lib/signal.ts), run on the real catalog plus one imaginary racket with the slider counts. */
export default function SignalTry({ products, tones, plain }: { products: SignalInput[]; /** Words without emoji (SkinRecs design). */ plain?: boolean;
  /** Badge colours [high, mid, low]; the default is padel's lime and yellow. */ tones?: [string, string, string] }) {
  const [c, setC] = useState({ pos: 41, mix: 19, neg: 7 });
  const total = c.pos + c.mix + c.neg;
  const score = signals([...products, { id: "__try", category: "all", positive: c.pos, mixed: c.mix, judged: total }]).get("__try")?.signal ?? null;
  const note = total < NEW_UNDER ? `Under ${NEW_UNDER} reviews: no score yet, so this ${niche.words.one} wouldn't appear in rankings.`
    : total < 15 ? `${total} reviews. The score stays modest until more people weigh in.`
    : `${total} reviews, ${c.pos} loved it. Enough people that the score can trust it.`;
  // The shared score colours (owner 2026-11-17: green 85+, yellow 70–84, white below; never the site accent).
  const [hi, mid, lo] = tones ?? ["var(--score-g)", "var(--score-y)", "var(--score-w)"];
  // Under NEW_UNDER reviews the site shows "New" and no number (lib/score-view.ts), so the demo does too.
  const shown = total < NEW_UNDER ? null : score;
  const badge = shown === null ? lo : shown >= 85 ? hi : shown >= 70 ? mid : lo;
  const row = (k: keyof typeof c, label: string) => <label key={k}><span>{label}</span>
    <input type="range" min={0} max={60} value={c[k]} onChange={e => setC(x => ({ ...x, [k]: +e.target.value }))}/><b>{c[k]}</b></label>;
  return <div className="hw-try">
    <div className="hw-sliders"><p>{plain ? "try it, drag the sliders" : "// try it — drag the sliders"}</p>{row("pos", plain ? "loved it" : "👍 loved it")}{row("mix", plain ? "mixed" : "🤷 mixed")}{row("neg", plain ? "not for me" : "👎 not for me")}</div>
    <div className="hw-out">
      <span className="hw-score" style={{ background: badge }}>{shown ?? (total < NEW_UNDER ? "New" : "–")}</span>
      <div><span className="hw-bar" aria-hidden="true"><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>
        <span>{note}</span></div>
    </div>
  </div>;
}
