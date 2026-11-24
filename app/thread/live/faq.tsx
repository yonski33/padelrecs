"use client";
import { useState } from "react";
/** The FAQ accordion (Rankings Thread v2): one open at a time. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div>{items.map((f, i) => <div key={f.q} className="th-faq">
    <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}><span>{f.q}</span><span aria-hidden="true">{open === i ? "−" : "+"}</span></button>
    {open === i && <p>{f.a}</p>}
  </div>)}</div>;
}
