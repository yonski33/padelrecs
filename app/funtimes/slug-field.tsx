"use client";
import { useState } from "react";
import { slugify } from "../../lib/slug";
import { niche, productHref } from "../../lib/niche";
const w = niche.words;

/** Page-address field: shows the full URL as you type and can rebuild the slug from the racket name field. */
export default function SlugField({ initial, oldSlugs, shape }: { initial: string; oldSlugs: string[]; shape?: string | null }) {
  const [slug, setSlug] = useState(initial);
  const clean = slugify(slug);
  function fromName(event: React.MouseEvent<HTMLButtonElement>) {
    const name = event.currentTarget.form?.querySelector<HTMLInputElement>('input[name="name"]')?.value || "";
    setSlug(slugify(name));
  }
  return <div className="field slug-field">
    <label htmlFor="slug">Page address (URL)</label>
    <div className="slug-input"><span>{`${niche.site.domain}${productHref({ slug: "", shape })}`}</span><input id="slug" name="slug" value={slug} onChange={e => setSlug(e.target.value)} maxLength={200} required spellCheck={false} autoComplete="off"/></div>
    <div className="slug-actions">
      <button type="button" className="text-button" onClick={fromName}>{`Match the ${w.one} name`}</button>
      {clean !== initial && clean && <span>Will become <b>{productHref({ slug: clean, shape })}</b>. The current address will redirect there.</span>}
    </div>
    {oldSlugs.length > 0 && <small>Old addresses that redirect here: {oldSlugs.map(s => <code key={s}>{productHref({ slug: s, shape })}</code>)}</small>}
  </div>;
}
