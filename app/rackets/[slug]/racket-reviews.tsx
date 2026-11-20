"use client";
import { siteVoice, voiceThanks } from "../../../lib/site-voice";
import { scoreBox } from "../../../lib/score-tone";
import { niche } from "../../../lib/niche";
import { useFormToken } from "../../form-token-client";
import { VERDICT_PILL } from "../../../lib/review-pill";
import { videoLabel } from "../../../lib/video-label";
import { useEffect, useRef, useState } from "react";
import { VERDICTS, loadProfile, saveProfile, sendVote, nickname, type Verdict } from "../../quick-vote";

// The racket page's Reviews section (owner 2026-11-15, site-jobs/RACKET-REVIEWS-SECTION.md, Claude Design mockup): all /
// players / youtube tabs, a "Played it? Add yours." composer and the feed, newest first, 8 at a time. Real data only: the
// cards come from the server (racket-fit.tsx) with their text, source link and dates already worked out, so the first page
// is in the HTML. The composer uses the existing flow: the verdict is a quick vote (/api/racket-votes), and words of 20+
// characters also post a normal moderated review (POST /api/reviews, spam guard + moderation), with the level picked here.

export type ReviewCard = {
  id: string; kind: "player" | "youtube" | "blog" | "reddit"; who: string; initial?: string; meta?: string | null; verdict?: Verdict | null; when?: string | null;
  /** Player and blog cards: the text and whether it's the writer's exact words (quote marks only then). */
  text?: string; verbatim?: boolean;
  /** YouTube cards: video id for the thumbnail, the summary's points, whether it's a comment under the video, and the video's
   *  length in minutes when known. */
  video?: string | null; points?: string[]; comment?: boolean; minutes?: number | null;
  /** YouTube cards: the video's date (ISO), for "Summary of <channel>'s video, <date>". */ date?: string | null;
  /** How long the writer has played it ("6–12 months"), when given. */ played?: string | null;
  /** What this review mentions (its stored tags), for "What players mention". */ tags?: string[];
  url?: string | null; source?: string | null;
};

const PAGE = 8, MIN_WORDS = 20;
/** After Post (owner 2026-11-18): a review waits for approval; a vote is saved at once (/api/racket-votes, no moderation). */
const THANKS = { words: "Thanks for sharing! Your review will appear here once it's approved.", vote: "Thanks! Your vote has been added." } as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const WORD: Record<Verdict, string> = { positive: "👍 loved it", mixed: "🤷 mixed", negative: "👎 not for me" };
const PILL: Record<Verdict, string> = { positive: "👍 loved it", mixed: "🤷 mixed", negative: "👎 not for them" };
const TABS = [["all", "all"], ["players", "players"], ["youtube", "youtube"], ["blogs", "blogs"], ["reddit", "reddit"]] as const;

const PLAIN: Record<Verdict, string> = { positive: "loved it", mixed: "mixed", negative: "not for me" };
/** The score row's counts with every count under `min` left out ("12 loved · 6 nope · 21 rated"); under `min` rated, none. */
function countLine(m: { pos: number; mix: number; neg: number }, rated: number, min: number, thin: boolean) {
  if (rated < min) return "first ratings in";
  if (thin) return `${rated} rated so far`;
  return [...([[m.pos, "loved"], [m.mix, "mixed"], [m.neg, "nope"]] as const).filter(([n]) => n >= min).map(([n, w]) => `${n} ${w}`), `${rated} rated`, "tap a colour to filter"].join(" · ");
}

/** Who reviews, in the site's words (lib/niche reviewers, else people). */
const RV = (niche.reviewers ?? niche.people).many;
export default function RacketReviews({ racketId, name, cards, nicknames = [], total, mood, words, v11c, hideUnder }: { /** SkinRecs (owner rule): counts
   *  under this are never shown (the score row and the mention tags). Unset: every count, as before. */ hideUnder?: number; /** v11c (owner 2026-11-17): "What players say",
   *  the new-this-week dot, a one-row "Played it?" (dots, no emoji; a few words optional) and the thin state. */ v11c?: { fresh: number; thin: boolean; /** Each mention tag's tone: praise or complaint. */ tone?: Record<string, "pos" | "neg" | "neutral"> }; racketId: string; name: string; cards: ReviewCard[]; nicknames?: string[]; /** All reports, the page's one count. */ total?: number;
  /** Every judged report's sentiment and the Player score for the header (owner's final mock: badge, bar, no %). */ mood?: { pos: number; mix: number; neg: number; score?: number | null };
  /** Another site's words (SkinRecs): the profile chips ("I have" dry / oily…), the score's name, the composer's title, who the
   *  reviewers are. Padel's by default. */ words?: { levelLead: string; levels: { value: string; label: string }[]; score: string; ask: string; people: string; peopleTab: string } }) {
  const W = words ?? { levelLead: "I'm", levels: LEVELS.map(l => ({ value: l[0].toUpperCase() + l.slice(1), label: l as string })), score: "Player score", ask: "Played it?", people: RV, peopleTab: RV };
  const [tab, setTab] = useState<"all" | "players" | "youtube" | "blogs" | "reddit">("all"), [shown, setShown] = useState(PAGE);
  const formToken = useFormToken();
  // v11c filters (owner 2026-11-17, the approved mock): a verdict from the vote bar, a tag from "What players mention".
  const [vf, setVf] = useState<Verdict | null>(null), [tf, setTf] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null), [level, setLevel] = useState<string | null>(null);
  const [text, setText] = useState(""), [nick, setNick] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [posted, setPosted] = useState<"words" | "vote" | null>(null);
  // The site's own thank-you (lib/site-voice.ts), picked once per page view; shown only after a send, so SSR never renders it.
  const [thanksLine] = useState(() => voiceThanks(THANKS.words));
  // The "a few words" box grows with its text (up to its CSS max-height).
  const grow = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = grow.current; if (t) { t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; } }, [text, verdict]);
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
  const list = cards.filter(c => (tab === "all" || c.kind === (tab === "players" ? "player" : tab === "blogs" ? "blog" : tab === "reddit" ? "reddit" : "youtube"))
    && (!vf || c.verdict === vf) && (!tf || (c.tags ?? []).includes(tf)));
  // "What players mention": each tag's count is the number of these cards that mention it, so a tap shows exactly that many
  // (with the verdict and tab filters off); fewer than 3 mentions, no tag (owner 2026-11-18: 5 left most pages without the box).
  const MIN_MENTIONS = 3;
  const mentions = v11c ? [...cards.reduce((m, c) => { for (const t of new Set(c.tags ?? [])) m.set(t, (m.get(t) ?? 0) + 1); return m; }, new Map<string, number>())]
    .filter(([, n]) => n >= MIN_MENTIONS).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) : [];
  const toneOf = (t: string) => v11c?.tone?.[t] ?? "neutral";
  /** "blogs" tab only when this product has a blog card (owner 2026-11-18). */
  const hasBlogs = cards.some(c => c.kind === "blog"), hasReddit = cards.some(c => c.kind === "reddit");

  async function post() {
    if (!verdict || busy) return;
    const words = text.trim(), v = VERDICTS.find(x => x.key === verdict)!;
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your vote.`); return; }
    setBusy(true); setError("");
    try {
      const profile = { ...loadProfile(), ...(level ? { level } : {}) };
      if (level) saveProfile(profile);
      await sendVote(racketId, v.rating, profile);
      if (words) {
        const token = await formToken();
        const known = Object.fromEntries(Object.entries({ playerLevel: profile.level, playingSide: profile.side, playingStyle: profile.style }).filter(([, x]) => x));
        const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ racketMode: "existing", racketId, rating: v.rating, reviewText: words, tags: [], website: "", formToken: token, alias: nick.trim() || undefined, ...known }) });
        const b = await r.json() as { error?: string };
        if (!r.ok) throw new Error(b.error || "Your vote counted, but the words didn't post. Try again?");
      }
      setPosted(words ? "words" : "vote");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }

  const rated = mood ? mood.pos + mood.mix + mood.neg : 0;
  // The approved mock, copied (owner 2026-11-17, artifact NXPeRJcKkjVCxjwZ7EH9Xj): on wide screens a 720px left column (heading,
  // score row, "Played it?", the list) and a sticky "What players mention" list beside it; narrower, the tags are a chip row.
  if (v11c) {
    const top5 = mentions.slice(0, 5);
    const tagButton = (t: string, n: number, row: boolean) => <button key={t} type="button" className={`rv12-tag ${toneOf(t) === "neg" ? "neg" : toneOf(t) === "pos" ? "pos" : "neu"}${row ? " chip" : ""}`} aria-pressed={tf === t}
      onClick={() => { setTf(tf === t ? null : t); setShown(PAGE); }}><i aria-hidden="true"/><span>{t}</span>{(!hideUnder || n >= hideUnder) && <small>{n}</small>}</button>;
    return <div className={`rv12${top5.length ? " side" : ""}`}>
      <div className="rv12-main">
        <div className="rv12-head"><h2>{`What ${W.people} say`}</h2>{v11c.fresh > 0 && <span className="rv-new"><i aria-hidden="true"/>{`${v11c.fresh} new this week`}</span>}
          <div className="rv12-tabs" role="group" aria-label="Show">{TABS.filter(([k]) => (k !== "blogs" || hasBlogs) && (k !== "reddit" || hasReddit)).map(([k, label]) =>
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setShown(PAGE); }}>{k === "players" ? W.peopleTab : label}</button>)}</div></div>
        {mood && rated > 0 && <div className="rv12-score">
          {mood.score != null && <span className="rv12-badge" title={`${W.score}: not a % of happy ${W.people}. It blends how much ${W.people} like it with how many have weighed in.`}>
            <b className={scoreBox(mood.score) || "plain"}>{mood.score}</b><span>{W.score}</span></span>}
          <span className="rv12-bar"><span className="rv12-vbar" role="group" aria-label="Show reviews by opinion">{([["positive", mood.pos, "p"], ["mixed", mood.mix, "m"], ["negative", mood.neg, "n"]] as const).map(([k, n, cls]) =>
            n > 0 && <button key={k} type="button" className={cls} style={{ flex: n }} aria-pressed={vf === k} title={`show ${VERDICT_PILL[k]} reviews`}
              onClick={() => { setVf(vf === k ? null : k); setShown(PAGE); }}><span className="sr-only">{`${n} ${VERDICT_PILL[k]}`}</span></button>)}</span>
            <small>{hideUnder ? countLine(mood, rated, hideUnder, v11c.thin) : v11c.thin ? `${rated} rated so far` : `${mood.pos} loved · ${mood.mix} mixed · ${mood.neg} nope · ${rated} rated · tap a colour to filter`}</small></span></div>}
        {posted ? <div className="rv12-thanks" role="status">{posted === "words" ? thanksLine : THANKS[posted]}</div>
        : <div id="played" className="rv-played">
          <div className="rv-prow"><b>{W.ask}</b>
            {VERDICTS.map(x => <button key={x.key} type="button" className={x.key} aria-pressed={verdict === x.key} onClick={() => { setVerdict(x.key); setError(""); }}><i aria-hidden="true"/>{PLAIN[x.key]}</button>)}
            <span className="rv-pk">one tap, no account</span></div>
          {verdict && <div className="rv-pwords">
            {/* A box that wraps and grows (owner 2026-11-18): 3 lines to start, up to about 8, then it scrolls; Enter is a new line. */}
            <textarea ref={grow} rows={3} value={text} onChange={e => { setText(e.target.value); setError(""); }} maxLength={2000} placeholder="a few words? (optional)" aria-label="A few words (optional)"/>
            {/* "posting as" (owner 2026-11-18, as the quick review card): a nickname filled in for this device, ↻ for another,
                or clear it and type your own name. */}
            <div className="rv-psend"><span className="rv-pas">posting as</span>
              <span className="rv-nick"><input value={nick} onChange={e => setNick(e.target.value)} maxLength={50} placeholder="your name (optional)" aria-label="Posting as (optional, change it if you like)"/>
                <button type="button" onClick={newNick} title="Another nickname" aria-label="Another nickname">↻</button></span>
              <button type="button" className="rv-post" disabled={busy} onClick={post}>{busy ? "posting…" : "Post"}</button></div></div>}
          {error && <p className="rv-err" role="alert">{error}</p>}
        </div>}
        {top5.length > 0 && <div className="rv12-row" aria-label={`What ${W.people} mention`}>{top5.map(([t, n]) => tagButton(t, n, true))}</div>}
        {(vf || tf) && <span className="rv12-showing">showing <strong>{[vf && VERDICT_PILL[vf], tf].filter(Boolean).join(" · ")}</strong>{` (${list.length}) · `}
          <button type="button" onClick={() => { setVf(null); setTf(null); }}>clear</button></span>}
        <div className="rv12-list">{list.slice(0, shown).map((c, i) => <Rv12Card key={c.id} c={c} i={i}/>)}</div>
        {list.length === 0 && <div className="rv12-empty"><b>{vf || tf ? "No reviews match these filters" : tab === "youtube" ? "No YouTube reviews summarised yet." : siteVoice()?.empty.reviews ?? `No ${W.people.replace(/s$/, "")} reviews yet.`}</b>
          {(vf || tf) && <button type="button" onClick={() => { setVf(null); setTf(null); }}>show all reviews</button>}</div>}
        {!v11c.thin && list.length > shown && <button type="button" className="rv12-more" onClick={() => setShown(s => s + PAGE)}>{`show ${list.length - shown} more reviews ↓`}</button>}
      </div>
      {top5.length > 0 && <aside className="rv12-side" aria-label={`What ${W.people} mention`}><div className="rv12-box">
        <div className="rv12-boxh"><h3>{`What ${W.people} mention`}</h3>{tf && <button type="button" onClick={() => setTf(null)}>clear</button>}</div>
        <span className="rv12-hint">tap one to filter the reviews</span>
        <div className="rv12-tags">{top5.map(([t, n]) => tagButton(t, n, false))}</div>
        <span className="rv12-legend"><span><i className="pos"/>praise</span><span><i className="neg"/>complaint</span></span>
      </div></aside>}
    </div>;
  }
  return <>
    <div className="rv-head">
      <div><h2>Reviews</h2>
        {mood && mood.pos + mood.mix + mood.neg > 0 && <div className="rv-mood">
          {mood.score != null && <span className="rv-badge" title={`${W.score}: not a % of happy ${W.people}. It blends how much ${W.people} like it with how many have weighed in.`}><b className={scoreBox(mood.score) || "plain"}>{mood.score}</b>{W.score}</span>}
          <span className="rv-mbar"><span className="rf-sbar" role="img" aria-label={`${mood.pos} positive, ${mood.mix} mixed, ${mood.neg} negative`}><i className="p" style={{ flex: mood.pos }}/><i className="m" style={{ flex: mood.mix }}/><i className="n" style={{ flex: mood.neg }}/></span>
          <small>{`👍 ${mood.pos} loved · 🤷 ${mood.mix} mixed · 👎 ${mood.neg} nope · ${mood.pos + mood.mix + mood.neg} rated`}</small></span></div>}{!mood && <p>{total !== undefined && total !== cards.length ? `${cards.length} of the ${total} reviews · from players on padelrecs, summarised YouTube reviews and blogs (forum reports count in the score only)` : `${cards.length} total · from players on padelrecs and summarised YouTube reviews`}</p>}</div>
      <div className="rv-tabs" role="group" aria-label="Show">{TABS.filter(([k]) => (k !== "blogs" || hasBlogs) && (k !== "reddit" || hasReddit)).map(([k, label]) =>
        <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setShown(PAGE); }}>{k === "players" ? W.peopleTab : label}</button>)}</div>
    </div>
    <div className="rv-list">
      {posted ? <div className="rv-thanks" role="status"><span aria-hidden="true">🎾</span>
        <span>{posted === "words" ? thanksLine : THANKS[posted]}</span></div>
      : <div className={`rv-compose${verdict ? "" : " one"}`}>
        <div className="rv-ct"><b>{W.ask}</b><span>one tap, no account</span></div>
        <div className="rv-verdicts" role="group" aria-label={`Your take on the ${name}`}>{VERDICTS.map(x =>
          <button key={x.key} type="button" className={x.key} aria-pressed={verdict === x.key} onClick={() => { setVerdict(x.key); setError(""); }}>{WORD[x.key]}</button>)}</div>
        {verdict && <><div className="rv-levels" role="group" aria-label="About you (optional)"><span>{W.levelLead}</span>{W.levels.map(l =>
          <button key={l.value} type="button" aria-pressed={level === l.value} onClick={() => setLevel(level === l.value ? null : l.value)}>{l.label}</button>)}</div>
        <textarea rows={4} maxLength={2000} value={text} onChange={e => { setText(e.target.value); setError(""); }} aria-label="Your review (optional)"
          placeholder="What would you tell a friend thinking of buying it? What surprised you? What did you come from?"/>
        <div className="rv-send">
          <span className="rv-nick"><input value={nick} onChange={e => setNick(e.target.value)} maxLength={50} placeholder="name or nickname (optional)" aria-label="Your nickname (optional, change it if you like)"/>
            <button type="button" onClick={newNick} title="Another nickname" aria-label="Another nickname">↻</button></span>
          <button type="button" className="rv-post" disabled={!verdict || busy} onClick={post}>{busy ? "posting…" : verdict ? "Post review →" : "pick your take"}</button>
        </div>
        </>}
        {error && <p className="rv-err" role="alert">{error}</p>}
      </div>}

      {list.length === 0 && <p className="rv-empty">{tab === "youtube" ? "No YouTube reviews summarised yet." : siteVoice()?.empty.reviews ?? `No ${W.people.replace(/s$/, "")} reviews yet.`}</p>}
      {list.slice(0, shown).map((c, i) => <Card key={c.id} c={c} i={i} pill={PILL}/>)}
      {list.length > shown && <button type="button" className="rv-more" onClick={() => setShown(s => s + PAGE)}>show more reviews ↓</button>}
    </div>
  </>;
}

/** One review card: a player (avatar, name, verdict, time; then the writer's level · side when given) or a YouTube video in the
 *  same list (thumbnail, channel, verdict, summary, watch link). */
function Card({ c, i, pill, v11c = false }: { c: ReviewCard; i: number; pill: Record<Verdict, string>; v11c?: boolean }) {
  return <article className={`rv-card ${c.kind}${v11c ? " v11c" : ""}`}>
        {c.kind === "player" ? <>
          <div className="rv-top">
            <span className={`rv-av a${i % 4}`} aria-hidden="true">{c.initial ?? c.who[0]}</span>
            <strong>{c.who}</strong>
            {(c.meta && !v11c || c.url) && <span className="rv-meta">{v11c ? null : c.meta}{c.url && <>{c.meta && !v11c ? " · " : ""}<a href={c.url} target="_blank" rel="noopener nofollow">{`${c.source ?? "source"} ↗`}</a></>}</span>}
            {c.verdict && <span className={`rv-pill ${c.verdict}`}>{pill[c.verdict]}</span>}
            {c.when && <span className="rv-when">{c.when}</span>}
          </div>
          {v11c && c.meta && <div className="rv-who2">{c.meta}</div>}
          <p className="rv-text">{c.verbatim ? `“${c.text}”` : c.text}</p>
        </> : v11c ? <YtLite c={c} pill={pill}/> : <div className="rv-yt">
          <a className="rv-thumb" href={c.url ?? undefined} target="_blank" rel="noopener nofollow" aria-label={`Watch on YouTube: ${c.who}`}>
            {c.video && <img src={`https://i.ytimg.com/vi/${c.video}/mqdefault.jpg`} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }}/>}
            <span className="rv-play" aria-hidden="true">▶</span>
          </a>
          <div className="rv-yb">
            <div className="rv-top"><span className="rv-tag">youtube</span><strong>{c.who.replace(/^youtube\s+/i, "") || c.who}</strong>
              {c.verdict && <span className={`rv-pill ${c.verdict}`}>{pill[c.verdict]}</span>}
              {c.when && <span className="rv-when">{c.when}</span>}</div>
            {c.comment && <div className="rv-title">a viewer&apos;s comment under the video</div>}
            {c.points && c.points.length > 1 ? <ul>{c.points.map((p, j) => <li key={j}>{p}</li>)}</ul> : <p className="rv-text">{c.points?.[0]}</p>}
            {c.url && <a className="rv-watch" href={c.url} target="_blank" rel="noopener nofollow">{c.comment ? "see the comment on youtube ↗" : "watch on youtube ↗"}</a>}
          </div>
        </div>}
  </article>;
}

/** A YouTube review on the v11c page (owner 2026-11-17), in the same list as player cards.
 *  A video summary: top row with a small thumbnail beside "▶ YouTube", the channel, verdict and time and "summary of the
 *  video" (our words, not the creator's); then the whole summary (no clamp, the stored points joined) and "watch ↗" from the
 *  card's left edge. A viewer's comment: no thumbnail (a comment beside a video's thumbnail read as the video's verdict); it
 *  looks like a player card: initial, "YouTube viewer", "comment on a <channel> video", the full text, "see the comment ↗". */
function YtLite({ c, pill }: { c: ReviewCard; pill: Record<Verdict, string> }) {
  const channel = c.who.replace(/^youtube\s+/i, "") || c.who;
  const end = (t: string) => /[.!?…"”)]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`;
  const text = (c.points ?? []).filter(Boolean).map(end).join(" ");
  const meta = <>{c.verdict && <span className={`rv-pill ${c.verdict}`}>{pill[c.verdict]}</span>}{c.when && <span className="rv-when">{c.when}</span>}</>;
  if (c.comment) return <div className="rv-ycomm">
    <div className="rv-top"><span className="rv-av a0" aria-hidden="true">Y</span><strong>YouTube viewer</strong>{meta}</div>
    <div className="rv-who2">{`comment on a ${channel} video`}</div>
    {text && <p className="rv-text">{text}</p>}
    {c.url && <a className="rv-watch" href={c.url} target="_blank" rel="noopener nofollow">see the comment ↗</a>}
  </div>;
  return <div className="rv-ytl">
    <div className="rv-yhead">
      <a className="rv-tl" href={c.url ?? undefined} target="_blank" rel="noopener nofollow" aria-label={`Watch on YouTube: ${channel}`}>
        {c.video && <img src={`https://i.ytimg.com/vi/${c.video}/mqdefault.jpg`} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }}/>}
      </a>
      <div className="rv-yb">
        <div className="rv-top"><span className="rv-ylab">{`▶ YouTube${c.minutes ? ` · ${c.minutes} min` : ""}`}</span><strong>{channel}</strong>{meta}</div>
        <div className="rv-ysub">summary of the video</div>
      </div>
    </div>
    {text && <p className="rv-text rv-y2">{text}</p>}
    {c.url && <a className="rv-watch" href={c.url} target="_blank" rel="noopener nofollow">watch ↗</a>}
  </div>;
}


/** A review card as the approved mock draws it: avatar, name, verdict pill and time on top, then the full text. A viewer's
 *  comment adds "comment on a <channel> video" and "see the comment ↗"; a video summary leads with its text (pill beside it),
 *  then a small thumbnail, the channel, "watch ↗" and the time. */
function Rv12Card({ c, i }: { c: ReviewCard; i: number }) {
  const channel = c.who.replace(/^youtube\s+/i, "") || c.who;
  const end = (t: string) => /[.!?…"”)]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`;
  const text = c.kind !== "youtube" ? (c.verbatim ? `“${c.text}”` : c.text ?? "") : (c.points ?? []).filter(Boolean).map(end).join(" ");
  const pill = c.verdict && <span className={`rv12-pill ${c.verdict}`}>{VERDICT_PILL[c.verdict]}</span>;
  if (c.kind === "youtube" && !c.comment) return <article className="rv12-card">
    <div className="rv12-yt">{text && <p className="rv12-text">{text}</p>}{pill}</div>
    <div className="rv12-ymeta"><a className="rv12-thumb" href={c.url ?? undefined} target="_blank" rel="noopener nofollow" aria-label={`Watch on YouTube: ${channel}`}>
      {c.video && <img src={`https://i.ytimg.com/vi/${c.video}/mqdefault.jpg`} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }}/>}</a>
      <span className="rv12-ysum">{videoLabel(channel, c.date)}</span>{c.url && <a href={c.url} target="_blank" rel="noopener nofollow">watch ↗</a>}
      {!c.date && c.when && <span className="rv12-when">{c.when}</span>}</div>
  </article>;
  // A blog review (owner 2026-11-18): like the video summary, text first (pill beside it), then "blog", the blog's name, read ↗, time.
  if (c.kind === "blog") return <article className="rv12-card">
    <div className="rv12-yt"><p className="rv12-text">{text}</p>{pill}</div>
    <div className="rv12-ymeta"><span className="rv12-src">blog</span><strong>{c.who}</strong>{c.url && <a href={c.url} target="_blank" rel="noopener nofollow">read ↗</a>}{c.when && <span className="rv12-when">{c.when}</span>}</div>
  </article>;
  // A Reddit comment (owner 2026-11-18): the subreddit as the name, "Reddit comment" under it, then our one- to two-sentence
  // summary of what the comment says about the product (no quote marks, no usernames: the words are ours), "see the thread ↗".
  if (c.kind === "reddit") return <article className="rv12-card">
    {/* The community is the name (owner 2026-11-18): we keep no usernames, and showing them would be a privacy risk. Plain text,
        like a player card. */}
    <div className="rv12-top"><span className={`rv12-av a${i % 4}`} aria-hidden="true">r</span>
      <span className="rv12-who"><span className="rv12-line"><strong>{c.source ?? "Reddit"}</strong>{pill}{c.when && <span className="rv12-when">{c.when}</span>}</span>
        <span className="rv12-sub">Reddit comment</span></span></div>
    <p className="rv12-text">{c.text}</p>
    {c.url && <a className="rv12-link" href={c.url} target="_blank" rel="noopener nofollow">see the thread ↗</a>}
  </article>;
  const comment = c.kind === "youtube";
  return <article className="rv12-card">
    <div className="rv12-top"><span className={`rv12-av${comment ? " yt" : ` a${i % 4}`}`} aria-hidden="true">{comment ? "Y" : (c.initial ?? c.who[0] ?? "P").toUpperCase()}</span>
      <span className="rv12-who"><span className="rv12-line"><strong>{comment ? "YouTube viewer" : c.who}</strong>{pill}{c.when && <span className="rv12-when">{c.when}</span>}</span>
        {comment && <span className="rv12-sub">{`comment on a ${channel} video`}</span>}
        {!comment && c.url && <a className="rv12-sub" href={c.url} target="_blank" rel="noopener nofollow">{`${c.source ?? "source"} ↗`}</a>}</span></div>
    {text && <p className="rv12-text">{text}</p>}
    {comment && c.url && <a className="rv12-link" href={c.url} target="_blank" rel="noopener nofollow">see the comment ↗</a>}
  </article>;
}
