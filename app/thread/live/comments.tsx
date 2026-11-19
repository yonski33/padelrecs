"use client";
// Comments (README "Comments", Metalbone CTRL Thread v7): a collapsed one-line box that opens on tap, "Posting as" a generated
// nickname you can edit or renew, low-key ▲ n ▼, Reply, timestamps, replies indented under a 2px line, newest first (or Top).
// /api/comments (drizzle/0025): clean comments show at once, links and very short ones wait for a person, spam is dropped.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ownerCheck } from "../../admin-edit";
import { byline, postProblem, POST_HINT, typedName, NAME_MAX } from "../../../lib/thread/display-name";
import { LevelSide, savedLevelSide, saveLevelSide, NO_LEVEL_SIDE, type LevelSideValue } from "./level-side";
import { savedName, saveName, grow } from "./name";
import { ago } from "../ui";

type C = { id: string; parentId: string | null; alias: string; level?: string | null; side?: string | null; body: string; at: string; score: number; mine: number };
/** "Gali A · Intermediate, left side" (lib/thread/display-name.ts byline), the level and side a step quieter. */
function Who({ c, small, rename }: { c: C; small?: boolean; rename: ReactNode }) {
  const b = byline(c.alias, c.level, c.side);
  return <div className="th-cm-head"><strong style={small ? { fontSize: 14 } : undefined}>{b.who}</strong>{b.meta && <span>{`· ${b.meta}`}</span>}<span>{`· ${ago(c.at)}`}</span>{rename}</div>;
}
const HELD = "Thanks! Your comment will show once a person has checked it.";

function Box({ nick, setNick, ls, setLs, nicknames, placeholder, cta, onPost, onCancel, autoFocus = true }: { nick: string; setNick: (s: string) => void; ls: LevelSideValue; setLs: (v: LevelSideValue) => void; nicknames: string[]; placeholder: string; cta: string;
  onPost: (text: string) => Promise<boolean>; onCancel: () => void; autoFocus?: boolean }) {
  const [text, setText] = useState(""), [busy, setBusy] = useState(false), [nameErr, setNameErr] = useState("");
  // A name, or a level or side (owner 2026-11-19): checked here, the message right under this box (replies too), no modal.
  const send = async () => { const p = postProblem(nick, ls.level, ls.side); if (p) { setNameErr(p); return; } setNameErr(""); setBusy(true); if (await onPost(text.trim())) setText(""); setBusy(false); };
  // Why the button is off, said under it (owner 2026-11-19), instead of a grey button with no reason.
  const short = text.trim().length < 2, noName = !!postProblem(nick, ls.level, ls.side);
  const why = short && noName ? "Write a comment, then add a name or your level to post" : short ? "Write something to post" : noName ? POST_HINT : "";
  return <div className="th-compose white">
    <textarea className="th-ta th-ta-grow" rows={2} autoFocus={autoFocus} value={text} maxLength={2000} placeholder={placeholder} aria-label={placeholder}
      onChange={e => { setText(e.target.value); grow(e.currentTarget); }}/>
    <div className="th-compose-foot">
      <span className="th-as"><input value={nick} onChange={e => { setNick(e.target.value); setNameErr(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Name or nickname" aria-invalid={!!nameErr}/>
        <LevelSide value={ls} set={v => { setLs(v); setNameErr(""); }} small label={false}/></span>
      <span className="th-grow"/>
      <button type="button" className="cancel" onClick={onCancel}>Cancel</button>
      <button type="button" className="th-post" disabled={busy || !!why} onClick={send}>{busy ? "Posting…" : cta}</button>
    </div>
    {nameErr ? <span className="th-err" role="alert">{nameErr}</span> : why && <span className="th-why">{why}</span>}
  </div>;
}

export function Comments({ page, title = "Comments", prompt = "Join the conversation", placeholder = "Join the conversation", nicknames = [] }: { page: string; title?: string; prompt?: string; placeholder?: string; nicknames?: string[] }) {
  const [list, setList] = useState<C[] | null>(null), [open, setOpen] = useState(false), [reply, setReply] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new"), [nick, setNick] = useState(""), [ls, setLs] = useState<LevelSideValue>(NO_LEVEL_SIDE), [note, setNote] = useState(""), [err, setErr] = useState("");
  const token = useRef("");
  // The owner's tools (Edit, Delete, Hide): asked for only when a sign-in cookie is present, and drawn here in the browser, so
  // the cached page is the same for everyone. Every action is checked on the server (app/api/funtimes/comments).
  const [admin, setAdmin] = useState(false), [editing, setEditing] = useState<{ id: string; text: string; nameOnly?: boolean } | null>(null), draft = useRef(""), draftName = useRef(""), [draftLs, setDraftLs] = useState<LevelSideValue>(NO_LEVEL_SIDE), [editErr, setEditErr] = useState("");
  useEffect(() => { let live = true; ownerCheck().then(a => { if (live) setAdmin(a); }); return () => { live = false; }; }, []);
  // The owner's rename (abuse cases) runs the same name rules as posting; text and name save together, or the name alone.
  async function own(c: C, action: "edit" | "delete" | "hide", text?: string, name?: string, who?: LevelSideValue) {
    // The same rule as posting: a name, or a level or side. An untouched old name counts only when it's a typed one.
    if (action === "edit" && name !== undefined) { const p = postProblem(name.trim() ? name : "", who?.level ?? c.level, who?.side ?? c.side); if (p) { setEditErr(p); return; } }
    if (action === "delete" && !window.confirm(list?.some(x => x.parentId === c.id) ? "Delete this comment? It has replies, so it will show as [removed]." : "Delete this comment and its votes?")) return;
    if (action === "hide" && !window.confirm("Hide this comment? It moves back to pending in the admin.")) return;
    const form = new URLSearchParams({ id: c.id, ...(action === "edit" ? { action: "edit", ...(text !== undefined ? { body: text } : {}), ...(name !== undefined ? { alias: name } : {}), ...(who ? { level: who.level, side: who.side } : {}) } : action === "delete" ? { action: "delete", confirm: "yes" } : { action: "status", status: "pending" }) });
    const r = await fetch("/api/funtimes/comments", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form }).catch(() => null);
    const b = r ? await r.json().catch(() => ({})) as { result?: string } : {};
    if (!r?.ok) { setErr("That didn't save. Check you're still signed in, then try again."); return; }
    setErr(""); setEditErr(""); setEditing(null);
    setList(l => (l ?? []).flatMap(x => x.id !== c.id ? (action === "hide" && x.parentId === c.id ? [] : [x])
      : b.result === "edited" ? [{ ...x, ...(text !== undefined ? { body: text.trim() } : {}), ...(name !== undefined && name.trim() ? { alias: name.trim() } : {}), ...(who ? { level: who.level || null, side: who.side || null } : {}) }] : b.result === "removed" ? [{ ...x, body: "[removed]", alias: "[removed]" }] : []));
  }
  // No generated names (owner 2026-11-19): the name box starts with the name this browser typed last time, else empty.
  useEffect(() => { setNick(savedName()); setLs(savedLevelSide()); }, []);
  useEffect(() => {
    fetch(`/api/comments?page=${encodeURIComponent(page)}&token=1`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { comments?: C[]; token?: string } | null) => { setList(b?.comments ?? []); token.current = b?.token ?? ""; }).catch(() => setList([]));
  }, [page]);
  // Shown at once with the author's own ▲ (score 1); the server's copy replaces it, or it goes if the comment is held.
  async function post(body: string, parentId: string | null) {
    setErr(""); setNote("");
    const problem = postProblem(nick, ls.level, ls.side); if (problem) { setErr(problem); return false; }
    saveName(nick); saveLevelSide(ls);
    const temp: C = { id: `temp-${Date.now()}`, parentId, alias: nick.trim(), level: ls.level || null, side: ls.side || null, body, at: new Date().toISOString(), score: 1, mine: 1 };
    setList(l => [temp, ...(l ?? [])]); setOpen(false); setReply(null);
    try {
      const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, parentId, alias: temp.alias, playerLevel: ls.level || undefined, playingSide: ls.side || undefined, body, formToken: token.current, website: "" }) });
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
  const Votes = ({ c }: { c: C }) => <span>
    <button type="button" className="arrow up" aria-label="Upvote" aria-pressed={c.mine === 1} onClick={() => vote(c, 1)}>▲</button>
    <span className="n">{c.score}</span>
    <button type="button" className="arrow down" aria-label="Downvote" aria-pressed={c.mine === -1} onClick={() => vote(c, -1)}>▼</button></span>;
  const Own = ({ c }: { c: C }) => admin && !c.id.startsWith("temp-") ? <>
    <button type="button" className="reply" onClick={() => open_(c, false)}>{editing?.id === c.id && !editing.nameOnly ? "Cancel edit" : "Edit"}</button>
    <button type="button" className="reply" onClick={() => own(c, "delete")}>Delete</button>
    <button type="button" className="reply" onClick={() => own(c, "hide")}>Hide</button></> : null;
  const open_ = (c: C, nameOnly: boolean) => { draft.current = c.body; draftName.current = typedName(c.alias) ?? ""; setDraftLs({ level: c.level ?? "", side: c.side ?? "" }); setEditErr("");
    setEditing(editing?.id === c.id && !!editing.nameOnly === nameOnly ? null : { id: c.id, text: c.body, nameOnly }); };
  /** "Rename" next to the poster's name, for the owner only. */
  const Rename = ({ c }: { c: C }) => admin && !c.id.startsWith("temp-") && c.alias !== "[removed]" ? <button type="button" className="th-mini-btn" style={{ fontSize: 12 }} onClick={() => open_(c, true)}>Rename</button> : null;
  // Called as a function, not a component, so the edit box keeps its input (and focus) across re-renders.
  const textOf = (c: C) => editing?.id === c.id ? <div className="th-compose" style={{ margin: "4px 0" }}>
    <span className="th-as"><input defaultValue={draftName.current} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Poster's name" autoFocus={editing.nameOnly} onChange={e => { draftName.current = e.target.value; setEditErr(""); }}/>
      <LevelSide value={draftLs} set={v => { setDraftLs(v); setEditErr(""); }} small label={false}/></span>
    {!editing.nameOnly && <textarea className="th-ta" rows={3} defaultValue={editing.text} maxLength={2000} aria-label="Edit comment" onChange={e => { draft.current = e.target.value; }}/>}
    {editErr && <span className="th-err" role="alert">{editErr}</span>}
    <div className="th-compose-foot"><button type="button" className="cancel" onClick={() => setEditing(null)}>Cancel</button>
      <button type="button" className="th-btn dark" onClick={() => own(c, "edit", editing.nameOnly ? undefined : draft.current, draftName.current, draftLs)}>{editing.nameOnly ? "Save name" : "Save"}</button></div></div>
    : <p>{c.body}</p>;
  return <section id="comments" className="th-card th-sec" style={{ paddingBottom: 8, scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h2">{title}</h2>{tops.length > 1 && <div className="th-seg" role="group" aria-label="Sort comments"><span className="lbl">Sort</span>
      {([["new", "Newest"], ["top", "Top"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>}</div>
    {open ? <Box nick={nick} setNick={setNick} ls={ls} setLs={setLs} nicknames={nicknames} placeholder={placeholder} cta="Comment" onPost={t => post(t, null)} onCancel={() => setOpen(false)}/>
      : <button type="button" className="th-open" onClick={() => { setOpen(true); setNote(""); }}>{prompt}</button>}
    {note && <p className="th-ok" role="status">{note}</p>}
    {err && <span className="th-err" role="alert">{err}</span>}
    <div style={{ display: "flex", flexDirection: "column" }}>
      {tops.map(c => <div key={c.id} className="th-cm">
        <Who c={c} rename={<Rename c={c}/>}/>
        {textOf(c)}
        <div className="th-cm-act"><Votes c={c}/><button type="button" className="reply" onClick={() => setReply(reply === c.id ? null : c.id)}>{reply === c.id ? "Cancel" : "Reply"}</button><Own c={c}/></div>
        {reply === c.id && <div style={{ marginLeft: 14 }}><Box nick={nick} setNick={setNick} ls={ls} setLs={setLs} nicknames={nicknames} placeholder={`Reply to ${byline(c.alias, c.level, c.side).who}`} cta="Reply" onPost={t => post(t, c.id)} onCancel={() => setReply(null)}/></div>}
        {replies(c.id).length > 0 && <div className="th-replies">{replies(c.id).map(r => <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Who c={r} small rename={<Rename c={r}/>}/>
          {textOf(r)}
          <div className="th-cm-act"><Votes c={r}/><Own c={r}/></div>
        </div>)}</div>}
      </div>)}
      {list && tops.length === 0 && !open && <p className="th-note" style={{ padding: "6px 0" }}>No comments yet. Start the conversation.</p>}
    </div>
  </section>;
}
