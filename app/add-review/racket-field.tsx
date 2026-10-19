"use client";
import { useMemo, useState } from "react";
import { matchingRackets } from "../../lib/racket-search";
import { ProductIcon } from "../icons";
import { niche } from "../../lib/niche";

const { words: w, examples: ex } = niche;

export type FieldRacket = { id: string; name: string; slug: string; shape: string | null; brand?: string };

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (s: string) => norm(s).split(" ").filter(Boolean).map(t => /^\d+$/.test(t) ? String(Number(t)) : t);

function within1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
const similar = (a: string, b: string) => a === b || (a.length >= 3 && b.startsWith(a)) || (a.length >= 4 && b.length >= 4 && within1(a, b));

/** Near-misses for typos like "Vertx 5 2026": most typed words resemble a word in the racket name. */
function closeRackets(list: FieldRacket[], typed: string) {
  const want = tokens(typed);
  if (want.length < 2) return [];
  return list.map(r => {
    const have = tokens(r.name);
    const hits = want.filter(w => have.some(h => similar(w, h))).length;
    return { r, score: hits / want.length, hits };
  }).filter(x => x.hits >= 2 && x.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.r);
}

/** Best guess at brand / model / year from free text, e.g. "Nox AT10 Genius 18K 2026". */
function guess(typed: string, brands: { name: string }[]) {
  const text = typed.trim().replace(/\s+/g, " ");
  const brand = [...brands].sort((a, b) => b.name.length - a.name.length).find(b => text.toLowerCase().startsWith(b.name.toLowerCase() + " "));
  const year = text.match(/(?:^|\s)((?:19|20)\d{2})$/)?.[1] ?? "";
  const rest = text.slice(brand ? brand.name.length + 1 : 0).replace(/\s*(?:19|20)\d{2}$/, "");
  if (brand) return { brand: brand.name, model: rest, year };
  const [first = "", ...others] = rest.split(" ");
  return { brand: first, model: others.join(" "), year };
}

export default function RacketField({ rackets, brands, initialRacket }: { rackets: FieldRacket[]; brands: { name: string }[]; initialRacket?: string }) {
  const initial = rackets.find(r => r.id === initialRacket) ?? null;
  const [text, setText] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<FieldRacket | null>(initial);
  const [forceNew, setForceNew] = useState(false);
  const [edits, setEdits] = useState<null | { brand: string; model: string; year: string }>(null);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);

  const typed = text.trim();
  const matches = useMemo(() => selected || !typed ? [] : matchingRackets(rackets, typed).slice(0, 6), [rackets, typed, selected]);
  const close = useMemo(() => selected || !typed || matches.length ? [] : closeRackets(rackets, typed), [rackets, typed, matches.length, selected]);
  const suggestions = matches.length ? matches : close;
  const isNew = !selected && typed.length >= 3 && (forceNew || !suggestions.length);
  const parts = edits ?? guess(typed, brands);

  function choose(r: FieldRacket) { setSelected(r); setText(r.name); setForceNew(false); setEdits(null); setActive(-1); }
  function change() { setSelected(null); setText(""); setForceNew(false); setEdits(null); }

  return <div className="racket-field">
    <input type="hidden" name="racketMode" value={selected ? "existing" : "new"}/>
    <input type="hidden" name="racketId" value={selected?.id ?? ""}/>

    {selected ? <div className="picked">
      <ProductIcon shape={selected.shape} brand={selected.brand}/>
      <span><b>{selected.name}</b>{selected.shape ?? "In the database"}</span>
      <button type="button" className="text-button" onClick={change}>Change</button>
    </div> : <div className="combo">
      <label className="sr-only" htmlFor="racket-input">{w.One}</label>
      <input id="racket-input" value={text} autoComplete="off" placeholder={`Start typing, e.g. ${ex.brand} ${ex.model} ${ex.year}`}
        role="combobox" aria-expanded={focused && suggestions.length > 0 && !isNew} aria-controls="racket-options" aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `racket-option-${active}` : undefined}
        onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
        onChange={e => { setText(e.target.value); setForceNew(false); setEdits(null); setActive(-1);
          const exact = rackets.find(r => norm(r.name) === norm(e.target.value)); if (exact) choose(exact); }}
        onKeyDown={e => {
          if (!suggestions.length || isNew) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setActive(i => e.key === "ArrowDown" ? (i + 1) % suggestions.length : (i <= 0 ? suggestions.length : i) - 1); }
          if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(suggestions[active]); }
        }}/>
      {typed && !isNew && suggestions.length > 0 && <div className="combo-list">
        <p className="combo-label">{matches.length ? "In the database" : "Did you mean…"}</p>
        <ul id="racket-options" role="listbox" aria-label={`Matching ${w.many}`}>
          {suggestions.map((r, i) => <li key={r.id} role="presentation">
            <button type="button" id={`racket-option-${i}`} role="option" aria-selected={i === active} className="sug-item"
              onMouseDown={e => e.preventDefault()} onClick={() => choose(r)}>
              <ProductIcon shape={r.shape} brand={r.brand}/><span className="nm">{r.name}{r.shape && <span className="mt">{r.shape}</span>}</span><span className="ct">pick</span>
            </button>
          </li>)}
        </ul>
        {typed.length >= 3 && <button type="button" className="combo-new" onMouseDown={e => e.preventDefault()} onClick={() => setForceNew(true)}>
          None of these — add “{typed}{`” as a new ${w.one}`}
        </button>}
      </div>}
    </div>}

    {isNew && <div className="new-racket">
      <p><b>Not in the database yet — we’ll add it.</b> Check we split it right:</p>
      <div className="new-racket-grid">
        <label>Brand<input name="brandName" list="brand-options" value={parts.brand} maxLength={100} required onChange={e => setEdits({ ...parts, brand: e.target.value })}/></label>
        <label>Model<input name="modelName" value={parts.model} maxLength={150} required onChange={e => setEdits({ ...parts, model: e.target.value })}/></label>
        <label>Year<input name="year" type="number" inputMode="numeric" min={1980} max={2100} value={parts.year} required placeholder={String(ex.year)} onChange={e => setEdits({ ...parts, year: e.target.value })}/></label>
      </div>
      <datalist id="brand-options">{brands.map(b => <option key={b.name} value={b.name}/>)}</datalist>
      {!parts.year && <p className="help">Add the year — it tells this season’s model apart from last one’s.</p>}
      {forceNew && <button type="button" className="text-button" onClick={() => setForceNew(false)}>← Back to suggestions</button>}
    </div>}

    {!selected && !isNew && <p className="help">Pick it from the list as you type. Not in there? Keep typing the full name and we’ll add it.</p>}
  </div>;
}
