import type { SkinContext } from "./context";
import { skinPicked, type SkinChoice } from "../../lib/skin-choice";
import { attrWords, verdictOf, type AttrMatch } from "../../lib/attr-score";

export type SkinRow = { r: SkinContext["data"]["listed"][number]; m: AttrMatch | null; pct: number | null; signal: number | null; ff: boolean; reason: string | null };

/** The products for a choice: the type and fragrance-free are filters; with picks, ordered by match % (too few reports go
 *  last, by user score); without, by user score. Always high to low (owner, signal-score). */
export function rankSkin(ctx: SkinContext, c: SkinChoice, only?: (r: SkinRow["r"]) => boolean): SkinRow[] {
  const picked = skinPicked(c);
  const rows = ctx.data.listed.filter(r => (!c.type || r.shape === c.type) && (!only || only(r))).map(r => {
    const ff = ctx.attrs.get(r.id)?.facts.fragrance_free === "free";
    const m = picked ? ctx.match(r.id, c) : null;
    return { r, m, pct: m?.pct ?? null, signal: ctx.signal(r.id), ff, reason: m ? reasonOf(ctx, m) : null };
  }).filter(x => !c.ff || x.ff);
  return rows.sort((a, b) => (picked ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.r.name.localeCompare(b.r.name));
}

/** One short, real reason: the strongest part the match rests on ("good for dry skin · 9 people with dry skin"). */
export function reasonOf(ctx: SkinContext, m: AttrMatch): string | null {
  const part = [...m.parts].filter(p => p.key.startsWith("suits_")).sort((a, b) => b.score - a.score)[0];
  if (!part) return m.parts.find(p => p.key === "finish") ? `${m.parts.find(p => p.key === "finish")!.label}` : null;
  const a = ctx.profile.attrs.find(x => x.key === part.key)!;
  const w = attrWords(a, { score: part.score, n: part.n });
  return `${w === "not for" ? "not for" : `${w} for`} ${part.label} · ${part.n} ${part.n === 1 ? "person" : "people"} with ${part.label}`;
}
export const fitWord = (pct: number | null) => ({ good: "Strong fit", maybe: "Worth a look", no: "Probably not your match", thin: null })[verdictOf(pct)];
