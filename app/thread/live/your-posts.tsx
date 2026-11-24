"use client";
// "Your posts" on /account (PadelRecs member zone): the member's reviews and comments, newest first. Each row links to the
// post on its page, with its date, first line and status. Edit (text only) for 24 hours after posting; delete any time.
import { useEffect, useState } from "react";

type Post = { kind: "review" | "comment"; id: string; at: string; text: string; status: "pending" | "live" | "hidden"; editable: boolean; title: string; href: string | null };
const STATUS: Record<Post["status"], [string, string]> = { live: ["Live", "pos"], pending: ["Waiting for a check", "mix"], hidden: ["Hidden", "neg"] };
const MIN = { review: 20, comment: 2 };
const day = (at: string) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const firstLine = (t: string) => { const l = t.split("\n").find(x => x.trim()) ?? ""; return l.length > 120 ? `${l.slice(0, 117).trimEnd()}…` : l; };

export function YourPosts() {
  const [posts, setPosts] = useState<Post[] | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null), [rowErr, setRowErr] = useState<{ id: string; msg: string } | null>(null);
  useEffect(() => {
    fetch("/api/account/posts", { cache: "no-store" }).then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.error); setPosts(b.posts); })
      .catch(e => { setPosts([]); setError(e instanceof Error && e.message ? e.message : "Could not load your posts."); });
  }, []);
  const key = (p: Post) => `${p.kind}:${p.id}`;
  async function save(p: Post) {
    if (!editing) return;
    if (editing.text.trim().length < MIN[p.kind]) { setRowErr({ id: key(p), msg: p.kind === "review" ? "A review needs at least 20 characters." : "Write at least a couple of words." }); return; }
    setBusy(key(p)); setRowErr(null);
    try {
      const r = await fetch("/api/account/posts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: p.kind, id: p.id, text: editing.text }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.error);
      setPosts(l => l!.map(x => key(x) === key(p) ? { ...x, text: editing.text.trim(), status: b.status } : x)); setEditing(null);
    } catch (e) { setRowErr({ id: key(p), msg: e instanceof Error && e.message ? e.message : "Could not save that." }); } finally { setBusy(null); }
  }
  async function remove(p: Post) {
    if (!window.confirm(p.kind === "review" ? "Delete this review for good?" : "Delete this comment for good?")) return;
    setBusy(key(p)); setRowErr(null);
    try {
      const r = await fetch(`/api/account/posts?kind=${p.kind}&id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
      const b = await r.json(); if (!r.ok) throw new Error(b.error);
      setPosts(l => l!.filter(x => key(x) !== key(p)));
    } catch (e) { setRowErr({ id: key(p), msg: e instanceof Error && e.message ? e.message : "Could not delete it." }); } finally { setBusy(null); }
  }
  return <section className="th-card th-sec" aria-labelledby="your-posts">
    <h2 className="th-h2" id="your-posts">Your posts</h2>
    {posts === null ? <p className="th-note">Loading your posts…</p>
      : error ? <p className="th-err">{error}</p>
      : !posts.length ? <p className="th-note">No reviews or comments yet. They show up here once you post.</p>
      : <ul className="th-own">{posts.map(p => { const k = key(p), [label, tone] = STATUS[p.status], open = editing?.id === k;
        return <li key={k}>
          <div className="th-own-top">
            {p.href ? <a href={p.href}><b>{p.title}</b></a> : <b>{p.title}</b>}
            <span className="th-own-meta">{`${p.kind === "review" ? "Review" : "Comment"} · ${day(p.at)}`}</span>
            <span className={`th-vpill ${tone}`}>{label}</span>
          </div>
          {open ? <textarea className="th-ta" rows={4} value={editing.text} maxLength={2000} aria-label="Edit your post" autoFocus
            onChange={e => { setEditing({ id: k, text: e.target.value }); setRowErr(null); }}/> : <p className="th-own-text">{firstLine(p.text)}</p>}
          <div className="th-own-act">
            {open ? <>
              <button type="button" className="th-btn dark" disabled={busy === k} onClick={() => save(p)}>{busy === k ? "Saving…" : "Save"}</button>
              <button type="button" className="th-mini-btn" onClick={() => { setEditing(null); setRowErr(null); }}>Cancel</button>
              {p.kind === "review" && <span className="th-note">An edited review is checked again before it shows.</span>}
            </> : <>
              {p.editable && <button type="button" className="th-mini-btn" onClick={() => { setEditing({ id: k, text: p.text }); setRowErr(null); }}>Edit</button>}
              <button type="button" className="th-mini-btn" disabled={busy === k} onClick={() => remove(p)}>{busy === k ? "Deleting…" : "Delete"}</button>
              {!p.editable && p.status !== "hidden" && <span className="th-note">Editing closes 24 hours after posting, so replies and votes keep their context.</span>}
            </>}
          </div>
          {rowErr?.id === k && <span className="th-err" role="alert">{rowErr.msg}</span>}
        </li>; })}</ul>}
  </section>;
}
