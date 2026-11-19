"use client";
// The owner's review tools on the Thread racket page (owner 2026-11-19), drawn only in the signed-in owner's browser (the
// shared owner check, app/admin-edit.tsx), so the cached page is the same for everyone. Every action is one of the existing
// admin review routes, each checking the admin session on the server and refreshing the pages:
//   approve / reject / hide: /api/funtimes/reviews (status, with the status it expects to change);
//   edit the text:           /api/funtimes/review-quick (field "text");
//   delete:                  reject, then /api/funtimes/delete-rejected (the admin queue's own two steps).
// Scores and counts follow from the normal pipeline. Web summaries (Reddit, YouTube, blogs) have no tools here.
import { useEffect, useState } from "react";
import { ownerCheck } from "../../admin-edit";
import { VERDICT, ago } from "../ui";

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
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

type Pending = { id: string; alias: string | null; rating: number; text: string; tags: string[]; level: string | null; at: string };
/** Pending reviews of this racket, at the top of the reviews section: Approve, Reject, Edit then approve. */
export function PendingReviews({ racketId }: { racketId: string }) {
  const owner = useOwner();
  const [rows, setRows] = useState<Pending[] | null>(null), [edit, setEdit] = useState<Record<string, string>>({}), [err, setErr] = useState(""), [note, setNote] = useState("");
  useEffect(() => { if (!owner) return;
    fetch(`/api/funtimes/racket-reviews?racket=${encodeURIComponent(racketId)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { pending?: Pending[] } | null) => setRows(b?.pending ?? [])).catch(() => setRows([])); }, [owner, racketId]);
  if (!owner || !rows) return null;
  const done = (id: string, msg: string) => { setRows(l => (l ?? []).filter(x => x.id !== id)); setNote(msg); setErr(""); };
  const act = async (p: Pending, how: "approve" | "reject" | "edit") => {
    try {
      if (how === "edit") await editText(p.id, edit[p.id] ?? p.text);
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
        <div className="th-rv-who"><strong>{p.alias || "A PadelRecs player"}</strong><span>{`· ${ago(p.at)}`}</span>{p.level && <span>{`· ${p.level.toLowerCase()}`}</span>}
          <span className={`th-pill ${v[1]}`} style={{ fontSize: 12.5 }}>{v[0]}</span>{p.tags.map(t => <span key={t} className="th-tag">{t}</span>)}</div>
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
export function LiveReviewTools({ id, text, onChange }: { id: string; text: string; onChange: (next: { text?: string; gone?: true }) => void }) {
  const owner = useOwner();
  const [draft, setDraft] = useState<string | null>(null), [err, setErr] = useState("");
  if (!owner || id.startsWith("demo-")) return null;
  const run = async (f: () => Promise<void>, after: Parameters<typeof onChange>[0]) => { try { await f(); setErr(""); setDraft(null); onChange(after); } catch (e) { setErr(e instanceof Error ? e.message : "That didn't save."); } };
  return <div className="th-admin-acts" aria-label="Owner tools">
    {draft !== null ? <>
      <textarea className="th-ta" rows={4} value={draft} maxLength={4000} aria-label="Edit review" onChange={e => setDraft(e.target.value)}/>
      <button type="button" className="th-btn dark" onClick={() => run(() => editText(id, draft), { text: draft.trim() })}>Save</button>
      <button type="button" className="th-btn" onClick={() => setDraft(null)}>Cancel</button></>
    : <>
      <button type="button" className="th-mini-btn" onClick={() => setDraft(text)}>Edit</button>
      <button type="button" className="th-mini-btn" onClick={() => window.confirm("Hide this review? It goes back to pending and leaves the score until approved again.")
        && run(() => status(id, "pending", "approved"), { gone: true })}>Hide</button>
      <button type="button" className="th-mini-btn" onClick={() => window.confirm("Delete this review for good? It can't be undone.")
        && run(async () => { await status(id, "rejected", "approved"); await send("/api/funtimes/delete-rejected", { id }); }, { gone: true })}>Delete</button></>}
    {err && <span className="th-err" role="alert">{err}</span>}
  </div>;
}
