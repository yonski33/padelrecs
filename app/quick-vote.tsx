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

// Card reviews are signed with a generated nickname (owner, 2026-11-14: like Reddit's random usernames, nothing to type).
// One per device, kept in localStorage, so the same person shows up under the same name. Each niche's own words.
const NICK_A = ["Swift", "Steady", "Lucky", "Bold", "Sunny", "Quiet", "Clever", "Brave", "Calm", "Sharp", "Happy", "Mellow", "Rapid", "Smooth", "Wild", "Cool"];
/** The generic second halves, for niches without form.quickVote.nicknames. */
export const DEFAULT_NICKNAMES = ["Volley", "Lob", "Smash", "Rally", "Spin", "Drop", "Ace", "Slice", "Serve", "Rebound", "Baseline", "Topspin"];
export function nickname(words: string[] = DEFAULT_NICKNAMES) {
  try {
    const known = localStorage.getItem("rv-nick");
    if (known) return known;
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
    const nick = `${pick(NICK_A)}${pick(words.length ? words : DEFAULT_NICKNAMES)}${Math.floor(100 + Math.random() * 900)}`;
    localStorage.setItem("rv-nick", nick);
    return nick;
  } catch { return ""; }
}
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

/** After a verdict: "Got a few words to say about it?" → "Post it" saves a normal (moderated) review right away, signed
 *  with the device's nickname → optional tags, each added as tapped → a plain thank-you. "Nah, I'm good" closes it.
 *  Used by the product page's card and by every row on /rate. */
export function FollowUp({ racketId, rating, label, placeholder, nicknames, onDone }: {
  racketId: string; rating: number; label: string; placeholder: string; nicknames: string[]; onDone?: (posted: boolean) => void;
}) {
  const [note, setNote] = useState<"open" | "sending" | "tags" | "sent" | "closed">("open"), [words, setWords] = useState(""), [error, setError] = useState("");
  const [postedAs, setPostedAs] = useState(""), [tags, setTags] = useState<string[]>([]);
  const token = useRef(""), saved = useRef<{ id: string; edit: string } | null>(null);
  useEffect(() => {
    // The review API wants a signed "form opened at" token (lib/form-token.ts); fetched now, while they type.
    fetch("/api/reviews", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { token?: string } | null) => { token.current = b?.token || ""; }).catch(() => {});
  }, []);
  // The verdict can change while the box is open (another tap): later tags then go to the review already saved.
  async function post() {
    const text = words.trim();
    if (text.length < MIN_WORDS) { setError(`A little more, please: at least ${MIN_WORDS} characters.`); return; }
    setNote("sending"); setError("");
    try {
      if (!token.current) { const b = await (await fetch("/api/reviews", { cache: "no-store" })).json() as { token?: string }; token.current = b.token || ""; }
      const p = loadProfile(), nick = nickname(nicknames); setPostedAs(nick);
      const known = Object.fromEntries(Object.entries({ playerLevel: p.level, playingSide: p.side, playingStyle: p.style }).filter(([, v]) => v));
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ racketMode: "existing", racketId, rating, reviewText: text, tags: [], website: "", formToken: token.current, alias: nick || undefined, ...known }) });
      const b = await r.json() as { id?: string; edit?: string; error?: string };
      if (!r.ok) throw new Error(b.error || "Could not post that. Please try again.");
      saved.current = b.id && b.edit ? { id: b.id, edit: b.edit } : null;
      setNote("tags");
    } catch (e) { setNote("open"); setError(e instanceof Error ? e.message : "Could not post that. Please try again."); }
  }
  function toggleTag(t: string) {
    const next = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t];
    setTags(next);
    if (saved.current) fetch("/api/reviews", { method: "PATCH", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...saved.current, tags: next }) }).catch(() => {});
  }
  const finish = (posted: boolean) => { setNote(posted ? "sent" : "closed"); onDone?.(posted); };

  if (note === "open" || note === "sending") return <div className="qv-words">
    <label htmlFor={`qv-words-${racketId}`}>{label}</label>
    <textarea id={`qv-words-${racketId}`} rows={3} maxLength={2000} value={words} onChange={e => { setWords(e.target.value); setError(""); }} placeholder={placeholder} autoFocus/>
    <div className="qv-words-row">
      <button type="button" className="qv-post" disabled={note === "sending"} onClick={post}>{note === "sending" ? "Posting…" : "Post it"}</button>
      <button type="button" className="qv-nah" onClick={() => finish(false)}>{"Nah, I'm good"}</button>
      <small className={error ? "qv-err" : undefined}>{error || (words.trim().length < MIN_WORDS ? `A sentence is plenty · ${MIN_WORDS - words.trim().length} characters to go` : "Goes live after a quick check")}</small>
    </div>
  </div>;
  if (note === "tags") return <div className="qv-steps" aria-live="polite">
    <p className="qv-steps-head">{`Nice! Your review is saved${postedAs ? ` as ${postedAs}` : ""}.`}</p>
    <div className="qv-step">
      <h3>{`Anything that stands out? Tap up to ${MAX_TAGS}, all optional`}</h3>
      <div className="qv-chips">{TAGS.map(t => { const on = tags.includes(t.label); return <button type="button" key={t.label} className={`tone-${t.tone}`} aria-pressed={on}
        disabled={!on && tags.length >= MAX_TAGS} onClick={() => toggleTag(t.label)}>{t.label}</button>; })}</div>
    </div>
    <div className="qv-words-row"><button type="button" className="qv-post" onClick={() => finish(true)}>Done</button></div>
  </div>;
  return null;
}

export default function QuickVote({ racketId, name, question, people, placeholder, nicknames }: {
  racketId: string; name: string; question: string; people: { one: string; many: string }; placeholder: string; nicknames: string[];
}) {
  const [stats, setStats] = useState<Stats | null>(null), [mine, setMine] = useState<Verdict | null>(null), [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [phase, setPhase] = useState<"none" | "follow" | "posted" | "skipped">("none");

  useEffect(() => {
    fetch(`/api/racket-votes?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { stats?: Stats; mine?: number | null } | null) => {
        if (b?.stats) setStats(b.stats);
        if (b?.mine) { setMine(verdictOf(b.mine)); setRating(b.mine); }
      }).catch(() => {});
  }, [racketId]);

  async function vote(v: typeof VERDICTS[number]) {
    const before = mine; setMine(v.key); setBusy(true); setError("");
    try { setStats(await sendVote(racketId, v.rating, loadProfile())); setRating(v.rating); if (phase === "none") setPhase("follow"); }
    catch (e) { setMine(before); setError(e instanceof Error ? e.message : "Could not save your vote."); }
    finally { setBusy(false); }
  }

  const others = stats ? stats.total - (mine ? 1 : 0) : 0;
  const counted = others > 0 ? `Counted with ${others.toLocaleString("en-US")} other ${others === 1 ? people.one : people.many}.` : "You're the first to vote.";
  const corner = stats && stats.total > 0 ? `${stats.total.toLocaleString("en-US")} ${stats.total === 1 ? people.one : people.many} voted` : "";
  return <section className="qv" aria-labelledby="qv-title">
    <div className="qv-top">
      <div>
        <p className="qv-eyebrow">Your take · one tap</p>
        <h2 id="qv-title">{mine ? "Thanks for your take" : question}</h2>
        <p className="qv-sub">{`Tell other ${people.many} how it worked for you. No review to write.`}</p>
      </div>
      {corner && <span className="qv-corner">{corner}</span>}
    </div>
    <VerdictButtons value={mine} onPick={vote} name={name} disabled={busy}/>
    {error && <p className="qv-error" role="alert">{error}</p>}
    {phase === "follow" && !error && <FollowUp racketId={racketId} rating={rating} label={`Thanks! ${others > 0 ? `${counted} ` : ""}Got a few words to say about it?`}
      placeholder={placeholder} nicknames={nicknames} onDone={posted => setPhase(posted ? "posted" : "skipped")}/>}
    {phase === "posted" && <p className="qv-thanks" role="status">Thanks! Your review goes live after a quick check.</p>}
    {phase === "skipped" && <p className="qv-thanks" role="status">{`Thanks! ${counted}`}</p>}
  </section>;
}
