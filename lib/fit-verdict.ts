// The racket page's fit check (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md): "is this the right racket for you?" for the
// visitor's quick-match picks (lib/quick-match.ts). Real data only, the same inputs as quick match: tag counts from published
// reports, the rankings' places, the quick-take level band. No guessing: thin data says so instead of giving a verdict.
import type { QuickChoice } from "./quick-match";

/** A level range, 0 beginner … 2 advanced. */
export type Band = { from: number; to: number };
/** Where a racket's level comes from (owner 2026-11-15, RACKET-FIT-PAGE.md "Racket level band: sources"): the brand's own
 *  product page, YouTube reviewers who state a level (2+ channels agreeing), and the players' reports (the quick-take band). */
export type LevelSources = { maker?: Band & { words: string; url: string }; youtube?: Band & { channels: number; of: number }; players?: Band };
export type FitFacts = {
  /** Every stored report on the racket. */
  reports: number;
  /** Tag mentions: good tags counted from positive and mixed reports only (like the finder), the rest from all. */
  tags: Record<string, number>;
  /** Quick-take level band (from player reports), 0 beginner … 2 advanced. */
  band?: Band;
  /** Maker and YouTube levels beside the players' band; see levelSources(). */
  levels?: LevelSources;
  /** Place on the control / power rankings, when it's on them. */
  places?: { control?: number; power?: number };
};
export type FitVerdict = { kind: "good" | "maybe" | "no" | "thin"; label: string; icon: string; reasons: string[]; /** One short reason for list rows (the home). */ short?: string;
  /** What fits (ok checks) and what to weigh (conflicts), for the racket page's two blocks. */ fits?: string[]; catches?: string[] };

export const MIN_FIT_REPORTS = 20;
/** Arm-friendly mentions needed before the fit check vouches for a sore arm. */
export const ARM_BAR = 3;
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

type Check = { level: "ok" | "soft" | "hard" | "unknown"; reason?: string; short?: string };

function styleCheck(c: QuickChoice, f: FitFacts): Check {
  if (c.style === "any") return { level: "ok" };
  const { lean, control, power } = styleLean(f);
  if (!lean) return { level: "unknown" };
  const evidence = lean === "control" ? `${players(control)} praise the control` : lean === "power" ? `${players(power)} praise the power` : `players praise both control (${control}) and power (${power})`;
  if (lean === c.style) return { level: "ok", reason: `Built for ${c.style === "balance" ? "a bit of everything" : c.style}: ${evidence}.`, short: c.style === "balance" ? "Suited to an all-round game" : `Suited to your ${c.style} priority` };
  if (c.style === "balance" || lean === "balance") return { level: "soft", short: `Leans ${lean === "balance" ? "all-round" : lean}`, reason: `You want ${c.style === "balance" ? "a balance" : c.style}; it leans ${lean === "balance" ? "all-round" : lean}. ${evidence[0].toUpperCase()}${evidence.slice(1)}.` };
  return { level: "hard", short: `A ${lean} racket`, reason: `You want ${c.style}, but this one is a ${lean} racket: ${evidence}.` };
}

const span = (b: Band) => b.from === b.to ? LEVELS[b.from] : `${LEVELS[b.from]} to ${LEVELS[b.to]}`;
const has = (b: Band, i: number) => i >= b.from && i <= b.to;
/** The level sources a racket has, the players' band included. */
export function levelSources(f: FitFacts): LevelSources {
  return { ...f.levels, players: f.levels?.players ?? f.band };
}
/** "the brand and 3 reviewers say beginner to intermediate · players say intermediate": what backs a band, sources that
 *  agree grouped together. */
export function levelBacking(f: FitFacts): string | null {
  const src = levelSources(f);
  const named: [string, Band][] = [];
  if (src.maker) named.push(["the brand", src.maker]);
  // The brand's own short term when it has one ("Level: Professional" → "professional"), else the range.
  const brandTerm = src.maker?.words.replace(/^(player\s+)?level( of play)?:?\s*/i, "").trim().toLowerCase();
  const brandSays = brandTerm && brandTerm.split(/\s+/).length <= 3 ? brandTerm.replace(/\s*[-/]\s*/g, " to ") : null;
  if (src.youtube) named.push([`${src.youtube.channels} reviewers`, src.youtube]);
  if (src.players) named.push(["players", src.players]);
  if (!named.length) return null;
  const groups = new Map<string, string[]>();
  for (const [who, b] of named) { const k = span(b); groups.set(k, [...groups.get(k) ?? [], who]); }
  return [...groups].map(([k, whos]) => [whos.length === 1 && whos[0] === "the brand" && brandSays ? brandSays : k, whos] as const).map(([k, whos]) => `${whos.length > 1 ? `${whos.slice(0, -1).join(", ")} and ${whos.at(-1)}` : whos[0]} ${whos.length === 1 && whos[0] !== "players" && !whos[0].endsWith("reviewers") ? "says" : "say"} ${k}`).join(" · ");
}
/** The band the sources agree on: each level that at least half of them include. */
export function combinedBand(f: FitFacts): Band | undefined {
  const bands = Object.values(levelSources(f)).filter((b): b is Band => !!b);
  if (!bands.length) return undefined;
  const fits = [0, 1, 2].filter(i => bands.filter(b => has(b, i)).length * 2 >= bands.length);
  return fits.length ? { from: fits[0], to: fits[fits.length - 1] } : undefined;
}

function levelCheck(c: QuickChoice, f: FitFacts): Check {
  const i = LEVELS.indexOf(c.level), who = c.level === "advanced" ? "advanced players" : `${c.level}s`;
  const src = levelSources(f);
  // Brands label most top-line rackets "Professional". Such a label says "not aimed at beginners", so it counts for a beginner;
  // it isn't counted against intermediates. A brand range that names lower levels counts in full (owner 2026-11-15).
  const makerCounts = !!src.maker && (src.maker.from < 2 || c.level !== "intermediate");
  const named = ([["the brand", makerCounts ? src.maker : undefined], ["reviewers", src.youtube], ["players", src.players]] as [string, Band | undefined][]).filter((x): x is [string, Band] => !!x[1]);
  if (named.length) {
    const yes = named.filter(([, b]) => has(b, i)), no = named.filter(([, b]) => !has(b, i));
    const backing = levelBacking(f);
    if (!no.length) return { level: "ok", short: "Fits your level", reason: `Level: ${backing}. That includes you.` };
    if (!yes.length) return { level: "hard", short: `Not aimed at ${who}`, reason: `Level: ${backing}. Not aimed at ${who}.` };
    // Sources disagree: say who, and call it a demo-first (owner: note it when player reports disagree).
    const whoNot = no.map(([w]) => w).join(" and ");
    return { level: "soft", short: "Level opinions differ", reason: `Level: ${backing}. ${whoNot[0].toUpperCase()}${whoNot.slice(1)} ${no.length > 1 || no[0][0] !== "the brand" ? "don't" : "doesn't"} put it at ${c.level}.` };
  }
  // No level sources: the finder's level signal, forgiving against demanding mentions.
  const forgiving = f.tags.forgiving ?? 0, demanding = (f.tags.demanding ?? 0) + (c.level === "beginner" ? f.tags["small sweet spot"] ?? 0 : 0);
  if (c.level === "advanced") return { level: "unknown" };
  if (forgiving + demanding < 3) return { level: "unknown" };
  if (demanding > forgiving) return { level: c.level === "beginner" ? "hard" : "soft", short: "Players call it demanding", reason: `${players(demanding)} call it demanding, against ${forgiving} who call it forgiving.` };
  return { level: "ok", short: "Players call it forgiving", reason: `${players(forgiving)} call it forgiving.` };
}

function armCheck(c: QuickChoice, f: FitFacts): Check {
  if (!c.arm) return { level: "ok" };
  const kind = f.tags["arm-friendly"] ?? 0, harsh = f.tags["vibrates on mishits"] ?? 0;
  if (harsh > kind) return { level: "hard", short: "Players mention vibration", reason: `Sore arm: ${players(harsh)} mention vibration, only ${kind} call it arm-friendly.` };
  // Owner 2026-11-15: 3 arm-friendly mentions is the bar ("a racket that hurts your arm will never get 3 of 30–40 saying it's good").
  if (kind >= ARM_BAR) return { level: "ok", short: "Players call it arm-friendly", reason: `${players(kind)} call it arm-friendly${harsh ? `, ${harsh} mention vibration` : ""}.` };
  return { level: "unknown", reason: `Sore arm: only ${kind} ${kind === 1 ? "player calls" : "players call"} it arm-friendly so far, too few to vouch for it.` };
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
  const fits = reasons(["ok"]), catches = [...reasons(["hard"]), ...reasons(["soft"])];
  const short = (lv: Check["level"], mark: string) => { const x = checks.find(c => c.level === lv && c.short); return x ? `${mark} ${x.short}` : undefined; };
  if (checks.some(x => x.level === "hard")) return { kind: "no", label: "Probably not your racket", icon: "🤔", reasons: [...reasons(["hard"]), ...reasons(["soft", "ok"])].slice(0, 3), short: short("hard", "✗"), fits, catches };
  if (checks.some(x => x.level === "soft")) return { kind: "maybe", label: "Maybe, demo it first", icon: "🤷", reasons: [...reasons(["soft"]), ...reasons(["ok"]), ...reasons(["unknown"])].slice(0, 3), short: short("ok", "✓") ?? short("soft", "~"), fits, catches };
  return { kind: "good", label: "Good match for you", icon: "👍", reasons: [...reasons(["ok"]).slice(0, 2), ...reasons(["unknown"]), ...reasons(["ok"]).slice(2)].slice(0, 3), short: short("ok", "✓"), fits, catches };
}

/** "Generally best for" chips when there are no picks: the band, the lean, arm comfort, only what the data supports. */
export function bestFor(f: FitFacts): string[] {
  const out: string[] = [];
  const band = combinedBand(f);
  if (band) out.push(band.from === band.to ? LEVELS[band.from] : `${LEVELS[band.from]} → ${LEVELS[band.to]}`);
  const { lean } = styleLean(f);
  if (lean) out.push(lean === "balance" ? "all-round players" : `${lean} players`);
  const kind = f.tags["arm-friendly"] ?? 0, harsh = f.tags["vibrates on mishits"] ?? 0;
  if (kind >= 5 && kind > 2 * harsh) out.push("sore arms");
  return out;
}
