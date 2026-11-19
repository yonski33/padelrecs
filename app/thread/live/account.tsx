"use client";
// The /account page's panel (optional PadelRecs accounts): email link sign-in (plus the email's 6-digit code for another
// device), reserving a name, level and side, sign out, delete. All writes go to /api/account*. Copy: plain, no "we".
import { useEffect, useState } from "react";
import { savedName, saveName } from "./name";
import { NAME_MAX } from "../../../lib/thread/display-name";
import { accountNameProblem } from "../../../lib/thread/account-name";
import { forgetAccount } from "./use-account";
import { YourPosts } from "./your-posts";
import { niche } from "../../../lib/niche";

/** The review form's own labels ("Level" and "Side" on padel, "Level" and "Mostly plays" on pickleball). */
const LEVEL = niche.profile.playerLevel.label, SIDE = niche.profile.playingSide.label;
/** The side in a sentence: "side" on padel, "play style" where the field is "Mostly plays". */
const SIDE_WORD = SIDE === "Side" ? "side" : "play style";

export type AccountView = { name: string; level: string | null; side: string | null; status: string } | null;
type Initial = { signedIn: false } | { signedIn: true; email: string | null; account: AccountView };

const post = async (url: string, body: object, method = "POST") => {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const b = await r.json().catch(() => ({})) as Record<string, unknown> & { error?: string };
  if (!r.ok) throw new Error(b.error || "Something went wrong. Try again?");
  return b;
};

export function AccountPanel({ initial, next, failed, levels, sides }: { initial: Initial; next: string | null; failed: boolean; levels: string[]; sides: string[] }) {
  const [state, setState] = useState(initial), [linked, setLinked] = useState(0);
  if (!state.signedIn) return <SignIn next={next} failed={failed}/>;
  if (!state.account) return <Claim email={state.email} next={next} levels={levels} sides={sides} onDone={(a, n) => { setLinked(n); setState({ ...state, account: a }); }}/>;
  return <Profile email={state.email} account={state.account} next={next} levels={levels} sides={sides} linked={linked} onChange={a => setState({ ...state, account: a })}/>;
}

function SignIn({ next, failed }: { next: string | null; failed: boolean }) {
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [code, setCode] = useState(""), [busy, setBusy] = useState(false);
  const [error, setError] = useState(failed ? "That sign-in link didn't work (links work once, for an hour). Ask for a new one below." : "");
  async function send(e?: React.FormEvent) {
    e?.preventDefault(); setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Add your email address.");
    setBusy(true);
    try { await post("/api/account/login", { email: email.trim(), next: next ?? undefined, website: "" }); setSent(true); }
    catch (x) { setError(x instanceof Error ? x.message : "Could not send the email."); } finally { setBusy(false); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try { await post("/api/account/verify", { email: email.trim(), code: code.trim() }); forgetAccount(); window.location.href = next ? `/account?next=${encodeURIComponent(next)}` : "/account"; }
    catch (x) { setError(x instanceof Error ? x.message : "That code didn't work."); setBusy(false); }
  }
  return <article className="th-card th-hero">
    <h1 className="th-h1">Keep your name</h1>
    <div className="th-intro"><p>An account is optional. Posting with a typed name still works. With one, your name is yours: nobody else can post as you, and your reviews and comments get a small member mark.</p>
      <p>No password. Sign in with a link sent to your email.</p></div>
    {!sent ? <form className="th-form" onSubmit={send} noValidate>
      <label>Your email<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" maxLength={254} autoFocus/></label>
      {error && <span className="th-err" role="alert">{error}</span>}
      <button type="submit" className="th-btn round lime" style={{ alignSelf: "flex-start" }} disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
      <span className="th-note">The email is only used to sign you in. It never shows on the site. <a href="/privacy">Privacy</a></span>
    </form> : <form className="th-form" onSubmit={verify} noValidate>
      <div className="th-ok" role="status"><b>Check your email.</b><p>{`A sign-in link is on its way to ${email.trim()}. Tap it on this device and you're in.`}</p></div>
      <label>Opened the email on another device? Type the code from it here.<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="6-digit code" maxLength={10}/></label>
      {error && <span className="th-err" role="alert">{error}</span>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="th-btn dark" disabled={busy || code.length < 6}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" className="th-mini-btn" onClick={() => { setSent(false); setCode(""); }}>Use another email</button>
        <button type="button" className="th-mini-btn" disabled={busy} onClick={() => send()}>Send it again</button>
      </div>
    </form>}
  </article>;
}

function Picks({ label, options, value, set }: { label: string; options: string[]; value: string | null; set: (v: string | null) => void }) {
  return <div className="th-fgroup"><span>{label}</span><div className="th-topics" role="group" aria-label={label}>
    {options.map(o => <button key={o} type="button" className="th-pick sm" aria-pressed={value === o} onClick={() => set(value === o ? null : o)}>{o}</button>)}</div></div>;
}
const back = (next: string | null) => next ? <a className="th-link-b" href={next}>Back to where you were</a> : null;

function Claim({ email, next, levels, sides, onDone }: { email: string | null; next: string | null; levels: string[]; sides: string[]; onDone: (a: AccountView, linked: number) => void }) {
  const [name, setName] = useState(""), [level, setLevel] = useState<string | null>(null), [side, setSide] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  // The name this browser typed on a review or comment before: most people want to keep exactly that one.
  useEffect(() => { setName(savedName()); }, []);
  async function claim(e: React.FormEvent) {
    e.preventDefault(); const p = accountNameProblem(name); if (p) return setError(p);
    setBusy(true); setError("");
    try { const b = await post("/api/account", { action: "claim", name: name.trim(), level, side }) as { account: AccountView; linked: number };
      saveName(name); forgetAccount(); onDone(b.account, b.linked); }
    catch (x) { setError(x instanceof Error ? x.message : "Could not save that."); } finally { setBusy(false); }
  }
  return <article className="th-card th-hero">
    <h1 className="th-h1">Pick your name</h1>
    <div className="th-intro"><p>{`Signed in${email ? ` as ${email}` : ""}. Choose the name people see on your reviews and comments. Once it's yours, nobody else can post with it.`}</p>
      <p>Earlier posts from this device under the same name are added to your account.</p></div>
    <form className="th-form" onSubmit={claim} noValidate>
      <label>Name or nickname<input value={name} onChange={e => { setName(e.target.value); setError(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" autoFocus/></label>
      <Picks label={`${LEVEL} (optional)`} options={levels} value={level} set={setLevel}/>
      <Picks label={`${SIDE} (optional)`} options={sides} value={side} set={setSide}/>
      {error && <span className="th-err" role="alert">{error}</span>}
      <button type="submit" className="th-btn round lime" style={{ alignSelf: "flex-start" }} disabled={busy}>{busy ? "Saving…" : "Keep this name"}</button>
    </form>
    {back(next)}
  </article>;
}

function Profile({ email, account, next, levels, sides, linked = 0, onChange }: { email: string | null; account: NonNullable<AccountView>; next: string | null; levels: string[]; sides: string[]; linked?: number; onChange: (a: AccountView) => void }) {
  const [name, setName] = useState(account.name), [level, setLevel] = useState(account.level), [side, setSide] = useState(account.side);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  const [del, setDel] = useState(false), [removePosts, setRemovePosts] = useState(false);
  const blocked = account.status === "blocked", dirty = name.trim() !== account.name || level !== account.level || side !== account.side;
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (name.trim() !== account.name) { const p = accountNameProblem(name); if (p) return setError(p); }
    setBusy(true); setError(""); setSaved(false);
    try { const b = await post("/api/account", { action: "update", name: name.trim(), level, side }) as { account: AccountView };
      saveName(name); forgetAccount(); onChange(b.account); setSaved(true); }
    catch (x) { setError(x instanceof Error ? x.message : "Could not save that."); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try { await post(`/api/account${removePosts ? "?posts=remove" : ""}`, {}, "DELETE"); forgetAccount(); window.location.href = "/?account=deleted"; }
    catch (x) { setError(x instanceof Error ? x.message : "Could not delete the account."); setBusy(false); }
  }
  return <>
    <article className="th-card th-hero">
      <h1 className="th-h1">Your account</h1>
      <div className="th-intro"><p>{`Posting as ${account.name}${email ? `. Signed in as ${email}` : ""}.`}</p>
        {linked > 0 && <p>{`${linked} earlier ${linked === 1 ? "post" : "posts"} from this device ${linked === 1 ? "is" : "are"} now on your account.`}</p>}</div>
      {blocked && <p className="th-err" role="alert">This account is paused, so it can't post right now. If that looks wrong, write through <a href="/contact">the contact form</a>.</p>}
      <form className="th-form" onSubmit={save} noValidate>
        <label>Name or nickname<input value={name} onChange={e => { setName(e.target.value); setError(""); setSaved(false); }} maxLength={NAME_MAX} disabled={blocked}/></label>
        <Picks label={LEVEL} options={levels} value={level} set={v => { setLevel(v); setSaved(false); }}/>
        <Picks label={SIDE} options={sides} value={side} set={v => { setSide(v); setSaved(false); }}/>
        <span className="th-note">{`A new name, level or ${SIDE_WORD} also shows on your earlier reviews and comments.`}</span>
        {error && <span className="th-err" role="alert">{error}</span>}
        {saved && <span className="th-note" role="status">Saved. Your posts show the change too.</span>}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit" className="th-btn round lime" disabled={busy || blocked || !dirty}>{busy ? "Saving…" : "Save"}</button>
          {back(next)}
        </div>
      </form>
    </article>
    <YourPosts/>
    <section className="th-card th-sec">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <form method="post" action="/auth/signout" onSubmit={() => forgetAccount()}><button className="th-btn">Sign out</button></form>
        {!del && <button type="button" className="th-mini-btn" onClick={() => setDel(true)}>Delete account</button>}
      </div>
      {del && <div className="th-form" style={{ marginTop: 10 }}>
        <p className="th-lead">Deleting removes your email and sign-in, and frees the name. Your posts stay under the name, without the member mark, unless you tick the box.</p>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}><input type="checkbox" checked={removePosts} onChange={e => setRemovePosts(e.target.checked)}/>Also delete my reviews and comments</label>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" className="th-btn dark" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete my account"}</button>
          <button type="button" className="th-mini-btn" onClick={() => setDel(false)}>Cancel</button>
        </div>
      </div>}
    </section>
  </>;
}
