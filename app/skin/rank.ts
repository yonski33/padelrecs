import { skinPicked, type SkinChoice } from "../../lib/skin-choice";
import { attrWords, attrMatch, verdictOf, FEW_VOICES, type AttrMatch, type AttrChoice, type ProductAttrs } from "../../lib/attr-score";
import { applies, type AttrProfile } from "../../lib/attr-profile";

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

/** What each step-2 goal adds to the match: the score it stands for (owner's design 2026-11-16). "just everyday" adds
 *  nothing: it ranks like no goal (match tuning, owner OK 2026-11-17). */
export const GOAL_ATTR: Partial<Record<NonNullable<SkinChoice["goal"]>, { key: string; label: string }>> = {
  hydrate: { key: "hydration", label: "hydration" }, calm: { key: "gentle", label: "gentleness" }, clear: { key: "breakouts", label: "breakouts" } };
const TEX_TARGET = { light: 15, rich: 85 } as const;
/** Where a skin type sits on the texture axis when no finish or texture is picked (oily: light, dry: richer). */
const TEXTURE_FOR: Record<string, number> = { oily: 20, combination: 35, normal: 50, dry: 70 };
/** Not on lists without a type: eye creams, masks and balms answer other questions (audit #9). */
export const EVERYTHING_SKIP = new Set(["Eye cream", "Mask", "Balm & ointment"]);
/** "just everyday" ranks as no goal: same order and header as no pick at all (audit #12). */
export const effectiveChoice = (c: SkinChoice): SkinChoice => c.goal === "daily" ? { ...c, goal: null } : c;

// The match (SkinRecs match tuning pass, owner OK 2026-11-17, skinrecs-match-audit.md):
// - few voices count for less: a suits, goal or finish score is pulled toward 50, s′ = 50 + (s − 50)·n/(n + 4);
// - "reacts easily" adds gentleness (0.15) and caps: 60 for strong actives, low gentleness (< 45 from 8+ voices) or our own
//   "too strong" page verdict; fragranced, essential oils or a leave-on acid: −5, at most 74;
// - a goal with no reports counts as a neutral 50 (no free pass); a concern with no group reports uses its quality score
//   (gentle, breakouts) at half weight; normal skin uses suits_normal or the dry/oily/combination pool;
// - "acne" adds breakouts (0.15); a picked texture replaces the skin type's ideal texture;
// - the % is spread: 60 + (raw − 60)·1.3, between 5 and 97; body-first products ×0.85 (these are face lists).
const SHRINK_K = 4, STRONG_CAP = 60, SCENT_CAP = 74;
export const shrink = (s: number, n: number) => 50 + (s - 50) * n / (n + SHRINK_K);
const spread = (raw: number) => Math.max(5, Math.min(97, Math.round(60 + (raw - 60) * 1.3)));
const shapes = new WeakMap<object, Map<string, string | null>>();
const shapeIn = (ctx: SkinRankCtx<SkinItem>, id: string) => {
  let m = shapes.get(ctx.data.listed); if (!m) { m = new Map(ctx.data.listed.map(r => [r.id, r.shape])); shapes.set(ctx.data.listed, m); }
  return m.get(id) ?? null;
};

/** The match for one product and a choice, as weighted parts. Every list, the catalogue and the product page use this. */
export function skinMatch(ctx: SkinRankCtx<SkinItem>, id: string, choice: SkinChoice): AttrMatch {
  const c = effectiveChoice(choice), { profile } = ctx;
  const a = ctx.attrs.get(id) ?? { scores: {}, facts: {} }, shape = shapeIn(ctx, id), signal = ctx.signal(id);
  const sc = (k: string) => a.scores[k] ?? null;
  const label = (k: string) => profile.groups.find(g => g.key === k)?.display ?? k;
  const parts: AttrMatch["parts"] = [], missing: string[] = [];
  const add = (key: string, lab: string, score: number, n: number, weight: number, shrunk = true) =>
    parts.push({ key, label: lab, score: shrunk ? shrink(score, n) : score, n, weight });
  if (c.skin === "normal") {
    // Few people say "normal skin": its own score with 3+ voices, else the dry, oily and combination scores pooled by voices.
    const own = sc("suits_normal");
    if (own && own.n >= 3) add("suits_normal", label("normal"), own.score, own.n, 0.4);
    else {
      const pool = ["dry", "oily", "combination"].map(k => sc(`suits_${k}`)).filter((x): x is NonNullable<typeof x> => !!x);
      const n = pool.reduce((s2, x) => s2 + x.n, 0);
      if (n) add("suits_normal", label("normal"), pool.reduce((s2, x) => s2 + x.score * x.n, 0) / n, n, 0.4); else missing.push(label("normal"));
    }
  } else if (c.skin) {
    const s = sc(`suits_${c.skin}`);
    if (s) add(`suits_${c.skin}`, label(c.skin), s.score, s.n, profile.weights.group); else missing.push(label(c.skin));
  }
  const QUALITY: Record<string, string> = { sensitive: "gentle", acne: "breakouts" };
  for (const k of c.concerns) {
    const s = sc(`suits_${k}`), w = profile.weights.concerns / c.concerns.length, q = sc(QUALITY[k] ?? "");
    if (s) add(`suits_${k}`, label(k), s.score, s.n, w);
    else if (q) add(`${QUALITY[k]}_for_${k}`, label(k), q.score, q.n, w / 2);
    else missing.push(label(k));
  }
  const sens = c.concerns.includes("sensitive"), acne = c.concerns.includes("acne");
  const gentle = sc("gentle"), breakouts = sc("breakouts");
  if (sens && gentle) add("gentle", "gentleness", gentle.score, gentle.n, 0.15);
  if (acne && breakouts) add("breakouts", "breakouts", breakouts.score, breakouts.n, 0.15);
  const finish = profile.attrs.find(x => x.key === "finish"), texture = profile.attrs.find(x => x.key === "texture");
  if (c.finish && finish && applies(finish, shape)) {
    const s = sc("finish"), target = c.finish === finish.ends![0] ? 0 : 100;
    if (s) add("finish", `${c.finish} finish`, Math.max(0, 100 - Math.abs(s.score - target)), s.n, profile.weights.feel); else missing.push(`${c.finish} finish`);
  } else if (!c.tex && c.skin && texture && TEXTURE_FOR[c.skin] !== undefined && sc("texture")) {
    const s = sc("texture")!;
    add("texture", "texture", Math.max(0, 100 - Math.abs(s.score - TEXTURE_FOR[c.skin])), s.n, profile.weights.feel / 2, false);
  }
  const g = c.goal ? GOAL_ATTR[c.goal] : undefined;
  if (g) { const gs = sc(g.key); if (gs) add(g.key, g.label, gs.score, gs.n, 0.3); else add(g.key, `no ${g.label} reports yet`, 50, 0, 0.3, false); }
  const ts = c.tex ? sc("texture") : null;
  if (c.tex && ts) add("texture", "texture", Math.max(0, 100 - Math.abs(ts.score - TEX_TARGET[c.tex])), ts.n, 0.15, false);
  if (signal !== null) add("score", "user score", signal, 0, profile.weights.score, false);
  const real = parts.filter(p => p.key !== "score");
  if (missing.length || !real.length) return { pct: null, parts, missing };
  let pct = spread(parts.reduce((s2, p) => s2 + p.score * p.weight, 0) / parts.reduce((s2, p) => s2 + p.weight, 0));
  if (sens) {
    const f = a.facts;
    if (f.fragrance_free === "fragrance" || f.fragrance_free === "oils" || (f.acid && f.acid !== "none")) pct = Math.min(pct - 5, SCENT_CAP);
    if (f.strength === "strong" || f.neg || (gentle && gentle.score < 45 && gentle.n >= 8)) pct = Math.min(pct, STRONG_CAP);
  }
  if (a.facts.use === "body-first") pct = Math.round(pct * 0.85);
  return { pct, parts, missing };
}

/** The catalogue's "good for" groups: each is a suits_<key> score. */
export const SKIN_GROUPS = [["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["sensitive", "Sensitive"], ["acne", "Acne-prone"]] as const;

export type SkinRow<R extends SkinItem = SkinItem> = { r: R; m: AttrMatch | null; pct: number | null; signal: number | null; ff: boolean; reason: string | null };

/** The products for a choice: the type and fragrance-free are filters; with picks, ordered by match % (too few reports go
 *  last, by user score); without, by user score. Always high to low (owner, signal-score). */
export function rankSkin<R extends SkinItem>(ctx: SkinRankCtx<R>, c: SkinChoice, only?: (r: R) => boolean): SkinRow<R>[] {
  const picked = skinPicked(effectiveChoice(c));
  const rows = ctx.data.listed.filter(r => (c.type ? r.shape === c.type : !EVERYTHING_SKIP.has(r.shape ?? "")) && (!only || only(r))).map(r => {
    const ff = ctx.attrs.get(r.id)?.facts.fragrance_free === "free";
    const m = picked ? skinMatch(ctx, r.id, c) : null;
    return { r, m, pct: m?.pct ?? null, signal: ctx.signal(r.id), ff, reason: m ? reasonOf(ctx, m) : null };
  }).filter(x => (!c.ff || x.ff) && (!c.budget || ctx.attrs.get(x.r.id)?.facts.price === c.budget));
  // Without picks, by user score; a body-first product (mostly used on the body) ranks as if ×0.85 on these face lists.
  const key = (x: (typeof rows)[number]) => x.signal === null ? -1 : ctx.attrs.get(x.r.id)?.facts.use === "body-first" ? x.signal * 0.85 : x.signal;
  return rows.sort((a, b) => (picked ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || key(b) - key(a) || a.r.name.localeCompare(b.r.name));
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
