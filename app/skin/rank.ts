import type { SkinContext } from "./context";
import { skinPicked, type SkinChoice } from "../../lib/skin-choice";
import { attrWords, verdictOf, FEW_VOICES, type AttrMatch } from "../../lib/attr-score";

/** What each step-2 goal adds to the match: the score it stands for (owner's design 2026-11-16). */
export const GOAL_ATTR: Partial<Record<NonNullable<SkinChoice["goal"]>, { key: string; label: string }>> = {
  hydrate: { key: "hydration", label: "hydration" }, calm: { key: "gentle", label: "gentleness" }, clear: { key: "breakouts", label: "breakouts" } };
const TEX_TARGET = { light: 15, rich: 85 } as const;

/** The match for one product and a choice: the engine's (skin type, concerns, finish), plus the goal's score and a preferred
 *  texture, as weighted parts. The home list and the product page use this one number. */
export function skinMatch(ctx: SkinContext, id: string, c: SkinChoice): AttrMatch {
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

export type SkinRow = { r: SkinContext["data"]["listed"][number]; m: AttrMatch | null; pct: number | null; signal: number | null; ff: boolean; reason: string | null };

/** The products for a choice: the type and fragrance-free are filters; with picks, ordered by match % (too few reports go
 *  last, by user score); without, by user score. Always high to low (owner, signal-score). */
export function rankSkin(ctx: SkinContext, c: SkinChoice, only?: (r: SkinRow["r"]) => boolean): SkinRow[] {
  const picked = skinPicked(c);
  const rows = ctx.data.listed.filter(r => (!c.type || r.shape === c.type) && (!only || only(r))).map(r => {
    const ff = ctx.attrs.get(r.id)?.facts.fragrance_free === "free";
    const m = picked ? skinMatch(ctx, r.id, c) : null;
    return { r, m, pct: m?.pct ?? null, signal: ctx.signal(r.id), ff, reason: m ? reasonOf(ctx, m) : null };
  }).filter(x => (!c.ff || x.ff) && (!c.budget || ctx.attrs.get(x.r.id)?.facts.price === c.budget));
  return rows.sort((a, b) => (picked ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.r.name.localeCompare(b.r.name));
}

/** One short, real reason: the strongest part the match rests on ("good for dry skin · 9 people with dry skin"). */
export function reasonOf(ctx: SkinContext, m: AttrMatch): string | null {
  const part = [...m.parts].filter(p => p.key.startsWith("suits_")).sort((a, b) => b.score - a.score)[0];
  if (!part) return m.parts.find(p => p.key === "finish") ? `${m.parts.find(p => p.key === "finish")!.label}` : null;
  // Few people of that type so far: say so, without a verdict word.
  if (part.n < FEW_VOICES) return `${part.n} ${part.n === 1 ? "person" : "people"} with ${part.label} so far`;
  const a = ctx.profile.attrs.find(x => x.key === part.key)!;
  const w = attrWords(a, { score: part.score, n: part.n });
  return `${w === "not for" ? "not for" : `${w} for`} ${part.label} · ${part.n} ${part.n === 1 ? "person" : "people"} with ${part.label}`;
}
export const fitWord = (pct: number | null) => ({ good: "Strong fit", maybe: "Worth a look", no: "Probably not", thin: null })[verdictOf(pct)];
