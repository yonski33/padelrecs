// The match engine (ENGINE-ALGO.md §5, owner "Build it" 2026-11-15): one number with one meaning, ported from the offline
// prototype (engine-proto/engine_proto.py), which the owner's yardstick checked. Pure functions over one compact fact set per
// product; the same code ranks on the server and in the browser (lib/home-rank.ts). Site-specific words and numbers live in
// the niche profile (lib/niche fit.engine).
//
//   quality Q   happy share (positive + 0.3 mixed), smoothed toward the catalog's by m imaginary reports
//   traits      control / power (and arm) sentiment: praise share smoothed toward a prior (catalog share + spec lean) by k
//               imaginary voices; an expert's 0–100 counts as E voices
//   axis        0 control … 1 power: the specs' lean plus the maker's label (worth ks voices), moved by power praise vs
//               control praise (scaled by how often each is praised overall) and by an expert's power vs control values; a
//               maker label bounds it to its half ("CTRL" ≤ 0.35, "Power/HRD" ≥ 0.65)
//   style fit   AX × the axis position for the pick + (1 − AX) × the picked trait's sentiment
//   score       wq Q + wf fit + wp log-popularity; ranked by score − z × uncertainty (from real counts only, priors aren't data)
//   display %   the cautious score placed on 45–97 between anchors taken over the 9 level × style picks

export type Voices = { plus: number; minus: number };
/** The traits a product page shows as dots (lib/trait-score.ts TRAITS). */
export const DOT_TRAITS: readonly string[] = ["forgiveness", "power", "control", "defence", "arm", "speed"];
/** A trait key (padel's above; a site's profile can name its own, EngineProfile.traits). */
export type DotTrait = string;
const COMPLAINT_DOTS: readonly DotTrait[] = ["arm", "forgiveness"], MIN_COMPLAINT_VOICES = 3;
/** What the engine reads per product (app/match-context.ts builds it from the evidence store and the catalog). */
export type EngineFacts = {
  /** The product's own name, for the maker's label words. */ name: string;
  year: number;
  /** Reports with a verdict. */ pos: number; mix: number; neg: number;
  /** Praising / faulting voices per trait (lib/evidence.ts evidenceBalance). */ voices: { control: Voices; power: Voices } & Partial<Record<DotTrait, Voices>>;
  /** The specs' lean in dots, −1…+1 (lib/trait-score.ts specLean). */ spec: { control: number; power: number } & Partial<Record<DotTrait, number>>;
  /** An expert's 0–100 per trait, when set (admin expert grid). */ expert: Partial<Record<DotTrait, number>>;
  /** The maker's mould (rackets.shape, lower-cased), for profile.shapeBounds. */ shape?: string | null;
};
export type EngineProfile = {
  m: number; k: number; ks: number; E: number; z: number; wq: number; wf: number; wp: number; minReports: number;
  /** Score from the verdict counts the product page shows (the owner's typed tally where saved, db/sentiment-tally.ts) instead
   *  of the counted reviews alone. PadelRecs first (owner report 2026-11-26); other sites' lists reorder with it, so theirs wait. */
  pageTally?: boolean;
  /** Creator reviews shape the style and fit profile (owner "yes we should", 2026-11-26): each live creator card's attribute
   *  word counts as a weighted voice on the matching trait (app/match-context.ts CREATOR_WORD: Excellent 1, Great 0.8, Good 0.4
   *  praise; Okay 0.5, Weak 1 complaint), so a
   *  product with many creator reviews has more evidence for what it is and a smaller caution cut. Never the Loved it / Mixed
   *  / Not for me counts, which stay the players' (hybrid ranking). Attribute key → engine trait. */
  creatorVoices?: Record<string, string>;
  /** Share of the style fit that is the axis position (the rest: how positively players talk about the trait). */ ax: number;
  /** Maker label words (matched in the lower-cased name, as written, spaces included) for each end of the axis. */
  controlLabels: string[]; powerLabels: string[];
  /** Labels that cap the axis at all-round (≤ allRoundCap): praise moves it inside, the shape can't push it to the power side
   *  (owner 2026-11-15, "Yes, cap Team": Team versions are softer, beginner-friendly builds). */
  allRoundLabels?: string[]; allRoundCap?: number;
  /** A label bounds the specs prior (control ≤ [0], power ≥ [1]) and the final axis (control ≤ [2], power ≥ [3]). */
  labelBounds: [number, number, number, number];
  /** Verdict cut-offs on the display %: Strong fit ≥ good, Worth a look ≥ maybe, else Probably not. */ cuts: { good: number; maybe: number };
  /** With "sore arm": the share of the fit that is arm comfort (the prototype has no arm pick; a site choice). */ armShare: number;
  /** With fine-tune weight / feel / sweet-spot picks: the share of the fit that is those (lib/fine-tune.ts fineFit). */ fineShare: number;
  /** The site's dot traits and the ones that can drop to 2 (default padel's: DOT_TRAITS; arm and forgiveness). */
  traits?: readonly string[]; complaint?: readonly string[];
  /** The style picks the display anchors cover (default control / balance / power). A pick off the axis (pickleball's spin) is
   *  matched on that trait's sentiment alone. */ styles?: readonly Exclude<EngineStyle, "any">[];
  // The match-audit tuning pass (Grok audit, owner OK 2026-11-16), padel and pickleball. Unset: the engine as before.
  /** With a level picked, this share of the fit is how well the product suits that level (suits[level] / 100). */ levelShare?: number;
  /** The balance pick's axis term squared, (1 − 2|axis − 0.5|)², so only real all-rounders reach the top. */ balanceSquared?: boolean;
  /** "Any" style: the style term is the product's quality Q instead of a flat 0.5. */ anyByQuality?: boolean;
  /** Display anchors per style pick (and "any"), not pooled over the styles. */ anchorsPerStyle?: boolean;
  /** Any hard reason (level, arm, feel) holds the % at this (under the "Worth a look" cut, so never Strong fit). */ hardCap?: number;
  /** Trait dots: the bottom share of the catalogue's ranking per trait reads 2 (PickleballRecs); unset, 3 is the floor. */ lowShare?: number;
  /** Trait dots follow the page's own clear claims (lib/page-bars.ts, app/match-context.ts; PickleballRecs). */ pageBars?: boolean;
  /** A product's own style (its bars) scores at least its "balance" %, the opposite style at most (lib/home-rank.ts). */ styleOrder?: boolean;
  /** One row per model: the best-scoring eligible member, a newer one winning when it is within this many % points. Unset:
   *  the newest year that passes. */ familyBestWithin?: number;
  /** Ties on the cautious score go to the product with more reports. */ tieByReports?: boolean;
  /** When the maker's label words clamp the axis: "always" (padel: the label is a fact, owner rule) or "weakEvidence" (only
   *  while players' control + power votes are under 4; above that, players decide; the label's prior still counts). */ labelClamp?: "always" | "weakEvidence";
  /** Fine-tune as a penalty only (audit 2026-11-16): fit −= this × (1 − fineFit), so a mismatch can never raise the %. Unset:
   *  the fineShare blend. */ finePenalty?: number;
  /** With "sore arm": small demotions of the cautious score for a thin (14 mm) core and a firm feel (PickleballRecs). */ armSpecDemote?: { core14: number; firm: number };
  /** The maker's mould bounds the final axis like a label (owner 2026-11-17, "the Oxdog is a diamond"): shape word (matched
   *  in the lower-cased shape) → [min, max]. A diamond plays on the power side however its control is praised. */ shapeBounds?: Record<string, [number, number]>;
  /** Newest model wins (owner 2026-11-17): a newer year with this many reports always takes the model's row. */ newestAt?: number;
  /** The shape rule (owner 2026-11-17): for these styles at these levels, these shapes (lib/fine-tune shapeOf) go after every
   *  other row and stay under "Worth a look". */ shapeOrder?: { styles: string[]; levels: string[]; below: string[] };
  /** At these levels a high-balance (head-heavy) racket goes after the rest, like the shape rule. */ headHeavyBelow?: string[];
  /** A power (control) pick on a racket whose Attack (Control) bar is at most this is held under Strong fit. */ styleBarMax?: number;
  /** The lowest % for curated places #1, #2, #3 … (the owner's "perfect fits"). */ curatedTop?: number[];
  /** The balance pick's axis term with a flat middle: within this distance of 0.5 counts as fully all-round. */ balanceFlat?: number;
  // The DiscGolfRecs match audit (Grok 2026-11-16, owner OK 2026-11-17). Unset: as before.
  /** A hard reason (with hardCap) also takes this off the cautious score, and the product sorts after every other row. */ hardPenalty?: number;
  /** A softer warning (FitFacts.warn: DiscGolfRecs' step-up drivers, page warnings) takes this off, holds the % under Strong fit
   *  and sorts the row after the unwarned ones (audit 2026-11-17). */ warnPenalty?: number;
  /** A product whose own stability (FitFacts.lean) is the opposite of the picked one is held under "Worth a look" and sorted
   *  after the rest. */ oppositeLeanLow?: boolean;
  /** With the slower-arm pick, a product the specs call slow-arm friendly (RankItem.flags.slowArm) gains this much. */ slowArmLift?: number;
  /** The display scale: the floor anchor maps to `base`, the best to base + span, clamped at max (default 45 / 50 / 97). */ display?: { base: number; span: number; max: number };
  /** "Any" style: a stability window at this share of the fit, around `target` (or `lowTarget` for a beginner or a slower arm),
   *  so a well-suited product can reach Strong fit without a style pick. */ anyWindow?: { share: number; target: number; lowTarget: number };
  /** "Any" style gets its own display anchors (floor and ceiling); the style picks stay pooled. */ anyOwnAnchors?: boolean;
  /** Maker label words match as a whole last word of a name of 3+ words ("Discraft Zone OS", not the mold "Discraft XS"). */ labelLastWord?: boolean;
};
export type EngineStyle = "any" | "control" | "balance" | "power" | "spin";
const AXIS_STYLES = ["control", "balance", "power"];
type Trait = { v: number; sd: number };
export type EngineBase = { axis: number; axisN: number;
  /** What players alone say, 0 control … 1 power: power praise vs control praise (base-rate scaled), no prior; null under 4 voices. */ playerAxis: number | null; Q: number; sdQ: number; tr: { control: Trait; power: Trait; arm: Trait } & Record<string, Trait>; pop: number; n: number };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

/** Per product: quality, trait sentiment, the style axis and popularity, from the catalog-wide averages. `n` = every report. */
export function engineBase(items: { id: string; n: number; e: EngineFacts }[], p: EngineProfile): Map<string, EngineBase> {
  const judged = items.filter(x => x.n >= 1);
  const tot = sum(judged, x => x.e.pos + x.e.mix + x.e.neg);
  const q0 = sum(judged, x => x.e.pos + 0.3 * x.e.mix) / Math.max(tot, 1);
  const vo = (x: { e: EngineFacts }, t: string) => x.e.voices[t] ?? { plus: 0, minus: 0 };
  // Sentiment for control, power, arm, and any style pick off the axis (pickleball's spin).
  const keys = ["control", "power", "arm", ...(p.styles ?? []).filter(st => !AXIS_STYLES.includes(st))];
  const share0: Record<string, number> = Object.fromEntries(keys.map(t => {
    const P = sum(items, x => vo(x, t).plus), C = sum(items, x => vo(x, t).minus);
    return [t, P / Math.max(P + C, 1)];
  }));
  const nmax = Math.max(...items.map(x => x.n), 1);
  // Base rates: power is praised more often than control across the catalog, so praise counts are compared to that.
  const base = { control: sum(items, x => vo(x, "control").plus) / items.length, power: sum(items, x => vo(x, "power").plus) / items.length };
  const out = new Map<string, EngineBase>();
  for (const x of items) {
    const { pos, mix, neg } = x.e, n = pos + mix + neg;
    const Q = (pos + 0.3 * mix + p.m * q0) / (n + p.m);
    const sdQ = Math.sqrt(Q * (1 - Q) / (n + 1)); // uncertainty from real reports only (priors are not data)
    const trait = (t: string): Trait => {
      const { plus: Pp, minus: Cc } = vo(x, t);
      const mu0 = clamp(share0[t] + 0.15 * (x.e.spec[t] ?? 0), 0.05, 0.95);
      const e = x.e.expert[t];
      const [Ep, Ec] = e !== undefined ? [p.E * e / 100, p.E * (1 - e / 100)] : [0, 0];
      const v = (Pp + Ep + p.k * mu0) / (Pp + Cc + Ep + Ec + p.k);
      return { v, sd: Math.sqrt(v * (1 - v) / (Pp + Cc + 1)) };
    };
    // The style axis, 0 control … 1 power: the specs' prior and the maker's own label (worth ks voices), moved by what
    // players praise (control praise in power units) and by an expert's power vs control values.
    let a0 = clamp(0.5 + 0.3 * ((x.e.spec.power ?? 0) - (x.e.spec.control ?? 0)), 0.12, 0.88);
    const nm = x.e.name.toLowerCase(), words = nm.split(/\s+/);
    const has = (w: string) => p.labelLastWord ? words.length >= 3 && words.at(-1) === w.trim() : nm.includes(w);
    const ctl = p.controlLabels.some(has), pow = p.powerLabels.some(has);
    const mid = !!p.allRoundLabels?.some(w => nm.includes(w)), cap = p.allRoundCap ?? 0.55;
    if (mid) a0 = Math.min(a0, cap);
    if (ctl) a0 = Math.min(a0, p.labelBounds[0]);
    if (pow) a0 = Math.max(a0, p.labelBounds[1]);
    // A catalogue with no control praise at all (SimRacingRecs before any style evidence) has no rate to compare to: 0, not 0/0.
    const Pc = base.control > 0 ? vo(x, "control").plus / base.control * base.power : 0, Pp = vo(x, "power").plus;
    let num = p.ks * a0 + Pp, den = p.ks + Pp + Pc;
    const ec = x.e.expert.control, ep = x.e.expert.power;
    if (ec !== undefined && ep !== undefined && ec + ep > 0) { num += p.E * ep / (ec + ep); den += p.E; }
    let axis = num / den;
    // The maker's line label is a fact (owner 2026-11-15, "[Metalbone CTRL 3.5] is not a power racket"): praise moves the axis
    // inside its half, never across. With labelClamp "weakEvidence" (PickleballRecs, owner 2026-11-16) only while players have
    // said little (under 4 control + power votes).
    const clampIt = p.labelClamp !== "weakEvidence" || Pp + Pc < 4;
    if (ctl && clampIt) axis = Math.min(axis, p.labelBounds[2]);
    if (pow && clampIt) axis = Math.max(axis, p.labelBounds[3]);
    if (mid) axis = Math.min(axis, cap);
    const sh = (x.e.shape ?? "").toLowerCase();
    for (const [w, [lo, hi]] of Object.entries(p.shapeBounds ?? {})) if (sh.includes(w)) axis = clamp(axis, lo, hi);
    out.set(x.id, { axis, axisN: 1 + Pp + Pc, playerAxis: Pp + Pc >= 4 ? Pp / (Pp + Pc) : null, Q, sdQ, tr: Object.fromEntries(keys.map(k => [k, trait(k)])) as EngineBase["tr"], pop: Math.log1p(x.n) / Math.log1p(nmax), n: x.n });
  }
  return out;
}

/** The fit to a style pick, 0–1, and its uncertainty. "any" is neutral (the list then follows quality and popularity). */
export function engineFit(e: EngineBase, style: EngineStyle, p: EngineProfile, low = false): [number, number] {
  if (style === "any" && p.anyWindow) {
    const w = p.anyWindow, t = low ? w.lowTarget : w.target, win = clamp(1 - 2 * Math.abs(e.axis - t), 0, 1);
    return [(1 - w.share) * 0.5 + w.share * win, w.share * Math.sqrt(e.axis * (1 - e.axis) / e.axisN)];
  }
  if (style === "any") return p.anyByQuality ? [e.Q, e.sdQ] : [0.5, 0];
  // Off the axis (pickleball's spin): how positively players talk about that trait.
  if (!AXIS_STYLES.includes(style)) { const t = e.tr[style]; return t ? [t.v, t.sd] : [0.5, 0]; }
  const a = e.axis, { control: c, power: pw } = e.tr;
  const [ax, sent, ss] = style === "control" ? [1 - a, c.v, c.sd] : style === "power" ? [a, pw.v, pw.sd]
    : [(1 - 2 * Math.max(0, Math.abs(a - 0.5) - (p.balanceFlat ?? 0)) / (1 - 2 * (p.balanceFlat ?? 0))) ** (p.balanceSquared ? 2 : 1), (c.v + pw.v) / 2, Math.sqrt((c.sd ** 2 + pw.sd ** 2) / 2)];
  const sda = Math.sqrt(a * (1 - a) / e.axisN);
  return [p.ax * ax + (1 - p.ax) * sent, Math.sqrt((p.ax * sda) ** 2 + ((1 - p.ax) * ss) ** 2)];
}

export type EnginePick = { style: EngineStyle; arm?: boolean; fine?: number | null; /** suits[picked level], 0–100, with a level picked. */ suits?: number | null;
  /** A beginner or a slower arm (anyWindow's lowTarget). */ low?: boolean };
/** The score and the cautious score (what lists are ordered by). */
export function engineScore(e: EngineBase, pick: EnginePick, p: EngineProfile): { score: number; cautious: number } {
  let [F, sF] = engineFit(e, pick.style, p, !!pick.low);
  // The level as a score (audit 2026-11-16): fit = (1 − levelShare) × style + levelShare × suits / 100.
  if (p.levelShare && pick.suits !== undefined && pick.suits !== null) { F = (1 - p.levelShare) * F + p.levelShare * pick.suits / 100; sF = (1 - p.levelShare) * sF; }
  // Sore arm and fine-tune picks (not in the prototype): a share of the fit, with their uncertainty.
  if (pick.arm) { F = (1 - p.armShare) * F + p.armShare * e.tr.arm.v; sF = Math.sqrt(((1 - p.armShare) * sF) ** 2 + (p.armShare * e.tr.arm.sd) ** 2); }
  if (pick.fine !== undefined && pick.fine !== null) {
    if (p.finePenalty !== undefined) F -= p.finePenalty * (1 - pick.fine);
    else { F = (1 - p.fineShare) * F + p.fineShare * pick.fine; sF = (1 - p.fineShare) * sF; }
  }
  const score = p.wq * e.Q + p.wf * F + p.wp * e.pop;
  const sd = Math.sqrt((p.wq * e.sdQ) ** 2 + (p.wf * sF) ** 2);
  return { score, cautious: score - p.z * sd };
}

/** The display %: the cautious score placed on the 45–97 scale between the anchors. */
export const enginePct = (cautious: number, a: { lo: number; hi: number }, d: { base: number; span: number; max: number } = { base: 45, span: 50, max: 97 }) =>
  Math.round(clamp(d.base + d.span * (cautious - a.lo) / Math.max(a.hi - a.lo, 1e-9), 25, d.max));

/** Candidates for a list: enough reports, passing the level gate; one row per model (the newest year that passes), unless
 *  every year is asked for. `family` is the model's row id (lib/compare-pairs.ts rowOfFamily). */
export function engineCandidates<T extends { id: string; n: number; family: string; year: number }>(items: T[], ok: (x: T) => boolean, minReports: number, everyYear = false,
  /** With familyBestWithin: each member's % for the picks; the best one stays, a newer one within that many points wins (and
   *  always, with newestAt, once it has that many reports). */ best?: { pct: (x: T) => number; within: number; newestAt?: number }): T[] {
  const pass = items.filter(x => x.n >= minReports && ok(x));
  if (everyYear) return pass;
  const keep = new Map<string, T>();
  for (const x of pass) {
    const b = keep.get(x.family);
    if (!b) { keep.set(x.family, x); continue; }
    if (!best) { if (x.year > b.year) keep.set(x.family, x); continue; }
    const [newer, older] = x.year >= b.year ? [x, b] : [b, x];
    keep.set(x.family, (best.newestAt !== undefined && newer.n >= best.newestAt) || best.pct(newer) >= best.pct(older) - best.within ? newer : older);
  }
  return [...keep.values()];
}

/** The display anchors: the 10th-percentile and the best cautious score over the 9 level × style picks (one row per model).
 *  With anchorsPerStyle, one pair per style pick (and "any"), over that style's 3 levels, each scored with the level's suits. */
export function engineAnchors<T extends { id: string; n: number; family: string; year: number }>(items: T[], base: Map<string, EngineBase>, passes: (x: T, level: string) => boolean,
  p: EngineProfile, suitsOf?: (x: T, level: string) => number | null | undefined): { lo: number; hi: number; byStyle?: Record<string, { lo: number; hi: number }> } {
  const styles = p.styles ?? (["control", "balance", "power"] as const);
  const pair = (xs: number[]) => { xs.sort((a, b) => a - b); return { lo: xs[Math.floor(0.1 * xs.length)] ?? 0, hi: xs.at(-1) ?? 1 }; };
  const scores = (style: EngineStyle) => ["beginner", "intermediate", "advanced"].flatMap(level => engineCandidates(items, y => passes(y, level), p.minReports)
    .map(x => engineScore(base.get(x.id)!, { style, suits: p.levelShare ? suitsOf?.(x, level) : undefined, low: level === "beginner" }, p).cautious));
  const pooled = pair(styles.flatMap(st => scores(st)));
  if (p.anyOwnAnchors && !p.anchorsPerStyle) return { ...pooled, byStyle: { any: pair(scores("any")) } };
  if (!p.anchorsPerStyle) return pooled;
  // Each style's own floor, one shared ceiling: styles start from where their own lists start, and only the very best fit of
  // any style reaches the top of the scale (a per-style ceiling put every style's #1 at 95).
  const hi = Math.max(pooled.hi, ...[...styles, "any" as const].map(st => pair(scores(st)).hi));
  return { ...pooled, byStyle: Object.fromEntries([...styles, "any" as const].map(st => [st, { lo: pair(scores(st)).lo, hi }])) };
}

/** The verdict word from the same number. */
export const engineKind = (pct: number | null, p: EngineProfile) => pct === null ? "thin" as const : pct >= p.cuts.good ? "good" as const : pct >= p.cuts.maybe ? "maybe" as const : "no" as const;

/** Trait dots from the engine (PM / owner 2026-11-15: the dots, the copy and the ranking tell one story). Every trait: the praise
 *  share among the voices that mention it, smoothed toward the catalog's share (+ the specs' lean) by k voices, an expert's value
 *  as E voices; dots from where that smoothed value ranks in the catalog: the top 9% 5, the top 30% 4, else 3; 2 only for arm
 *  and forgiveness, the bottom 6% of those whose complaints (3+) outnumber the praise. Control and power also follow the axis: a racket on the control side
 *  (axis ≤ the control bound) shows at least 4 control dots unless its control complaints outnumber the praise, and the same
 *  for power on the power side. The 0–99 score is the dot band's floor plus the place in the ranking, as before. */
export function engineTraitDots(items: { id: string; n: number; e: EngineFacts }[], base: Map<string, EngineBase>, p: EngineProfile): Map<string, Record<DotTrait, { dots: number; score: number; v: number }>> {
  const vo = (x: { e: EngineFacts }, t: DotTrait) => x.e.voices[t] ?? { plus: 0, minus: 0 };
  const out = new Map<string, Record<DotTrait, { dots: number; score: number; v: number }>>(items.map(x => [x.id, {} as Record<DotTrait, { dots: number; score: number; v: number }>]));
  for (const t of p.traits ?? DOT_TRAITS) {
    const P0 = sum(items, x => vo(x, t).plus), C0 = sum(items, x => vo(x, t).minus), share0 = P0 / Math.max(P0 + C0, 1);
    const val = new Map(items.map(x => {
      const { plus: Pp, minus: Cc } = vo(x, t), mu0 = clamp(share0 + 0.15 * (x.e.spec[t] ?? 0), 0.05, 0.95), e = x.e.expert[t];
      const [Ep, Ec] = e !== undefined ? [p.E * e / 100, p.E * (1 - e / 100)] : [0, 0];
      return [x.id, (Pp + Ep + p.k * mu0) / (Pp + Cc + Ep + Ec + p.k)] as const;
    }));
    const order = [...items].sort((a, b) => val.get(b.id)! - val.get(a.id)! || a.id.localeCompare(b.id)), rank = new Map(order.map((x, i) => [x.id, i]));
    const n4 = Math.round(0.30 * items.length), n5 = Math.round(0.09 * items.length);
    // 2 dots only where players fault the trait itself (arm, forgiveness; owner 2026-11-15: little power praise on a control
    // racket isn't a complaint), with enough complaints to outnumber the praise.
    const worst = new Set((p.complaint ?? COMPLAINT_DOTS).includes(t) ? order.filter(x => vo(x, t).minus > vo(x, t).plus && vo(x, t).minus >= MIN_COMPLAINT_VOICES).slice(-Math.max(1, Math.round(0.06 * items.length))).map(x => x.id) : []);
    for (const x of items) {
      const i = rank.get(x.id)!, { plus, minus } = vo(x, t), b = base.get(x.id);
      // A site's low band (lowShare, PickleballRecs Grok audit 2026-11-17): the bottom of the catalogue's ranking reads 2, so
      // the bars span the catalogue like 4 and 5 do ("less than most"), not a floor of 3 on every trait.
      const low = p.lowShare !== undefined && i >= items.length - Math.round(p.lowShare * items.length);
      let dots = worst.has(x.id) ? 2 : i < n5 ? 5 : i < n4 ? 4 : low ? 2 : 3;
      if (b && t === "control" && b.axis <= p.labelBounds[2] && minus <= plus) dots = Math.max(dots, 4);
      if (b && t === "power" && b.axis >= p.labelBounds[3] && minus <= plus) dots = Math.max(dots, 4);
      const within = 1 - i / Math.max(1, items.length - 1);
      out.get(x.id)![t] = { dots, score: Math.round((dots - 1) * 20 + 19 * within), v: val.get(x.id)! };
    }
  }
  return out;
}
