"use client";
// PadelRecs' Discussion (v7b, replaces "Comments" on the racket page): a slim "Ask a question or share a tip…" pill that opens
// the composer, initials avatars (a stable colour per name), ▲ n · Reply, threaded replies under a thin line, and a ⋯ menu
// (Report; the owner's Edit · Rename · Hide · Delete). The same comments, votes and owner actions as comments.tsx.
import { W } from "../../../lib/thread/words";
import { commenterName, NAME_MAX } from "../../../lib/thread/display-name";
import { mentionOf } from "../../../lib/thread/mention";
import { ago } from "../ui";
import { Box, useComments, type C } from "./comments";
import { MemberMark } from "./member-mark";
import { MoreMenu, reportPost } from "./racket-v7b";
import { avatarOf } from "../../../lib/thread/avatar";

/** The words a page can change (the story page, owner design 2026-11-21: "Comments", "Add a comment…"); the racket page
 *  keeps the defaults. `author`: the story author's member name, whose comments get a small lime Author tag. */
export type DiscussionWords = { heading?: string; sub?: string; ask?: string; askIcon?: string; placeholder?: string; empty?: string; author?: string;
  /** v16 racket page: "Ask the community (12)" with a speech-bubble icon. */ count?: boolean };
export function Discussion({ page, model, words = {} }: { page: string; model: string; words?: DiscussionWords }) {
  const t = useComments(page);
  const { list, open, setOpen, reply, setReply, sort, setSort, nick, setNick, note, setNote, err, admin, editing, setEditing, draft, draftName, editErr, setEditErr, own, me, post, vote, tops, replies, open_ } = t;
  const Av = ({ c, sm }: { c: C; sm?: boolean }) => { const a = avatarOf(commenterName(c.alias)); return <span className={`th7-av${sm ? " sm" : ""}`} style={{ background: a.bg }} aria-hidden="true">{a.init}</span>; };
  const textOf = (c: C) => editing?.id === c.id ? <div className="th-compose" style={{ margin: "4px 0" }}>
    <span className="th-as"><input defaultValue={draftName.current} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Poster's name" autoFocus={editing.nameOnly} onChange={e => { draftName.current = e.target.value; setEditErr(""); }}/></span>
    {!editing.nameOnly && <textarea className="th-ta" rows={3} defaultValue={editing.text} maxLength={2000} aria-label="Edit comment" onChange={e => { draft.current = e.target.value; }}/>}
    {editErr && <span className="th-err" role="alert">{editErr}</span>}
    <div className="th-compose-foot"><button type="button" className="cancel" onClick={() => setEditing(null)}>Cancel</button>
      <button type="button" className="th-btn dark" onClick={() => own(c, "edit", editing.nameOnly ? undefined : draft.current, draftName.current)}>{editing.nameOnly ? "Save name" : "Save"}</button></div></div>
    : <p className="th7-cm-text">{c.body}</p>;
  const menu = (c: C) => <MoreMenu items={[{ label: "Report", run: () => reportPost(`cm-${c.id}`) }]}
    owner={admin && !c.id.startsWith("temp-") ? [{ label: "Edit", run: () => open_(c, false) }, ...(c.alias !== "[removed]" ? [{ label: "Rename", run: () => open_(c, true) }] : []),
      { label: "Hide", run: () => own(c, "hide") }, { label: "Delete", danger: true, run: () => own(c, "delete") }] : []}/>;
  const up = (c: C) => <button type="button" className="th7-up" aria-label="Upvote" aria-pressed={c.mine === 1} onClick={() => vote(c, 1)}><span aria-hidden="true">▲</span>{c.score}</button>;
  // Member names are reserved (accounts), so a member comment under the author's name is the author's.
  const isAuthor = (c: C) => !!words.author && !!c.member && commenterName(c.alias) === words.author;
  const head = (c: C) => <div className="th7-cm-head"><strong>{commenterName(c.alias)}</strong>{c.member && <MemberMark/>}{isAuthor(c) && <span className="th7-op">Author</span>}<span>{ago(c.at)}</span></div>;
  const box = (placeholder: string, cta: string, onPost: (x: string) => Promise<boolean>, onCancel: () => void, mention?: string) =>
    <Box me={me} nick={nick} setNick={setNick} nicknames={[]} placeholder={placeholder} cta={cta} onPost={onPost} onCancel={onCancel} mention={mention} back="#discussion"/>;
  return <section id="discussion" className="th-card th7-card th7-disc">
    {/* Older links (home feed, sign-in) point at #comments. */}<span id="comments" className="th7-anchor" aria-hidden="true"/>
    <div className="th7-disc-head"><h2 className={`th-h2${words.count ? " th7-hic" : ""}`}>{words.count && <svg width="24" height="22" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/></svg>}{`${words.heading ?? "Discussion"}${words.count && list?.length ? ` (${list.length.toLocaleString("en-US")})` : ""}`}</h2><span className="th-sub">{words.sub ?? `Questions about the ${model}? Ask ${W.people} who've used it.`}</span></div>
    {open ? box(words.placeholder ?? `What do you want to know about the ${model}?`, "Post", x => post(x, null), () => setOpen(false))
      : <button type="button" className="th7-ask" onClick={() => { setOpen(true); setNote(""); }}><span aria-hidden="true">{words.askIcon ?? "?"}</span>{words.ask ?? "Ask a question or share a tip…"}</button>}
    {note && <p className="th-ok" role="status">{note}</p>}
    {err && <span className="th-err" role="alert">{err}</span>}
    {tops.length > 1 && <div className="th-seg" role="group" aria-label="Sort comments"><span className="lbl">Sort</span>
      {([["new", "Newest"], ["top", "Top"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>}
    <div className="th7-cm-list">
      {tops.map(c => <div key={c.id} id={`cm-${c.id}`} className="th7-cm"><Av c={c}/>
        <div className="th7-cm-body">
          {head(c)}{textOf(c)}
          <div className="th7-cm-act">{up(c)}<button type="button" className="reply" onClick={() => setReply(reply === c.id ? null : c.id)}>{reply === c.id ? "Cancel" : "Reply"}</button>{menu(c)}</div>
          {reply === c.id && box(`Reply to ${commenterName(c.alias)}`, "Reply", x => post(x, c.id), () => setReply(null))}
          {replies(c.id).length > 0 && <div className="th7-replies">{replies(c.id).map(r => <div key={r.id} id={`cm-${r.id}`} className="th7-cm sm"><Av c={r} sm/>
            <div className="th7-cm-body">
              {head(r)}{textOf(r)}
              {/* A reply to a reply posts under the top-level comment, with "@Name" (as in comments.tsx). */}
              <div className="th7-cm-act">{up(r)}<button type="button" className="reply" onClick={() => setReply(reply === r.id ? null : r.id)}>{reply === r.id ? "Cancel" : "Reply"}</button>{menu(r)}</div>
              {reply === r.id && box(`Reply to ${commenterName(r.alias)}`, "Reply", x => post(x, c.id), () => setReply(null), mentionOf(commenterName(r.alias)))}
            </div></div>)}</div>}
        </div>
      </div>)}
      {list && tops.length === 0 && !open && <p className="th-note" style={{ padding: "6px 0" }}>{words.empty ?? "No questions yet. Ask the first one."}</p>}
    </div>
  </section>;
}
