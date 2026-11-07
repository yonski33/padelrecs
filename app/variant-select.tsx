"use client";
import { niche } from "../lib/niche";

/**
 * The optional variant a review is about, on niches with niche.variants (DiscGolfRecs: "Plastic"). Options are the chosen
 * product's variants (its `core` list, lib/variants.ts); "Not sure / other" posts a blank, stored as null. Nothing renders on
 * other niches or for a product without a list. The server checks the value against the product again (db/review-variant.ts).
 * Callers give it a `key` per product so the choice resets when the product changes.
 */
export default function VariantSelect({ options, defaultValue, className = "field variant-field" }: { options: string[] | undefined; defaultValue?: string | null; className?: string }) {
  if (!niche.variants || !options?.length) return null;
  const label = niche.variants.label;
  return <label className={className}>{label} <span className="opt">optional</span>
    <select name="variant" defaultValue={defaultValue && options.includes(defaultValue) ? defaultValue : ""}>
      <option value="">Not sure / other</option>
      {options.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
    <small>{`Which ${label.toLowerCase()} the review is about. Leave “Not sure / other” if you don’t know or it isn’t listed.`}</small>
  </label>;
}
