"use client";
import { niche, v2copy } from "../../lib/niche";
import { useFormToken } from "../form-token-client";
import { matchingRackets } from "../../lib/racket-search";
import { useState } from "react";
import { VERDICTS, loadProfile, nickname, saveProfile, sendVote, type Verdict } from "../quick-vote";

// Add a review in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/VexiJKZHN4whPpvvtVDM4k),
// Every design-v2 site (padel first; others pass their own traits, prompts and labels). Two required taps (racket, verdict), the rest optional. Same flow as the rest of the site: the verdict is a
// quick vote (/api/racket-votes); words of 20+ characters also post a normal moderated review (POST /api/reviews: spam
// guard, moderation) with the level, side, time with it and the dot ratings. A racket that isn't listed goes to the classic form.
export type AddRacket = { id: string; name: string; photo: string | null; href: string };
type Opt = { label: string; value: string };
const MIN_WORDS = 20;
const V: Record<Verdict, { icon: string; label: string; bg: string }> = {
  positive: { icon: "✓", label: "loved it", bg: "oklch(0.9 0.1 145)" }, mixed: { icon: "~", label: "mixed", bg: "oklch(0.93 0.12 95)" }, negative: { icon: "✕", label: "not for me", bg: "oklch(0.9 0.08 30)" },
};
const TRAITS = [["Forgiveness", "forgivenessRating", "tiny sweet spot", "huge sweet spot"], ["Power", "powerRating", "no pop", "cannon"], ["Control", "controlRating", "all over the place", "on a string"], ["Arm comfort", "comfortRating", "hurts", "zero pain"]] as const;
const PROMPTS = ["what surprised you", "what you came from", "weights setup", "who should skip it"];

export type AddLabels = { level: string; side: string; how: string; who: string };
export default function AddReviewV2({ rackets, initial, levels, sides, times, traits = TRAITS, prompts = PROMPTS, labels }: { rackets: AddRacket[]; initial?: string; levels: Opt[]; sides: Opt[]; times: Opt[];
  /** Another site's dot ratings ([label, rating column, low word, high word]), "+ prompt" chips and row words (padel's by default). */
  traits?: readonly (readonly [string, string, string, string])[]; prompts?: readonly string[]; labels?: AddLabels }) {
  const L = labels ?? { level: "my level", side: "I play", how: "How does it play?", who: "similar players" };
  const [racketId, setRacketId] = useState<string | null>(initial ?? null), [q, setQ] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [level, setLevel] = useState<string | null>(null), [side, setSide] = useState<string | null>(null), [time, setTime] = useState<string | null>(null);
  const [r, setR] = useState<Record<string, number>>({}), [text, setText] = useState(""), [name, setName] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<null | "words" | "vote">(null);
  const formToken = useFormToken();
  const racket = rackets.find(x => x.id === racketId) ?? null;
  const qq = q.trim().toLowerCase();
  const matches = (qq ? matchingRackets(rackets, qq) : rackets).slice(0, qq ? 8 : 4);
  const ready = !!(racket && verdict);
  const label = (opts: Opt[], v: string | null) => opts.find(o => o.value === v)?.label;
  const who = name.trim() || "Anonymous";

  async function submit() {
    if (!ready || busy) return;
    const words = text.trim();
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your verdict.`); return; }
    setBusy(true); setError("");
    try {
      const v = VERDICTS.find(x => x.key === verdict)!;
      const profile = { ...loadProfile(), ...(level ? { level } : {}), ...(side ? { side } : {}) };
      if (level || side) saveProfile(profile);
      await sendVote(racket!.id, v.rating, profile);
      if (words) {
        const token = await formToken();
        const ratings = Object.fromEntries(traits.filter(([n]) => r[n]).map(([n, key]) => [key, r[n]]));
        const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          racketMode: "existing", racketId: racket!.id, rating: v.rating, reviewText: words, tags: [], website: "", formToken: token, alias: name.trim() || nickname(niche.form.quickVote?.nicknames) || undefined,
          ...(level ? { playerLevel: level } : {}), ...(side ? { playingSide: side } : {}), ...(time ? { timeWithRacket: time } : {}), ...ratings }) });
        const b = await res.json() as { error?: string };
        if (!res.ok) throw new Error(b.error || "Your verdict counted, but the words didn't post. Try again?");
      }
      setDone(words ? "words" : "vote"); window.scrollTo({ top: 0 });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }
  function again() { setRacketId(null); setVerdict(null); setR({}); setText(""); setTime(null); setDone(null); setError(""); }

  if (done) return <section className="ar-done" role="status">
    <div aria-hidden="true">{v2copy.emoji || "✓"}</div>
    <h1>{done === "words" ? "Thanks — your verdict is in." : "Thanks — your verdict counts."}</h1>
    <p>{done === "words" ? `It'll appear in the feed after a quick check, and counts toward the ${racket?.name} score.` : `It counts toward the ${racket?.name} score. Add a few words next time and it shows in the feed too.`}</p>
    <div><button type="button" className="ar-again" onClick={again}>{`+ review another ${niche.words.one}`}</button><a href="/reviews">see latest reviews</a></div>
  </section>;

  const pills = (opts: Opt[], value: string | null, set: (v: string | null) => void, aria: string) => <div className="ar-pills" role="group" aria-label={aria}>
    {opts.map(o => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => set(value === o.value ? null : o.value)}>{o.label}</button>)}</div>;

  return <>
    <section className="ar-head"><h1>Add your verdict</h1><p>Two required taps, the rest is optional. No account. Your review goes live in the feed and moves the rankings.</p></section>
    <div className="ar-grid">
      <section className="ar-steps">
        <div className="ar-card">
          <div className="ar-h"><h2>{`1. Which ${niche.words.one}?`}</h2><span className="req">required</span></div>
          {racket ? <div className="ar-picked"><span className="ar-pic">{racket.photo && <img src={racket.photo} alt=""/>}</span><b>{racket.name}</b><button type="button" onClick={() => setRacketId(null)}>change</button></div>
          : <>
            <input className="ar-q" value={q} onChange={e => setQ(e.target.value)} placeholder={`start typing, e.g. ${v2copy.example.split(" ")[0].toLowerCase()}`} aria-label={`Search ${niche.words.many}`}/>
            <div className="ar-matches">{matches.map(m => <button key={m.id} type="button" onClick={() => { setRacketId(m.id); setQ(""); }}><span className="ar-pic sm">{m.photo && <img src={m.photo} alt=""/>}</span>{m.name}</button>)}</div>
            <p className="ar-small">Not listed? <a href="/add-review?classic=1">add it</a></p>
          </>}
        </div>
        <div className="ar-card">
          <div className="ar-h"><h2>2. Did it work for you?</h2><span className="req">required</span></div>
          <div className="ar-verdicts" role="group" aria-label="Your verdict">{(Object.keys(V) as Verdict[]).map(k => <button key={k} type="button" aria-pressed={verdict === k} className={k} onClick={() => { setVerdict(k); setError(""); }}>
            <span aria-hidden="true">{V[k].icon}</span><b>{V[k].label}</b></button>)}</div>
        </div>
        <div className="ar-card">
          <div className="ar-h"><h2>3. About you</h2><span>{`optional · helps match you with ${L.who}`}</span></div>
          <div className="ar-row"><span>{L.level}</span>{pills(levels, level, setLevel, L.level)}</div>
          <div className="ar-row"><span>{L.side}</span>{pills(sides, side, setSide, L.side)}</div>
          <div className="ar-row"><span>used it for</span>{pills(times, time, setTime, "Used it for")}</div>
        </div>
        <div className="ar-card">
          <div className="ar-h"><h2>{`4. ${L.how}`}</h2><span>optional · tap a dot</span></div>
          {traits.map(([n, , lo, hi]) => { const val = r[n] ?? 0; return <div key={n} className="ar-trait"><b>{n}</b>
            <div role="group" aria-label={n}>{[1, 2, 3, 4, 5].map(i => <button key={i} type="button" aria-label={`${n} ${i} of 5`} aria-pressed={i <= val} onClick={() => setR(x => ({ ...x, [n]: x[n] === i ? 0 : i }))}/>)}</div>
            <span>{val ? (val <= 2 ? lo : val >= 4 ? hi : "ok") : "—"}</span></div>; })}
          <p className="ar-small">Saved with your words (step 5).</p>
        </div>
        <div className="ar-card">
          <div className="ar-h"><h2>5. In your words</h2><span>optional</span></div>
          <div className="ar-prompts">{prompts.map(p => <button key={p} type="button" onClick={() => setText(t => (t ? t.trimEnd() + " " : "") + p[0].toUpperCase() + p.slice(1) + ": ")}>+ {p}</button>)}</div>
          <textarea rows={5} maxLength={2000} value={text} onChange={e => { setText(e.target.value); setError(""); }} placeholder="What would you tell a friend thinking of buying it?" aria-label="Your review"/>
          <div className="ar-row"><span>show my name as</span><input value={name} maxLength={50} onChange={e => setName(e.target.value)} placeholder="first name or nickname (blank = a nickname is picked for you)" aria-label="Show my name as"/></div>
        </div>
      </section>
      <aside className="ar-side">
        <p className="ar-k">{"// preview — how it'll look in the feed"}</p>
        <article className="ar-pv">
          <div className="ar-pvh"><b>{racket?.name ?? `Pick a ${niche.words.one}`}</b><span className={`ar-pill ${verdict ?? ""}`}>{verdict ? `${V[verdict].icon} ${V[verdict].label}` : "verdict?"}</span></div>
          <div className="ar-pvb">
            <div className="ar-who"><span aria-hidden="true">{who[0].toUpperCase()}</span><strong>{who}</strong><span className="m">{[label(levels, level), label(sides, side)].filter(Boolean).join(" · ")}</span></div>
            <p className={text.trim() ? undefined : "ph"}>{text.trim() || "Your words go here."}</p>
            <div className="ar-tags">{[time && `used ${label(times, time)}`, ...traits.filter(([n]) => r[n]).map(([n]) => `${n.toLowerCase()} ${r[n]}/5`)].filter(Boolean).map(t => <span key={t as string}>{t}</span>)}</div>
          </div>
        </article>
        <button type="button" className="ar-submit" disabled={!ready || busy} onClick={submit}>{busy ? "posting…" : ready ? "Post my review →" : !racket ? `pick a ${niche.words.one} first` : "pick a verdict first"}</button>
        {error && <p className="ar-err" role="alert">{error}</p>}
        <p className="ar-small">{"Every review gets a check before it counts. No ads in your inbox: no email needed."}</p>
      </aside>
    </div>
  </>;
}
