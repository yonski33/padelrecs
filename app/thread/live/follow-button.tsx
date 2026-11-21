"use client";
// Follow a racket page (drizzle/0034, db/follows.ts): one click to follow, one to unfollow. Signed out, the click opens a
// small sign-in prompt; after signing in the player comes back to the page already following (the racket waits in
// localStorage until then). The state is asked only when a Supabase session cookie is present, so cached pages stay the
// same for everyone. Two copies on the racket page (hero and feed) stay in step through a window event.
import { useEffect, useRef, useState } from "react";

const PENDING = "recs-follow-pending", EVENT = "recs-follow";
const hasSession = () => typeof document !== "undefined" && /(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
let asked: Record<string, Promise<boolean | null>> = {};
const ask = (id: string) => asked[id] ??= fetch(`/api/account/follows?racket=${encodeURIComponent(id)}`, { cache: "no-store" })
  .then(r => r.ok ? r.json() : null).then((b: { signedIn?: boolean; following?: boolean } | null) => b?.signedIn ? !!b.following : null).catch(() => null);
let resumed = false;
const send = (id: string, on: boolean) => fetch("/api/account/follows", { method: on ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId: id }) })
  .then(r => r.ok);
const tell = (id: string, on: boolean) => { asked = { ...asked, [id]: Promise.resolve(on) }; window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, on } })); };

const Bell = ({ on }: { on: boolean }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

export function FollowButton({ id, name, place }: { id: string; name: string; place: "hero" | "feed" }) {
  // null = signed out (or not known yet), true / false = signed in and following or not.
  const [on, setOn] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [prompt, setPrompt] = useState(false), [note, setNote] = useState("");
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let live = true;
    const hear = (e: Event) => { const d = (e as CustomEvent<{ id: string; on: boolean }>).detail; if (d.id === id && live) setOn(d.on); };
    window.addEventListener(EVENT, hear);
    if (hasSession()) ask(id).then(async state => {
      if (!live) return;
      setOn(state);
      // Back from signing in after clicking Follow: follow now (once per page, whichever button loads first).
      let pending: string | null = null; try { pending = localStorage.getItem(PENDING); } catch { /* storage off */ }
      if (state === false && pending === id && !resumed) {
        resumed = true; try { localStorage.removeItem(PENDING); } catch { /* storage off */ }
        if (await send(id, true)) { tell(id, true); if (place === "hero") setNote("You're following this racket. New reviews and posts come in one email a day."); }
      } else if (state !== null && pending === id) { try { localStorage.removeItem(PENDING); } catch { /* storage off */ } }
    });
    return () => { live = false; window.removeEventListener(EVENT, hear); };
  }, [id, place]);
  useEffect(() => {
    if (!prompt) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setPrompt(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPrompt(false); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [prompt]);

  async function click() {
    setNote("");
    if (on === null) { setPrompt(p => !p); return; }
    const want = !on; setBusy(true); setOn(want);
    if (await send(id, want)) tell(id, want); else { setOn(!want); setNote("That didn't work. Try again?"); }
    setBusy(false);
  }
  function signIn() {
    try { localStorage.setItem(PENDING, id); } catch { /* storage off: they can click Follow again after */ }
    window.location.href = `/account?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }
  return <span className={`th-follow-wrap ${place}`} ref={box}>
    <button type="button" className={`th-follow${on ? " on" : ""}`} aria-pressed={!!on} disabled={busy} onClick={click}
      aria-label={on ? `Following the ${name}. Click to unfollow.` : `Follow the ${name}`} aria-expanded={on === null ? prompt : undefined}>
      <Bell on={!!on}/>{on ? "Following ✓" : "Follow"}</button>
    {prompt && on === null && <span className="th-follow-pop" role="dialog" aria-label="Sign in to follow">
      <b>{`Follow the ${name}`}</b>
      <span>Get one email a day when players post a new review or post here. Nothing new, no email. Unfollow any time.</span>
      <span className="th-follow-act"><button type="button" className="th-btn round lime" onClick={signIn}>Sign in or register</button>
        <button type="button" className="th-mini-btn" onClick={() => setPrompt(false)}>Not now</button></span>
      <span className="th-note">No password: a sign-in link goes to your email.</span>
    </span>}
    {note && <span className="th-note th-follow-note" role="status">{note}</span>}
  </span>;
}
