"use client";
// The admin's "Edit flair" box (drizzle/0038, /api/funtimes/flair), opened from a top-level post's "…" menu on the live page.
// Only drawn for a signed-in admin after the page loads (the menu's owner items), so the cached HTML is the same for
// everyone. Question, Tip, No flair (beats the guess from the words), or Auto (back to that guess).
import { useState } from "react";
import { flairFor } from "../../../lib/thread/feed";

export type FlairPick = "question" | "tip" | "none" | "auto";
const PICKS: [FlairPick, string][] = [["question", "Question"], ["tip", "Tip"], ["none", "No flair"], ["auto", "Auto"]];

/** `type`: the post's saved type (undefined when none is saved). `onSaved`: show the change on the page at once. */
export function FlairEditor({ id, body, type, onSaved, onClose }: { id: string; body: string; type?: "question" | "tip" | "none";
  onSaved: (pick: FlairPick) => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [note, setNote] = useState("");
  const now = type ?? "auto", guess = flairFor(undefined, body);
  async function pick(flair: FlairPick) {
    setBusy(true); setErr(""); setNote("");
    try {
      const r = await fetch("/api/funtimes/flair", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ id, flair }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.error);
      onSaved(flair); setNote("Saved. Visitors see it once the page refreshes.");
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "That didn't save."); } finally { setBusy(false); }
  }
  return <div className="th-admin-acts th-help-edit" role="group" aria-label="Edit flair">
    <span className="th-note" style={{ flexBasis: "100%" }}>{`Flair: ${now === "auto" ? `auto, from the words (${guess === "question" ? "Question" : "none"})` : now === "none" ? "none (set by an admin)" : `${now === "question" ? "Question" : "Tip"} (saved)`}`}</span>
    {PICKS.map(([k, label]) => <button key={k} type="button" className={`th-btn${now === k ? " dark" : ""}`} aria-pressed={now === k} disabled={busy} onClick={() => pick(k)}>{label}</button>)}
    <button type="button" className="th-mini-btn" onClick={onClose}>Close</button>
    {note && <span className="th-note" role="status" style={{ flexBasis: "100%" }}>{note}</span>}
    {err && <span className="th-err" role="alert" style={{ flexBasis: "100%" }}>{err}</span>}
  </div>;
}
