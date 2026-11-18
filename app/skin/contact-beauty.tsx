"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** Contact for SkinRecs in the owner's beauty design (Claude Design "SkinRecs contact", 2026-11-16). Posts to the same
 *  /api/contact as every site's form (signed form token, honeypot); the topic (plus the product) becomes the subject and the
 *  name is sent as "visitor", as padel's v2 form does. The API needs an email, so it is required here; the mock's "prefer
 *  email?" box is left out because the site has no public inbox address. */
const TOPICS = [
  ["fix", "Something's wrong", "ingredients, photo or summary", "What's off, and what should it be?", true],
  ["missing", "Missing product", "not listed yet", "Brand and product name, plus a link if you have one.", true],
  ["idea", "Idea or feedback", "make the site better", "What would make skinrecs more useful for you?", false],
  ["brand", "Brand or shop", "formulas, stock, corrections", "Who you are and what you need.", false],
  ["other", "Something else", "anything goes", "Go for it.", false],
] as const;
type Topic = (typeof TOPICS)[number][0];

async function fetchFormToken() {
  try { const r = await fetch("/api/contact", { cache: "no-store" }); return r.ok ? ((await r.json()) as { token?: string }).token || "" : ""; } catch { return ""; }
}

export default function ContactBeauty() {
  const token = useRef("");
  useEffect(() => { const load = () => fetchFormToken().then(t => { if (t) token.current = t; }); load(); const id = setInterval(load, 60 * 60_000); return () => clearInterval(id); }, []);
  const [topic, setTopic] = useState<Topic | null>(null), [product, setProduct] = useState(""), [msg, setMsg] = useState(""), [email, setEmail] = useState("");
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
      const subject = `${cur[1]}${cur[4] && product.trim() ? `: ${product.trim()}` : ""}`.slice(0, 150);
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "visitor", email: email.trim(), subject, message: msg.trim(), website, formToken: token.current }) });
      const out = await r.json().catch(() => ({})) as { error?: string };
      if (!r.ok) throw new Error(out.error || "Could not send your message.");
      setSent(email.trim()); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) { setError(x instanceof Error ? x.message : "Could not send your message. Please try again."); } finally { setBusy(false); }
  }

  if (sent !== null) return <section className="bt-done" role="status">
    <h1>Got it, thank you.</h1>
    <p>{`You'll hear back at ${sent} within a couple of days.`}</p>
    <div className="bf-row"><button type="button" className="bf-ghost" onClick={() => { setTopic(null); setProduct(""); setMsg(""); setSent(null); }}>send another</button>
      <Link className="bp-btn" href="/products">back to products</Link></div>
  </section>;

  return <>
    <section className="bt-hero"><div className="bs-k">contact</div>
      <h1>Say <em>hello</em>.</h1>
      <p>{"A real person reads every message. We usually reply within a couple of days, faster if it's a wrong ingredient list."}</p></section>
    <div className="bt-grid">
      <form className="bt-form" onSubmit={send} noValidate>
        <div className="bt-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue=""/></label></div>
        <div role="group" aria-label="What it's about"><span className="bt-q">{"1. What's it about?"}</span>
          <div className="bt-topics">{TOPICS.map(([k, t, hint]) => <button key={k} type="button" aria-pressed={topic === k} onClick={() => setTopic(k)}><b>{t}</b><span>{hint}</span></button>)}</div></div>
        {cur?.[4] && <label className="bt-field"><span className="bt-q">Which product? <small>(helps us find it fast)</small></span>
          <input value={product} onChange={e => setProduct(e.target.value)} maxLength={100} placeholder="e.g. CeraVe Moisturizing Cream"/></label>}
        <label className="bt-field"><span className="bt-q">2. Your message</span>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} maxLength={5000} placeholder={cur ? cur[3] : "Pick a topic above, then write away."}/></label>
        <label className="bt-field"><span className="bt-q">3. Your email <small>(so we can reply)</small></span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
        {error && <div className="bt-err" role="alert">{error}</div>}
        <div className="bt-send"><span>{"No newsletter. We won't add you to anything."}</span>
          <button type="submit" disabled={!ready || busy}>{label}</button></div>
      </form>
      <aside className="bt-side">
        <div className="bt-card sage"><b>Want to review a product?</b><span>No need to write to us. Post it directly, no account needed.</span><a className="bp-btn" href="/add-review">+ add a review</a></div>
        <div className="bt-note"><strong>Brands &amp; shops:</strong>{" happy to fix ingredient lists or add missing products. We don't sell placements or reviews. "}<a href="/how-we-make-these">Our rules →</a></div>
        <div className="bt-note"><strong>Having a reaction?</strong> {"We can't give medical advice. Stop using the product and talk to a pharmacist or dermatologist."}</div>
      </aside>
    </div>
  </>;
}
