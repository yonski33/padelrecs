// Trait scores (owner 2026-11-15; rebuilt the same day: "excellent control racket" showed Control 3): Forgiveness, Power,
// Control, Defence, Arm comfort and Speed, each 1–5 dots (and a 0–99 score for quick match and lists), from three sources:
//   1. players' report tags (TRAIT_TAGS), counted as a share of the racket's tagged reports;
//   2. YouTube reviewers' checked notes (db/youtube-traits/<niche>.json, one mention per channel), worth YT_WEIGHT tags each;
//   3. the specs (shape, balance, weight, core) as a small prior, never more than ±1 dot on their own.
// Fixed scale, no percentile: the catalog median share is 3 dots, and every STEP (scaled to the trait's spread) above or
// below it is one dot, so many rackets can share 4–5 when players praise them. A racket's share is smoothed toward the median
// by PRIOR imaginary reports. 3 is the floor (every racket here is solid); 2 is the extreme end of complaints about that exact
// trait (see `worst` below); 1 only by hand. With few player mentions the specs and YouTube set the base. Hand-set dots (1–5) win.
// Pure, so tests can feed it plain objects.

import { fitConfigFor, type FitConfig, type Specs } from "./fit-config";
export type { Specs } from "./fit-config";

const PADEL = fitConfigFor({ id: "padel" })!;
/** Padel's traits (the default everywhere a site config isn't passed); other sites' lists live in lib/fit-config.ts. */
export const TRAITS = ["forgiveness", "power", "control", "defence", "arm", "speed"] as const;
/** A trait key: padel's six, or another site's (lib/fit-config.ts). */
export type Trait = string;
export const TRAIT_LABEL: Record<string, string> = Object.fromEntries(PADEL.traits.map(t => [t.key, t.label]));
/** Which tags count for and against each trait, and how much (owner 2026-11-15). */
export const TRAIT_TAGS: Record<string, { plus: [string, number][]; minus: [string, number][] }> = Object.fromEntries(PADEL.traits.map(t => [t.key, { plus: t.plus, minus: t.minus }]));
/** Traits that players fault directly ("vibrates", "small sweet spot"): only these can drop to 2. Little power praise on a
 *  control racket isn't a complaint (owner 2026-11-15). */
export const COMPLAINT_TRAITS: Trait[] = PADEL.complaint;
/** The share of the catalog that can sit at 2 dots for a complaint trait. */
export const WORST_SHARE = 0.05;
export const MIN_EVIDENCE = 8, MIN_MENTIONS = 2, PRIOR = 10, YT_WEIGHT = 2;
/** Longest hand-written line under a trait (admin area). */
export const MAX_TRAIT_TEXT_HINT = 220;

export type TraitInput = {
  id: string;
  /** Reports with at least one tag. */ tagged: number; tags: Record<string, number>;
  /** YouTube channels that praise (plus) or fault (minus) each trait. */ youtube?: Partial<Record<Trait, { plus: number; minus: number }>>;
  specs?: Specs;
  /** Arm comfort said only in report text (no arm tag): reports kind (plus) or hard (minus) on the arm. */ textArm?: { plus: number; minus: number };
  /** Dots (1–5) set by hand per trait. */ override?: Partial<Record<Trait, number>> | null;
  /** From the evidence store (lib/evidence.ts evidenceTotals): per trait the weighted net, praising voices and complaints.
   *  When given it replaces `tags` and `textArm` for the trait counts (they're already in it). */
  totals?: Partial<Record<Trait, { net: number; plus: number; minus: number }>>;
};
export type TraitScore = { score: number; dots: number; plus: number; minus: number; yt: number; spec: number;
  /** What set it: player reports, or (few player mentions) the specs and YouTube, or nothing (3 by default). */ basis: "players" | "specs" | "none"; set?: boolean;
  /** Scorer v2: people behind it, one voice once (players incl. our reviewers, and YouTube reviewers), for the line under the bar. */
  people?: { players: { plus: number; minus: number }; reviewers: { plus: number; minus: number } } };

export const dotsFor = (score: number) => Math.min(5, 1 + Math.floor(score / 20));
const weighted = (tags: Record<string, number>, list: [string, number][]) => list.reduce((a, [t, w]) => a + w * (tags[t] ?? 0), 0);
const people = (tags: Record<string, number>, list: [string, number][]) => list.filter(([, w]) => w >= 1).reduce((a, [t]) => a + (tags[t] ?? 0), 0);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

/** The specs' lean per trait in dots, each within ±1 (the site's rules in lib/fit-config.ts; padel: round / low balance →
 *  control and defence; diamond / high balance → power, less speed and forgiveness; light → speed; soft core → arm comfort). */
export function specLean(s: Specs | undefined, cfg: FitConfig = PADEL): Record<Trait, number> {
  if (!s) return Object.fromEntries(cfg.traits.map(t => [t.key, 0]));
  return cfg.specLean(s);
}

/** How much a racket's praise leans to control (positive) or power (negative), in dots within ±1: Control +lean, Defence
 *  +lean/2, Power −lean. Needs 6+ style mentions; even praise gives nothing. */
export function styleBonus(p: TraitInput, t: Trait, cfg: FitConfig = PADEL): number {
  const { control, power, follows } = cfg.axis;
  if (t !== control.trait && t !== follows && t !== power.trait) return 0;
  const sum = (tags: string[]) => tags.reduce((a, tag) => a + (p.tags[tag] ?? 0), 0);
  const ytC = YT_WEIGHT * ((p.youtube?.[control.trait]?.plus ?? 0) + (follows ? p.youtube?.[follows]?.plus ?? 0 : 0)), ytW = YT_WEIGHT * (p.youtube?.[power.trait]?.plus ?? 0);
  const c = (p.totals ? (p.totals[control.trait]?.plus ?? 0) + (follows ? p.totals[follows]?.plus ?? 0 : 0) : sum(control.tags)) + ytC;
  const w = (p.totals ? p.totals[power.trait]?.plus ?? 0 : sum(power.tags)) + ytW;
  if (c + w < 6) return 0;
  const lean = Math.max(-1, Math.min(1, (c / (c + w) - 0.5) * 2.5));
  return t === control.trait ? lean : t === follows ? lean / 2 : -lean;
}

/** Every racket's trait scores (padel: six) (never null for a listed racket since 2026-11-15: thin data falls back to 3). */
export function traitScores(products: TraitInput[], cfg: FitConfig = PADEL): Map<string, Record<Trait, TraitScore | null>> {
  const out = new Map<string, Record<Trait, TraitScore | null>>();
  const keys = cfg.traits.map(d => d.key);
  for (const p of products) out.set(p.id, Object.fromEntries(keys.map(t => [t, null])) as Record<Trait, TraitScore | null>);
  for (const { key: t, plus, minus } of cfg.traits) {
    const yt = (p: TraitInput) => p.youtube?.[t] ?? { plus: 0, minus: 0 };
    // Arm words without a tag count like tags (one per report).
    const tx = (p: TraitInput) => !p.totals && t === cfg.arm.trait ? p.textArm ?? { plus: 0, minus: 0 } : { plus: 0, minus: 0 };
    // Tag counts, or the evidence store's totals (which already hold the arm words).
    const wPlus = (p: TraitInput) => p.totals ? Math.max(0, p.totals[t]?.net ?? 0) : weighted(p.tags, plus);
    const wMinus = (p: TraitInput) => p.totals ? Math.max(0, -(p.totals[t]?.net ?? 0)) : weighted(p.tags, minus);
    const voices = (p: TraitInput) => p.totals ? p.totals[t]?.plus ?? 0 : people(p.tags, plus);
    const faults = (p: TraitInput) => p.totals ? p.totals[t]?.minus ?? 0 : minus.reduce((a, [tag]) => a + (p.tags[tag] ?? 0), 0);
    const evidence = (p: TraitInput) => p.tagged + yt(p).plus + yt(p).minus;
    const net = (p: TraitInput) => wPlus(p) - wMinus(p) + tx(p).plus - tx(p).minus + YT_WEIGHT * (yt(p).plus - yt(p).minus);
    const base = (p: TraitInput) => p.tagged + YT_WEIGHT * (yt(p).plus + yt(p).minus);
    // The catalog's typical share (median → 3 dots) and spread (one dot per STEP), over rackets with enough evidence.
    const pool = products.filter(p => evidence(p) >= MIN_EVIDENCE && base(p) > 0);
    const shares = pool.map(p => net(p) / base(p));
    const m = median(shares);
    const spread = median(shares.map(x => Math.abs(x - m)));
    const step = Math.max(0.04, 1.2 * spread);
    // 2 dots is the extreme end (owner 2026-11-15: "if we set it at 2, more unforgiving rackets will have to be 1"): 8+ players
    // fault that exact trait, over 3× the praise (+1), and the racket is among the WORST_SHARE most-faulted in the catalog.
    // With too few rackets to judge the extreme end, the plain rule: 5+ complaints that outnumber praise.
    const praiseOf = (p: TraitInput) => voices(p) + tx(p).plus + yt(p).plus;
    const againstOf = (p: TraitInput) => faults(p) + tx(p).minus + yt(p).minus;
    const worst = new Set<string>();
    if (cfg.complaint.includes(t)) {
      if (pool.length >= 20) {
        const cap = Math.max(1, Math.ceil(WORST_SHARE * products.length));
        products.filter(p => againstOf(p) >= 8 && againstOf(p) / (praiseOf(p) + 1) > 3)
          .sort((a, b) => againstOf(b) / (praiseOf(b) + 1) - againstOf(a) / (praiseOf(a) + 1)).slice(0, cap).forEach(p => worst.add(p.id));
      } else products.filter(p => againstOf(p) >= 5 && againstOf(p) > praiseOf(p)).forEach(p => worst.add(p.id));
    }
    for (const p of products) {
      const mentions = voices(p) + faults(p) + tx(p).plus + tx(p).minus + yt(p).plus + yt(p).minus;
      const lean = specLean(p.specs, cfg)[t] ?? 0;
      const o = p.override?.[t];
      const hand = typeof o === "number" && Number.isInteger(o) && o >= 1 && o <= 5 ? o : null;
      const enough = evidence(p) >= MIN_EVIDENCE && mentions >= MIN_MENTIONS;
      // Thin player data: the specs and YouTube reviewers set the base, never below 3 (owner 2026-11-15).
      const ytLean = 0.5 * (yt(p).plus - yt(p).minus);
      const basis: TraitScore["basis"] = enough ? "players" : lean > 0.2 || yt(p).plus + yt(p).minus > 0 ? "specs" : "none";
      let cont: number;
      if (enough) {
        const smooth = (net(p) + PRIOR * m) / (base(p) + PRIOR);
        // Most rackets collect "good control", so the share alone can't tell a control racket: what players praise it for
        // decides too. Control vs power praise (with reviewers) leans Control and Defence up and Power down, or the reverse.
        cont = 3 + (smooth - m) / step + lean + styleBonus(p, t, cfg);
      } else cont = 3 + Math.max(0, lean) + ytLean;
      cont = Math.max(1, Math.min(5, cont));
      // Owner 2026-11-15: every racket on the site is solid, so 3 is the floor. 2 only on strong specific complaints (5+ players
      // fault that exact trait, more than praise it); 1 never automatically, only by hand.
      const complaint = worst.has(p.id);
      const dots = hand ?? Math.max(complaint ? 2 : 3, Math.min(5, Math.round(cont)));
      const score = hand !== null ? (hand - 1) * 20 + 10 : Math.round((Math.max(complaint ? 2 : 3, cont) - 1) / 4 * 99);
      out.get(p.id)![t] = { score, dots, plus: voices(p) + tx(p).plus, minus: faults(p) + tx(p).minus, yt: yt(p).plus, spec: lean, basis, ...(hand !== null ? { set: true } : {}) };
    }
  }
  return out;
}

// Scorer v2 (owner 2026-11-15, split scale): dots from the evidence store (lib/evidence.ts evidenceBalance: one voice once,
// comparisons count half).
//   2: the extreme end of complaint traits, on balance: the WORST_SHARE_V2 of rackets with the highest complaint share
//      C / (P + C + 1) and at least MIN_COMPLAINTS weighted complaints.
//   4–5: the praise rate, praising voices (weighted) per report read on the racket, smoothed toward the catalog rate by
//      RATE_PRIOR reports; the top TOP4_SHARE of the catalog get 4, the clear standouts (TOP5_SHARE) 5, and only when
//      complaints on that trait don't outnumber praise.
//   3: everything else (the owner's floor). 1 only by hand; hand-set dots win.
export const RATE_PRIOR = 10, TOP4_SHARE = 0.30, TOP5_SHARE = 0.09, WORST_SHARE_V2 = 0.06, MIN_COMPLAINTS = 9;
export type BalanceInput = { id: string; reports: number; balance: Partial<Record<Trait, { P: number; C: number; plusVoices: number; minusVoices: number; people?: TraitScore["people"] }>>;
  youtube?: Partial<Record<Trait, { plus: number; minus: number }>>; specs?: Specs; override?: Partial<Record<Trait, number>> | null };

export function balanceScores(products: BalanceInput[], cfg: FitConfig = PADEL): Map<string, Record<Trait, TraitScore | null>> {
  const keys = cfg.traits.map(d => d.key);
  const out = new Map<string, Record<Trait, TraitScore | null>>();
  for (const p of products) out.set(p.id, Object.fromEntries(keys.map(t => [t, null])) as Record<Trait, TraitScore | null>);
  const PC = (p: BalanceInput, t: Trait) => p.balance[t] ?? { P: 0, C: 0, plusVoices: 0, minusVoices: 0 };
  for (const t of keys) {
    const reports = products.reduce((a, p) => a + p.reports, 0);
    const r0 = reports ? products.reduce((a, p) => a + PC(p, t).P, 0) / reports : 0;
    const rate = (p: BalanceInput) => (PC(p, t).P + RATE_PRIOR * r0) / (p.reports + RATE_PRIOR);
    const rank = new Map([...products].sort((a, b) => rate(b) - rate(a) || a.id.localeCompare(b.id)).map((p, i) => [p.id, i]));
    const n4 = Math.round(TOP4_SHARE * products.length), n5 = Math.round(TOP5_SHARE * products.length);
    const worst = new Set<string>();
    if (cfg.complaint.includes(t)) {
      const share = (p: BalanceInput) => PC(p, t).C / (PC(p, t).P + PC(p, t).C + 1);
      products.filter(p => PC(p, t).C >= MIN_COMPLAINTS).sort((a, b) => share(b) - share(a))
        .slice(0, Math.max(1, Math.round(WORST_SHARE_V2 * products.length))).forEach(p => worst.add(p.id));
    }
    for (const p of products) {
      const { P, C, plusVoices, minusVoices } = PC(p, t);
      const lean = specLean(p.specs, cfg)[t] ?? 0;
      const o = p.override?.[t];
      const hand = typeof o === "number" && Number.isInteger(o) && o >= 1 && o <= 5 ? o : null;
      const i = rank.get(p.id)!, top = C <= P && P > 0;
      const auto = worst.has(p.id) ? 2 : top && i < n5 ? 5 : top && i < n4 ? 4 : 3;
      const dots = hand ?? auto;
      // 0–99 for quick match: the band's floor plus where it sits in the praise ranking.
      const within = 1 - i / Math.max(1, products.length - 1);
      const score = hand !== null ? (hand - 1) * 20 + 10 : Math.round((dots - 1) * 20 + 19 * within);
      const basis: TraitScore["basis"] = P + C >= 2 ? "players" : lean > 0.2 ? "specs" : "none";
      out.get(p.id)![t] = { score, dots, plus: plusVoices, minus: minusVoices, yt: p.youtube?.[t]?.plus ?? 0, spec: lean, basis, ...(PC(p, t).people ? { people: PC(p, t).people } : {}), ...(hand !== null ? { set: true } : {}) };
    }
  }
  return out;
}
