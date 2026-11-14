"use client";
import { useEffect, useState } from "react";

// Quick ratings (2026-11-14 pivot, owner's design): "Played it? Tap a ball" right under the sentiment bar. Five of the
// niche's rating icons (padel balls on PadelRecs); one tap rates it, then a thank-you with a link to the full review form,
// pre-filled with the product and the rating.

export type Stats = { total: number; average: number | null; positive: number; mixed: number; negative: number; level?: { name: string; positive: number; total: number } };
export type Profile = { level?: string; style?: string; side?: string };
export const BALL_WORDS = ["", "Not for me", "Meh", "It's OK", "Really good", "Love it"];
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
  if (!r.ok || !body.stats) throw new Error(body.error || "Could not save your rating.");
  return body.stats;
}

export function ChoiceRow({ label, options, value, onPick }: { label: string; options: string[]; value?: string; onPick: (v: string) => void }) {
  return <div className="qv-choice"><span>{label}</span><div>{options.map(o =>
    <button type="button" key={o} aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>)}</div></div>;
}

/** Five tappable balls. Hovering previews a rating; the chosen one stays filled. */
export function Balls({ value, onPick, onHover, name, small, disabled }: {
  value: number; onPick: (n: number) => void; onHover?: (n: number) => void; name: string; small?: boolean; disabled?: boolean;
}) {
  const [hover, setHover] = useState(0), [pop, setPop] = useState(0);
  const shown = hover || value;
  const set = (n: number) => { setHover(n); onHover?.(n); };
  return <span className={small ? "tb tb-sm" : "tb"} role="radiogroup" aria-label={`Rate the ${name}`} onMouseLeave={() => set(0)}>
    {[1, 2, 3, 4, 5].map(n => <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={`${n} of 5: ${BALL_WORDS[n]}`} disabled={disabled}
      className={`tb-ball${n <= shown ? " on" : ""}${pop === n ? " pop" : ""}`} onMouseEnter={() => set(n)} onFocus={() => set(n)} onBlur={() => set(0)}
      onClick={() => { setPop(n); setTimeout(() => setPop(0), 200); onPick(n); }}/>)}
  </span>;
}

export default function QuickVote({ racketId, name, people, addHref }: {
  racketId: string; name: string; people: { one: string; many: string }; addHref: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null), [mine, setMine] = useState(0), [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    fetch(`/api/racket-votes?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { stats?: Stats; mine?: number | null } | null) => { if (b?.stats) setStats(b.stats); if (b?.mine) setMine(b.mine); })
      .catch(() => {});
  }, [racketId]);

  async function vote(n: number) {
    const before = mine; setMine(n); setBusy(true); setError("");
    try { setStats(await sendVote(racketId, n, loadProfile())); setJustVoted(true); }
    catch (e) { setMine(before); setError(e instanceof Error ? e.message : "Could not save your rating."); }
    finally { setBusy(false); }
  }

  const others = stats ? stats.total - (mine ? 1 : 0) : 0;
  const tail = hover ? BALL_WORDS[hover]
    : stats && stats.total > 0 ? `${stats.total.toLocaleString("en-US")} ${stats.total === 1 ? people.one : people.many} rated it${stats.average ? ` · ${stats.average.toFixed(1)} avg` : ""}` : "";
  const review = `${addHref}${addHref.includes("?") ? "&" : "?"}rating=${mine}`;
  return <div className="qv-row">
    <div className="qv-line">
      <span className="qv-ask">{mine ? "Your rating" : "Played it? Tap a ball"}</span>
      <Balls value={mine} onPick={vote} onHover={setHover} name={name} disabled={busy}/>
      {tail && <span className="qv-tail">{tail}</span>}
    </div>
    {error && <p className="qv-error" role="alert">{error}</p>}
    {mine > 0 && justVoted && !error && <p className="qv-thanks" role="status">
      {`Thanks! ${others > 0 ? `Counted with ${others.toLocaleString("en-US")} other ${others === 1 ? people.one : people.many}. ` : "You're the first to rate it. "}`}
      <a href={review}>Want to leave a more detailed review? <span aria-hidden="true">→</span></a>
    </p>}
  </div>;
}
