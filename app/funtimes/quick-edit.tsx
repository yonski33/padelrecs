"use client";
// Inline edits on the admin queue (owner 2026-11-17): click the name, the date or the text, edit in place, save without a
// reload (POST /api/funtimes/review-quick, same admin guard), then "saved ✓" or the error on the spot. Name and date save on
// Enter or blur; the text saves with Save or Cmd/Ctrl+Enter. Esc cancels. With kind="comment" the same box edits a comment's
// name and text on the admin Latest comments page.
import { useEffect, useRef, useState } from "react";
import { quickEditRequest, type QuickField, type QuickKind } from "../../lib/review-quick";

type Field = QuickField; type Kind = QuickKind;
async function save(id: string, field: Field, value: string, kind: Kind) {
  const { url, body } = quickEditRequest(kind, id, field, value);
  const r = await fetch(url, { method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
  const b = await r.json().catch(() => ({})) as { error?: string; value?: string };
  if (!r.ok) throw new Error(b.error || (r.status === 403 ? "Admin access required. Sign in again." : `Saving failed (${r.status}).`));
  return b.value ?? value;
}
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function QuickEdit({ id, field, value, empty, kind = "review" }: { id: string; field: Field; value: string; /** Shown for an empty name. */ empty?: string; kind?: Kind }) {
  const [shown, setShown] = useState(value), [edit, setEdit] = useState(false), [draft, setDraft] = useState(""), [state, setState] = useState<{ ok?: boolean; error?: string; busy?: boolean }>({});
  const box = useRef<HTMLTextAreaElement>(null);
  const start = () => { setDraft(field === "date" ? shown.slice(0, 10) : shown); setEdit(true); setState({}); };
  const cancel = () => { setEdit(false); setState({}); };
  async function commit() {
    const next = field === "date" ? draft : draft.trim();
    if ((field === "date" ? shown.slice(0, 10) : shown) === next) { setEdit(false); return; }
    setState({ busy: true });
    try { setShown(await save(id, field, next, kind)); setEdit(false); setState({ ok: true }); }
    catch (e) { setState({ error: e instanceof Error ? e.message : "Saving failed." }); }
  }
  // The text box grows with its words.
  useEffect(() => { const t = box.current; if (t) { t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; } }, [draft, edit]);
  const note = <>{state.ok && <span className="qe-ok" role="status"> saved ✓</span>}{state.error && <span className="qe-err" role="alert"> {state.error}</span>}</>;
  if (!edit) {
    const label = field === "date" ? fmt(shown) : shown || empty || "";
    return field === "text" ? <div className="qe"><p className="review-text qe-click" role="button" tabIndex={0} title="Click to edit" onClick={start} onKeyDown={e => { if (e.key === "Enter") start(); }}>{label}</p>{note}</div>
      : <span className="qe"><button type="button" className="qe-click" title="Click to edit" onClick={start}>{field === "alias" ? <b>{label}</b> : <time dateTime={shown}>{label}</time>}</button>{note}</span>;
  }
  if (field === "text") return <div className="qe qe-on">
    <textarea ref={box} className="qe-text" value={draft} maxLength={2000} autoFocus disabled={state.busy} onChange={e => setDraft(e.target.value)}
      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void commit(); } }}/>
    <div className="qe-row"><button type="button" onClick={() => void commit()} disabled={state.busy}>{state.busy ? "Saving…" : "Save"}</button>
      <button type="button" className="secondary-button" onClick={cancel}>Cancel</button><small>{`${draft.trim().length} / 2000 · Cmd/Ctrl+Enter saves, Esc cancels`}</small></div>{note}</div>;
  return <span className="qe qe-on">
    <input className="qe-in" type={field === "date" ? "date" : "text"} value={draft} autoFocus disabled={state.busy} maxLength={field === "alias" ? (kind === "comment" ? 24 : 50) : undefined}
      max={field === "date" ? new Date().toISOString().slice(0, 10) : undefined} onChange={e => setDraft(e.target.value)}
      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); void commit(); } }} onBlur={() => { if (!state.error) void commit(); }}/>{note}</span>;
}
