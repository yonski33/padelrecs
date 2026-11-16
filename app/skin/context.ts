// The skin pages' data (SkinRecs on the match engine, ENGINE-PLAN.md step 6): the catalog, the evidence store and the
// attribute scores (lib/attr-score.ts), worked out once and kept for a few minutes, like the catalog itself.
import { catalog, type Catalog } from "../../db/data";
import { evidenceRows } from "../../db/evidence";
import { niche } from "../../lib/niche";
import { attrProfileFor, type AttrProfile } from "../../lib/attr-profile";
import { scoreAll, attrMatch, type ProductAttrs, type AttrChoice, type AttrMatch } from "../../lib/attr-score";
import type { EvidenceRow } from "../../lib/evidence";
import { productSignals } from "../signals";
import { withSafety } from "../../lib/skin-safety";
import { skinPage } from "../../lib/skin-page";

export type SkinContext = {
  data: Catalog; profile: AttrProfile; attrs: Map<string, ProductAttrs>;
  counts: Map<string, { n: number; positive: number; mixed: number; negative: number }>;
  quotes: Map<string, EvidenceRow[]>; signal: (id: string) => number | null;
  match: (id: string, c: AttrChoice) => AttrMatch;
};
const TTL = 5 * 60_000;
let memo: { at: number; value: Promise<SkinContext> } | null = null;

export function skinContext(): Promise<SkinContext> {
  if (memo && Date.now() - memo.at < TTL) return memo.value;
  const value = load();
  memo = { at: Date.now(), value };
  value.catch(() => { if (memo?.value === value) memo = null; });
  return value;
}

async function load(): Promise<SkinContext> {
  const profile = attrProfileFor(niche);
  if (!profile) throw new Error(`No attribute profile for ${niche.id}`);
  const [data, sigs, rows] = await Promise.all([catalog(), productSignals(), evidenceRows()]);
  const counts = new Map(data.listed.map(r => [r.id, { n: 0, positive: 0, mixed: 0, negative: 0 }]));
  for (const r of data.reviews) { const c = counts.get(r.racketId); if (!c) continue; c.n++; if (r.rating >= 4) c.positive++; else if (r.rating === 3) c.mixed++; else c.negative++; }
  for (const e of data.external) { const c = counts.get(e.racketId); if (!c) continue; c.n++; if (e.sentiment) c[e.sentiment]++; }
  const scored = scoreAll(profile, data.listed.map(r => {
    const c = counts.get(r.id)!, judged = c.positive + c.mixed + c.negative;
    return { id: r.id, shape: r.shape, reports: c.n, verdict: judged ? (c.positive - c.negative) / judged : null };
  }), rows);
  // Strength, acid, use and our own page's "too strong" verdict, which the match reads with "reacts easily" (lib/skin-safety.ts).
  const attrs = new Map(data.listed.map(r => [r.id, withSafety(scored.get(r.id) ?? { scores: {}, facts: {} }, r.name, r.shape, (skinPage(r.slug)?.no ?? []).map(x => x.title))]));
  const quotes = new Map<string, EvidenceRow[]>();
  for (const r of rows) if (r.quote && r.sourceKind !== "maker") { const l = quotes.get(r.productId) ?? []; l.push(r); quotes.set(r.productId, l); }
  const signal = (id: string) => sigs.get(id)?.signal ?? null;
  const shapeOf = new Map(data.listed.map(r => [r.id, r.shape]));
  return { data, profile, attrs, counts, quotes, signal,
    match: (id, c) => attrMatch(profile, attrs.get(id) ?? { scores: {}, facts: {} }, shapeOf.get(id) ?? null, signal(id), c) };
}
