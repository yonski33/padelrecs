"use client";
// The owner's "Edit helpful" box (drizzle/0036, /api/funtimes/helpful), opened from a post's "…" menu on the live page.
// Only drawn for a signed-in admin after the page loads (the menu's owner items), so the cached HTML is the same for
// everyone. Set a number, reset to the real votes, or remove one voter's votes (here, or everywhere on the site).
import { useEffect, useState } from "react";

type Voter = { key: string; short: string; at: string; value: number; total: number };
type State = { real: number; override: number | null; shown: number; voters: Voter[]; history: { action: string; fromShown: number; toShown: number; by: string; at: string }[] };
const day = (at: string) => new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const WHAT: Record<string, string> = { set: "set", reset: "reset", "remove-voter": "removed a voter", "remove-voter-everywhere": "removed a voter everywhere" };

export function HelpfulEditor({ kind, id, onClose }: { kind: "player" | "web" | "comment"; id: string; onClose: () => void }) {
  const [s, setS] = useState<State | null>(null), [value, setValue] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [note, setNote] = useState("");
  const load = () => fetch(`/api/funtimes/helpful?kind=${kind}&id=${encodeURIComponent(id)}`, { cache: "no-store" })
    .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.error); setS(b); setValue(String(b.shown)); })
    .catch(e => setErr(e instanceof Error && e.message ? e.message : "Could not load the votes."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [kind, id]);
  async function act(body: object, done: string) {
    setBusy(true); setErr(""); setNote("");
    try {
      const r = await fetch("/api/funtimes/helpful", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ kind, id, ...body }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.error);
      setNote(`${done} Reload the page to see it on the post.`); await load();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "That didn't save."); } finally { setBusy(false); }
  }
  const n = Number(value), valid = value.trim() !== "" && Number.isInteger(n) && (kind === "comment" || n >= 0);
  return <div className="th-admin-acts th-help-edit" role="group" aria-label="Edit helpful">
    {!s ? <span className="th-note">{err || "Loading votes…"}</span> : <>
      <span className="th-note" style={{ flexBasis: "100%" }}>{`Real votes: ${s.real}${s.override !== null ? ` · shown: ${s.override} (set by an admin)` : ""}`}</span>
      <input type="number" inputMode="numeric" value={value} onChange={e => { setValue(e.target.value); setErr(""); }} aria-label="Helpful count to show" style={{ width: 90 }}/>
      <button type="button" className="th-btn dark" disabled={busy || !valid} onClick={() => act({ action: "set", value: n }, "Saved.")}>Set</button>
      {s.override !== null && <button type="button" className="th-btn" disabled={busy} onClick={() => act({ action: "reset" }, "Back to the real votes.")}>Reset to real votes</button>}
      <button type="button" className="th-mini-btn" onClick={onClose}>Close</button>
      {s.voters.length > 0 && <details style={{ flexBasis: "100%" }}><summary className="th-mini-btn">{`Voters (${s.voters.length})`}</summary>
        <ul className="th-help-voters">{s.voters.map(v => <li key={v.key}>
          <code>{v.short}</code><span>{`${kind === "comment" ? (v.value > 0 ? "▲" : "▼") : "▲"} ${day(v.at)} · ${v.total} ${v.total === 1 ? "vote" : "votes"} on the site`}</span>
          <button type="button" className="th-mini-btn" disabled={busy} onClick={() => act({ action: "remove-voter", voter: v.key, everywhere: false }, "Vote removed.")}>Remove here</button>
          {v.total > 1 && <button type="button" className="th-mini-btn" disabled={busy} onClick={() => { if (window.confirm(`Remove all ${v.total} votes from this voter across the site?`)) act({ action: "remove-voter", voter: v.key, everywhere: true }, "Their votes are removed."); }}>Remove all theirs</button>}
        </li>)}</ul></details>}
      {s.history.length > 0 && <details style={{ flexBasis: "100%" }}><summary className="th-mini-btn">History</summary>
        <ul className="th-help-voters">{s.history.map((h, i) => <li key={i}><span>{`${day(h.at)} · ${h.by} ${WHAT[h.action] ?? h.action}: ${h.fromShown} → ${h.toShown}`}</span></li>)}</ul></details>}
      {note && <span className="th-note" role="status" style={{ flexBasis: "100%" }}>{note}</span>}
      {err && <span className="th-err" role="alert" style={{ flexBasis: "100%" }}>{err}</span>}
    </>}
  </div>;
}
