"use client";
// The owner's review tools on the Thread racket page (owner 2026-11-19), drawn only in the signed-in owner's browser (the
// shared owner check, app/admin-edit.tsx), so the cached page is the same for everyone. Every action is one of the existing
// admin review routes, each checking the admin session on the server and refreshing the pages:
//   approve / reject / hide: /api/funtimes/reviews (status, with the status it expects to change);
//   edit the text:           /api/funtimes/review-quick (field "text");
//   name, level and side:    /api/funtimes/review-quick (fields "alias", "playerLevel", "playingSide");
//   delete:                  reject, then /api/funtimes/delete-rejected (the admin queue's own two steps).
// Scores and counts follow from the normal pipeline. Web summaries (Reddit, YouTube, blogs) have no tools here.
import { useEffect, useState } from "react";
import { ownerCheck } from "../../admin-edit";
import { VERDICT, ago } from "../ui";
import { reviewerName, nameProblem, postProblem, typedName, NAME_MAX } from "../../../lib/thread/display-name";
import { LevelSide, type LevelSideValue } from "./level-side";

export function useOwner() {
  const [owner, setOwner] = useState(false);
  useEffect(() => { let live = true; ownerCheck().then(a => { if (live) setOwner(a); }); return () => { live = false; }; }, []);
  return owner;
}
async function send(path: string, form: Record<string, string>) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams(form) }).catch(() => null);
  const b = r ? await r.json().catch(() => ({})) as { error?: string } : { error: "No connection." };
  if (!r?.ok) throw new Error(b.error || "That didn't save. Check you're still signed in.");
}
const status = (id: string, to: string, from: string) => send("/api/funtimes/reviews", { id, status: to, expectedStatus: from, returnStatus: from });
const editText = (id: string, text: string) => send("/api/funtimes/review-quick", { id, field: "text", value: text });
/** The owner's rename (abuse cases): the same name rules as posting, then the queue's own quick edit (field "alias"). */
const editName = async (id: string, name: string) => { const p = nameProblem(name); if (p) throw new Error(p); await send("/api/funtimes/review-quick", { id, field: "alias", value: name.trim() }); };
/** Who posted it, as the owner's Edit changes it: the typed name ("" for none), level and side ("" for none). */
export type Who = { alias: string } & LevelSideValue;
export type ReviewChange = { text?: string; who?: Who; gone?: true };
/** Name, level and side save together, under the posting rule: a name, or a level or side (owner 2026-11-19). */
async function editWho(id: string, was: Who, now: Who) {
  const p = postProblem(now.alias, now.level, now.side); if (p) throw new Error(p);
  if (now.alias.trim() !== was.alias) await send("/api/funtimes/review-quick", { id, field: "alias", value: now.alias.trim() });
  if (now.level !== was.level) await send("/api/funtimes/review-quick", { id, field: "playerLevel", value: now.level });
  if (now.side !== was.side) await send("/api/funtimes/review-quick", { id, field: "playingSide", value: now.side });
}
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

type Pending = { id: string; alias: string | null; rating: number; text: string; tags: string[]; level: string | null; at: string };
/** Pending reviews of this racket, at the top of the reviews section: Approve, Reject, Edit then approve. */
export function PendingReviews({ racketId }: { racketId: string }) {
  const owner = useOwner();
  const [rows, setRows] = useState<Pending[] | null>(null), [edit, setEdit] = useState<Record<string, string>>({}), [names, setNames] = useState<Record<string, string>>({}), [err, setErr] = useState(""), [note, setNote] = useState("");
  useEffect(() => { if (!owner) return;
    fetch(`/api/funtimes/racket-reviews?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { pending?: Pending[] } | null) => setRows(b?.pending ?? [])).catch(() => setRows([])); }, [owner, racketId]);
  if (!owner || !rows) return null;
  const done = (id: string, msg: string) => { setRows(l => (l ?? []).filter(x => x.id !== id)); setNote(msg); setErr(""); };
  const act = async (p: Pending, how: "approve" | "reject" | "edit") => {
    try {
      if (how === "edit") { const n = names[p.id]; if (n !== undefined && n.trim() !== (typedName(p.alias) ?? "")) await editName(p.id, n); await editText(p.id, edit[p.id] ?? p.text); }
      await status(p.id, how === "reject" ? "rejected" : "approved", "pending");
      done(p.id, how === "reject" ? "Rejected." : "Approved: it shows on this page after the next refresh, and counts in the score.");
    } catch (e) { setErr(e instanceof Error ? e.message : "That didn't save."); }
  };
  return <div className="th-admin-box" role="region" aria-label="Pending reviews (owner only)">
    <div className="th-head-row"><b>{`Pending reviews (${rows.length})`}</b><span className="th-sub">Only you see this</span></div>
    {note && <span className="th-ok" role="status">{note}</span>}{err && <span className="th-err" role="alert">{err}</span>}
    {rows.length === 0 && <span className="th-note">Nothing waiting for this racket.</span>}
    {rows.map(p => { const v = VERDICT[verdictOf(p.rating)];
      return <div key={p.id} className="th-rv">
        <div className="th-rv-who"><strong>{reviewerName({ alias: p.alias, level: p.level })}</strong><span>{`· ${ago(p.at)}`}</span>{p.level && <span>{`· ${p.level.toLowerCase()}`}</span>}
          <span className={`th-pill ${v[1]}`} style={{ fontSize: 12.5 }}>{v[0]}</span>{p.tags.map(t => <span key={t} className="th-tag">{t}</span>)}</div>
        {p.id in edit && <span className="th-as"><input value={names[p.id] ?? typedName(p.alias) ?? ""} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Reviewer's name" onChange={e => setNames(x => ({ ...x, [p.id]: e.target.value }))}/></span>}
        {p.id in edit ? <textarea className="th-ta" rows={4} value={edit[p.id]} maxLength={4000} aria-label="Edit review" onChange={e => setEdit(x => ({ ...x, [p.id]: e.target.value }))}/> : <p className="th-rv-text">{p.text}</p>}
        <div className="th-admin-acts">
          {p.id in edit ? <><button type="button" className="th-btn dark" onClick={() => act(p, "edit")}>Save and approve</button>
            <button type="button" className="th-btn" onClick={() => setEdit(x => { const y = { ...x }; delete y[p.id]; return y; })}>Cancel</button></>
          : <><button type="button" className="th-btn dark" onClick={() => act(p, "approve")}>Approve</button>
            <button type="button" className="th-btn" onClick={() => setEdit(x => ({ ...x, [p.id]: p.text }))}>Edit then approve</button>
            <button type="button" className="th-btn" onClick={() => act(p, "reject")}>Reject</button></>}
        </div>
      </div>; })}
  </div>;
}

/** Edit, Delete and Hide on a live player review card. `id` is the review's own id. */
export function LiveReviewTools({ id, text, who, onChange }: { id: string; text: string; who: Who; onChange: (next: ReviewChange) => void }) {
  const owner = useOwner();
  const [draft, setDraft] = useState<string | null>(null), [name, setName] = useState<Who | null>(null), [err, setErr] = useState("");
  if (!owner || id.startsWith("demo-")) return null;
  const run = async (f: () => Promise<void>, after: ReviewChange) => { try { await f(); setErr(""); setDraft(null); setName(null); onChange(after); } catch (e) { setErr(e instanceof Error ? e.message : "That didn't save."); } };
  const save = () => run(async () => { if (name !== null) await editWho(id, who, name); if (draft !== null && draft.trim() !== text.trim()) await editText(id, draft); },
    { ...(name !== null ? { who: { ...name, alias: name.alias.trim() } } : {}), ...(draft !== null ? { text: draft.trim() } : {}) });
  return <div className="th-admin-acts" aria-label="Owner tools">
    {draft !== null || name !== null ? <>
      {name !== null && <span className="th-as" style={{ flexBasis: "100%" }}><input value={name.alias} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Reviewer's name" autoFocus={draft === null} onChange={e => { setName({ ...name, alias: e.target.value }); setErr(""); }}/>
        <LevelSide value={name} set={v => { setName({ ...name, ...v }); setErr(""); }}/></span>}
      {draft !== null && <textarea className="th-ta" rows={4} value={draft} maxLength={4000} aria-label="Edit review" onChange={e => setDraft(e.target.value)}/>}
      <button type="button" className="th-btn dark" onClick={save}>Save</button>
      <button type="button" className="th-btn" onClick={() => { setDraft(null); setName(null); setErr(""); }}>Cancel</button></>
    : <>
      <button type="button" className="th-mini-btn" onClick={() => { setName(who); setDraft(text); }}>Edit</button>
      <button type="button" className="th-mini-btn" onClick={() => setName(who)}>Rename</button>
      <button type="button" className="th-mini-btn" onClick={() => window.confirm("Hide this review? It goes back to pending and leaves the score until approved again.")
        && run(() => status(id, "pending", "approved"), { gone: true })}>Hide</button>
      <button type="button" className="th-mini-btn" onClick={() => window.confirm("Delete this review for good? It can't be undone.")
        && run(async () => { await status(id, "rejected", "approved"); await send("/api/funtimes/delete-rejected", { id }); }, { gone: true })}>Delete</button></>}
    {err && <span className="th-err" role="alert">{err}</span>}
  </div>;
}
