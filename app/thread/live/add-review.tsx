"use client";
// Add a review in the Thread look (owner 2026-11-20): the design-v2 form's fields and flow (app/add-review/add-v2.tsx), in
// each site's Thread tokens. Two required taps (product, verdict), the rest optional. The verdict is a quick vote
// (/api/racket-votes); words of 20+ characters also post a normal moderated review (POST /api/reviews) with the level, side,
// time with it and the dot ratings. A name is needed with words (lib/thread/display-name.ts), as in the page composer; a
// signed-in member posts as their account, with its level and side. The product picker filters in the browser.
import { useEffect, useState } from "react";
import { niche, v2copy } from "../../../lib/niche";
import { useFormToken } from "../../form-token-client";
import { matchingRackets } from "../../../lib/racket-search";
import { VERDICTS, loadProfile, saveProfile, sendVote, type Verdict } from "../../quick-vote";
import { nameProblem, NAME_MAX } from "../../../lib/thread/display-name";
import { accountSite } from "../../../lib/thread/sites";
import { th } from "../../../lib/thread/look";
import { VERDICT } from "../ui";
import { W } from "../../../lib/thread/words";
import { useAccount, signInHref } from "./use-account";
import { MemberMark } from "./member-mark";
import type { AddV2Props } from "../../add-review/v2-props";

const MIN_WORDS = 20;
const ACCOUNTS = accountSite(niche.id);
const TRAITS = [["Forgiveness", "forgivenessRating", "tiny sweet spot", "huge sweet spot"], ["Power", "powerRating", "no pop", "cannon"], ["Control", "controlRating", "all over the place", "on a string"], ["Arm comfort", "comfortRating", "hurts", "zero pain"]] as const;
const PROMPTS = ["what surprised you", "what you came from", "weights setup", "who should skip it"];
const ONE = niche.words.one;
type Opt = { label: string; value: string };
/** A member's stored level or side ("Intermediate", "Right") as one of this form's options, else null. */
const optOf = (opts: Opt[], v?: string | null) => v ? opts.find(o => o.value.toLowerCase() === v.toLowerCase())?.value ?? null : null;

export function ThreadAddReview({ rackets, initial, levels, sides, times, traits = TRAITS, prompts = PROMPTS, labels }: AddV2Props) {
  // "similar players" / "similar people": the site's Thread word for people (lib/thread/words.ts; SkinRecs never says "users").
  const L = { ...(labels ?? { level: "my level", side: "I play", how: "How does it play?" }), who: `similar ${W.people}` };
  const [racketId, setRacketId] = useState<string | null>(initial ?? null), [q, setQ] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [level, setLevel] = useState<string | null>(null), [side, setSide] = useState<string | null>(null), [time, setTime] = useState<string | null>(null);
  const [r, setR] = useState<Record<string, number>>({}), [text, setText] = useState(""), [name, setName] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<null | "words" | "vote">(null);
  const me = useAccount();
  // A member posts as their account, with the level and side they saved (as the page composer does); they can still change them here.
  useEffect(() => { if (!me) return; setLevel(l => l ?? optOf(levels, me.level)); setSide(s => s ?? optOf(sides, me.side)); }, [me, levels, sides]);
  const formToken = useFormToken();
  const racket = rackets.find(x => x.id === racketId) ?? null;
  const qq = q.trim().toLowerCase();
  const matches = (qq ? matchingRackets(rackets, qq) : rackets).slice(0, qq ? 8 : 4);
  const words = text.trim();
  const who = me?.name ?? name.trim();
  const noName = !!words && !me && !!nameProblem(name);
  const ready = !!(racket && verdict) && !noName;
  const label = (opts: Opt[], v: string | null) => opts.find(o => o.value === v)?.label;
  const why = !racket ? `Pick a ${ONE} to post` : !verdict ? "Pick your take to post" : noName ? "Add a name to post your words" : "";

  async function submit() {
    if (!ready || busy) return;
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your vote.`); return; }
    const problem = words && !me ? nameProblem(name) : null; if (problem) { setError(problem); return; }
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
          racketMode: "existing", racketId: racket!.id, rating: v.rating, reviewText: words, tags: [], website: "", formToken: token, alias: me ? undefined : name.trim() || undefined,
          ...(level ? { playerLevel: level } : {}), ...(side ? { playingSide: side } : {}), ...(time ? { timeWithRacket: time } : {}), ...ratings }) });
        const b = await res.json() as { error?: string };
        if (!res.ok) throw new Error(b.error || "Your vote counted, but the words didn't post. Try again?");
      }
      setDone(words ? "words" : "vote"); window.scrollTo({ top: 0 });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }
  function again() { setRacketId(null); setVerdict(null); setR({}); setText(""); setTime(null); setDone(null); setError(""); }

  if (done) return <section className="th-card th-sec th-ar-done" role="status">
    <h1 className="th-h1">{done === "words" ? "Thanks, your review is in." : "Thanks, your vote counts."}</h1>
    <p className="th-lead">{done === "words" ? `Your words show after a quick check. Your vote already counts toward the ${racket?.name} score.` : `It counts toward the ${racket?.name} score. Add a few words next time and they show on its page too.`}</p>
    <div className="th-ar-again"><button type="button" className="th-btn round lime" onClick={again}>{`Review another ${ONE}`}</button>{racket && <a className="th-link-b" href={th(racket.href)}>{`Back to the ${racket.name}`}</a>}</div>
  </section>;

  const pills = (opts: Opt[], value: string | null, set: (v: string | null) => void, aria: string) => <div className="th-picks" role="group" aria-label={aria}>
    {opts.map(o => <button key={o.value} type="button" className="th-pick sm" aria-pressed={value === o.value} onClick={() => set(value === o.value ? null : o.value)}>{o.label}</button>)}</div>;
  const head = (n: number, title: string, note: string) => <div className="th-head-row th-ar-h"><h2 className="th-h3">{`${n}. ${title}`}</h2><span className="th-sub">{note}</span></div>;

  return <div className="th-ar">
    <section className="th-card th-sec th-ar-intro">
      <h1 className="th-h1">Add your review</h1>
      <p className="th-lead">{`Two taps are needed, the rest is optional. ${ACCOUNTS ? "An account is optional." : "No account needed."} Your vote counts right away; your words show after a quick check.`}</p>
    </section>
    <div className="th-ar-grid">
      <div className="th-ar-steps">
        <section className="th-card th-sec">
          {head(1, `Which ${ONE}?`, "required")}
          {racket ? <div className="th-ar-picked"><span className="th-ar-pic">{racket.photo ? <img src={racket.photo} alt=""/> : <span className="th-ph"/>}</span><b>{racket.name}</b>
            <button type="button" className="th-link-b" onClick={() => setRacketId(null)}>Change</button></div>
          : <>
            <input className="th-ar-q" value={q} onChange={e => setQ(e.target.value)} placeholder={`Start typing, e.g. ${v2copy.example.split(" ")[0]}`} aria-label={`Search ${niche.words.many}`}/>
            <div className="th-ar-matches">{matches.map(m => <button key={m.id} type="button" onClick={() => { setRacketId(m.id); setQ(""); }}>
              <span className="th-ar-pic sm">{m.photo ? <img src={m.photo} alt=""/> : <span className="th-ph"/>}</span>{m.name}</button>)}</div>
            <p className="th-ar-small">{`Not listed? `}<a href="/add-review?classic=1">{`Add the ${ONE}`}</a></p>
          </>}
        </section>
        <section className="th-card th-sec">
          {head(2, "Did it work for you?", "required")}
          <div className="th-picks" role="group" aria-label="Your take">{VERDICTS.map(v => <button key={v.key} type="button" className={`th-vpick ${VERDICT[v.key][1]}`} aria-pressed={verdict === v.key}
            onClick={() => { setVerdict(v.key); setError(""); }}><span className={`th-sdot ${VERDICT[v.key][1]}`}/>{VERDICT[v.key][0]}</button>)}</div>
        </section>
        <section className="th-card th-sec">
          {head(3, "About you", `optional · helps match you with ${L.who}`)}
          <div className="th-ar-row"><span>{L.level}</span>{pills(levels, level, setLevel, L.level)}</div>
          <div className="th-ar-row"><span>{L.side}</span>{pills(sides, side, setSide, L.side)}</div>
          <div className="th-ar-row"><span>used it for</span>{pills(times, time, setTime, "Used it for")}</div>
        </section>
        <section className="th-card th-sec">
          {head(4, L.how, "optional · tap a dot")}
          {traits.map(([n, , lo, hi]) => { const val = r[n] ?? 0; return <div key={n} className="th-ar-trait"><b>{n}</b>
            <div role="group" aria-label={n}>{[1, 2, 3, 4, 5].map(i => <button key={i} type="button" aria-label={`${n} ${i} of 5`} aria-pressed={i <= val} onClick={() => setR(x => ({ ...x, [n]: x[n] === i ? 0 : i }))}/>)}</div>
            <span>{val ? (val <= 2 ? lo : val >= 4 ? hi : "ok") : ""}</span></div>; })}
          <p className="th-ar-small">Saved with your words (step 5).</p>
        </section>
        <section className="th-card th-sec">
          {head(5, "In your words", "optional")}
          <div className="th-ar-prompts">{prompts.map(p => <button key={p} type="button" className="th-chipf" onClick={() => setText(t => (t ? t.trimEnd() + " " : "") + p[0].toUpperCase() + p.slice(1) + ": ")}>{`+ ${p}`}</button>)}</div>
          <textarea className="th-ta" rows={5} maxLength={2000} value={text} onChange={e => { setText(e.target.value); setError(""); }} placeholder="What would you tell a friend thinking of buying it?" aria-label="Your review"/>
          {me ? <div className="th-as th-as-me">Posting as <b>{me.name}</b><MemberMark/></div>
            : <div className="th-as"><input value={name} maxLength={NAME_MAX} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Name or nickname" aria-label="Name or nickname"/>
              <span>{words ? "needed with your words" : "needed if you add words"}</span>
              {ACCOUNTS && <a className="th-signin" href={signInHref()}>Sign in to keep your name</a>}</div>}
        </section>
      </div>
      <aside className="th-ar-side">
        <section className="th-card th-sec">
          <span className="th-stitle">Preview</span>
          <span className="th-sub">How it will show on the {ONE} page</span>
          <article className="th-ar-pv">
            <div className="th-ar-pvh"><b>{racket?.name ?? `Pick a ${ONE}`}</b>{verdict ? <span className={`th-vpill ${VERDICT[verdict][1]}`}>{VERDICT[verdict][0]}</span> : <span className="th-ar-small">Not picked yet</span>}</div>
            <div className="th-ar-who"><strong className={who ? undefined : "ph"}>{who || "Your name"}</strong>{me && <MemberMark/>}<span>{[label(levels, level), label(sides, side)].filter(Boolean).join(" · ")}</span></div>
            <p className={words ? undefined : "ph"}>{words || "Your words go here."}</p>
            <div className="th-ar-tags">{[time && `used ${label(times, time)}`, ...traits.filter(([n]) => r[n]).map(([n]) => `${n.toLowerCase()} ${r[n]}/5`)].filter(Boolean).map(t => <span key={t as string}>{t}</span>)}</div>
          </article>
          <button type="button" className="th-post th-ar-post" disabled={!ready || busy} onClick={submit}>{busy ? "Posting…" : "Post my review"}</button>
          {why && !busy && <span className="th-why">{why}</span>}
          {error && <span className="th-err" role="alert">{error}</span>}
          <p className="th-ar-small">Every review gets a check before its words show.</p>
        </section>
      </aside>
    </div>
  </div>;
}
