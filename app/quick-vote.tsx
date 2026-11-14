"use client";
import { useEffect, useState } from "react";

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

export default function QuickVote({ racketId, name, one, people, addHref }: {
  racketId: string; name: string; one: string; people: { one: string; many: string }; addHref: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null), [mine, setMine] = useState<Verdict | null>(null), [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    fetch(`/api/racket-votes?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { stats?: Stats; mine?: number | null } | null) => {
        if (b?.stats) setStats(b.stats);
        if (b?.mine) { setMine(verdictOf(b.mine)); setRating(b.mine); }
      }).catch(() => {});
  }, [racketId]);

  async function vote(v: typeof VERDICTS[number]) {
    const before = mine; setMine(v.key); setBusy(true); setError("");
    try { setStats(await sendVote(racketId, v.rating, loadProfile())); setRating(v.rating); setJustVoted(true); }
    catch (e) { setMine(before); setError(e instanceof Error ? e.message : "Could not save your vote."); }
    finally { setBusy(false); }
  }

  const others = stats ? stats.total - (mine ? 1 : 0) : 0;
  const corner = stats && stats.total > 0 ? `${stats.total.toLocaleString("en-US")} ${stats.total === 1 ? people.one : people.many} voted` : "About 2 seconds";
  const review = `${addHref}${addHref.includes("?") ? "&" : "?"}rating=${rating}`;
  return <section className="qv" aria-labelledby="qv-title">
    <div className="qv-top">
      <div>
        <p className="qv-eyebrow">Your take · one tap</p>
        <h2 id="qv-title">{mine ? "Thanks for your take" : `Have you played with this ${one}?`}</h2>
        <p className="qv-sub">{`Tell other ${people.many} how it worked for you. No review to write.`}</p>
      </div>
      <span className="qv-corner">{corner}</span>
    </div>
    <VerdictButtons value={mine} onPick={vote} name={name} disabled={busy}/>
    {error && <p className="qv-error" role="alert">{error}</p>}
    {mine && justVoted && !error && <p className="qv-thanks" role="status">
      {`Thanks! ${others > 0 ? `Counted with ${others.toLocaleString("en-US")} other ${others === 1 ? people.one : people.many}. ` : "You're the first to vote. "}`}
      <a href={review}>Want to leave a more detailed review? <span aria-hidden="true">→</span></a>
    </p>}
  </section>;
}
