"use client";
// "Ask a question about any racket…" (PadelRecs home and /questions, owner OK 2026-11-21): typing or tapping opens a racket
// search first; once a racket is picked, the question posts through that racket's discussion composer (comments.tsx Box,
// /api/comments, page "racket:<id>"). Every question belongs to a racket: there is no general post. Search runs here in the
// browser (instant).
import { useMemo, useState } from "react";
import { th } from "../../../lib/thread/look";
import { Box, useComments } from "./comments";

export type AskRacket = { id: string; name: string; href: string; pic: string | null };
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Composer({ r, onCancel }: { r: AskRacket; onCancel: () => void }) {
  const t = useComments(`racket:${r.id}`), [done, setDone] = useState(false);
  if (done) return <p className="th-ok" role="status">{t.note || "Posted. "}<a href={th(`${r.href}#reviews`)}>{`See it on the ${r.name} page ›`}</a></p>;
  return <>
    {t.err && <span className="th-err" role="alert">{t.err}</span>}
    <Box me={t.me} nick={t.nick} setNick={t.setNick} nicknames={[]} placeholder="What do you want to know?" cta="Post"
      onPost={async x => { const ok = await t.post(x, null); if (ok) setDone(true); return ok; }} onCancel={onCancel} back="/questions"/>
  </>;
}

export function AskQuestion({ rackets, words = { one: "racket" } }: { rackets: AskRacket[]; words?: { one: string } }) {
  const [q, setQ] = useState(""), [open, setOpen] = useState(false), [picked, setPicked] = useState<AskRacket | null>(null);
  const hits = useMemo(() => { const words = fold(q).split(/\s+/).filter(Boolean);
    return (words.length ? rackets.filter(r => words.every(w => fold(r.name).includes(w))) : rackets).slice(0, 6); }, [q, rackets]);
  if (picked) return <div className="thq-ask on">
    <div className="thq-picked"><span>Asking about</span>{picked.pic && <img src={picked.pic} alt="" loading="lazy"/>}<b>{picked.name}</b>
      <button type="button" onClick={() => { setPicked(null); setOpen(true); }}>Change</button></div>
    <Composer r={picked} onCancel={() => { setPicked(null); setQ(""); setOpen(false); }}/>
  </div>;
  return <div className="thq-ask">
    <input className="thq-ask-in" value={q} placeholder={`Ask a question about any ${words.one}…`} aria-label={`Ask a question about any ${words.one}`}
      onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }}/>
    {open && <div className="thq-pick" role="listbox" aria-label="Pick the racket first">
      <span className="lbl">{`Which ${words.one} is it about?`}</span>
      {hits.map(r => <button key={r.id} type="button" role="option" aria-selected={false} onClick={() => { setPicked(r); setOpen(false); }}>
        {r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}{r.name}</button>)}
      {hits.length === 0 && <span className="th-note">{`No ${words.one} by that name. Try the brand or model.`}</span>}
      <button type="button" className="thq-close" onClick={() => setOpen(false)}>Close</button>
    </div>}
  </div>;
}
