"use client";
// "Following" on /account (PadelRecs member zone, drizzle/0034): the rackets this player follows, each with Unfollow, and
// the daily email on or paused.
import { useEffect, useState } from "react";

type Followed = { id: string; name: string; href: string; since: string };
const day = (at: string) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function YourFollows() {
  const [list, setList] = useState<Followed[] | null>(null), [emails, setEmails] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/account/follows", { cache: "no-store" }).then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.error); setList(b.rackets ?? []); setEmails(b.emails ?? true); })
      .catch(e => { setList([]); setError(e instanceof Error && e.message ? e.message : "Could not load what you follow."); });
  }, []);
  const call = (method: string, body: object) => fetch("/api/account/follows", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.error); return b; });
  async function drop(f: Followed) {
    setBusy(f.id); setError("");
    try { await call("DELETE", { racketId: f.id }); setList(l => l!.filter(x => x.id !== f.id)); }
    catch (e) { setError(e instanceof Error && e.message ? e.message : "Could not unfollow."); } finally { setBusy(null); }
  }
  async function toggle(on: boolean) {
    setBusy("emails"); setError(""); setEmails(on);
    try { await call("PATCH", { emails: on }); } catch (e) { setEmails(!on); setError(e instanceof Error && e.message ? e.message : "Could not save that."); } finally { setBusy(null); }
  }
  return <section className="th-card th-sec" aria-labelledby="your-follows">
    <h2 className="th-h2" id="your-follows">Following</h2>
    {list === null ? <p className="th-note">Loading…</p>
      : !list.length ? <p className="th-note">{error || "No rackets yet. Tap Follow on a racket page to get its new reviews and posts in one email a day."}</p>
      : <>
        <ul className="th-own">{list.map(f => <li key={f.id} className="th-own-row">
          <div className="th-own-top"><a href={f.href}><b>{f.name}</b></a><span className="th-own-meta">{`Since ${day(f.since)}`}</span>
            <button type="button" className="th-mini-btn" disabled={busy === f.id} onClick={() => drop(f)}>{busy === f.id ? "Unfollowing…" : "Unfollow"}</button></div>
        </li>)}</ul>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontWeight: 400 }}>
          <input type="checkbox" checked={emails} disabled={busy === "emails"} onChange={e => toggle(e.target.checked)}/>
          Email me once a day when there&apos;s something new on these rackets
        </label>
        {error && <span className="th-err" role="alert">{error}</span>}
      </>}
  </section>;
}
