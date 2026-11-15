"use client";
import { niche, v2copy } from "../../lib/niche";
import "../pages-v2.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Contact in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/LkbuT2gi4WYrVqXDLmyc3S), PadelRecs only.
// Posts to the same /api/contact as the classic form (signed form token, honeypot). The API needs a name, an email and a
// subject: the topic (plus the racket) becomes the subject and the name is sent as "visitor". An email is required so the
// reply has somewhere to go; the mockup's optional email would need an API change for every site.
const TOPICS = [
  ["fix", "Something's wrong", "a spec, photo or summary", "Tell us what's off and what it should be.", true],
  ["missing", `Missing ${niche.words.one}`, "we don't list it yet", "Brand, model and year, plus a link if you have one.", true],
  ["idea", "Idea or feedback", "make the site better", `What would make ${niche.site.name.toLowerCase()} more useful for you?`, false],
  ["brand", "Brand or shop", "specs, stock, partnerships", "Who you are and what you need.", false],
  ["other", "Something else", "anything goes", "Go for it.", false],
] as const;
type Topic = (typeof TOPICS)[number][0];

async function fetchFormToken() {
  try { const r = await fetch("/api/contact", { cache: "no-store" }); return r.ok ? ((await r.json()) as { token?: string }).token || "" : ""; } catch { return ""; }
}

export default function ContactV2() {
  const token = useRef("");
  useEffect(() => { const load = () => fetchFormToken().then(t => { if (t) token.current = t; }); load(); const id = setInterval(load, 60 * 60_000); return () => clearInterval(id); }, []);
  const [topic, setTopic] = useState<Topic | null>(null), [racket, setRacket] = useState(""), [msg, setMsg] = useState(""), [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [sent, setSent] = useState<string | null>(null);
  const cur = TOPICS.find(t => t[0] === topic);
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const ready = !!topic && msg.trim().length >= 10 && emailOk;
  const label = !topic ? "pick a topic" : msg.trim().length < 10 ? "write a message" : !emailOk ? "add your email" : busy ? "sending…" : "Send message →";

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!ready || !cur || busy) return; setError("");
    const website = String(new FormData(e.currentTarget).get("website") ?? "");
    if (!token.current) token.current = await fetchFormToken();
    if (!token.current) { setError("Could not reach the site. Check your connection and try again."); return; }
    setBusy(true);
    try {
      const subject = `${cur[1]}${cur[4] && racket.trim() ? `: ${racket.trim()}` : ""}`.slice(0, 150);
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "visitor", email: email.trim(), subject, message: msg.trim(), website, formToken: token.current }) });
      const out = await r.json().catch(() => ({})) as { error?: string };
      if (!r.ok) throw new Error(out.error || "Could not send your message.");
      setSent(email.trim()); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) { setError(x instanceof Error ? x.message : "Could not send your message. Please try again."); } finally { setBusy(false); }
  }

  if (sent !== null) return <section className="pg2-done" role="status">
    <h1>Got it, thanks.</h1>
    <p>{`We'll reply to ${sent} within a couple of days.`}</p>
    <div className="pg2-row"><button type="button" className="pg2-btn" onClick={() => { setTopic(null); setRacket(""); setMsg(""); setSent(null); }}>send another</button><Link className="pg2-btn dark" href="/">back to rackets</Link></div>
  </section>;

  return <>
    <section className="pg2-hero">
      <div className="pg2-k">{"// contact"}</div>
      <h1>Say <span className="hl">hola</span>.</h1>
      <p className="pg2-lede">{"A real person reads every message. We usually reply within a couple of days, faster if it's a wrong spec."}</p>
    </section>
    <div className="pg2-cgrid">
      <form className="pg2-form" onSubmit={send} noValidate>
        <div className="pg2-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue=""/></label></div>
        <div role="group" aria-label="What it's about"><span className="pg2-q">{"1. What's it about?"}</span>
          <div className="pg2-topics">{TOPICS.map(([k, t, hint]) => <button key={k} type="button" className="pg2-topic" aria-pressed={topic === k} onClick={() => setTopic(k)}><b>{t}</b><span>{hint}</span></button>)}</div></div>
        {cur?.[4] && <label className="pg2-field"><span className="pg2-q">{`Which ${niche.words.one}? `}<small>(helps us find it fast)</small></span>
          <input value={racket} onChange={e => setRacket(e.target.value)} maxLength={100} placeholder={`e.g. ${v2copy.example}`}/></label>}
        <label className="pg2-field"><span className="pg2-q">2. Your message</span>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} maxLength={5000} placeholder={cur ? cur[3] : "Pick a topic above, then write away."}/></label>
        <label className="pg2-field"><span className="pg2-q">3. Your email <small>(so we can reply)</small></span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
        {error && <div className="pg2-err" role="alert">{error}</div>}
        <div className="pg2-send"><span>{"No newsletter. We won't add you to anything."}</span>
          <button type="submit" className="pg2-go" disabled={!ready || busy}>{label}</button></div>
      </form>
      <aside className="pg2-side">
        <div className="pg2-card mint"><span className="pg2-t">{`Want to review a ${niche.words.one}?`}</span>
          <span className="pg2-small">No need to write to us. Post it directly, no account needed.</span>
          <a className="pg2-btn dark" href="/add-review">+ add a review</a></div>
        <div className="pg2-note"><strong>Brands &amp; shops:</strong>{` happy to fix specs or add missing ${niche.words.many}. We don't sell placements or reviews. `}<a href="/how-we-make-these">Our rules →</a></div>
      </aside>
    </div>
  </>;
}
