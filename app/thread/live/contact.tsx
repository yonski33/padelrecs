"use client";
// Thread contact form (Contact Thread): topic pills that set the message placeholder, then name, email and message, posted to
// the site's existing contact endpoint (/api/contact: form token, honeypot, spam check, saved and mailed). The mock's
// address isn't used (owner 2026-11-19: keep the current form, don't invent an address).
import { useEffect, useRef, useState } from "react";

type Topic = { label: string; placeholder: string };
export function ContactForm({ topics, labels }: { topics: Topic[]; labels: { topics: string; email: string; emailPh: string; message: string; send: string; sentTitle: string; sentBody: string; again: string } }) {
  const token = useRef(""), [topic, setTopic] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState(false);
  const load = () => fetch("/api/contact", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { token?: string } | null) => { if (b?.token) token.current = b.token; }).catch(() => {});
  useEffect(() => { load(); }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!v.name?.trim()) return setError("Add your name.");
    if (!/^\S+@\S+\.\S+$/.test(v.email?.trim() || "")) return setError("Add an email address for the reply.");
    if ((v.message || "").trim().length < 10) return setError("Your message needs at least 10 characters.");
    if (!token.current) await load();
    if (!token.current) return setError("Could not reach the site. Check your connection and try again.");
    setBusy(true);
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, subject: topics[topic].label, formToken: token.current }) });
      const b = await r.json() as { error?: string };
      if (!r.ok) throw new Error(b.error || "Could not send your message.");
      setDone(true);
    } catch (x) { setError(x instanceof Error ? x.message : "Could not send your message."); } finally { setBusy(false); }
  }
  if (done) return <div className="th-ok" role="status"><b>{labels.sentTitle}</b><p>{labels.sentBody}</p>
    <button type="button" className="th-btn" style={{ marginTop: 8 }} onClick={() => { setDone(false); load(); }}>{labels.again}</button></div>;
  return <form className="th-form" onSubmit={submit} noValidate>
    <div className="th-fgroup"><span>{labels.topics}</span><div className="th-topics" role="group" aria-label={labels.topics}>
      {topics.map((t, i) => <button key={t.label} type="button" className="th-pick sm" aria-pressed={topic === i} onClick={() => setTopic(i)}>{t.label}</button>)}</div></div>
    <label>Your name<input name="name" autoComplete="name" maxLength={100}/></label>
    <label>{labels.email}<input name="email" type="email" autoComplete="email" placeholder={labels.emailPh} maxLength={254}/></label>
    <label>{labels.message}<textarea name="message" rows={5} placeholder={topics[topic].placeholder} maxLength={5000}/></label>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }}/>
    {error && <span className="th-err" role="alert">{error}</span>}
    <button type="submit" className="th-btn round lime" style={{ alignSelf: "flex-start" }} disabled={busy}>{busy ? "Sending…" : labels.send}</button>
  </form>;
}
