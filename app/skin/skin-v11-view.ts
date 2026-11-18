// SkinRecs v11c product page (owner 2026-11-18): the browser's picks for "Better matches for your skin" (under 60%), "Other
// products to consider" (2 cards) and their gain / give-up lines. Pure, so the browser re-runs it on a tap. Every line is a
// comparison of the two products' own scores (1+ dot apart, both with enough reports) or their price tiers, so it is true of
// both (owner feedback #3: "every comparison line must be true of both products").
import { rankSkin, wireCtx, type SkinWire } from "./rank";
import { applies, type AttrProfile } from "../../lib/attr-profile";
import { dotsOf, FEW_VOICES } from "../../lib/attr-score";
import { FIT_MIN } from "../../lib/verdict-scale";
import type { SkinChoice } from "../../lib/skin-choice";

export type SkinCard = { id: string; name: string; href: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null; score: number | null };
export type SkinPeers = { self: SkinWire; peers: SkinWire[]; cards: Record<string, SkinCard>; /** Before an answer: same type, close in feel, never far below this one's score. */ similar: string[]; /** This product by its short name, for "than the …". */ ref: string };
type Edge = { gain: string; give: string };
type Row = { id: string; pct: number | null };

/** [score key, gain words, give-up words]; "suits_<skin>" is added for the visitor's skin type. */
const TRAITS: [string, string, string][] = [
  ["hydration", "More hydrating", "Less hydrating"],
  ["gentle", "Gentler on reactive skin", "More likely to irritate"],
  ["breakouts", "Less likely to clog pores", "More likely to clog pores"],
];

/** The strongest gain and the strongest give-up of `b` against `a`, on different traits; null without both. The visitor's own
 *  skin and goal come first among equal gaps. */
export function edgeOf(profile: AttrProfile, a: SkinWire, b: SkinWire, choice: SkinChoice, ref: string): Edge | null {
  const rows: [string, string, string][] = [...(choice.skin ? [[`suits_${choice.skin}`, `Better for ${choice.skin} skin`, `Less suited to ${choice.skin} skin`] as [string, string, string]] : []), ...TRAITS];
  const want = new Set([choice.skin ? `suits_${choice.skin}` : "", choice.goal === "hydrate" ? "hydration" : "", choice.goal === "calm" || choice.concerns.includes("sensitive") ? "gentle" : "",
    choice.goal === "clear" || choice.concerns.includes("acne") ? "breakouts" : ""]);
  const gaps: { gap: number; up: string; down: string; key: string }[] = [];
  for (const [k, up, down] of rows) {
    const def = profile.attrs.find(x => x.key === k); if (!def || !applies(def, a.shape)) continue;
    const sa = a.attrs.scores[k], sb = b.attrs.scores[k];
    if (!sa || !sb || sa.n < FEW_VOICES || sb.n < FEW_VOICES) continue;
    const gap = dotsOf(sb.score) - dotsOf(sa.score);
    if (gap !== 0) gaps.push({ gap: gap + (want.has(k) ? Math.sign(gap) * 0.5 : 0), up, down, key: k });
  }
  const pa = typeof a.attrs.facts.price === "string" ? a.attrs.facts.price : null, pb = typeof b.attrs.facts.price === "string" ? b.attrs.facts.price : null;
  if (pa && pb && pa.length !== pb.length) gaps.push({ gap: (pa.length - pb.length) * 0.75, up: "Costs less", down: "Costs more", key: "price" });
  const g = gaps.filter(x => x.gap > 0).sort((x, y) => y.gap - x.gap)[0], v = gaps.filter(x => x.gap < 0 && x.key !== g?.key).sort((x, y) => x.gap - y.gap)[0];
  return g && v ? { gain: `${g.up} than the ${ref}.`, give: `${v.down} than the ${ref}.` } : null;
}

/** The ranked peers for the picks, or null before an answer. */
export function ranked(profile: AttrProfile, P: SkinPeers, choice: SkinChoice): Row[] {
  const ctx = wireCtx(profile, [P.self, ...P.peers]);
  return rankSkin(ctx, { ...choice, type: P.self.shape, typeSlug: null }, x => x.id !== P.self.id && !!P.cards[x.id]).map(x => ({ id: x.r.id, pct: x.pct }));
}

/** Better matches (owner rule): only when this one is under 60%, the 3 best that beat it. */
export function betterOf(rows: Row[], pct: number | null): Row[] {
  if (pct === null || pct >= FIT_MIN) return [];
  return rows.filter(r => r.pct !== null && r.pct > pct).slice(0, 3);
}

/** Other products: after an answer the best fits (60%+) by match; before it, similar ones close to this one's score. Only
 *  cards with both an honest gain and a give-up line; at most 2. */
export function othersOf(profile: AttrProfile, P: SkinPeers, choice: SkinChoice, rows: Row[] | null): (Row & Edge)[] {
  const byId = new Map(P.peers.map(p => [p.id, p]));
  const pool: Row[] = rows ? rows.filter(r => (r.pct ?? 0) >= FIT_MIN) : P.similar.map(id => ({ id, pct: null }));
  const out: (Row & Edge)[] = [];
  for (const r of pool) {
    const b = byId.get(r.id); if (!b) continue;
    const e = edgeOf(profile, P.self, b, choice, P.ref);
    if (e) out.push({ ...r, ...e });
    if (out.length === 2) break;
  }
  return out;
}
