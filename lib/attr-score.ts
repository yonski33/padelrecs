// The scorer and matcher for attribute-kind profiles (lib/attr-profile.ts; ENGINE-PLAN.md §2D–E). Evidence rows in, a
// 0–100 score per product and attribute out, with how many voices it rests on, then the visitor's picks into a match %.
// Pure functions, so tests feed plain objects.
//   - one voice counts once: rows are netted per author (or per report when the author is unknown) before counting;
//   - quality: the net share of praise against complaints over the product's reports, smoothed, ranked within the products
//     it applies to; 3 dots is the floor, 4–5 for the top 40% / 9%, 2 only for complaint attributes at the bad end;
//   - suits: what members of the group said (+1 liked, 0 mixed, −1 not), pulled toward the product's overall verdict and
//     its stand-in quality while few have spoken; no score below `minGroup` members;
//   - axis: where the voices put it between the two ends, pulled to the middle while few have spoken;
//   - fact: the latest maker / owner row.
import type { EvidenceRow } from "./evidence";
import { applies, type AttrDef, type AttrProfile } from "./attr-profile";

export type AttrScore = { score: number; n: number; plus?: number; minus?: number };
export type ProductAttrs = { scores: Record<string, AttrScore | null>; facts: Record<string, string | number | null> };
export type ScoreInput = { id: string; shape: string | null; reports: number; /** −1..1: (positive − negative) / judged. */ verdict: number | null };

const VOICE = (r: EvidenceRow) => r.authorKey ?? r.sourceRef.split("#")[0];
/** Bands: rank percentile → 0–100 (5 dots ≥ 80, 4 ≥ 65, 3 ≥ 45, 2 ≥ 30). */
const TOP4 = 0.4, TOP5 = 0.09, WORST = 0.1, MIN_COMPLAINTS = 3, SMOOTH = 4;
/** Under this many people of a skin type, the words say "few reports so far", never "great" (owner 2026-11-16: "Acne-prone:
 *  great" from 4 people). The score still counts for the match. */
export const FEW_VOICES = 6;
export const dotsOf = (s: number) => s >= 80 ? 5 : s >= 65 ? 4 : s >= 45 ? 3 : s >= 30 ? 2 : 1;

/** Net each voice per attribute: one author, one +1 / −1 (or 0 for a mixed voice on an axis or suits row). */
function voices(rows: EvidenceRow[]) {
  const by = new Map<string, Map<string, { sum: number; best: number }>>(); // attribute → voice → net
  for (const r of rows) {
    if (r.value === null) continue;
    const a = by.get(r.attribute) ?? new Map(); by.set(r.attribute, a);
    const k = VOICE(r), v = a.get(k) ?? { sum: 0, best: 0 };
    v.sum += r.value * r.strength; v.best = Math.max(v.best, r.strength); a.set(k, v);
  }
  return by;
}

export function scoreAll(profile: AttrProfile, products: ScoreInput[], rows: EvidenceRow[]): Map<string, ProductAttrs> {
  const byProduct = new Map<string, EvidenceRow[]>();
  for (const r of rows) { const l = byProduct.get(r.productId) ?? []; l.push(r); byProduct.set(r.productId, l); }
  const net = new Map(products.map(p => [p.id, voices(byProduct.get(p.id) ?? [])]));
  const out = new Map<string, ProductAttrs>(products.map(p => [p.id, { scores: {}, facts: {} }]));

  // Quality and axis first: suits lean on them.
  for (const a of profile.attrs.filter(a => a.kind === "quality")) {
    const cands = products.filter(p => applies(a, p.shape) && p.reports >= 3).map(p => {
      const v = [...(net.get(p.id)!.get(a.key)?.values() ?? [])];
      const plus = v.filter(x => x.sum > 0).length, minus = v.filter(x => x.sum < 0).length;
      return { p, plus, minus, s: (plus - minus) / (p.reports + SMOOTH) };
    });
    const sorted = [...cands].sort((x, y) => x.s - y.s);
    for (const c of cands) {
      // Rank percentile, ties sharing the middle of their run.
      const lo = sorted.findIndex(x => x.s === c.s), hi = sorted.length - 1 - [...sorted].reverse().findIndex(x => x.s === c.s);
      const pct = sorted.length > 1 ? ((lo + hi) / 2) / (sorted.length - 1) : 0.5;
      let score: number;
      if (pct >= 1 - TOP5 && c.plus > 0) score = 80 + 19 * (pct - (1 - TOP5)) / TOP5;
      else if (pct >= 1 - TOP4 && c.plus > 0) score = 65 + 14 * (pct - (1 - TOP4)) / (TOP4 - TOP5);
      else if (a.complaint && pct < WORST && c.minus >= MIN_COMPLAINTS && c.minus > c.plus) score = 30 + 14 * pct / WORST;
      else score = 45 + 19 * Math.min(1, pct / (1 - TOP4));
      out.get(c.p.id)!.scores[a.key] = { score: Math.round(score), n: c.plus + c.minus, plus: c.plus, minus: c.minus };
    }
    for (const p of products) if (!(a.key in out.get(p.id)!.scores)) out.get(p.id)!.scores[a.key] = null;
  }
  for (const a of profile.attrs.filter(a => a.kind === "axis")) for (const p of products) {
    const v = [...(net.get(p.id)!.get(a.key)?.values() ?? [])].filter(x => x.sum !== 0);
    if (!applies(a, p.shape) || v.length < profile.minAxis) { out.get(p.id)!.scores[a.key] = null; continue; }
    const pos = v.reduce((s, x) => s + Math.sign(x.sum), 0) / (v.length + 2);
    out.get(p.id)!.scores[a.key] = { score: Math.round(50 + 50 * pos), n: v.length };
  }
  for (const a of profile.attrs.filter(a => a.kind === "suits")) for (const p of products) {
    const v = [...(net.get(p.id)!.get(a.key)?.values() ?? [])];
    if (v.length < profile.minGroup || !applies(a, p.shape)) { out.get(p.id)!.scores[a.key] = null; continue; }
    const sum = v.reduce((s, x) => s + Math.max(-1, Math.min(1, x.sum)), 0);
    // The prior: the product's overall verdict, and its stand-in attribute (−1..1) where it has one.
    const pa = a.prior && out.get(p.id)!.scores[a.prior.attr];
    const lean = pa ? a.prior!.sign * (pa.score - 50) / 50 : null;
    const prior = lean === null ? (p.verdict ?? 0) : 0.5 * (p.verdict ?? 0) + 0.5 * lean;
    const K = 3, m = (sum + K * prior) / (v.length + K);
    out.get(p.id)!.scores[a.key] = { score: Math.round(Math.max(0, Math.min(99, 50 + 50 * m))), n: v.length,
      plus: v.filter(x => x.sum > 0).length, minus: v.filter(x => x.sum < 0).length };
  }
  // Facts: owner rows win over maker rows; the latest of each.
  for (const a of profile.attrs.filter(a => a.kind === "fact")) for (const p of products) {
    const rs = (byProduct.get(p.id) ?? []).filter(r => r.attribute === a.key && applies(a, p.shape))
      .sort((x, y) => (x.sourceKind === "owner" ? 1 : 0) - (y.sourceKind === "owner" ? 1 : 0) || (x.saidAt ?? "").localeCompare(y.saidAt ?? ""));
    const last = rs.at(-1);
    out.get(p.id)!.facts[a.key] = last ? last.valueText ?? last.value : null;
  }
  return out;
}

/** Words for a score: suits ("great for dry skin"), quality (the profile's words), axis ("light", "rich-ish"). */
export function attrWords(a: AttrDef, s: AttrScore | null | undefined): string | null {
  if (!s) return null;
  if (a.kind === "suits" && s.n < FEW_VOICES) return "few reports";
  if (a.kind === "suits") return s.score >= 80 ? "great" : s.score >= 65 ? "good" : s.score >= 50 ? "mixed" : s.score >= 35 ? "often not" : "not for";
  if (a.kind === "axis") { const [lo, hi] = a.ends!; return s.score < 30 ? lo : s.score < 43 ? `on the ${lo} side` : s.score <= 57 ? `between ${lo} and ${hi}` : s.score <= 70 ? `on the ${hi} side` : hi; }
  const w = a.words; if (!w) return null;
  return w[5 - dotsOf(s.score)] ?? w[2];
}

// ── Quick match ────────────────────────────────────────────────────────────────────────────────────────────────────────
export type AttrChoice = { type: string | null; skin: string | null; concerns: string[]; finish: string | null; ff: boolean };
export const EMPTY_CHOICE: AttrChoice = { type: null, skin: null, concerns: [], finish: null, ff: false };
export const choiceEmpty = (c: AttrChoice) => !c.skin && !c.concerns.length && !c.finish && !c.ff;

/** Where a skin type sits on the texture axis when no finish is picked (oily: light, dry: richer). */
const TEXTURE_FOR: Record<string, number> = { oily: 20, combination: 35, normal: 50, dry: 70 };
export type MatchPart = { key: string; label: string; score: number; n: number; weight: number };
export type AttrMatch = { pct: number | null; parts: MatchPart[]; missing: string[] };

/** The match % for one product and a choice. No % when the skin type or a ticked concern has too few voices: the page says
 *  "not enough reports yet" instead. `signal` is the Player score (0–99) or null. */
export function attrMatch(profile: AttrProfile, p: ProductAttrs, shape: string | null, signal: number | null, c: AttrChoice): AttrMatch {
  const w = profile.weights, parts: MatchPart[] = [], missing: string[] = [];
  const label = (k: string) => profile.groups.find(g => g.key === k)?.display ?? k;
  // Hardly anyone writes "I have normal skin": normal leans on the overall verdict (user score) and a middle texture instead.
  if (c.skin && c.skin !== "normal") {
    const s = p.scores[`suits_${c.skin}`];
    if (s) parts.push({ key: `suits_${c.skin}`, label: label(c.skin), score: s.score, n: s.n, weight: w.group }); else missing.push(label(c.skin));
  }
  for (const k of c.concerns) {
    const s = p.scores[`suits_${k}`];
    if (s) parts.push({ key: `suits_${k}`, label: label(k), score: s.score, n: s.n, weight: w.concerns / c.concerns.length }); else missing.push(label(k));
  }
  const finish = profile.attrs.find(a => a.key === "finish"), texture = profile.attrs.find(a => a.key === "texture");
  if (c.finish && finish && applies(finish, shape)) {
    const s = p.scores.finish, target = c.finish === finish.ends![0] ? 0 : 100;
    if (s) parts.push({ key: "finish", label: `${c.finish} finish`, score: Math.max(0, 100 - Math.abs(s.score - target)), n: s.n, weight: w.feel }); else missing.push(`${c.finish} finish`);
  } else if (c.skin && texture && TEXTURE_FOR[c.skin] !== undefined && p.scores.texture) {
    const s = p.scores.texture;
    parts.push({ key: "texture", label: "texture", score: Math.max(0, 100 - Math.abs(s.score - TEXTURE_FOR[c.skin])), n: s.n, weight: w.feel / 2 });
  }
  if (signal !== null) parts.push({ key: "score", label: "user score", score: signal, n: 0, weight: w.score });
  if (missing.length || (!parts.some(x => x.key !== "score") && !(c.skin === "normal" || c.ff))) return { pct: null, parts, missing };
  const tw = parts.reduce((s, x) => s + x.weight, 0);
  return { pct: Math.round(parts.reduce((s, x) => s + x.score * x.weight, 0) / tw), parts, missing };
}
// Same bands as ENGINE-ALGO.md step 7 (Strong fit ≥ 75, Worth a look 55–74); the shared lib/engine module replaces this matcher later.
export const verdictOf = (pct: number | null) => pct === null ? "thin" as const : pct >= 75 ? "good" as const : pct >= 55 ? "maybe" as const : "no" as const;
