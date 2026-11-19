"use client";
// The Thread racket page's live parts (Metalbone CTRL Thread v7): "Is it right for me?" on the live engine, the
// Loved it / Mixed / Not for me poll (the quick vote, /api/racket-votes), and the reviews feed with its composer (a vote,
// plus a normal moderated review when there are words: POST /api/reviews, the same flow as the live page).
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PendingReviews, LiveReviewTools } from "./review-admin";
import { PickChips } from "./pick-chips";
import { usePicks, usePayload, complete, fitFor } from "./picks";
import { tone, VERDICT, SOURCE, MIN_SHOWN, POLL_PCT_AT } from "../ui";
import { sendVote, loadProfile, VERDICTS, type Verdict } from "../../quick-vote";
import { nameProblem, NAME_MAX } from "../../../lib/thread/display-name";
import { savedName, saveName } from "./name";
import { useFormToken } from "../../form-token-client";
import type { RvCard } from "../racket-data";

const FIT_HEAD = { good: "Yes, a strong fit.", maybe: "Maybe. Demo it first.", no: "Probably not this one.", thin: "Not enough reports to say yet." } as const;

export function FitCheck({ id }: { id: string }) {
  const [picks, set] = usePicks();
  const on = complete(picks), payload = usePayload(on);
  const fit = useMemo(() => on && payload ? fitFor(payload, picks, id) : null, [on, payload, picks, id]);
  return <div className="th-fit">
    <span className="th-fit-title">Is it right for me?</span>
    <PickChips picks={picks} set={set} small/>
    {(picks.level || picks.style) && <div className="th-fit-out" aria-live="polite">
      {!on ? <p>Pick a level and a style to see your match.</p> : !fit ? <p>Working out your match…</p> : <>
        <span><b>{FIT_HEAD[fit.verdict.kind]}</b>{fit.pct != null && <><span className={`th-badge xs ${tone(fit.pct)}`}>{`${fit.pct}%`}</span><small>your match</small></>}</span>
        {fit.verdict.reasons.length > 0 && <p>{fit.verdict.reasons.slice(0, 2).join(" ")}</p>}
      </>}
    </div>}
  </div>;
}

type Counts = { positive: number; mixed: number; negative: number };
const RATING: Record<Verdict, number> = { positive: 5, mixed: 3, negative: 1 };
/** "Played it? Tap to add yours": the review verdicts plus the quick votes, one vote per device, changeable. */
export function Poll({ id, reviews }: { id: string; reviews: Counts }) {
  const [votes, setVotes] = useState<Counts | null>(null), [mine, setMine] = useState<Verdict | null>(null), [err, setErr] = useState("");
  // Counts from /api/thread-poll: a reviewer who also quick-voted counts once (their review is in `reviews`).
  const load = () => fetch(`/api/thread-poll?racket=${encodeURIComponent(id)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { votes?: Counts; mine?: number | null } | null) => {
    if (!b?.votes) return; setVotes(b.votes); setMine(b.mine ? (b.mine >= 4 ? "positive" : b.mine === 3 ? "mixed" : "negative") : null);
  }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);
  // Tap your pick again to take the vote back (one tap: a double tap zooms on phones).
  const pick = async (v: Verdict) => {
    setErr(""); const was = mine, off = mine === v; setMine(off ? null : v);
    try {
      if (off) { const r = await fetch(`/api/racket-votes?racket=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!r.ok) throw new Error(); }
      else await sendVote(id, RATING[v], loadProfile());
      await load();
    } catch { setMine(was); setErr(off ? "Could not remove your vote. Try again?" : "Could not save your vote. Try again?"); }
  };
  const n = (k: Verdict) => reviews[k] + (votes?.[k] ?? 0);
  const total = n("positive") + n("mixed") + n("negative");
  return <div className="th-poll">
    <span className="th-poll-head"><b>Poll: would you buy it again?</b><span>{mine ? "Thanks, your vote counts. Tap another to change it, or tap again to remove." : "One tap, no account"}</span></span>
    {(["positive", "mixed", "negative"] as const).map(k => { const c = n(k), w = total ? Math.round(c / total * 100) : 0, cls = VERDICT[k][1];
      return <button key={k} type="button" className={`th-popt ${cls}${mine && mine !== k ? " dim" : ""}`} aria-pressed={mine === k} onClick={() => pick(k)}>
        <i style={{ width: total ? `${w}%` : 0 }}/>
        <span><span className={`th-sdot ${cls}`}/>{VERDICT[k][0]}</span>
        <em>{total >= POLL_PCT_AT ? <><strong>{`${w}%`}</strong>{c > 0 && <span>{` · ${c}`}</span>}</> : c > 0 ? <strong>{c}</strong> : null}</em>
      </button>; })}
    {total === 0 && <span className="th-note">No votes yet. Be the first.</span>}
    {err && <span className="th-err">{err}</span>}
  </div>;
}

const TABS = [["all", "All"], ["player", "Players"], ["reddit", "Reddit"], ["youtube", "YouTube"], ["blog", "Blogs"]] as const;
const PAGE = 8, MIN_WORDS = 20;
type Sort = "new" | "pos" | "crit" | "helpful";
/** The mock's sorts (Newest · Most positive · Critical first), plus the existing Most helpful. */
const SORTS: [Sort, string][] = [["new", "Newest"], ["pos", "Most positive"], ["crit", "Critical first"], ["helpful", "Most helpful"]];
const VF: ["positive" | "mixed" | "negative" | null, string][] = [[null, "All"], ["positive", "Loved it"], ["mixed", "Mixed"], ["negative", "Not for me"]];
/** Player reviews: own reviews plus labelled Reddit, YouTube and blog summaries, source tabs, sort, composer, load more. */
export function Reviews({ id, cards, nicknames }: { id: string; cards: RvCard[]; nicknames: string[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all"), [sort, setSort] = useState<Sort>("new"), [vf, setVf] = useState<"positive" | "mixed" | "negative" | null>(null), [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(false), [verdict, setVerdict] = useState<Verdict | null>(null), [text, setText] = useState(""), [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<"words" | "vote" | null>(null);
  const formToken = useFormToken();
  // No generated names (owner 2026-11-19): an optional name, the one this browser typed last time if any.
  useEffect(() => { setNick(savedName()); }, []);
  // The owner's on-page changes (review-admin.tsx): edited text and removed cards, until the page refreshes.
  const [changed, setChanged] = useState<Record<string, { text?: string; alias?: string; gone?: true }>>({});
  const live = useMemo(() => cards.filter(c => !changed[c.id]?.gone).map(c => { const x = changed[c.id]; return x ? { ...c, ...(x.text ? { text: x.text } : {}), ...(x.alias ? { who: x.alias, alias: x.alias, meta: null } : {}) } : c; }), [cards, changed]);
  const counts = Object.fromEntries(TABS.map(([k]) => [k, k === "all" ? live.length : live.filter(c => c.kind === k).length]));
  // Source tabs and verdict chips combine (owner mock 2026-11-19b); everything filters and sorts here in the browser.
  const inTab = useMemo(() => live.filter(c => tab === "all" || c.kind === tab), [live, tab]);
  const list = useMemo(() => {
    const l = inTab.filter(c => !vf || c.verdict === vf), rank = (o: Record<string, number>) => (c: RvCard) => o[c.verdict ?? ""] ?? 3;
    const by = sort === "pos" ? rank({ positive: 0, mixed: 1, negative: 2 }) : sort === "crit" ? rank({ negative: 0, mixed: 1, positive: 2 }) : null;
    return [...l].sort((a, b) => sort === "helpful" ? b.helpful - a.helpful || b.text.length - a.text.length
      : (by ? by(a) - by(b) : 0) || (b.at ?? "").localeCompare(a.at ?? ""));
  }, [inTab, vf, sort]);
  async function post() {
    if (!verdict || busy) return;
    const words = text.trim();
    // A written review needs a name (owner 2026-11-19); a verdict alone is a one-tap vote and stays nameless.
    const problem = words ? nameProblem(nick) : null; if (problem) { setError(problem); return; }
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your verdict.`); return; }
    setBusy(true); setError("");
    try {
      const profile = loadProfile();
      await sendVote(id, RATING[verdict], profile);
      if (words) {
        const token = await formToken();
        const known = Object.fromEntries(Object.entries({ playerLevel: profile.level, playingSide: profile.side, playingStyle: profile.style }).filter(([, x]) => x));
        const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ racketMode: "existing", racketId: id, rating: RATING[verdict], reviewText: words, tags: [], website: "", formToken: token, alias: nick.trim() || undefined, ...known }) });
        saveName(nick);
        const b = await r.json() as { error?: string };
        if (!r.ok) throw new Error(b.error || "Your vote counted, but the review didn't post. Try again?");
      }
      setDone(words ? "words" : "vote"); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }
  return <section id="reviews" className="th-card th-sec" style={{ paddingBottom: 6, scrollMarginTop: 70 }}>
    <div className="th-head-row" style={{ alignItems: "center" }}>
      <h2 className="th-h2">Player reviews</h2>
      {!open && !done && <button type="button" className="th-btn round lime" onClick={() => setOpen(true)}>+ Add your review</button>}
    </div>
    {done && <p className="th-ok" role="status">{done === "words" ? "Thanks for sharing! Your review will appear here once it's approved." : "Thanks! Your vote has been added."}</p>}
    {open && <div className="th-compose">
      <div className="th-as"><input value={nick} onChange={e => { setNick(e.target.value); setError(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Name or nickname" required/></div>
      <div className="th-picks"><span className="lbl" style={{ fontSize: 13.5, color: "var(--ink2)", minWidth: 0 }}>Played it?</span>
        {VERDICTS.map(v => <button key={v.key} type="button" className={`th-vpick ${VERDICT[v.key][1]}`} aria-pressed={verdict === v.key} onClick={() => { setVerdict(v.key); setError(""); }}><span className={`th-sdot ${VERDICT[v.key][1]}`}/>{VERDICT[v.key][0]}</button>)}
      </div>
      <textarea className="th-ta" rows={3} autoFocus value={text} onChange={e => { setText(e.target.value); setError(""); }} maxLength={2000} placeholder="Write your review" aria-label="Your review"/>
      {error && <span className="th-err">{error}</span>}
      <div className="th-compose-foot"><span className="th-grow"/><span>No account needed</span>
        <button type="button" className="cancel" onClick={() => { setOpen(false); setError(""); }}>Cancel</button>
        <button type="button" className="th-btn round lime" disabled={!verdict || busy} onClick={post}>{busy ? "Posting…" : "Post"}</button></div>
    </div>}
    <span className="th-note" style={{ marginTop: -4 }}>From players here. Plus Reddit, YouTube and blog reviews, summarised.</span>
    <PendingReviews racketId={id}/>
    {cards.length > 0 && <>
      <div className="th-tabs" role="group" aria-label="Show reviews from">{TABS.filter(([k]) => k === "all" || counts[k] > 0).map(([k, l]) =>
        <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setShown(PAGE); }}>{l}{counts[k] > 0 && <span>{counts[k]}</span>}</button>)}</div>
      <div className="th-rv-bar">
        <div className="th-rv-chips" role="group" aria-label="Show verdict">{VF.map(([k, l]) => { const n = k ? inTab.filter(c => c.verdict === k).length : inTab.length;
          return <button key={l} type="button" className="th-chipf" aria-pressed={vf === k} onClick={() => { setVf(k); setShown(PAGE); }}>{l}{n > 0 && <span>{n}</span>}</button>; })}</div>
        <div className="th-seg th-qm-seg" role="group" aria-label="Sort"><span className="vh">Sort</span>
          {SORTS.map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>
      </div>
    </>}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.slice(0, shown).map(c => <ReviewCard key={c.id} c={c} tools={c.kind === "player" ? <LiveReviewTools id={c.id.slice(2)} text={c.text} alias={c.alias ?? ""} onChange={x => setChanged(m => ({ ...m, [c.id]: { ...m[c.id], ...x } }))}/> : null}/>)}
      {cards.length === 0 && <p className="th-empty">No reviews yet. Played it? Be the first.</p>}
      {cards.length > 0 && list.length === 0 && <p className="th-empty">No reviews match. <button type="button" onClick={() => { setTab("all"); setVf(null); }}>Show all</button></p>}
    </div>
    {list.length > shown && <button type="button" className="th-btn th-center" style={{ margin: "4px 0 8px" }} onClick={() => setShown(s => s + 16)}>{`Load ${Math.min(16, list.length - shown)} more reviews`}</button>}
  </section>;
}

function ReviewCard({ c, tools }: { c: RvCard; tools?: ReactNode }) {
  const src = c.kind === "player" ? null : SOURCE[c.kind];
  return <article className="th-rv big">
    <div className="th-rv-top">
      <div className="th-rv-who">
        {src && <span className={`th-tag ${src[1]}`}>{src[0]}</span>}
        {c.kind === "player" ? <strong>{c.who}</strong> : c.url ? <a href={c.url} target="_blank" rel="noopener nofollow" style={{ fontWeight: 700, color: "var(--ink)" }}>{`${c.who} ↗`}</a> : <strong>{c.who}</strong>}
        {c.kind !== "player" && !c.quote && <span>· summarised</span>}
        {c.meta && <span>{`· ${c.meta}`}</span>}
        {c.verdict && <span className={`th-pill ${VERDICT[c.verdict][1]}`} style={{ fontSize: 12.5 }}>{VERDICT[c.verdict][0]}</span>}
      </div>
      <span className="th-rv-when">{c.when}</span>
    </div>
    <div className={`th-rv-grid${c.video ? " yt" : ""}`}>
      {c.video && <a className="th-yt" href={c.url!} target="_blank" rel="noopener nofollow" aria-label={`Watch ${c.who} on YouTube`} style={{ backgroundImage: `url(https://i.ytimg.com/vi/${c.video}/mqdefault.jpg)` }}/>}
      <p className={`th-rv-text${c.quote ? " quote" : ""}`}>{c.quote ? `“${c.text}”` : c.text}</p>
    </div>
    {c.url && c.kind !== "reddit" && <a className="th-rv-link" href={c.url} target="_blank" rel="noopener nofollow">{c.kind === "youtube" ? "Watch on YouTube ↗" : "Read the full review ↗"}</a>}
    {tools}
  </article>;
}
