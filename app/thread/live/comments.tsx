"use client";
// Comments (README "Comments", Metalbone CTRL Thread v7): a collapsed one-line box that opens on tap, "Posting as" a generated
// nickname you can edit or renew, low-key ▲ n ▼, Reply (on replies too: it posts under the same top-level comment, with
// "@Name"), timestamps, replies indented under a 2px line, newest first (or Top).
// /api/comments (drizzle/0025): clean comments show at once, links and very short ones wait for a person, spam is dropped.
import { accountSite } from "../../../lib/thread/sites";
import { niche } from "../../../lib/niche";
import { useEffect, useRef, useState } from "react";
import { ownerCheck } from "../../admin-edit";
import { profileLine, commenterName, nameProblem, typedName, NAME_MAX } from "../../../lib/thread/display-name";
import { savedName, saveName, grow } from "./name";
import { ago } from "../ui";
import { useAccount, signInHref, type Me } from "./use-account";
import { MemberMark } from "./member-mark";
import { mentionOf, withoutMention } from "../../../lib/thread/mention";
/** Optional accounts run on PadelRecs only for now (lib/thread/sites.ts accountSite). */
const ACCOUNTS = accountSite(niche.id);

export type C = { id: string; parentId: string | null; alias: string; body: string; at: string; score: number; mine: number; member?: boolean; level?: string | null; side?: string | null;
  /** PadelRecs community feed (drizzle/0035): a saved Question or Tip, or an admin's "none" (no flair, 0038); absent for
   *  plain posts and older rows. */ type?: "question" | "tip" | "none" };
const HELD = "Thanks! Your comment will show once a person has checked it.";


export function Box({ me, nick, setNick, nicknames, placeholder, cta, onPost, onCancel, autoFocus = true, mention, back = "#comments" }: { me: Me; nick: string; setNick: (s: string) => void; nicknames: string[]; placeholder: string; cta: string;
  onPost: (text: string) => Promise<boolean>; onCancel: () => void; autoFocus?: boolean; /** Prefilled "@Name " (a reply to a reply). */ mention?: string; /** Where sign-in brings you back. */ back?: string }) {
  const [text, setText] = useState(mention ?? ""), [busy, setBusy] = useState(false), [nameErr, setNameErr] = useState("");
  // A name is required (owner 2026-11-19): checked here, the message right under this box (replies too), no modal.
  const send = async () => { const p = nameProblem(nick); if (p) { setNameErr(p); return; } setNameErr(""); setBusy(true); if (await onPost(text.trim())) setText(""); setBusy(false); };
  // Why the button is off, said under it (owner 2026-11-19), instead of a grey button with no reason.
  const short = withoutMention(text, mention).trim().length < 2, noName = !!nameProblem(nick);
  const why = short && noName ? "Write a comment and add a name to post" : short ? "Write something to post" : noName ? "Add a name to post" : "";
  return <div className="th-compose white">
    <textarea className="th-ta th-ta-grow" rows={2} autoFocus={autoFocus} value={text}
      onFocus={e => { if (mention) { const n = e.currentTarget.value.length; e.currentTarget.setSelectionRange(n, n); } }} maxLength={2000} placeholder={placeholder} aria-label={placeholder}
      onChange={e => { setText(e.target.value); grow(e.currentTarget); }}/>
    <div className="th-compose-foot">
      {me ? <span className="th-as th-as-me">Posting as <b>{me.name}</b><MemberMark/></span>
        : <span className="th-as"><input value={nick} onChange={e => { setNick(e.target.value); setNameErr(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Name or nickname" aria-invalid={!!nameErr} required/></span>}
      <span className="th-grow"/>
      {!me && ACCOUNTS && <a className="th-signin" href={signInHref(back)}>Sign in to keep your name</a>}
      <button type="button" className="cancel" onClick={onCancel}>Cancel</button>
      <button type="button" className="th-post" disabled={busy || !!why} onClick={send}>{busy ? "Posting…" : cta}</button>
    </div>
    {nameErr ? <span className="th-err" role="alert">{nameErr}</span> : why && <span className="th-why">{why}</span>}
  </div>;
}

/** The comment thread's state and actions (load, post, vote, the owner's edit / delete / hide), shared by Comments here and
 *  PadelRecs' Discussion (discussion.tsx). */
export function useComments(page: string) {
  const [list, setList] = useState<C[] | null>(null), [open, setOpen] = useState(false), [reply, setReply] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new"), [nick, setNick] = useState(""), [note, setNote] = useState(""), [err, setErr] = useState("");
  const token = useRef("");
  // The owner's tools (Edit, Delete, Hide): asked for only when a sign-in cookie is present, and drawn here in the browser, so
  // the cached page is the same for everyone. Every action is checked on the server (app/api/funtimes/comments).
  const [admin, setAdmin] = useState(false), [editing, setEditing] = useState<{ id: string; text: string; nameOnly?: boolean } | null>(null), draft = useRef(""), draftName = useRef(""), [editErr, setEditErr] = useState("");
  useEffect(() => { let live = true; ownerCheck().then(a => { if (live) setAdmin(a); }); return () => { live = false; }; }, []);
  // The owner's rename (abuse cases) runs the same name rules as posting; text and name save together, or the name alone.
  async function own(c: C, action: "edit" | "delete" | "hide", text?: string, name?: string) {
    if (action === "edit" && name !== undefined) { const p = nameProblem(name); if (p) { setEditErr(p); return; } }
    if (action === "delete" && !window.confirm(list?.some(x => x.parentId === c.id) ? "Delete this comment? It has replies, so it will show as [removed]." : "Delete this comment and its votes?")) return;
    if (action === "hide" && !window.confirm("Hide this comment? It moves back to pending in the admin.")) return;
    const form = new URLSearchParams({ id: c.id, ...(action === "edit" ? { action: "edit", ...(text !== undefined ? { body: text } : {}), ...(name !== undefined ? { alias: name } : {}) } : action === "delete" ? { action: "delete", confirm: "yes" } : { action: "status", status: "pending" }) });
    const r = await fetch("/api/funtimes/comments", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form }).catch(() => null);
    const b = r ? await r.json().catch(() => ({})) as { result?: string } : {};
    if (!r?.ok) { setErr("That didn't save. Check you're still signed in, then try again."); return; }
    setErr(""); setEditErr(""); setEditing(null);
    setList(l => (l ?? []).flatMap(x => x.id !== c.id ? (action === "hide" && x.parentId === c.id ? [] : [x])
      : b.result === "edited" ? [{ ...x, ...(text !== undefined ? { body: text.trim() } : {}), ...(name !== undefined ? { alias: name.trim() } : {}) }] : b.result === "removed" ? [{ ...x, body: "[removed]", alias: "[removed]" }] : []));
  }
  // No generated names (owner 2026-11-19): the name box starts with the name this browser typed last time, else empty.
  useEffect(() => { setNick(savedName()); }, []);
  // Optional accounts: a signed-in member posts under their reserved name.
  const me = useAccount();
  useEffect(() => { if (me) setNick(me.name); }, [me]);
  useEffect(() => {
    fetch(`/api/comments?page=${encodeURIComponent(page)}&token=1`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { comments?: C[]; token?: string } | null) => { setList(b?.comments ?? []); token.current = b?.token ?? ""; }).catch(() => setList([]));
  }, [page]);
  // Shown at once with the author's own ▲ (score 1); the server's copy replaces it, or it goes if the comment is held.
  async function post(body: string, parentId: string | null, postType?: "question" | "tip") {
    setErr(""); setNote("");
    const problem = nameProblem(nick); if (problem) { setErr(problem); return false; }
    saveName(nick);
    const temp: C = { id: `temp-${Date.now()}`, parentId, alias: nick.trim(), body, at: new Date().toISOString(), score: 1, mine: 1, member: !!me, level: me?.level ?? null, side: me?.side ?? null, ...(postType && !parentId ? { type: postType } : {}) };
    setList(l => [temp, ...(l ?? [])]); setOpen(false); setReply(null);
    try {
      const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, parentId, alias: temp.alias, body, formToken: token.current, website: "", ...(postType && !parentId ? { postType } : {}) }) });
      const b = await r.json() as { status?: string; comment?: C; error?: string };
      if (!r.ok) throw new Error(b.error || "Could not post that. Try again?");
      setList(l => b.comment ? (l ?? []).map(x => x.id === temp.id ? b.comment! : x) : (l ?? []).filter(x => x.id !== temp.id));
      if (!b.comment) setNote(HELD);
      return true;
    } catch (e) { setList(l => (l ?? []).filter(x => x.id !== temp.id)); setErr(e instanceof Error ? e.message : "Could not post that. Try again?"); return false; }
  }
  async function vote(c: C, v: 1 | -1) {
    if (c.id.startsWith("temp-")) return; // still posting
    const value = c.mine === v ? 0 : v, delta = value - c.mine;
    setList(l => l!.map(x => x.id === c.id ? { ...x, mine: value, score: x.score + delta } : x));
    const r = await fetch("/api/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: c.id, value }) }).catch(() => null);
    if (!r?.ok) setList(l => l!.map(x => x.id === c.id ? { ...x, mine: c.mine, score: c.score } : x));
  }
  const tops = (list ?? []).filter(c => !c.parentId).sort((a, b) => sort === "top" ? b.score - a.score || b.at.localeCompare(a.at) : b.at.localeCompare(a.at));
  const replies = (id: string) => (list ?? []).filter(c => c.parentId === id).sort((a, b) => a.at.localeCompare(b.at));
  const open_ = (c: C, nameOnly: boolean) => { draft.current = c.body; draftName.current = typedName(c.alias) ?? ""; setEditErr("");
    setEditing(editing?.id === c.id && !!editing.nameOnly === nameOnly ? null : { id: c.id, text: c.body, nameOnly }); };
  return { list, setList, open, setOpen, reply, setReply, sort, setSort, nick, setNick, note, setNote, err, setErr, admin, editing, setEditing, draft, draftName, editErr, setEditErr, own, me, post, vote, tops, replies, open_ };
}

export function Comments({ page, title = "Comments", prompt = "Join the conversation", placeholder = "Join the conversation", nicknames = [] }: { page: string; title?: string; prompt?: string; placeholder?: string; nicknames?: string[] }) {
  const { list, open, setOpen, reply, setReply, sort, setSort, nick, setNick, note, setNote, err, admin, editing, setEditing, draft, draftName, editErr, setEditErr, own, me, post, vote, tops, replies, open_ } = useComments(page);
  const Votes = ({ c }: { c: C }) => <span>
    <button type="button" className="arrow up" aria-label="Upvote" aria-pressed={c.mine === 1} onClick={() => vote(c, 1)}>▲</button>
    <span className="n">{c.score}</span>
    <button type="button" className="arrow down" aria-label="Downvote" aria-pressed={c.mine === -1} onClick={() => vote(c, -1)}>▼</button></span>;
  const Own = ({ c }: { c: C }) => admin && !c.id.startsWith("temp-") ? <>
    <button type="button" className="reply" onClick={() => open_(c, false)}>{editing?.id === c.id && !editing.nameOnly ? "Cancel edit" : "Edit"}</button>
    <button type="button" className="reply" onClick={() => own(c, "delete")}>Delete</button>
    <button type="button" className="reply" onClick={() => own(c, "hide")}>Hide</button></> : null;
  /** "Rename" next to the poster's name, for the owner only. */
  const Rename = ({ c }: { c: C }) => admin && !c.id.startsWith("temp-") && c.alias !== "[removed]" ? <button type="button" className="th-mini-btn" style={{ fontSize: 12 }} onClick={() => open_(c, true)}>Rename</button> : null;
  // Called as a function, not a component, so the edit box keeps its input (and focus) across re-renders.
  const textOf = (c: C) => editing?.id === c.id ? <div className="th-compose" style={{ margin: "4px 0" }}>
    <span className="th-as"><input defaultValue={draftName.current} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Poster's name" autoFocus={editing.nameOnly} onChange={e => { draftName.current = e.target.value; setEditErr(""); }}/></span>
    {!editing.nameOnly && <textarea className="th-ta" rows={3} defaultValue={editing.text} maxLength={2000} aria-label="Edit comment" onChange={e => { draft.current = e.target.value; }}/>}
    {editErr && <span className="th-err" role="alert">{editErr}</span>}
    <div className="th-compose-foot"><button type="button" className="cancel" onClick={() => setEditing(null)}>Cancel</button>
      <button type="button" className="th-btn dark" onClick={() => own(c, "edit", editing.nameOnly ? undefined : draft.current, draftName.current)}>{editing.nameOnly ? "Save name" : "Save"}</button></div></div>
    : <p>{c.body}</p>;
  return <section id="comments" className="th-card th-sec" style={{ paddingBottom: 8, scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h2">{title}</h2>{tops.length > 1 && <div className="th-seg" role="group" aria-label="Sort comments"><span className="lbl">Sort</span>
      {([["new", "Newest"], ["top", "Top"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>}</div>
    {open ? <Box me={me} nick={nick} setNick={setNick} nicknames={nicknames} placeholder={placeholder} cta="Comment" onPost={t => post(t, null)} onCancel={() => setOpen(false)}/>
      : <button type="button" className="th-open" onClick={() => { setOpen(true); setNote(""); }}>{prompt}</button>}
    {note && <p className="th-ok" role="status">{note}</p>}
    {err && <span className="th-err" role="alert">{err}</span>}
    <div style={{ display: "flex", flexDirection: "column" }}>
      {tops.map(c => <div key={c.id} className="th-cm">
        <div className="th-cm-head"><strong>{commenterName(c.alias)}</strong>{c.member && <MemberMark/>}{c.member && profileLine(c.level, c.side) && <span>{`· ${profileLine(c.level, c.side)}`}</span>}<span>{`· ${ago(c.at)}`}</span><Rename c={c}/></div>
        {textOf(c)}
        <div className="th-cm-act"><Votes c={c}/><button type="button" className="reply" onClick={() => setReply(reply === c.id ? null : c.id)}>{reply === c.id ? "Cancel" : "Reply"}</button><Own c={c}/></div>
        {reply === c.id && <div style={{ marginLeft: 14 }}><Box me={me} nick={nick} setNick={setNick} nicknames={nicknames} placeholder={`Reply to ${commenterName(c.alias)}`} cta="Reply" onPost={t => post(t, c.id)} onCancel={() => setReply(null)}/></div>}
        {replies(c.id).length > 0 && <div className="th-replies">{replies(c.id).map(r => <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="th-cm-head"><strong style={{ fontSize: 14 }}>{commenterName(r.alias)}</strong>{r.member && <MemberMark/>}{r.member && profileLine(r.level, r.side) && <span>{`· ${profileLine(r.level, r.side)}`}</span>}<span>{`· ${ago(r.at)}`}</span><Rename c={r}/></div>
          {textOf(r)}
          {/* Reply to a reply (owner 2026-11-20): one indent level, as before; it posts under the top-level comment, with "@Name". */}
          <div className="th-cm-act"><Votes c={r}/><button type="button" className="reply" onClick={() => setReply(reply === r.id ? null : r.id)}>{reply === r.id ? "Cancel" : "Reply"}</button><Own c={r}/></div>
          {reply === r.id && <Box me={me} nick={nick} setNick={setNick} nicknames={nicknames} placeholder={`Reply to ${commenterName(r.alias)}`} cta="Reply"
            mention={mentionOf(commenterName(r.alias))} onPost={t => post(t, c.id)} onCancel={() => setReply(null)}/>}
        </div>)}</div>}
      </div>)}
      {list && tops.length === 0 && !open && <p className="th-note" style={{ padding: "6px 0" }}>No comments yet. Start the conversation.</p>}
    </div>
  </section>;
}
