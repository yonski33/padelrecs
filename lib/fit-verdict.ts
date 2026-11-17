// The racket page's fit check (owner 2026-11-15, site-jobs/RACKET-FIT-PAGE.md): "is this the right racket for you?" for the
// visitor's quick-match picks (lib/quick-match.ts). Real data only, the same inputs as quick match: tag counts from published
// reports, the rankings' places, the quick-take level band. No guessing: thin data says so instead of giving a verdict.
import type { QuickChoice, Level } from "./quick-match";
import { fitConfigFor, SITE_FIT, type FitConfig } from "./fit-config";

import { niche } from "./niche";
import { fineMismatches, type FineFacts } from "./fine-tune";

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
  /** Shape, weight, feel and forgiveness for quick match's fine-tune (lib/fine-tune.ts), and the weight as the specs say it. */
  fine?: FineFacts & { weightSpec?: string | null };
  /** How well it suits each level, 0–100 (lib/level-suits.ts), and a line when the brand and players / reviewers disagree. */
  suits?: { beginner: number; intermediate: number; advanced: number; basis: string[] }; levelDisagree?: string;
  /** Place on the control / power rankings, when it's on them. */
  places?: { control?: number; power?: number };
  /** With a shape picked (owner 2026-11-15: "compare it inside its own filter"): where the racket sits for the picked style
   *  among the rated rackets of that shape, 0 bottom … 1 top (app/match-context.ts styleWithin). */
  styleWithin?: { rank: number; shape: string };
  /** Arm comfort dots (1–5, lib/trait-score.ts, an expert value wins), for the sore-arm check. */
  armDots?: number;
  /** The Attack and Control bars (1–5) as the page shows them: the one style every page uses (owner audit 2026-11-17). */ styleDots?: { power: number; control: number; /** PickleballRecs' spin pick. */ spin?: number };
  /** A site's own hard rules (DiscGolfRecs match audit 2026-11-16, lib/discgolf-hard.ts): the reason it is wrong for a beginner
   *  or a slower arm (the page says skip it, or it is too fast). Each is a hard level / arm reason, so the engine caps it. */
  hard?: { beginner?: string; arm?: string };
  /** A site's softer warnings (DiscGolfRecs: a speed 9–10 step-up driver, a page warning for newer or slower arms): the list
   *  shows it after the rest, never at Strong fit, and the check says why. */
  warn?: { beginner?: string; arm?: string };
  /** A site's one stability for this product (DiscGolfRecs: from the flight numbers), read before the tag counts. */
  lean?: "control" | "balance" | "power";
};
/** Within a picked shape: an all-round racket this high for the picked style counts as built for it, and a racket that
 *  leans the other way this high is only a soft conflict (owner 2026-11-15, the Electra Pro ST5 and the Nox 12K). */
export const WITHIN_OK = 0.6, WITHIN_SOFT = 0.4;
export type FitVerdict = { kind: "good" | "maybe" | "no" | "thin"; label: string; icon: string; reasons: string[]; /** One short reason for list rows (the home). */ short?: string;
  /** What fits (ok checks) and what to weigh (conflicts), for the racket page's two blocks. */ fits?: string[]; catches?: string[] };

/** The fewest reports for a verdict, and below how many it says it rests on fewer reports (per site, lib/niche fit). */
export const MIN_FIT_REPORTS = niche.fit?.minReports ?? 20, FEW_FIT_REPORTS = niche.fit?.fewReports ?? MIN_FIT_REPORTS;
/** Arm-friendly mentions needed before the fit check vouches for a sore arm. */
export const ARM_BAR = 3;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const n = (f: FitFacts, tags: string[]) => tags.reduce((a, t) => a + (f.tags[t] ?? 0), 0);

/** Where the racket sits: control, power or in between, from what players praise (and the rankings it's on). */
export function styleLean(f: FitFacts, cfg: FitConfig = SITE_FIT): { lean: "control" | "power" | "balance" | null; control: number; power: number } {
  const control = n(f, cfg.axis.control.tags), power = n(f, cfg.axis.power.tags);
  if (f.lean) return { lean: f.lean, control, power };
  if (control + power < 5) return { lean: f.places?.control && !f.places.power ? "control" : f.places?.power && !f.places.control ? "power" : null, control, power };
  const lean = control >= power * 1.5 ? "control" : power >= control * 1.5 ? "power" : "balance";
  return { lean, control, power };
}

type Check = { level: "ok" | "soft" | "hard" | "unknown"; reason?: string; short?: string };

function styleCheck(c: QuickChoice, f: FitFacts, cfg: FitConfig): Check {
  if (c.style === "any") return { level: "ok" };
  // A pick off the control–power axis (pickleball's spin): that trait's own praise against its complaints, said plainly.
  if (c.style !== "control" && c.style !== "balance" && c.style !== "power") {
    const t = cfg.traits.find(x => x.key === c.style); if (!t) return { level: "unknown" };
    const plus = n(f, t.plus.map(([tag]) => tag)), minus = n(f, t.minus.map(([tag]) => tag)), word = t.label.toLowerCase();
    if (plus + minus < 3) return { level: "unknown" };
    if (minus > plus) return { level: "hard", short: `Low on ${word}`, reason: `You want ${word}, but it's low on ${word}.` };
    if (plus >= 3 && plus >= 2 * minus) return { level: "ok", short: `Strong ${word}`, reason: `Strong ${word}.` };
    return { level: "soft", short: `${t.label} opinions differ`, reason: `${t.label} splits opinion.` };
  }
  const { lean } = styleLean(f, cfg);
  if (!lean) return { level: "unknown" };
  // A type-picker site (DiscGolfRecs): the axis is stability, said in its own words ("flies understable"), as a statement.
  if (cfg.quick) {
    const word = (s: "control" | "balance" | "power") => cfg.styleLabels[s].toLowerCase(), want = word(c.style), is = word(lean);
    if (lean === c.style) return { level: "ok", short: `Flies ${want}`, reason: `Flies ${want}.` };
    if (c.style === "balance" || lean === "balance") return { level: "soft", short: `Flies ${is}`, reason: `You want ${want}; it flies ${is}.` };
    return { level: "hard", short: `Flies ${is}`, reason: `You want ${want}, but this one flies ${is}.` };
  }
  // Said as a statement (owner 2026-11-16, expert voice, lib/voice.ts): what it is, not how many players praise what.
  if (lean === c.style) return { level: "ok", reason: `Built for ${c.style === "balance" ? "a bit of everything" : c.style}.`, short: c.style === "balance" ? "Suited to an all-round game" : `Suited to your ${c.style} priority` };
  // Inside a picked shape, the racket is weighed against that shape's rackets, not the whole catalog.
  const w = f.styleWithin, among = w && `${w.shape === "hybrid" ? "teardrop / hybrid" : w.shape} rackets`;
  const strong = c.style === "balance" ? "most all-round" : c.style === "power" ? "most powerful" : "most controlled";
  if (w && (c.style === "balance" || lean === "balance") && w.rank >= WITHIN_OK)
    return { level: "ok", short: `Among the ${strong} ${among}`, reason: `Among the ${strong} ${among}.` };
  if (w && c.style !== "balance" && lean !== "balance" && w.rank >= WITHIN_SOFT)
    return { level: "soft", short: `Leans ${lean}, mid-pack for ${c.style} among ${among}`, reason: `It leans ${lean}, but for ${c.style} it sits mid-pack among ${among}.` };
  if (c.style === "balance" || lean === "balance") return { level: "soft", short: `Leans ${lean === "balance" ? "all-round" : lean}`, reason: `You want ${c.style === "balance" ? "a balance" : c.style}; it leans ${lean === "balance" ? "all-round" : lean}.` };
  return { level: "hard", short: `A ${lean} ${cfg.word}`, reason: `You want ${c.style}, but this one is a ${lean} ${cfg.word}.` };
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

/** Suits scores: 62+ fits, 40–61 could (a demo-first), under 40 doesn't, but only when players or reviewers back it: the
 *  brand's label alone never rules a racket out (owner 2026-11-15). */
export const SUITS_OK = 62, SUITS_LOW = 40;
function levelCheck(choice: QuickChoice, f: FitFacts, cfg: FitConfig): Check {
  // No level picked yet: nothing to check (owner 2026-11-15).
  if (!choice.level) return { level: "unknown" };
  if (choice.level === "beginner" && f.hard?.beginner) return { level: "hard", short: `Not a first ${niche.words.one}`, reason: f.hard.beginner };
  if (choice.level === "beginner" && f.warn?.beginner) return { level: "soft", short: /step-up/i.test(f.warn.beginner) ? "Step-up driver" : "Not the easiest start", reason: f.warn.beginner };
  const c = choice as QuickChoice & { level: Level };
  const i = LEVELS.indexOf(c.level), who = c.level === "advanced" ? "advanced players" : `${c.level}s`;
  if (f.suits) {
    // An expert level leads (owner 2026-11-17, Vertex 05 Hybrid: "the pro comes from the brand"): our call first, the brand's
    // label after it as what it is, never in its place.
    const ours = f.suits.basis.includes("expert") ? LEVELS.filter(l => f.suits![l] >= SUITS_OK) : [];
    const backing = levelBacking(f), v = f.suits[c.level];
    const brand = f.levels?.maker?.words.replace(/^(player\s+)?level( of play)?:?\s*/i, "").trim().toLowerCase();
    const said = ours.length ? `Level: we rate it ${ours.length > 1 ? `${ours[0]} to ${ours[ours.length - 1]}` : ours[0]}${brand && brand.split(/\s+/).length <= 3 ? `; the brand says ${brand}` : ""}.`
      : backing ? `Level: ${backing}.` : "";
    const backed = f.suits.basis.some(b => b !== "the brand");
    if (v >= SUITS_OK) return { level: "ok", short: "Suits your level", reason: `${said} Suits ${who}.`.trim() };
    // Why (lib/level-suits.ts caps): a pro line, or players and reviewers putting it at advanced; an expert level says it itself.
    const why = f.suits.basis.includes("expert") ? `Not ${c.level === "intermediate" || c.level === "advanced" ? "an" : "a"} ${c.level} ${niche.words.one}.`
      : f.suits.basis.includes("a pro line") ? `A pro line, built for advanced players.`
      : c.level === "beginner" && f.suits.basis.includes("its shape") ? cfg.quick?.beginnerShapeNote ?? `A diamond shape: few of them suit beginners.`
      : f.suits.basis.includes("advanced players") ? `A ${niche.words.one} for advanced players.` : `Not ${c.level === "intermediate" || c.level === "advanced" ? "an" : "a"} ${c.level} ${niche.words.one}.`;
    if (v < SUITS_LOW && backed) return { level: "hard", short: `Not aimed at ${who}`, reason: `${said} ${why}`.trim() };
    if (!backed && f.suits.basis.length === 0) return { level: "unknown" };
    return { level: "soft", short: f.levelDisagree ? "Level opinions differ" : `Could suit ${who}`, reason: f.levelDisagree ?? `${said} Not clearly ${/^[aeiou]/i.test(c.level) ? "an" : "a"} ${c.level} ${niche.words.one}; ${cfg.quick ? "throw one first" : "demo it first"}.`.trim() };
  }
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
    // Sources disagree: say opinions split, and call it a demo-first (owner: note it when player reports disagree).
    return { level: "soft", short: "Level opinions differ", reason: `Level: ${backing}. Opinions split on whether it suits ${who}.` };
  }
  // No level sources: the finder's level signal, forgiving against demanding mentions.
  const forgiving = f.tags[cfg.forgiving.plus] ?? 0, demanding = n(f, cfg.forgiving.minus) + (c.level === "beginner" ? n(f, cfg.forgiving.beginner) : 0);
  if (c.level === "advanced") return { level: "unknown" };
  if (forgiving + demanding < 3) return { level: "unknown" };
  if (demanding > forgiving) return { level: c.level === "beginner" ? "hard" : "soft", short: "Plays demanding", reason: "It plays more demanding than forgiving." };
  return { level: "ok", short: "Plays forgiving", reason: "Forgiving enough to learn with." };
}

function armCheck(c: QuickChoice, f: FitFacts, cfg: FitConfig): Check {
  if (!c.arm) return { level: "ok" };
  if (f.hard?.arm) return { level: "hard", short: "Needs more arm speed", reason: f.hard.arm };
  if (f.warn?.arm) return { level: "soft", short: "Needs some arm speed", reason: f.warn.arm };
  // A type-picker site's arm pick is a slower arm (DiscGolfRecs): read from its arm dots (players, the flight numbers, the expert).
  if (cfg.quick) {
    const L = cfg.quick.arm[0].toUpperCase() + cfg.quick.arm.slice(1);
    if (f.armDots === undefined) return { level: "unknown", reason: `${L}: not enough said yet about how it flies for a slower arm.` };
    if (f.armDots <= 2) return { level: "hard", short: "Needs more arm speed", reason: `${L}: players and its flight numbers say it needs more arm speed to fly as rated.` };
    if (f.armDots >= 4) return { level: "ok", short: `Suits a slower arm`, reason: `Rated good for a slower arm compared with other ${niche.words.many}.` };
    return { level: "soft", short: "Not clearly slow-arm friendly", reason: `${L}: not clearly easy for a slower arm; throw one first.` };
  }
  const kind = f.tags[cfg.arm.plus] ?? 0, harsh = cfg.arm.minus ? f.tags[cfg.arm.minus] ?? 0 : 0;
  if (harsh > kind) return { level: "hard", short: "Passes on vibration", reason: "Sore arm: it passes on vibration." };
  // Owner 2026-11-15: 3 arm-friendly mentions is the bar ("a racket that hurts your arm will never get 3 of 30–40 saying it's good").
  if (kind >= ARM_BAR) return { level: "ok", short: "Arm-friendly", reason: harsh >= 2 ? "Kind to the arm, with some vibration on mishits." : "Kind to the arm." };
  // Sore arm (audit 2026-11-15, #16): arm complaints (2 dots or fewer on Arm comfort) push a racket out, and one nobody
  // vouches for is a demo-first, not a strong fit. 4+ dots (players or the expert) is enough on its own.
  if (f.armDots !== undefined && f.armDots <= 2) return { level: "hard", short: "Hard on the arm", reason: "Sore arm: hard on elbows and wrists." };
  if (f.armDots !== undefined && f.armDots >= 4) return { level: "ok", short: "Easy on the arm", reason: "Easy on the arm compared with other rackets." };
  // Nothing known about the arm at all: unknown (with too little else, the verdict stays "not enough reports").
  if (f.armDots === undefined && !kind && !harsh) return { level: "unknown", reason: "Sore arm: how it treats the arm isn't known yet." };
  return { level: "soft", short: "Unproven for sore arms", reason: "Sore arm: too little evidence to vouch for it yet. Demo it first." };
}

/** Whether the picks meet a hard reason on level or arm (feel: "plays demanding" for a beginner is a level reason): the match
 *  engine holds such a product under "Worth a look" (audit 2026-11-16, lib/engine hardCap). */
export function hardOnLevelOrArm(c: QuickChoice, f: FitFacts, cfg: FitConfig = SITE_FIT): boolean {
  return levelCheck(c, f, cfg).level === "hard" || armCheck(c, f, cfg).level === "hard";
}

/** The verdict for a visitor's picks. Probably not: a hard conflict. Maybe: one soft conflict. Good: no conflicts and at least
 *  one real reason. Too little data (few reports, or nothing known about what was asked): say so. */
/** Fine-tune picks the racket doesn't match ("heavier than you asked for"): a soft reason only, never a hard no. */
function fineCheck(c: QuickChoice, f: FitFacts): Check {
  const miss = c.fine && f.fine ? fineMismatches(c.fine, f.fine, f.fine.weightSpec) : [];
  return miss.length ? { level: "soft", short: miss[0].replace(/ \(.*\)\.$|\.$/, ""), reason: miss.join(" ") } : { level: "ok" };
}

/** With `as` (the match engine's word, lib/engine engineKind), the verdict says that word and picks its reasons for it; without,
 *  the checks decide it as before. */
export function fitVerdict(c: QuickChoice, f: FitFacts, cfg: FitConfig = SITE_FIT, as?: FitVerdict["kind"]): FitVerdict {
  const checks = [styleCheck(c, f, cfg), levelCheck(c, f, cfg), armCheck(c, f, cfg), fineCheck(c, f)];
  const reasons = (pick: Check["level"][]) => checks.filter(x => pick.includes(x.level) && x.reason).map(x => x.reason!);
  const asked = [c.style !== "any", true, c.arm].filter(Boolean).length;
  const known = checks.filter((x, i) => [c.style !== "any", true, c.arm][i] && x.level !== "unknown").length;
  if (as === "thin" || (!as && (f.reports < MIN_FIT_REPORTS || known === 0 || known < Math.ceil(asked / 2))))
    return { kind: "thin", label: "Not enough reports from players like you yet", icon: "🫥", reasons: reasons(["hard", "soft", "ok"]).slice(0, 2) };
  const fits = reasons(["ok"]), catches = [...reasons(["hard"]), ...reasons(["soft"])];
  const short = (lv: Check["level"], mark: string) => { const x = checks.find(c => c.level === lv && c.short); return x ? `${mark} ${x.short}` : undefined; };
  const kind = as ?? (checks.some(x => x.level === "hard") ? "no" : checks.some(x => x.level === "soft") ? "maybe" : "good");
  if (kind === "no") return { kind: "no", label: `Probably not your ${cfg.word}`, icon: "🤔", reasons: [...reasons(["hard"]), ...reasons(["soft", "ok"])].slice(0, 3), short: short("hard", "✗") ?? short("soft", "~"), fits, catches };
  if (kind === "maybe") return { kind: "maybe", label: "Maybe, demo it first", icon: "🤷", reasons: [...reasons(["soft"]), ...reasons(["ok"]), ...reasons(["unknown"])].slice(0, 3), short: short("ok", "✓") ?? short("soft", "~"), fits, catches };
  return { kind: "good", label: "Good match for you", icon: "👍", reasons: [...reasons(["ok"]).slice(0, 2), ...reasons(["unknown"]), ...reasons(["ok"]).slice(2)].slice(0, 3), short: short("ok", "✓"), fits, catches };
}

/** "Generally best for" chips when there are no picks: the band, the lean, arm comfort, only what the data supports. */
export function bestFor(f: FitFacts, cfg: FitConfig = SITE_FIT): string[] {
  const out: string[] = [];
  // The level from the same scores the fit check uses (owner audit 2026-11-17: the page and the fit check never disagree);
  // the sources' band only where there are no scores.
  // A hard reason for beginners (DiscGolfRecs: speed 11+, fade 3+, "not a first disc") keeps "beginner" out of the line too.
  const ok = f.suits ? LEVELS.map((l, i) => f.suits![l as keyof typeof f.suits] as number >= SUITS_OK && !(i === 0 && f.hard?.beginner) ? i : -1).filter(i => i >= 0) : [];
  let band = ok.length ? { from: ok[0], to: ok[ok.length - 1] } : combinedBand(f);
  if (band && band.from === 0 && f.hard?.beginner) band = { from: 1, to: Math.max(band.to, 1) };
  if (band) out.push(band.from === band.to ? LEVELS[band.from] : `${LEVELS[band.from]} → ${LEVELS[band.to]}`);
  const lean = styleOf(f, cfg);
  // A type-picker site says it in its own sport's terms (DiscGolfRecs: what the stability is good for).
  if (lean) out.push(cfg.quick ? (cfg.quick.leanFor?.[lean] ?? cfg.styleLabels[lean].toLowerCase()) : lean === "balance" ? "all-round players" : `${lean} players`);
  const kind = f.tags[cfg.arm.plus] ?? 0, harsh = cfg.arm.minus ? f.tags[cfg.arm.minus] ?? 0 : 0;
  // Sore arms only when the Arm comfort bar backs it (4+), not on the tag count alone (audit: the AT10 12K XTREM).
  if (kind >= 5 && kind > 2 * harsh && (f.armDots === undefined || f.armDots >= 4) && !f.hard?.arm && !f.warn?.arm) out.push(cfg.quick ? "slower arms" : "sore arms");
  return out;
}
/** One style per racket (owner audit 2026-11-17): from the Attack and Control bars the page shows (a clear lead of 1+ dots),
 *  else the players' praise lean (lib/fit-verdict styleLean). */
export function styleOf(f: FitFacts, cfg: FitConfig = SITE_FIT): "control" | "power" | "balance" | null {
  if (f.styleDots && !cfg.quick) { const d = f.styleDots.power - f.styleDots.control; return d >= 1 ? "power" : d <= -1 ? "control" : "balance"; }
  return styleLean(f, cfg).lean;
}
