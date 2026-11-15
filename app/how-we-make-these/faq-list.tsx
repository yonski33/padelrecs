"use client";
import { useState } from "react";

/** The "Fair questions" list: one open at a time, the first open to start (mockup). */
export default function FaqList({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState(0);
  return <div className="hw-faqs">{faqs.map(([q, a], i) => <div key={q}>
    <button type="button" aria-expanded={open === i} onClick={() => setOpen(o => o === i ? -1 : i)}><span>{q}</span><span aria-hidden="true">{open === i ? "−" : "+"}</span></button>
    {open === i && <p>{a}</p>}
  </div>)}</div>;
}
