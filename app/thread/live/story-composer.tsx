"use client";
// Write a story (PadelRecs pilot, owner 2026-11-20): members only. A title, plain text (blank lines make paragraphs) and up to
// five racket tags, picked here in the browser from the catalogue. POST /api/stories: the owner's go live at once, others
// wait for a check. The rules are the API's own (lib/thread/stories.ts).
import { useEffect, useRef, useState } from "react";
import { matchingRackets } from "../../../lib/racket-search";
import { storyProblem, STORY_BODY, STORY_TITLE, STORY_RACKETS_MAX } from "../../../lib/thread/stories";
import { th } from "../../../lib/thread/look";
import { useAccountState, signInHref } from "./use-account";
import { MemberMark } from "./member-mark";
import { grow } from "./name";

type Racket = { id: string; name: string };
export function StoryComposer({ rackets }: { rackets: Racket[] }) {
  const me = useAccountState();
  const [title, setTitle] = useState(""), [body, setBody] = useState(""), [tags, setTags] = useState<string[]>([]), [q, setQ] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<{ status: string; slug?: string } | null>(null);
  const token = useRef("");
  useEffect(() => { fetch("/api/stories?token=1", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { token?: string } | null) => { token.current = b?.token ?? ""; }).catch(() => {}); }, []);
  if (me === "checking") return null;
  if (!me) return <section className="th-card th-sec"><h1 className="th-h1">Write a story</h1>
    <p className="th-lead">Stories are written by members. Sign in, pick your name, then come back here.</p>
    <a className="th-btn round lime" href={signInHref()} style={{ alignSelf: "flex-start" }}>Sign in</a></section>;
  if (done) return <section className="th-card th-sec" role="status"><h1 className="th-h1">{done.status === "live" ? "Your story is live." : "Thanks, your story is in."}</h1>
    <p className="th-lead">{done.status === "live" ? "Anyone can read it and comment below it now." : "It shows once a person has checked it, usually within a day."}</p>
    <div className="th-ar-again">{done.slug && <a className="th-btn round lime" href={th(`/stories/${done.slug}`)}>Read it</a>}<a className="th-link-b" href={th("/stories")}>All stories</a></div></section>;

  const problem = storyProblem({ title, body, rackets: tags });
  const qq = q.trim().toLowerCase(), byId = new Map(rackets.map(r => [r.id, r]));
  const matches = qq ? matchingRackets(rackets, qq).filter(r => !tags.includes(r.id)).slice(0, 6) : [];
  async function post() {
    if (problem || busy) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, rackets: tags, formToken: token.current, website: "" }) });
      const b = await r.json() as { status?: string; slug?: string; error?: string };
      if (!r.ok) throw new Error(b.error || "Could not post that. Try again?");
      setDone({ status: b.status ?? "pending", slug: b.slug }); window.scrollTo({ top: 0 });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post that. Try again?"); }
    finally { setBusy(false); }
  }
  return <section className="th-card th-sec th-story-form">
    <h1 className="th-h1">Write a story</h1>
    <p className="th-lead">Share what you learned, what you would change or what surprised you. Plain text; leave a blank line between paragraphs.</p>
    <label className="th-fgroup"><span>Title</span><input className="th-ar-q" value={title} maxLength={STORY_TITLE.max} onChange={e => { setTitle(e.target.value); setError(""); }}
      placeholder="e.g. 10 things I learned in my first year of padel"/></label>
    <label className="th-fgroup"><span>Your story</span><textarea className="th-ta th-ta-grow" rows={10} value={body} maxLength={STORY_BODY.max} onChange={e => { setBody(e.target.value); setError(""); grow(e.currentTarget, 900); }}
      placeholder="Start with what happened, then what you would tell a friend."/>
      <small className="th-sub">{`${body.trim().length.toLocaleString("en-US")} characters · ${STORY_BODY.min} at least`}</small></label>
    <div className="th-fgroup"><span>{`Rackets it mentions (optional, up to ${STORY_RACKETS_MAX})`}</span>
      {tags.length > 0 && <div className="th-qm-cats">{tags.map(id => <button key={id} type="button" className="th-pick sm" aria-pressed="true" onClick={() => setTags(t => t.filter(x => x !== id))}
        aria-label={`Remove ${byId.get(id)?.name ?? id}`}>{`${byId.get(id)?.name ?? id} ×`}</button>)}</div>}
      {tags.length < STORY_RACKETS_MAX && <input className="th-ar-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Search rackets" aria-label="Search rackets"/>}
      {matches.length > 0 && <div className="th-ar-matches">{matches.map(m => <button key={m.id} type="button" onClick={() => { setTags(t => [...t, m.id]); setQ(""); }}>{m.name}</button>)}</div>}
    </div>
    <div className="th-compose-foot">
      <span className="th-as th-as-me">Posting as <b>{me.name}</b><MemberMark/></span><span className="th-grow"/>
      <button type="button" className="th-post" disabled={!!problem || busy} onClick={post}>{busy ? "Posting…" : "Post story"}</button>
    </div>
    {error ? <span className="th-err" role="alert">{error}</span> : problem && (title || body) ? <span className="th-why">{problem}</span> : null}
    <p className="th-ar-small">Every story gets a check before it shows. Shop and affiliate links aren&apos;t allowed.</p>
  </section>;
}
