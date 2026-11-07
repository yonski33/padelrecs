import { MAX_TAGS, TAGS, tagTone } from "../lib/tags";

/** A review's variant (DiscGolfRecs: its plastic), shown at the end of its tag row but styled apart from the tags. */
export function VariantPill({ label, value }: { label: string; value: string }) {
  return <span className="variant-pill" title={`${label}: ${value}`} aria-label={`${label}: ${value}`}>{value}</span>;
}

export function TagList({ tags, counts, lead, trail }: { tags: readonly string[]; counts?: Map<string, number>; lead?: React.ReactNode; trail?: React.ReactNode }) {
  if (!tags.length && !lead && !trail) return null;
  return <div className="tags">{lead}{tags.map(t => <span key={t} className={`tag ${tagTone(t)}`}>{t}{counts && <span className="c">{counts.get(t)}</span>}</span>)}{trail}</div>;
}

/** Checkbox chips for the admin forms; works without JavaScript. The server enforces the limit. */
export function TagCheckboxes({ selected = [] }: { selected?: readonly string[] }) {
  return <fieldset className="tag-field">
    <legend>Quick tags <span className="muted">(optional, up to {MAX_TAGS}, based on what the review says)</span></legend>
    <div className="chip-picker">{TAGS.map(t => <label key={t.label} className={t.tone}>
      <input type="checkbox" name="tags" value={t.label} defaultChecked={selected.includes(t.label)}/><span>{t.label}</span>
    </label>)}</div>
  </fieldset>;
}
