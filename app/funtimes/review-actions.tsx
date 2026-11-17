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
