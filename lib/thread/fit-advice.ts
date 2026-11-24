// The racket page's "Is it right for me?" advice (owner 2026-11-19): the lines under the headline answer the player's picks
// instead of describing the racket. Pure, so tests feed plain facts.
//   - Under 60%: why it misses for them, then 1 or 2 better fits.
//   - 60 to 79%: what fits and what doesn't, plus one better fit if it scores 10+ points higher.
//   - 80% and up: why it fits, no suggestions.
// Words only (no counts), no testing claims. The facts are the cached payload's (app/home-payload.ts), the same the engine
// ranks on: how well it suits each level, the Attack and Control dots, the arm dots, feel, forgiveness, balance and shape.

export type AdvLevel = "beginner" | "intermediate" | "advanced";
import { niche } from "../niche";
/** "spin" on PickleballRecs (owner 2026-11-19: a 4th "I want" option), judged on the page's Spin bar. */
export type AdvStyle = "control" | "balance" | "power" | "spin";
export type AdvPicks = { level: AdvLevel; style: AdvStyle; arm: boolean };
export type AdvFacts = {
  suits?: { beginner: number; intermediate: number; advanced: number } | null;
  /** 1–5, as the page's Attack and Control bars (and Spin on pickleball). */ styleDots?: { power: number; control: number; spin?: number } | null;
  /** 1–5 arm comfort. */ armDots?: number | null;
  feel?: "soft" | "medium" | "firm" | null; forgiveness?: number | null; headHeavy?: boolean | null;
  /** The trait scores 0–99 the engine ranks on (lib/trait-score.ts), null when thin. */ control?: number | null; power?: number | null; arm?: number | null;
};
export type AdvCandidate = { id: string; name: string; href: string; pct: number; brand: string; shape: string | null };
export type Advice = { line: string; better: AdvCandidate[] };

/** A level suits it from this score (lib/level-suits.ts, 0–100), it's made for that level from MADE, and at or under MISS it
 *  doesn't suit. A trait score under LOW is short on that trait, and a style gap of GAP or more is a lean. */
const SUITS = 70, MADE = 60, MISS = 50, LOW = 50, GAP = 25;
const LEVELS: AdvLevel[] = ["beginner", "intermediate", "advanced"];
const A = { beginner: "a beginner", intermediate: "an intermediate", advanced: "an advanced player" } as const;
const STYLE_WORD = { control: "control", balance: "balance", power: "power", spin: "spin" } as const;
const STYLE_FIT = { control: "strong on control", balance: "well balanced", power: "strong on power", spin: "strong on spin" } as const;
/** The product word in the lines ("a lot of racket", "a lot of paddle"). */
const ONE = niche.words.one, MANY = niche.words.many;

type Point = { short: string; long: string };

/** What fits these picks, strongest first, as short phrases ("easy on the arm"). */
export function fitsOf(p: AdvPicks, f: AdvFacts): string[] {
  const out: string[] = [], d = f.styleDots;
  if (p.arm && ((f.armDots ?? 0) >= 4 || (f.arm ?? 0) >= 75)) out.push("easy on the arm");
  if (p.level === "beginner" && (f.forgiveness ?? 0) >= 70) out.push("forgiving");
  const c = f.control ?? (d ? d.control * 20 : null), w = f.power ?? (d ? d.power * 20 : null);
  if (c != null && w != null) {
    if (p.style === "control" && c >= 70) out.push("strong on control");
    if (p.style === "power" && w >= 70) out.push("strong on power");
    if (p.style === "balance" && Math.abs(w - c) < 15 && Math.min(w, c) >= 55) out.push("well balanced");
  }
  if (p.style === "spin" && (d?.spin ?? 0) >= 4) out.push("strong on spin");
  if ((f.suits?.[p.level] ?? 0) >= SUITS) out.push(`suits ${A[p.level]}`);
  if (p.arm && f.feel === "soft" && (f.armDots ?? 0) >= 3 && !out.includes("easy on the arm")) out.push("soft on the arm");
  return out;
}

/** What misses for these picks, most serious first: level, then the arm, then the style. */
export function missesOf(p: AdvPicks, f: AdvFacts): Point[] {
  const out: Point[] = [], s = f.suits, d = f.styleDots;
  if (s && s[p.level] <= MISS) {
    const made = LEVELS.filter(l => s[l] >= MADE), i = LEVELS.indexOf(p.level);
    const up = made.length > 0 && made.every(l => LEVELS.indexOf(l) > i), down = made.length > 0 && made.every(l => LEVELS.indexOf(l) < i);
    const madeFor = made.length === 1 ? (made[0] === "advanced" ? "advanced players" : `${made[0]}s`)
      : made.length === 2 && made[0] === "intermediate" ? "intermediate and up" : made.length === 2 ? "beginners and intermediates" : "";
    if (up) out.push({ short: `a lot of ${ONE} for ${A[p.level]}`, long: `Made for ${madeFor}, so it asks more than ${A[p.level]} wants.` });
    else if (down) out.push({ short: `easy to outgrow for ${A[p.level]}`, long: `Made for ${madeFor}, so ${A[p.level]} may outgrow it.` });
    else out.push({ short: `not built for ${A[p.level]}`, long: `Not built with ${A[p.level]} in mind.` });
  } else if (p.level === "beginner" && f.headHeavy && (f.forgiveness ?? 100) < 60) {
    out.push({ short: "head-heavy for a beginner", long: "Head-heavy with a small sweet spot, harder to handle for a beginner." });
  }
  if (p.arm && ((f.armDots ?? 5) <= 2 || (f.arm ?? 100) < LOW)) {
    const stiff = f.feel === "firm", heavy = !!f.headHeavy;
    const what = stiff && heavy ? "Stiff and head-heavy" : stiff ? "Stiff" : heavy ? "Head-heavy" : "Not easy on the arm";
    out.push({ short: "hard on a sore arm", long: what === "Not easy on the arm" ? "Not easy on the arm, a risk with a sore arm." : `${what}, hard on a sore arm.` });
  }
  // The style from the trait scores when there are both, else the dots (1–5, scaled to the same gap).
  const c = f.control ?? (d ? d.control * 20 : null), w = f.power ?? (d ? d.power * 20 : null);
  if (c != null && w != null) {
    const lean = w - c;
    if (p.style === "control" && (c < LOW || lean >= GAP))
      out.push({ short: `a bit lively for ${p.level === "beginner" ? "a beginner" : "a control game"}`, long: "It leans to power, livelier than a control game wants." });
    else if (p.style === "power" && (w < LOW || lean <= -GAP))
      out.push({ short: "short on punch for a power game", long: "It leans to control, short on punch for a power game." });
    else if (p.style === "balance" && Math.abs(lean) >= GAP)
      out.push(lean > 0 ? { short: `a bit lively for ${p.level === "beginner" ? "a beginner" : "a balanced game"}`, long: "It leans to power more than the balance you asked for." }
        : { short: "a bit tame for a balanced game", long: "It leans to control more than the balance you asked for." });
  }
  if (p.style === "spin" && d?.spin != null && d.spin <= 2) out.push({ short: "short on spin for a spin game", long: "Players find it short on spin, so a spin game asks more of it." });
  return out;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const and = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** The advice line for a match %. */
export function adviceLine(p: AdvPicks, f: AdvFacts, pct: number): string {
  const fits = fitsOf(p, f), misses = missesOf(p, f);
  if (pct < 60) return misses[0]?.long ?? `Other ${MANY} match your picks more closely.`;
  if (pct < 80) {
    if (fits.length && misses.length) return `${cap(fits[0])}, but ${misses[0].short}.`;
    if (misses.length) return `${misses[0].long.replace(/\.$/, "")}, so demo it first.`;
    if (fits.length) return `${cap(and(fits.slice(0, 2)))}, though a few match your picks more closely.`;
    return "A fair fit, but others match your picks more closely.";
  }
  // Say only what the fits don't already: "Forgiving and well balanced, a good fit for a beginner."
  const own = fits.filter(x => !x.startsWith("suits ")).slice(0, 2);
  const styled = own.some(x => STYLE_FIT[p.style] === x), armed = own.some(x => x.endsWith("on the arm"));
  const who = `${A[p.level]}${p.arm && !armed ? " with a sore arm" : ""}${styled ? "" : ` who wants ${STYLE_WORD[p.style]}`}`;
  return own.length ? `${cap(and(own))}, a good fit for ${who}.` : `A good fit for ${who}.`;
}

/** Better fits: current models only (the caller passes those), not this model, scoring at least `by` points more. Takes the
 *  best, and between two within 5 points, prefers the one sharing this racket's brand or shape. */
export function betterFits(own: { pct: number; brand: string; shape: string | null }, cands: AdvCandidate[], count: number, by = 10): AdvCandidate[] {
  const pool = cands.filter(c => c.pct >= own.pct + by).sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
  const near = (c: AdvCandidate) => (c.brand && c.brand === own.brand ? 2 : 0) + (own.shape && c.shape === own.shape ? 1 : 0);
  const out: AdvCandidate[] = [];
  while (out.length < count && pool.length) {
    const top = pool[0].pct, close = pool.filter(c => top - c.pct <= 5);
    const pick = close.reduce((a, b) => near(b) > near(a) ? b : a, close[0]);
    out.push(pick); pool.splice(pool.indexOf(pick), 1);
  }
  return out.sort((a, b) => b.pct - a.pct);
}

/** Both parts: the line, and the suggestions its band allows (2 under 60%, 1 from 60 to 79%, none from 80%). */
export function advise(p: AdvPicks, f: AdvFacts, own: { pct: number; brand: string; shape: string | null }, cands: AdvCandidate[]): Advice {
  const n = own.pct < 60 ? 2 : own.pct < 80 ? 1 : 0;
  return { line: adviceLine(p, f, own.pct), better: n ? betterFits(own, cands, n) : [] };
}
