import { skinPicked, type SkinChoice } from "../../lib/skin-choice";
import { attrWords, attrMatch, verdictOf, FEW_VOICES, type AttrMatch, type AttrChoice, type ProductAttrs } from "../../lib/attr-score";
import type { AttrProfile } from "../../lib/attr-profile";

// Pure: the server (app/skin/context.ts) and the browser (a page's payload, app/skin/payload.ts) rank with these same functions,
// so a tap re-ranks in the browser exactly as the cached page for that address would (app/instant-view.ts).

/** What ranking needs about one product. The server's context holds full catalog rows; the browser's holds these. */
export type SkinItem = { id: string; shape: string | null; name: string };
export type SkinRankCtx<R extends SkinItem = SkinItem> = {
  data: { listed: R[] }; profile: AttrProfile; attrs: Map<string, ProductAttrs>;
  signal: (id: string) => number | null; match: (id: string, c: AttrChoice) => AttrMatch };
/** One product as a page sends it to the browser. */
export type SkinWire = SkinItem & { signal: number | null; attrs: ProductAttrs };
/** The ranking context for products sent with a page. */
export function wireCtx(profile: AttrProfile, items: SkinWire[]): SkinRankCtx<SkinWire> {
  const byId = new Map(items.map(x => [x.id, x]));
  const signal = (id: string) => byId.get(id)?.signal ?? null;
  return { data: { listed: items }, profile, attrs: new Map(items.map(x => [x.id, x.attrs])), signal,
    match: (id, c) => attrMatch(profile, byId.get(id)?.attrs ?? { scores: {}, facts: {} }, byId.get(id)?.shape ?? null, signal(id), c) };
}

/** What each step-2 goal adds to the match: the score it stands for (owner's design 2026-11-16). */
export const GOAL_ATTR: Partial<Record<NonNullable<SkinChoice["goal"]>, { key: string; label: string }>> = {
  hydrate: { key: "hydration", label: "hydration" }, calm: { key: "gentle", label: "gentleness" }, clear: { key: "breakouts", label: "breakouts" } };
const TEX_TARGET = { light: 15, rich: 85 } as const;

/** The match for one product and a choice: the engine's (skin type, concerns, finish), plus the goal's score and a preferred
 *  texture, as weighted parts. The home list and the product page use this one number. */
export function skinMatch(ctx: SkinRankCtx<SkinItem>, id: string, c: SkinChoice): AttrMatch {
  const m = ctx.match(id, c), a = ctx.attrs.get(id);
  const parts = [...m.parts];
  const g = c.goal ? GOAL_ATTR[c.goal] : undefined, gs = g ? a?.scores[g.key] : null;
  if (g && gs) parts.push({ key: g.key, label: g.label, score: gs.score, n: gs.n, weight: 0.3 });
  const ts = c.tex ? a?.scores.texture : null;
  if (c.tex && ts) parts.push({ key: "texture", label: "texture", score: Math.max(0, 100 - Math.abs(ts.score - TEX_TARGET[c.tex])), n: ts.n, weight: 0.15 });
  // A goal alone (no skin type yet) still answers from its score; a picked skin type with too few voices gives no %.
  const real = parts.filter(p => p.key !== "score");
  const pct = m.missing.length || !real.length ? null : Math.round(parts.reduce((s2, p) => s2 + p.score * p.weight, 0) / parts.reduce((s2, p) => s2 + p.weight, 0));
  return { pct, parts, missing: m.missing };
}

/** The catalogue's "good for" groups: each is a suits_<key> score. */
export const SKIN_GROUPS = [["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["sensitive", "Sensitive"], ["acne", "Acne-prone"]] as const;

export type SkinRow<R extends SkinItem = SkinItem> = { r: R; m: AttrMatch | null; pct: number | null; signal: number | null; ff: boolean; reason: string | null };

/** The products for a choice: the type and fragrance-free are filters; with picks, ordered by match % (too few reports go
 *  last, by user score); without, by user score. Always high to low (owner, signal-score). */
export function rankSkin<R extends SkinItem>(ctx: SkinRankCtx<R>, c: SkinChoice, only?: (r: R) => boolean): SkinRow<R>[] {
  const picked = skinPicked(c);
  const rows = ctx.data.listed.filter(r => (!c.type || r.shape === c.type) && (!only || only(r))).map(r => {
    const ff = ctx.attrs.get(r.id)?.facts.fragrance_free === "free";
    const m = picked ? skinMatch(ctx, r.id, c) : null;
    return { r, m, pct: m?.pct ?? null, signal: ctx.signal(r.id), ff, reason: m ? reasonOf(ctx, m) : null };
  }).filter(x => (!c.ff || x.ff) && (!c.budget || ctx.attrs.get(x.r.id)?.facts.price === c.budget));
  return rows.sort((a, b) => (picked ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.r.name.localeCompare(b.r.name));
}

/** One short, real reason: the strongest part the match rests on ("good for dry skin · 9 people with dry skin"). */
export function reasonOf(ctx: Pick<SkinRankCtx<SkinItem>, "profile">, m: AttrMatch): string | null {
  const part = [...m.parts].filter(p => p.key.startsWith("suits_")).sort((a, b) => b.score - a.score)[0];
  if (!part) return m.parts.find(p => p.key === "finish") ? `${m.parts.find(p => p.key === "finish")!.label}` : null;
  // Few people of that type so far: say so, without a verdict word.
  if (part.n < FEW_VOICES) return `${part.n} ${part.n === 1 ? "person" : "people"} with ${part.label} so far`;
  const a = ctx.profile.attrs.find(x => x.key === part.key)!;
  const w = attrWords(a, { score: part.score, n: part.n });
  return `${w === "not for" ? "not for" : `${w} for`} ${part.label} · ${part.n} ${part.n === 1 ? "person" : "people"} with ${part.label}`;
}
export const fitWord = (pct: number | null) => ({ good: "Strong fit", maybe: "Worth a look", no: "Probably not", thin: null })[verdictOf(pct)];
