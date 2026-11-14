"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_TAGS, TAGS } from "../lib/tags";

// One-tap verdicts (2026-11-14 pivot, owner's mockup): "Have you played with this racket?" between "What players say" and
// the reviews, with the same Positive / Mixed / Negative cards the review form uses (owner: the same look, no faces). Saved as 5 / 3 / 1, like a review's
// verdict. After a tap: a thank-you and a link to the full review form, pre-filled with the product and the verdict.

export type Stats = { total: number; average: number | null; positive: number; mixed: number; negative: number; level?: { name: string; positive: number; total: number } };
export type Profile = { level?: string; style?: string; side?: string };
export type Verdict = "positive" | "mixed" | "negative";
export const VERDICTS: { key: Verdict; rating: number; word: string; hint: string }[] = [
  { key: "positive", rating: 5, word: "Positive", hint: "It worked for me" },
  { key: "mixed", rating: 3, word: "Mixed", hint: "Some good, some bad" },
  { key: "negative", rating: 1, word: "Negative", hint: "Not for me" },
];
export const verdictOf = (rating: number): Verdict => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
const PROFILE_KEY = "rv-profile";
/** One "a few details" question after the words: a review-form field and its chip options. */
export type DetailStep = { field: "playerLevel" | "playingSide" | "playingStyle" | "timeWithRacket"; question: string; options: { value: string; label: string }[] };
const PROFILE_FIELD = { playerLevel: "level", playingSide: "side", playingStyle: "style" } as const;
/** The review API's minimum (app/api/reviews/route.ts). */
const MIN_WORDS = 20;

export function loadProfile(): Profile {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") as Profile; } catch { return {}; }
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* private mode: the profile just isn't remembered */ }
}
export async function sendVote(racketId: string, rating: number, profile: Profile) {
  const r = await fetch("/api/racket-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId, rating, ...profile }) });
  const body = await r.json() as { stats?: Stats; error?: string };
  if (!r.ok || !body.stats) throw new Error(body.error || "Could not save your vote.");
  return body.stats;
}

export function ChoiceRow({ label, options, value, onPick }: { label: string; options: string[]; value?: string; onPick: (v: string) => void }) {
  return <div className="qv-choice"><span>{label}</span><div>{options.map(o =>
    <button type="button" key={o} aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>)}</div></div>;
}

/** The three verdict cards. compact: a smaller row for /rate. */
export function VerdictButtons({ value, onPick, name, compact, disabled }: { value: Verdict | null; onPick: (v: typeof VERDICTS[number]) => void; name: string; compact?: boolean; disabled?: boolean }) {
  const [pop, setPop] = useState<Verdict | null>(null);
  return <div className={compact ? "vb vb-compact" : "vb"} role="radiogroup" aria-label={`Your verdict on the ${name}`}>
    {VERDICTS.map(v => <button type="button" key={v.key} role="radio" aria-checked={value === v.key} disabled={disabled}
      className={`s-${v.key}${pop === v.key ? " pop" : ""}`} onClick={() => { setPop(v.key); setTimeout(() => setPop(null), 220); onPick(v); }}>
      <b>{v.word}</b>{!compact && <small>{v.hint}</small>}
    </button>)}
  </div>;
}

export default function QuickVote({ racketId, name, one, people, placeholder, steps }: {
  racketId: string; name: string; one: string; people: { one: string; many: string }; placeholder: string; steps: DetailStep[];
}) {
  const [stats, setStats] = useState<Stats | null>(null), [mine, setMine] = useState<Verdict | null>(null), [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [justVoted, setJustVoted] = useState(false);
  // After a vote: a small "few words" box that posts a normal (moderated) review, or closes with "Nah, I'm good".
  const [note, setNote] = useState<"closed" | "open" | "details" | "sending" | "sent">("closed"), [words, setWords] = useState(""), [noteError, setNoteError] = useState("");
  const token = useRef("");
  const [todo, setTodo] = useState<DetailStep[]>([]), [step, setStep] = useState(0), [answers, setAnswers] = useState<Record<string, string>>({}), [tags, setTags] = useState<string[]>([]);
  const pending = useRef<null | (() => string)>(null); // the review body, while the details are being asked; sent on leave
  // Leaving halfway through the details still sends what they gave (sendBeacon survives the page closing).
  useEffect(() => {
    const flush = () => { if (pending.current) { navigator.sendBeacon("/api/reviews", new Blob([pending.current()], { type: "text/plain" })); pending.current = null; } };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  useEffect(() => {
    fetch(`/api/racket-votes?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { stats?: Stats; mine?: number | null } | null) => {
        if (b?.stats) setStats(b.stats);
        if (b?.mine) { setMine(verdictOf(b.mine)); setRating(b.mine); }
      }).catch(() => {});
  }, [racketId]);

  async function vote(v: typeof VERDICTS[number]) {
    const before = mine; setMine(v.key); setBusy(true); setError("");
    try {
      setStats(await sendVote(racketId, v.rating, loadProfile())); setRating(v.rating); setJustVoted(true);
      if (note === "closed") {
        setNote("open");
        // The review API wants a signed "form opened at" token (lib/form-token.ts); fetched now, while they type.
        fetch("/api/reviews", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { token?: string } | null) => { token.current = b?.token || ""; }).catch(() => {});
      }
    }
    catch (e) { setMine(before); setError(e instanceof Error ? e.message : "Could not save your vote."); }
    finally { setBusy(false); }
  }

  // The steps still to ask: fields already known from this device's profile are skipped.
  const body = (extra: Record<string, string> = answers, chosen: string[] = tags) => {
    const p = loadProfile(), profile = { playerLevel: p.level, playingSide: p.side, playingStyle: p.style };
    const fields = Object.fromEntries(Object.entries({ ...profile, ...extra }).filter(([, v]) => v));
    return JSON.stringify({ racketMode: "existing", racketId, rating, reviewText: words.trim(), tags: chosen, website: "", formToken: token.current, ...fields });
  };

  function wordsDone() {
    if (words.trim().length < MIN_WORDS) { setNoteError(`A little more, please: at least ${MIN_WORDS} characters.`); return; }
    const known = loadProfile();
    setTodo(steps.filter(st => !(st.field in PROFILE_FIELD && known[PROFILE_FIELD[st.field as keyof typeof PROFILE_FIELD]])));
    setNoteError(""); setStep(0); setNote("details");
    pending.current = () => body();
  }
  function answer(field: string, value: string) {
    const next = { ...answers, [field]: value }; setAnswers(next);
    if (field in PROFILE_FIELD) saveProfile({ ...loadProfile(), [PROFILE_FIELD[field as keyof typeof PROFILE_FIELD]]: value });
    pending.current = () => body(next);
    setStep(s => s + 1);
  }
  async function send(chosen = tags) {
    pending.current = null; setNote("sending"); setNoteError("");
    try {
      if (!token.current) { const b = await (await fetch("/api/reviews", { cache: "no-store" })).json() as { token?: string }; token.current = b.token || ""; }
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(answers, chosen) });
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || "Could not post that. Please try again.");
      setNote("sent");
    } catch (e) { setNote("details"); pending.current = () => body(); setNoteError(e instanceof Error ? e.message : "Could not post that. Please try again."); }
  }

  const others = stats ? stats.total - (mine ? 1 : 0) : 0;
  const corner = stats && stats.total > 0 ? `${stats.total.toLocaleString("en-US")} ${stats.total === 1 ? people.one : people.many} voted` : "";
  return <section className="qv" aria-labelledby="qv-title">
    <div className="qv-top">
      <div>
        <p className="qv-eyebrow">Your take · one tap</p>
        <h2 id="qv-title">{mine ? "Thanks for your take" : `Have you played with this ${one}?`}</h2>
        <p className="qv-sub">{`Tell other ${people.many} how it worked for you. No review to write.`}</p>
      </div>
      {corner && <span className="qv-corner">{corner}</span>}
    </div>
    <VerdictButtons value={mine} onPick={vote} name={name} disabled={busy}/>
    {error && <p className="qv-error" role="alert">{error}</p>}
    {mine && justVoted && !error && note === "open" && <div className="qv-words">
      <label htmlFor="qv-words">{`Thanks! ${others > 0 ? `Counted with ${others.toLocaleString("en-US")} other ${others === 1 ? people.one : people.many}. ` : ""}Got a few words to say about it?`}</label>
      <textarea id="qv-words" rows={3} maxLength={2000} value={words} onChange={e => { setWords(e.target.value); setNoteError(""); }} placeholder={placeholder} autoFocus/>
      <div className="qv-words-row">
        <button type="button" className="qv-post" onClick={wordsDone}>Next</button>
        <button type="button" className="qv-nah" onClick={() => setNote("closed")}>{"Nah, I'm good"}</button>
        <small>{noteError || (words.trim().length < MIN_WORDS ? `A sentence is plenty · ${MIN_WORDS - words.trim().length} characters to go` : "Goes live after a quick check")}</small>
      </div>
    </div>}
    {mine && justVoted && !error && (note === "details" || note === "sending") && <div className="qv-steps" aria-live="polite">
      <p className="qv-steps-head">{`A few quick details, all optional · ${Math.min(step + 1, todo.length + 1)} of ${todo.length + 1}`}</p>
      {step < todo.length ? <div className="qv-step">
        <h3>{todo[step].question}</h3>
        <div className="qv-chips">{todo[step].options.map(o => <button type="button" key={o.value} onClick={() => answer(todo[step].field, o.value)}>{o.label}</button>)}</div>
      </div> : <div className="qv-step">
        <h3>{`Anything that stands out? Pick up to ${MAX_TAGS}`}</h3>
        <div className="qv-chips">{TAGS.map(t => { const on = tags.includes(t.label); return <button type="button" key={t.label} className={`tone-${t.tone}`} aria-pressed={on}
          disabled={!on && tags.length >= MAX_TAGS} onClick={() => setTags(prev => on ? prev.filter(x => x !== t.label) : [...prev, t.label])}>{t.label}</button>; })}</div>
      </div>}
      <div className="qv-words-row">
        {step >= todo.length
          ? <button type="button" className="qv-post" disabled={note === "sending"} onClick={() => send()}>{note === "sending" ? "Posting…" : "Post my review"}</button>
          : <button type="button" className="qv-nah" onClick={() => { pending.current = () => body(); setStep(s => s + 1); }}>Skip</button>}
        {step < todo.length && <button type="button" className="qv-nah" disabled={note === "sending"} onClick={() => send()}>Post now</button>}
        {noteError && <small className="qv-err">{noteError}</small>}
      </div>
    </div>}
    {mine && justVoted && !error && note === "sent" && <p className="qv-thanks" role="status">Thanks! Your review goes live after a quick check.</p>}
    {mine && justVoted && !error && note === "closed" && <p className="qv-thanks" role="status">
      {`Thanks! ${others > 0 ? `Counted with ${others.toLocaleString("en-US")} other ${others === 1 ? people.one : people.many}.` : "You're the first to vote."}`}
    </p>}
  </section>;
}
