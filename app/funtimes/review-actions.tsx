"use client";
// Approve / reject in place (owner 2026-11-17): the same POST to /api/funtimes/reviews with the same admin and origin checks,
// asking for JSON, so the page doesn't reload and the scroll position and page stay put. The row then says what happened
// ("approved ✓") and dims; a failure shows on the row and leaves it as it was. Without JavaScript the forms still post and
// redirect as before. "Approve all on this page" asks first, then approves the rows one by one.
import { useEffect, useRef, useState } from "react";

type Status = "pending" | "approved" | "rejected";
const LABEL: Record<Status, string> = { approved: "Approve", rejected: "Reject", pending: "Move to pending" };
const DONE: Record<Status, string> = { approved: "approved ✓", rejected: "rejected", pending: "moved to pending" };
/** The rows still waiting on this page, for "approve all". */
const approvers = new Set<() => Promise<boolean>>();

async function send(id: string, next: Status, expected: Status, back: Status) {
  const r = await fetch("/api/funtimes/reviews", { method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ id, status: next, expectedStatus: expected, returnStatus: back }) });
  const b = await r.json().catch(() => ({})) as { error?: string };
  if (!r.ok) throw new Error(b.error || (r.status === 403 ? "Admin access required. Sign in again." : `Saving failed (${r.status}). Try again.`));
}

export function ReviewActions({ id, status, back }: { id: string; status: Status; back: Status }) {
  const [busy, setBusy] = useState<Status | null>(null), [done, setDone] = useState<Status | null>(null), [error, setError] = useState("");
  async function go(next: Status) {
    if (busy || done) return false;
    setBusy(next); setError("");
    try { await send(id, next, status, back); setDone(next); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "Saving failed. Try again."); return false; }
    finally { setBusy(null); }
  }
  const approve = useRef<() => Promise<boolean>>(async () => false);
  useEffect(() => { approve.current = () => go("approved"); });
  // Waiting rows only: a row leaves the list once it has been changed.
  useEffect(() => { if (status === "approved" || done) return; const f = () => approve.current(); approvers.add(f); return () => { approvers.delete(f); }; }, [status, done]);
  return <div className="admin-actions">
    {done ? <span className="admin-done-note" role="status">{DONE[done]}</span>
      : (["approved", "rejected", "pending"] as Status[]).filter(s => s !== status).map(next =>
        <form action="/api/funtimes/reviews" method="post" key={next} onSubmit={e => { e.preventDefault(); void go(next); }}>
          <input type="hidden" name="id" value={id}/><input type="hidden" name="status" value={next}/>
          <input type="hidden" name="expectedStatus" value={status}/><input type="hidden" name="returnStatus" value={back}/>
          <button type="submit" disabled={!!busy} className={next === "approved" ? "" : "secondary-button"}>{busy === next ? "Saving…" : LABEL[next]}</button>
        </form>)}
    {error && <p className="admin-row-error" role="alert">{error}</p>}
  </div>;
}

/** "Approve all on this page": a confirm step, then one request at a time; the rows report their own results. */
export function ApproveAll({ count }: { count: number }) {
  const [run, setRun] = useState<{ ok: number; failed: number; total: number } | null>(null);
  async function all() {
    const list = [...approvers];
    if (!list.length || !window.confirm(`Approve all ${list.length} reviews on this page? They go live right away.`)) return;
    let ok = 0, failed = 0;
    setRun({ ok, failed, total: list.length });
    for (const f of list) { if (await f()) ok++; else failed++; setRun({ ok, failed, total: list.length }); }
  }
  if (!count) return null;
  return <div className="admin-bulk">
    <button type="button" onClick={all} disabled={!!run && run.ok + run.failed < run.total}>Approve all on this page</button>
    {run && <span role="status">{`${run.ok} of ${run.total} approved${run.failed ? `, ${run.failed} failed (see the rows)` : ""}`}</span>}
  </div>;
}

// Permanent delete of rejected reviews (owner 2026-11-18): a confirm step that says it can't be undone, then the JSON post.
async function purge(body: Record<string, string>) {
  const r = await fetch("/api/funtimes/delete-rejected", { method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams(body) });
  const b = await r.json().catch(() => ({})) as { error?: string; count?: number };
  if (!r.ok) throw new Error(b.error || (r.status === 403 ? "Admin access required. Sign in again." : `Deleting failed (${r.status}). Try again.`));
  return b.count ?? 0;
}

/** "Delete permanently" on one rejected row. */
export function DeleteRejected({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"), [error, setError] = useState("");
  async function go() {
    if (state !== "idle" || !window.confirm("Delete this rejected review permanently? This can't be undone.")) return;
    setState("busy"); setError("");
    try { await purge({ id }); setState("done"); } catch (e) { setError(e instanceof Error ? e.message : "Deleting failed."); setState("idle"); }
  }
  if (state === "done") return <div className="admin-actions"><span className="admin-done-note" role="status">deleted permanently</span></div>;
  return <div className="admin-actions">
    <button type="button" className="danger-button" disabled={state === "busy"} onClick={go}>{state === "busy" ? "Deleting…" : "Delete permanently"}</button>
    {error && <p className="admin-row-error" role="alert">{error}</p>}
  </div>;
}

/** "Delete all rejected": every rejected review on this site, not just this page; then the list reloads. */
export function DeleteAllRejected({ total }: { total: number }) {
  const [busy, setBusy] = useState(false), [note, setNote] = useState("");
  async function go() {
    if (busy || !window.confirm(`Delete all ${total} rejected reviews on this site permanently? This can't be undone.`)) return;
    setBusy(true); setNote("");
    try { const n = await purge({ all: "yes" }); setNote(`${n} deleted permanently`); window.location.assign("/funtimes?status=rejected"); }
    catch (e) { setNote(e instanceof Error ? e.message : "Deleting failed."); setBusy(false); }
  }
  if (!total) return null;
  return <div className="admin-bulk">
    <button type="button" className="danger-button" onClick={go} disabled={busy}>{busy ? "Deleting…" : `Delete all rejected (${total})`}</button>
    {note && <span role="status">{note}</span>}
  </div>;
}
