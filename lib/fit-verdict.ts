// The racket page's fit check (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md): "is this the right racket for you?" for the
// visitor's quick-match picks (lib/quick-match.ts). Real data only, the same inputs as quick match: tag counts from published
// reports, the rankings' places, the quick-take level band. No guessing: thin data says so instead of giving a verdict.
import type { QuickChoice } from "./quick-match";

export type FitFacts = {
  /** Every stored report on the racket. */
  reports: number;
  /** Tag mentions: good tags counted from positive and mixed reports only (like the finder), the rest from all. */
  tags: Record<string, number>;
  /** Quick-take level band, 0 beginner … 2 advanced. */
  band?: { from: number; to: number };
  /** Place on the control / power rankings, when it's on them. */
  places?: { control?: number; power?: number };
};
export type FitVerdict = { kind: "good" | "maybe" | "no" | "thin"; label: string; icon: string; reasons: string[] };

export const MIN_FIT_REPORTS = 20;
const CONTROL = ["good control", "great in defence"], POWER = ["easy power", "great on smashes"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const n = (f: FitFacts, tags: string[]) => tags.reduce((a, t) => a + (f.tags[t] ?? 0), 0);
const players = (k: number) => `${k} ${k === 1 ? "player" : "players"}`;

/** Where the racket sits: control, power or in between, from what players praise (and the rankings it's on). */
export function styleLean(f: FitFacts): { lean: "control" | "power" | "balance" | null; control: number; power: number } {
  const control = n(f, CONTROL), power = n(f, POWER);
  if (control + power < 5) return { lean: f.places?.control && !f.places.power ? "control" : f.places?.power && !f.places.control ? "power" : null, control, power };
  const lean = control >= power * 1.5 ? "control" : power >= control * 1.5 ? "power" : "balance";
  return { lean, control, power };
}

type Check = { level: "ok" | "soft" | "hard" | "unknown"; reason?: string };

function styleCheck(c: QuickChoice, f: FitFacts): Check {
  if (c.style === "any") return { level: "ok" };
  const { lean, control, power } = styleLean(f);
  if (!lean) return { level: "unknown" };
  const evidence = lean === "control" ? `${players(control)} praise the control` : lean === "power" ? `${players(power)} praise the power` : `players praise both control (${control}) and power (${power})`;
  if (lean === c.style) return { level: "ok", reason: `Built for ${c.style === "balance" ? "a bit of everything" : c.style}: ${evidence}.` };
  if (c.style === "balance" || lean === "balance") return { level: "soft", reason: `You want ${c.style === "balance" ? "a balance" : c.style}; it leans ${lean === "balance" ? "all-round" : lean}. ${evidence[0].toUpperCase()}${evidence.slice(1)}.` };
  return { level: "hard", reason: `You want ${c.style}, but this one is a ${lean} racket: ${evidence}.` };
}

function levelCheck(c: QuickChoice, f: FitFacts): Check {
  const i = LEVELS.indexOf(c.level), who = c.level === "advanced" ? "advanced players" : `${c.level}s`;
  if (f.band) {
    const span = `${LEVELS[f.band.from]}${f.band.to > f.band.from ? ` to ${LEVELS[f.band.to]}` : ""}`;
    if (i < f.band.from || i > f.band.to) return { level: "hard", reason: `Players put it at ${span}, not for ${who}.` };
    return { level: "ok", reason: `Players put it at ${span}: that includes you.` };
  }
  // No band yet: the finder's level signal, forgiving against demanding mentions.
  const forgiving = f.tags.forgiving ?? 0, demanding = (f.tags.demanding ?? 0) + (c.level === "beginner" ? f.tags["small sweet spot"] ?? 0 : 0);
  if (c.level === "advanced") return { level: "unknown" };
  if (forgiving + demanding < 3) return { level: "unknown" };
  if (demanding > forgiving) return { level: c.level === "beginner" ? "hard" : "soft", reason: `${players(demanding)} call it demanding, against ${forgiving} who call it forgiving.` };
  return { level: "ok", reason: `${players(forgiving)} call it forgiving.` };
}

function armCheck(c: QuickChoice, f: FitFacts): Check {
  if (!c.arm) return { level: "ok" };
  const kind = f.tags["arm-friendly"] ?? 0, harsh = f.tags["vibrates on mishits"] ?? 0;
  if (harsh > kind) return { level: "hard", reason: `Sore arm: ${players(harsh)} mention vibration, only ${kind} call it arm-friendly.` };
  if (kind >= 2) return { level: "ok", reason: `${players(kind)} call it arm-friendly${harsh ? `, ${harsh} mention vibration` : ""}.` };
  return { level: "unknown" };
}

/** The verdict for a visitor's picks. Probably not: a hard conflict. Maybe: one soft conflict. Good: no conflicts and at least
 *  one real reason. Too little data (few reports, or nothing known about what was asked): say so. */
export function fitVerdict(c: QuickChoice, f: FitFacts): FitVerdict {
  const checks = [styleCheck(c, f), levelCheck(c, f), armCheck(c, f)];
  const reasons = (pick: Check["level"][]) => checks.filter(x => pick.includes(x.level) && x.reason).map(x => x.reason!);
  const asked = [c.style !== "any", true, c.arm].filter(Boolean).length;
  const known = checks.filter((x, i) => [c.style !== "any", true, c.arm][i] && x.level !== "unknown").length;
  if (f.reports < MIN_FIT_REPORTS || known === 0 || known < Math.ceil(asked / 2))
    return { kind: "thin", label: "Not enough reports from players like you yet", icon: "🫥", reasons: reasons(["hard", "soft", "ok"]).slice(0, 2) };
  if (checks.some(x => x.level === "hard")) return { kind: "no", label: "Probably not your racket", icon: "🤔", reasons: [...reasons(["hard"]), ...reasons(["soft", "ok"])].slice(0, 3) };
  if (checks.some(x => x.level === "soft")) return { kind: "maybe", label: "Maybe, demo it first", icon: "🤷", reasons: [...reasons(["soft"]), ...reasons(["ok"])].slice(0, 3) };
  return { kind: "good", label: "Good match for you", icon: "👍", reasons: reasons(["ok"]).slice(0, 3) };
}

/** "Generally best for" chips when there are no picks: the band, the lean, arm comfort, only what the data supports. */
export function bestFor(f: FitFacts): string[] {
  const out: string[] = [];
  if (f.band) out.push(f.band.from === f.band.to ? LEVELS[f.band.from] : `${LEVELS[f.band.from]} → ${LEVELS[f.band.to]}`);
  const { lean } = styleLean(f);
  if (lean) out.push(lean === "balance" ? "all-round players" : `${lean} players`);
  const kind = f.tags["arm-friendly"] ?? 0, harsh = f.tags["vibrates on mishits"] ?? 0;
  if (kind >= 5 && kind > 2 * harsh) out.push("sore arms");
  return out;
}
