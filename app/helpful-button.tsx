"use client";
import { useEffect, useState } from "react";

const key = (type: string, id: string) => `helpful:${type}:${id}`;
function remembered(type: string, id: string) { try { return localStorage.getItem(key(type, id)) === "1"; } catch { return false; } }
function remember(type: string, id: string, on: boolean) { try { if (on) localStorage.setItem(key(type, id), "1"); else localStorage.removeItem(key(type, id)); } catch { /* private mode */ } }

export function HelpfulButton({ type, id, count: initial }: { type: "player" | "web"; id: string; count: number }) {
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  // Pages are cached for everyone, so "did I vote?" lives in this browser.
  useEffect(() => { if (remembered(type, id)) { setOn(true); setCount(c => Math.max(c, 1)); } }, [type, id]);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setBusy(true); setNote(""); setOn(next); setCount(c => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await fetch("/api/helpful", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id, on: next }) });
      const body = await res.json() as { count?: number; error?: string };
      if (!res.ok || typeof body.count !== "number") throw new Error(body.error || "Could not save your vote.");
      setCount(body.count); remember(type, id, next);
    } catch (error) {
      setOn(!next); setCount(c => Math.max(0, c + (next ? -1 : 1)));
      setNote(error instanceof Error ? error.message : "Could not save your vote.");
    } finally { setBusy(false); }
  }

  return <span className="react">
    <button type="button" className="helpful" aria-pressed={on} onClick={toggle} title={on ? "You found this helpful — tap to undo" : "Mark as helpful"}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2l5 6H9.8v3.8H6.2V9.2H3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
      <span className="lbl">Helpful</span>{count > 0 && <span className="n">{count}</span>}
    </button>
    {note && <span className="react-note" role="status">{note}</span>}
  </span>;
}
