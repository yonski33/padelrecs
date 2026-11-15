"use client";
import { niche } from "../../lib/niche";
import { useState } from "react";
import { signals, type SignalInput } from "../../lib/signal";

/** "Try it": the real signal formula (lib/signal.ts), run on the real catalog plus one imaginary racket with the slider counts. */
export default function SignalTry({ products }: { products: SignalInput[] }) {
  const [c, setC] = useState({ pos: 41, mix: 19, neg: 7 });
  const total = c.pos + c.mix + c.neg;
  const score = signals([...products, { id: "__try", category: "all", positive: c.pos, mixed: c.mix, judged: total }]).get("__try")?.signal ?? null;
  const note = total < 5 ? `Under 5 reviews: this ${niche.words.one} wouldn't appear in rankings yet.`
    : total < 15 ? `${total} reviews. The score stays modest until more people weigh in.`
    : `${total} reviews, ${c.pos} loved it. Enough people that the score can trust it.`;
  const badge = score === null ? "#fff" : score >= 85 ? "oklch(0.88 0.17 125)" : score >= 70 ? "oklch(0.93 0.14 100)" : "#fff";
  const row = (k: keyof typeof c, label: string) => <label key={k}><span>{label}</span>
    <input type="range" min={0} max={60} value={c[k]} onChange={e => setC(x => ({ ...x, [k]: +e.target.value }))}/><b>{c[k]}</b></label>;
  return <div className="hw-try">
    <div className="hw-sliders"><p>{"// try it — drag the sliders"}</p>{row("pos", "👍 loved it")}{row("mix", "🤷 mixed")}{row("neg", "👎 not for me")}</div>
    <div className="hw-out">
      <span className="hw-score" style={{ background: badge }}>{score ?? "–"}</span>
      <div><span className="hw-bar" aria-hidden="true"><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>
        <span>{note}</span></div>
    </div>
  </div>;
}
