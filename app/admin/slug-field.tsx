"use client";
import { useState } from "react";
import { slugify } from "../../lib/slug";
import { niche } from "../../lib/niche";
const w = niche.words;

/** Page-address field: shows the full URL as you type and can rebuild the slug from the racket name field. */
export default function SlugField({ initial, oldSlugs }: { initial: string; oldSlugs: string[] }) {
  const [slug, setSlug] = useState(initial);
  const clean = slugify(slug);
  function fromName(event: React.MouseEvent<HTMLButtonElement>) {
    const name = event.currentTarget.form?.querySelector<HTMLInputElement>('input[name="name"]')?.value || "";
    setSlug(slugify(name));
  }
  return <div className="field slug-field">
    <label htmlFor="slug">Page address (URL)</label>
    <div className="slug-input"><span>{`${niche.site.domain}/rackets/`}</span><input id="slug" name="slug" value={slug} onChange={e => setSlug(e.target.value)} maxLength={200} required spellCheck={false} autoComplete="off"/></div>
    <div className="slug-actions">
      <button type="button" className="text-button" onClick={fromName}>{`Match the ${w.one} name`}</button>
      {clean !== initial && clean && <span>Will become <b>/rackets/{clean}</b>. The current address will redirect there.</span>}
    </div>
    {oldSlugs.length > 0 && <small>Old addresses that redirect here: {oldSlugs.map(s => <code key={s}>/rackets/{s}</code>)}</small>}
  </div>;
}
