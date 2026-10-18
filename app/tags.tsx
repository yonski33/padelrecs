import { MAX_TAGS, TAGS, tagTone } from "../lib/tags";

export function TagList({ tags, counts }: { tags: readonly string[]; counts?: Map<string, number> }) {
  if (!tags.length) return null;
  return <div className="tags">{tags.map(t => <span key={t} className={`tag ${tagTone(t)}`}>{t}{counts && <span className="c">{counts.get(t)}</span>}</span>)}</div>;
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
