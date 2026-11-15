"use client";
import { useEffect, useState } from "react";
import { VERDICTS, loadProfile, saveProfile, sendVote, nickname, type Verdict } from "../../quick-vote";

// The racket page's Reviews section (owner 2026-11-15, site-jobs/RACKET-REVIEWS-SECTION.md, Claude Design mockup): all /
// players / youtube tabs, a "Played it? Add yours." composer and the feed, newest first, 8 at a time. Real data only: the
// cards come from the server (racket-fit.tsx) with their text, source link and dates already worked out, so the first page
// is in the HTML. The composer uses the existing flow: the verdict is a quick vote (/api/racket-votes), and words of 20+
// characters also post a normal moderated review (POST /api/reviews, spam guard + moderation), with the level picked here.

export type ReviewCard = {
  id: string; kind: "player" | "youtube"; who: string; initial?: string; meta?: string | null; verdict?: Verdict | null; when?: string | null;
  /** Player cards: the text and whether it's the writer's exact words (quote marks only then). */
  text?: string; verbatim?: boolean;
  /** YouTube cards: video id for the thumbnail, the summary's points, and whether it's a comment under the video. */
  video?: string | null; points?: string[]; comment?: boolean;
  url?: string | null; source?: string | null;
};

const PAGE = 8, MIN_WORDS = 20;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const WORD: Record<Verdict, string> = { positive: "👍 loved it", mixed: "🤷 mixed", negative: "👎 not for me" };
const PILL: Record<Verdict, string> = { positive: "👍 loved it", mixed: "🤷 mixed", negative: "👎 not for them" };
const TABS = [["all", "all"], ["players", "players"], ["youtube", "youtube"]] as const;

export default function RacketReviews({ racketId, name, cards, nicknames = [], total, mood }: { racketId: string; name: string; cards: ReviewCard[]; nicknames?: string[]; /** All reports, the page's one count. */ total?: number;
  /** Every report's sentiment for the bar beside the count (owner's final mock: a bar, no %). */ mood?: { pos: number; mix: number; neg: number } }) {
  const [tab, setTab] = useState<"all" | "players" | "youtube">("all"), [shown, setShown] = useState(PAGE);
  const [verdict, setVerdict] = useState<Verdict | null>(null), [level, setLevel] = useState<typeof LEVELS[number] | null>(null);
  const [text, setText] = useState(""), [nick, setNick] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [posted, setPosted] = useState<"words" | "vote" | null>(null);
  // A nickname fitting the site, filled in by default (owner 2026-11-15: like the old card, e.g. "SteadyVolley482"): the same one
  // per device (localStorage), editable, and a new one on tap. Read after the first render so server and client HTML match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNick(nickname(nicknames)); }, [nicknames]);
  const newNick = () => { try { localStorage.removeItem("rv-nick"); } catch { /* storage off */ } setNick(nickname(nicknames)); };
  // The side column's one-tap verdict pre-selects it here (racket-fit.tsx scrolls down).
  useEffect(() => {
    const pick = (e: Event) => { const v = (e as CustomEvent<Verdict>).detail; if (VERDICTS.some(x => x.key === v)) { setVerdict(v); setPosted(null); } };
    window.addEventListener("rv-verdict", pick);
    return () => window.removeEventListener("rv-verdict", pick);
  }, []);
  const list = cards.filter(c => tab === "all" || (tab === "youtube" ? c.kind === "youtube" : c.kind === "player"));

  async function post() {
    if (!verdict || busy) return;
    const words = text.trim(), v = VERDICTS.find(x => x.key === verdict)!;
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your verdict.`); return; }
    setBusy(true); setError("");
    try {
      const profile = { ...loadProfile(), ...(level ? { level: level[0].toUpperCase() + level.slice(1) } : {}) };
      if (level) saveProfile(profile);
      await sendVote(racketId, v.rating, profile);
      if (words) {
        const token = ((await (await fetch("/api/reviews", { cache: "no-store" })).json()) as { token?: string }).token || "";
        const known = Object.fromEntries(Object.entries({ playerLevel: profile.level, playingSide: profile.side, playingStyle: profile.style }).filter(([, x]) => x));
        const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ racketMode: "existing", racketId, rating: v.rating, reviewText: words, tags: [], website: "", formToken: token, alias: nick.trim() || undefined, ...known }) });
        const b = await r.json() as { error?: string };
        if (!r.ok) throw new Error(b.error || "Your verdict counted, but the words didn't post. Try again?");
      }
      setPosted(words ? "words" : "vote");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }

  return <>
    <div className="rv-head">
      <div><h2>Reviews</h2>
        {mood && mood.pos + mood.mix + mood.neg > 0 && <div className="rv-mood"><span>{`${total ?? cards.length} reviews`}</span>
          <span className="rf-sbar" role="img" aria-label={`${mood.pos} positive, ${mood.mix} mixed, ${mood.neg} negative`}><i className="p" style={{ flex: mood.pos }}/><i className="m" style={{ flex: mood.mix }}/><i className="n" style={{ flex: mood.neg }}/></span>
          <span>players &amp; YouTube</span></div>}{!mood && <p>{total !== undefined && total !== cards.length ? `${cards.length} of the ${total} reviews · from players on padelrecs and summarised YouTube reviews (forum reports count in the score, not shown here)` : `${cards.length} total · from players on padelrecs and summarised YouTube reviews`}</p>}</div>
      <div className="rv-tabs" role="group" aria-label="Show">{TABS.map(([k, label]) =>
        <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setShown(PAGE); }}>{label}</button>)}</div>
    </div>
    <div className="rv-list">
      {posted ? <div className="rv-thanks" role="status"><span aria-hidden="true">🎾</span>
        <span>{posted === "words" ? <><strong>Thanks — your review is in.</strong> It&apos;ll show here after a quick check.</> : <><strong>Thanks — your verdict counts.</strong> Add a few words next time and it shows here too.</>}</span></div>
      : <div className="rv-compose">
        <div className="rv-ct"><b>Played it?</b><span>one tap, no account</span></div>
        <div className="rv-verdicts" role="group" aria-label={`Your verdict on the ${name}`}>{VERDICTS.map(x =>
          <button key={x.key} type="button" className={x.key} aria-pressed={verdict === x.key} onClick={() => { setVerdict(x.key); setError(""); }}>{WORD[x.key]}</button>)}</div>
        {verdict && <><div className="rv-levels" role="group" aria-label="Your level (optional)"><span>I&apos;m</span>{LEVELS.map(l =>
          <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(level === l ? null : l)}>{l}</button>)}</div>
        <textarea rows={4} maxLength={2000} value={text} onChange={e => { setText(e.target.value); setError(""); }} aria-label="Your review (optional)"
          placeholder="What would you tell a friend thinking of buying it? What surprised you? What did you come from?"/>
        <div className="rv-send">
          <span className="rv-nick"><input value={nick} onChange={e => setNick(e.target.value)} maxLength={50} placeholder="name or nickname (optional)" aria-label="Your nickname (optional, change it if you like)"/>
            <button type="button" onClick={newNick} title="Another nickname" aria-label="Another nickname">↻</button></span>
          <button type="button" className="rv-post" disabled={!verdict || busy} onClick={post}>{busy ? "posting…" : verdict ? "Post review →" : "pick a verdict"}</button>
        </div>
        </>}
        {error && <p className="rv-err" role="alert">{error}</p>}
      </div>}

      {list.length === 0 && <p className="rv-empty">{tab === "youtube" ? "No YouTube reviews summarised yet." : "No player reviews yet."}</p>}
      {list.slice(0, shown).map((c, i) => <article key={c.id} className={`rv-card ${c.kind}`}>
        {c.kind === "player" ? <>
          <div className="rv-top">
            <span className={`rv-av a${i % 4}`} aria-hidden="true">{c.initial ?? c.who[0]}</span>
            <strong>{c.who}</strong>
            {(c.meta || c.url) && <span className="rv-meta">{c.meta}{c.url && <>{c.meta ? " · " : ""}<a href={c.url} target="_blank" rel="noopener nofollow">{`${c.source ?? "source"} ↗`}</a></>}</span>}
            {c.verdict && <span className={`rv-pill ${c.verdict}`}>{PILL[c.verdict]}</span>}
            {c.when && <span className="rv-when">{c.when}</span>}
          </div>
          <p className="rv-text">{c.verbatim ? `“${c.text}”` : c.text}</p>
        </> : <div className="rv-yt">
          <a className="rv-thumb" href={c.url ?? undefined} target="_blank" rel="noopener nofollow" aria-label={`Watch on YouTube: ${c.who}`}>
            {c.video && <img src={`https://i.ytimg.com/vi/${c.video}/mqdefault.jpg`} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }}/>}
            <span className="rv-play" aria-hidden="true">▶</span>
          </a>
          <div className="rv-yb">
            <div className="rv-top"><span className="rv-tag">youtube</span><strong>{c.who}</strong>
              {c.verdict && <span className={`rv-pill ${c.verdict}`}>{PILL[c.verdict]}</span>}
              {c.when && <span className="rv-when">{c.when}</span>}</div>
            {c.comment && <div className="rv-title">a viewer&apos;s comment under the video</div>}
            {c.points && c.points.length > 1 ? <ul>{c.points.map((p, j) => <li key={j}>{p}</li>)}</ul> : <p className="rv-text">{c.points?.[0]}</p>}
            {c.url && <a className="rv-watch" href={c.url} target="_blank" rel="noopener nofollow">{c.comment ? "see the comment on youtube ↗" : "watch on youtube ↗"}</a>}
          </div>
        </div>}
      </article>)}
      {list.length > shown && <button type="button" className="rv-more" onClick={() => setShown(s => s + PAGE)}>show more reviews ↓</button>}
    </div>
  </>;
}
