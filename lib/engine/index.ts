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
/** What the engine reads per product (app/match-context.ts builds it from the evidence store and the catalog). */
export type EngineFacts = {
  /** The product's own name, for the maker's label words. */ name: string;
  year: number;
  /** Reports with a verdict. */ pos: number; mix: number; neg: number;
  /** Praising / faulting voices per trait (lib/evidence.ts evidenceBalance). */ voices: { control: Voices; power: Voices; arm?: Voices };
  /** The specs' lean in dots, −1…+1 (lib/trait-score.ts specLean). */ spec: { control: number; power: number; arm?: number };
  /** An expert's 0–100 per trait, when set (admin expert grid). */ expert: { control?: number; power?: number; arm?: number };
};
export type EngineProfile = {
  m: number; k: number; ks: number; E: number; z: number; wq: number; wf: number; wp: number; minReports: number;
  /** Share of the style fit that is the axis position (the rest: how positively players talk about the trait). */ ax: number;
  /** Maker label words (matched in the lower-cased name, as written, spaces included) for each end of the axis. */
  controlLabels: string[]; powerLabels: string[];
  /** A label bounds the specs prior (control ≤ [0], power ≥ [1]) and the final axis (control ≤ [2], power ≥ [3]). */
  labelBounds: [number, number, number, number];
  /** Verdict cut-offs on the display %: Strong fit ≥ good, Worth a look ≥ maybe, else Probably not. */ cuts: { good: number; maybe: number };
  /** With "sore arm": the share of the fit that is arm comfort (the prototype has no arm pick; a site choice). */ armShare: number;
  /** With fine-tune weight / feel / sweet-spot picks: the share of the fit that is those (lib/fine-tune.ts fineFit). */ fineShare: number;
};
export type EngineStyle = "any" | "control" | "balance" | "power";
type Trait = { v: number; sd: number };
export type EngineBase = { axis: number; axisN: number; Q: number; sdQ: number; tr: { control: Trait; power: Trait; arm: Trait }; pop: number; n: number };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

/** Per product: quality, trait sentiment, the style axis and popularity, from the catalog-wide averages. `n` = every report. */
export function engineBase(items: { id: string; n: number; e: EngineFacts }[], p: EngineProfile): Map<string, EngineBase> {
  const judged = items.filter(x => x.n >= 1);
  const tot = sum(judged, x => x.e.pos + x.e.mix + x.e.neg);
  const q0 = sum(judged, x => x.e.pos + 0.3 * x.e.mix) / Math.max(tot, 1);
  const vo = (x: { e: EngineFacts }, t: "control" | "power" | "arm") => x.e.voices[t] ?? { plus: 0, minus: 0 };
  const share0 = Object.fromEntries((["control", "power", "arm"] as const).map(t => {
    const P = sum(items, x => vo(x, t).plus), C = sum(items, x => vo(x, t).minus);
    return [t, P / Math.max(P + C, 1)];
  })) as Record<"control" | "power" | "arm", number>;
  const nmax = Math.max(...items.map(x => x.n), 1);
  // Base rates: power is praised more often than control across the catalog, so praise counts are compared to that.
  const base = { control: sum(items, x => vo(x, "control").plus) / items.length, power: sum(items, x => vo(x, "power").plus) / items.length };
  const out = new Map<string, EngineBase>();
  for (const x of items) {
    const { pos, mix, neg } = x.e, n = pos + mix + neg;
    const Q = (pos + 0.3 * mix + p.m * q0) / (n + p.m);
    const sdQ = Math.sqrt(Q * (1 - Q) / (n + 1)); // uncertainty from real reports only (priors are not data)
    const trait = (t: "control" | "power" | "arm"): Trait => {
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
    const nm = x.e.name.toLowerCase();
    const ctl = p.controlLabels.some(w => nm.includes(w)), pow = p.powerLabels.some(w => nm.includes(w));
    if (ctl) a0 = Math.min(a0, p.labelBounds[0]);
    if (pow) a0 = Math.max(a0, p.labelBounds[1]);
    const Pc = vo(x, "control").plus / base.control * base.power, Pp = vo(x, "power").plus;
    let num = p.ks * a0 + Pp, den = p.ks + Pp + Pc;
    const ec = x.e.expert.control, ep = x.e.expert.power;
    if (ec !== undefined && ep !== undefined && ec + ep > 0) { num += p.E * ep / (ec + ep); den += p.E; }
    let axis = num / den;
    // The maker's line label is a fact (owner 2026-11-15, "[Metalbone CTRL 3.5] is not a power racket"): praise moves the axis
    // inside its half, never across.
    if (ctl) axis = Math.min(axis, p.labelBounds[2]);
    if (pow) axis = Math.max(axis, p.labelBounds[3]);
    out.set(x.id, { axis, axisN: 1 + Pp + Pc, Q, sdQ, tr: { control: trait("control"), power: trait("power"), arm: trait("arm") }, pop: Math.log1p(x.n) / Math.log1p(nmax), n: x.n });
  }
  return out;
}

/** The fit to a style pick, 0–1, and its uncertainty. "any" is neutral (the list then follows quality and popularity). */
export function engineFit(e: EngineBase, style: EngineStyle, p: EngineProfile): [number, number] {
  if (style === "any") return [0.5, 0];
  const a = e.axis, { control: c, power: pw } = e.tr;
  const [ax, sent, ss] = style === "control" ? [1 - a, c.v, c.sd] : style === "power" ? [a, pw.v, pw.sd]
    : [1 - 2 * Math.abs(a - 0.5), (c.v + pw.v) / 2, Math.sqrt((c.sd ** 2 + pw.sd ** 2) / 2)];
  const sda = Math.sqrt(a * (1 - a) / e.axisN);
  return [p.ax * ax + (1 - p.ax) * sent, Math.sqrt((p.ax * sda) ** 2 + ((1 - p.ax) * ss) ** 2)];
}

export type EnginePick = { style: EngineStyle; arm?: boolean; fine?: number | null };
/** The score and the cautious score (what lists are ordered by). */
export function engineScore(e: EngineBase, pick: EnginePick, p: EngineProfile): { score: number; cautious: number } {
  let [F, sF] = engineFit(e, pick.style, p);
  // Sore arm and fine-tune picks (not in the prototype): a share of the fit, with their uncertainty.
  if (pick.arm) { F = (1 - p.armShare) * F + p.armShare * e.tr.arm.v; sF = Math.sqrt(((1 - p.armShare) * sF) ** 2 + (p.armShare * e.tr.arm.sd) ** 2); }
  if (pick.fine !== undefined && pick.fine !== null) { F = (1 - p.fineShare) * F + p.fineShare * pick.fine; sF = (1 - p.fineShare) * sF; }
  const score = p.wq * e.Q + p.wf * F + p.wp * e.pop;
  const sd = Math.sqrt((p.wq * e.sdQ) ** 2 + (p.wf * sF) ** 2);
  return { score, cautious: score - p.z * sd };
}

/** The display %: the cautious score placed on the 45–97 scale between the anchors. */
export const enginePct = (cautious: number, a: { lo: number; hi: number }) => Math.round(clamp(45 + 50 * (cautious - a.lo) / Math.max(a.hi - a.lo, 1e-9), 25, 97));

/** Candidates for a list: enough reports, passing the level gate; one row per model (the newest year that passes), unless
 *  every year is asked for. `family` is the model's row id (lib/compare-pairs.ts rowOfFamily). */
export function engineCandidates<T extends { id: string; n: number; family: string; year: number }>(items: T[], ok: (x: T) => boolean, minReports: number, everyYear = false): T[] {
  const pass = items.filter(x => x.n >= minReports && ok(x));
  if (everyYear) return pass;
  const best = new Map<string, T>();
  for (const x of pass) { const b = best.get(x.family); if (!b || x.year > b.year) best.set(x.family, x); }
  return [...best.values()];
}

/** The display anchors: the 10th-percentile and the best cautious score over the 9 level × style picks (one row per model). */
export function engineAnchors<T extends { id: string; n: number; family: string; year: number }>(items: T[], base: Map<string, EngineBase>, passes: (x: T, level: string) => boolean,
  p: EngineProfile): { lo: number; hi: number } {
  const all: number[] = [];
  for (const level of ["beginner", "intermediate", "advanced"]) for (const style of ["control", "balance", "power"] as const)
    for (const x of engineCandidates(items, y => passes(y, level), p.minReports)) all.push(engineScore(base.get(x.id)!, { style }, p).cautious);
  all.sort((a, b) => a - b);
  return { lo: all[Math.floor(0.1 * all.length)] ?? 0, hi: all.at(-1) ?? 1 };
}

/** The verdict word from the same number. */
export const engineKind = (pct: number | null, p: EngineProfile) => pct === null ? "thin" as const : pct >= p.cuts.good ? "good" as const : pct >= p.cuts.maybe ? "maybe" as const : "no" as const;
