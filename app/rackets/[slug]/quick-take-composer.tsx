"use client";
import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_NICKNAMES, VERDICTS, loadProfile, nickname, sendVote, type Verdict } from "../../quick-vote";
import { MAX_TAGS } from "../../../lib/tags";

// "From the community" composer on quick-take pages (owner 2026-11-15): comment-style, nickname shown right away, a verdict
// pill, optional words and tags, Post. The verdict is a quick vote (/api/racket-votes, 5 / 3 / 1); words of 20+ characters
// also post a normal moderated review (POST /api/reviews), and its tags are added with the edit token (PATCH), like the
// one-tap card's follow-up in app/quick-vote.tsx. The new post shows at the top of the list straight away.

const MIN_WORDS = 20;
type Posted = { nick: string; verdict: Verdict; text: string; tags: string[] };
const COLOR: Record<Verdict, string> = { positive: "var(--pos)", mixed: "var(--mix)", negative: "var(--neg)" };

export default function QuickTakeComposer({ racketId, name, tags, nicknames, hasReviews }: { racketId: string; name: string; tags: string[]; nicknames: string[]; hasReviews: boolean }) {
  const [nick, setNick] = useState(""), [verdict, setVerdict] = useState<Verdict | null>(null), [text, setText] = useState(""), [picked, setPicked] = useState<string[]>([]);
  // Step by step (owner 2026-11-15): compact at rest; a verdict tap or focusing the box opens the words, tags and Post.
  const [open, setOpen] = useState(false), [allTags, setAllTags] = useState(false), regionId = useId();
  const TOP_TAGS = 6, shownTags = allTags ? tags : tags.slice(0, TOP_TAGS);
  // "+ more tags" goes away once the rest show, so focus moves to the first new tag instead of getting lost.
  const tagRow = useRef<HTMLDivElement>(null), focusNewTag = useRef(false);
  useEffect(() => { if (allTags && focusNewTag.current) { focusNewTag.current = false; tagRow.current?.querySelectorAll("button")[TOP_TAGS]?.focus(); } }, [allTags]);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [error, setError] = useState(""), [posts, setPosts] = useState<Posted[]>([]);
  useEffect(() => { setNick(nickname(nicknames)); }, [nicknames]);
  function renick() {
    try { localStorage.removeItem("rv-nick"); } catch { /* private mode: a name for this visit only */ }
    const fresh = nickname(nicknames.length ? nicknames : DEFAULT_NICKNAMES);
    setNick(fresh || nick);
  }
  const toggle = (t: string) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : p.length >= MAX_TAGS ? p : [...p, t]);

  async function post() {
    if (!verdict || busy) return;
    const words = text.trim(), v = VERDICTS.find(x => x.key === verdict)!;
    if (words && words.length < MIN_WORDS) { setError(`A little more, please: ${MIN_WORDS} characters at least, or clear the box to post just your verdict.`); return; }
    setBusy(true); setError("");
    try {
      const stats = await sendVote(racketId, v.rating, loadProfile());
      let note = `Counted! ${stats.total > 1 ? `You and ${(stats.total - 1).toLocaleString("en-US")} other ${stats.total - 1 === 1 ? "player" : "players"} have weighed in.` : "You're the first to weigh in."}`;
      if (words) {
        const token = ((await (await fetch("/api/reviews", { cache: "no-store" })).json()) as { token?: string }).token || "";
        const p = loadProfile();
        const known = Object.fromEntries(Object.entries({ playerLevel: p.level, playingSide: p.side, playingStyle: p.style }).filter(([, x]) => x));
        const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ racketMode: "existing", racketId, rating: v.rating, reviewText: words, tags: [], website: "", formToken: token, alias: nick || undefined, ...known }) });
        const b = await r.json() as { id?: string; edit?: string; error?: string };
        if (!r.ok) throw new Error(b.error || "Your verdict counted, but the words didn't post. Try again?");
        if (picked.length && b.id && b.edit) fetch("/api/reviews", { method: "PATCH", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, edit: b.edit, tags: picked }) }).catch(() => {});
        note += " Your words go live after a quick check.";
      } else if (picked.length) note += " Tags go with a few words, so they weren't saved this time.";
      setPosts(ps => [{ nick: nick || "You", verdict, text: words, tags: words ? picked : [] }, ...ps]);
      setVerdict(null); setText(""); setPicked([]); setAllTags(false); setMsg(note);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }

  return <>
    <div className="cbox">
      <div className="cbox-who">Posting as <b>{nick || "…"}</b><button type="button" onClick={renick}>↻ new name</button></div>
      <div className="vbtns" role="group" aria-label={`Your verdict on the ${name}`}>
        {VERDICTS.map(v => <button key={v.key} type="button" aria-pressed={verdict === v.key} style={{ "--c": COLOR[v.key] } as React.CSSProperties}
          aria-controls={regionId} onClick={() => { setVerdict(v.key); setOpen(true); setError(""); setMsg("Your verdict counts as soon as you post. Words and tags are optional."); }}>{v.word}</button>)}
      </div>
      {/* One textarea that grows, so focus never jumps when the composer opens. */}
      <textarea className={open ? "open" : undefined} rows={open ? 3 : 1} maxLength={2000} value={text} aria-label="Your review" aria-controls={regionId}
        onFocus={() => setOpen(true)} onChange={e => { setText(e.target.value); setError(""); }}
        placeholder={open ? `Played the ${name}? What stood out? How it plays, how it feels, who it suits…` : "Played it? Drop your take…"}/>
      <div id={regionId} className={`cmore${open ? " open" : ""}`} role="region" aria-label="Tags and post" aria-expanded={open} inert={!open}>
        <div className="cmore-in">
          <div ref={tagRow} className="ctags" aria-label={`Tags, up to ${MAX_TAGS}`}>{shownTags.map(t => { const on = picked.includes(t);
            return <button key={t} type="button" aria-pressed={on} disabled={!on && picked.length >= MAX_TAGS} onClick={() => toggle(t)}>{t}</button>; })}
            {!allTags && tags.length > TOP_TAGS && <button type="button" className="more-tags" aria-expanded={false} onClick={() => { focusNewTag.current = true; setAllTags(true); }}>+ more tags</button>}</div>
          <div className="cbox-foot">
            <span role="status" className={error ? "err" : undefined}>{error || msg || "Pick a verdict to post. No account needed."}</span>
            <button type="button" className="cpost" disabled={!verdict || busy} onClick={post}>{busy ? "Posting…" : "Post"}</button>
          </div>
        </div>
      </div>
    </div>
    {posts.length > 0 && <ul className="cms">{posts.map((p, i) => <li key={i} className="cm new"><div className="bub">
      <div className="cm-head"><b>{p.nick}</b><span>Just now</span><span className={`vchip ${p.verdict}`}>{VERDICTS.find(v => v.key === p.verdict)!.word}</span></div>
      {p.text && <p>{p.text}</p>}
      {p.tags.length > 0 && <div className="cm-tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div>}
    </div></li>)}</ul>}
    {!hasReviews && !posts.length && <p className="cs-empty">No takes yet. The first one gets the spotlight. 🎾</p>}
  </>;
}
