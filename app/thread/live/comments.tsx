"use client";
// Comments (README "Comments", Metalbone CTRL Thread v7): a collapsed one-line box that opens on tap, "Posting as" a generated
// nickname you can edit or renew, low-key ▲ n ▼, Reply, timestamps, replies indented under a 2px line, newest first (or Top).
// /api/comments (drizzle/0025): clean comments show at once, links and very short ones wait for a person, spam is dropped.
import { useEffect, useRef, useState } from "react";
import { nickname } from "../../quick-vote";
import { ago } from "../ui";

type C = { id: string; parentId: string | null; alias: string; body: string; question: boolean; at: string; score: number; mine: number };
const HELD = "Thanks! Your comment will show once a person has checked it.";

function Box({ nick, setNick, nicknames, placeholder, cta, onPost, onCancel, autoFocus = true }: { nick: string; setNick: (s: string) => void; nicknames: string[]; placeholder: string; cta: string;
  onPost: (text: string) => Promise<boolean>; onCancel: () => void; autoFocus?: boolean }) {
  const [text, setText] = useState(""), [busy, setBusy] = useState(false);
  return <div className="th-compose white">
    <textarea className="th-ta" rows={3} autoFocus={autoFocus} value={text} maxLength={2000} placeholder={placeholder} aria-label={placeholder} onChange={e => setText(e.target.value)}/>
    <div className="th-compose-foot">
      <span className="th-as"><span>as</span><input value={nick} onChange={e => setNick(e.target.value)} maxLength={50} aria-label="Posting as"/>
        <button type="button" onClick={() => { try { localStorage.removeItem("rv-nick"); } catch { /* storage off */ } setNick(nickname(nicknames)); }}>New name</button></span>
      <span className="th-grow"/>
      <button type="button" className="cancel" onClick={onCancel}>Cancel</button>
      <button type="button" className="th-btn round dark" disabled={busy || text.trim().length < 2} onClick={async () => { setBusy(true); if (await onPost(text.trim())) setText(""); setBusy(false); }}>{busy ? "Posting…" : cta}</button>
    </div>
  </div>;
}

export function Comments({ page, title = "Comments", prompt = "Join the conversation", placeholder = "Join the conversation", nicknames = [] }: { page: string; title?: string; prompt?: string; placeholder?: string; nicknames?: string[] }) {
  const [list, setList] = useState<C[] | null>(null), [open, setOpen] = useState(false), [reply, setReply] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new"), [nick, setNick] = useState(""), [note, setNote] = useState(""), [err, setErr] = useState("");
  const token = useRef("");
  useEffect(() => { setNick(nickname(nicknames)); }, [nicknames]);
  useEffect(() => {
    fetch(`/api/comments?page=${encodeURIComponent(page)}&token=1`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { comments?: C[]; token?: string } | null) => { setList(b?.comments ?? []); token.current = b?.token ?? ""; }).catch(() => setList([]));
  }, [page]);
  async function post(body: string, parentId: string | null) {
    setErr(""); setNote("");
    try {
      const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, parentId, alias: nick.trim() || "Player", body, question: !parentId && /\?\s*$/.test(body), formToken: token.current, website: "" }) });
      const b = await r.json() as { status?: string; comment?: C; error?: string };
      if (!r.ok) throw new Error(b.error || "Could not post that. Try again?");
      if (b.comment) setList(l => [b.comment!, ...(l ?? [])]); else setNote(HELD);
      setOpen(false); setReply(null); return true;
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not post that. Try again?"); return false; }
  }
  async function vote(c: C, v: 1 | -1) {
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
  return <section id="comments" className="th-card th-sec" style={{ paddingBottom: 8, scrollMarginTop: 70 }}>
    <div className="th-head-row"><h2 className="th-h2">{title}</h2>{tops.length > 1 && <div className="th-seg" role="group" aria-label="Sort comments"><span className="lbl">Sort</span>
      {([["new", "Newest"], ["top", "Top"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>}</div>
    {open ? <Box nick={nick} setNick={setNick} nicknames={nicknames} placeholder={placeholder} cta="Comment" onPost={t => post(t, null)} onCancel={() => setOpen(false)}/>
      : <button type="button" className="th-open" onClick={() => { setOpen(true); setNote(""); }}>{prompt}</button>}
    {note && <p className="th-ok" role="status">{note}</p>}
    {err && <span className="th-err" role="alert">{err}</span>}
    <div style={{ display: "flex", flexDirection: "column" }}>
      {tops.map(c => <div key={c.id} className="th-cm">
        <div className="th-cm-head"><strong>{c.alias}</strong>{c.question && <span className="th-pill q">Question</span>}<span>{`· ${ago(c.at)}`}</span></div>
        <p>{c.body}</p>
        <div className="th-cm-act"><Votes c={c}/><button type="button" className="reply" onClick={() => setReply(reply === c.id ? null : c.id)}>{reply === c.id ? "Cancel" : "Reply"}</button></div>
        {reply === c.id && <div style={{ marginLeft: 14 }}><Box nick={nick} setNick={setNick} nicknames={nicknames} placeholder={`Reply to ${c.alias}`} cta="Reply" onPost={t => post(t, c.id)} onCancel={() => setReply(null)}/></div>}
        {replies(c.id).length > 0 && <div className="th-replies">{replies(c.id).map(r => <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="th-cm-head"><strong style={{ fontSize: 14 }}>{r.alias}</strong><span>{`· ${ago(r.at)}`}</span></div>
          <p>{r.body}</p>
          <div className="th-cm-act"><Votes c={r}/></div>
        </div>)}</div>}
      </div>)}
      {list && tops.length === 0 && !open && <p className="th-note" style={{ padding: "6px 0" }}>No comments yet. Start the conversation.</p>}
    </div>
  </section>;
}
