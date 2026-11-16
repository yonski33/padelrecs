// Quick match (owner 2026-11-15: "the home page IS the quiz — you see the rackets according to what you need, not what we
// set"). A one-sentence version of the finder (lib/finder.ts): "I want [any | control | balance | power] and I'm [beginner |
// intermediate | advanced] [✓ sore elbow / wrist]". It reuses the finder's own options and scoring (tags counted from
// published reviews, the rankings' places), adds the level evidence we hold (players' stated levels, the quick-take level
// band), and with nothing chosen it is simply the Player score order. Pure functions, so tests feed plain objects.
import { matchFinder, type FinderProduct, type Reason } from "./finder";
import type { Finder, FinderOption } from "./niche/types";
import { fitConfigFor, type FitConfig } from "./fit-config";

const PADEL = fitConfigFor({ id: "padel" })!;
import { readFine, fineEmpty, fineParams, type FineTune } from "./fine-tune";
import { niche } from "./niche";

export const STYLES = ["any", "control", "balance", "power"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Style = typeof STYLES[number];
export type Level = typeof LEVELS[number];
export type QuickChoice = { style: Style; /** Unset until the visitor taps a level (owner 2026-11-15: picking a style must not
 *  pick "intermediate" too); no level means no level gate, bonus or check. */ level?: Level; arm: boolean; /** "Not sure yet? fine-tune" (lib/fine-tune.ts). */ fine?: FineTune;
  /** The product type picked first (sites with a type picker, lib/fit-config.ts quick.types: DiscGolfRecs): a hard filter. */ kind?: string };
export const DEFAULT_CHOICE: QuickChoice = { style: "any", arm: false };

/** Reads ?style=&level=&arm= (unknown values fall back to the default), and the fine-tune on a site that has one (padel's
 *  shapes and weights; lib/fit-config.ts fineTune). */
export function readChoice(q: { style?: string; level?: string; arm?: string; shape?: string; weight?: string; feel?: string; sweet?: string; kind?: string }, cfg: FitConfig | undefined = fitConfigFor(niche)): QuickChoice {
  const fine = cfg?.fineTune ? readFine(q) : {};
  const kind = cfg?.quick?.types.some(t => t.key === q.kind) ? q.kind : undefined;
  return {
    ...(fineEmpty(fine) ? {} : { fine }),
    ...(kind ? { kind } : {}),
    style: STYLES.includes(q.style as Style) ? q.style as Style : DEFAULT_CHOICE.style,
    ...(LEVELS.includes(q.level as Level) ? { level: q.level as Level } : {}),
    arm: q.arm === "1",
  };
}
export const isDefault = (c: QuickChoice) => c.style === DEFAULT_CHOICE.style && !c.level && !c.arm && fineEmpty(c.fine) && !c.kind;
/** The address for a choice: only what differs from the default, so "/" is the default list. */
export function choiceHref(c: QuickChoice, anchor = "#match") {
  const q = new URLSearchParams();
  if (c.kind) q.set("kind", c.kind);
  if (c.style !== DEFAULT_CHOICE.style) q.set("style", c.style);
  if (c.level) q.set("level", c.level);
  if (c.arm) q.set("arm", "1");
  for (const [k, v] of fineParams(c.fine)) q.set(k, v);
  return `${q.size ? `/?${q}` : "/"}${anchor}`;
}

const LEVEL_LABEL: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
/** Sore elbow or wrist: rackets players call arm-friendly rank first (a strong weight, not a filter, so the list stays full),
 *  with vibration complaints counting against. */
export const armOption = (cfg: FitConfig = PADEL): FinderOption => ({ label: "Sore elbow / wrist", want: [cfg.arm.plus], avoid: cfg.arm.minus ? [cfg.arm.minus] : [], weight: 2.5 });
export const ARM_OPTION: FinderOption = armOption();

/** The finder options a choice stands for. */
export function chosenOptions(finder: Pick<Finder, "questions">, c: QuickChoice, cfg: FitConfig = PADEL): FinderOption[] {
  const q = (id: string) => finder.questions.find(x => x.id === id);
  const opts: FinderOption[] = [];
  if (c.style !== "any") { const o = q("style")?.options.find(x => x.label === cfg.styleLabels[c.style as Exclude<Style, "any">]); if (o) opts.push(o); }
  const lv = c.level && q("level")?.options.find(x => x.label === LEVEL_LABEL[c.level!]);
  if (lv) opts.push(lv);
  if (c.arm) opts.push(armOption(cfg));
  return opts;
}

/** What we know about a racket's level fit: players who gave their level (and whether they liked it), and the quick-take
 *  level band (0 beginner … 2 advanced) where a block exists. */
export type LevelEvidence = { liked: Partial<Record<Level, number>>; band?: { from: number; to: number };
  /** 0–100 per level (lib/level-suits.ts); when present it ranks instead of the band. */ suits?: Record<Level, number> };
const LEVEL_INDEX: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
/** How much the level evidence moves a match: inside the band helps, outside it hurts; each player at that level who liked
 *  it adds a little (capped), so a racket nobody at your level reviewed isn't pushed down for it. */
const BAND_WEIGHT = 0.25, LIKED_WEIGHT = 0.04, LIKED_CAP = 5;
export function levelBonus(e: LevelEvidence | undefined, level: Level | undefined) {
  if (!e || !level) return 0;
  // Ranked by how well it suits that level (owner 2026-11-15): 50 is neutral, 100 is +2× the old band weight; never a cut.
  if (e.suits) return 2 * BAND_WEIGHT * (e.suits[level] - 50) / 50 + LIKED_WEIGHT * Math.min(LIKED_CAP, e.liked[level] ?? 0);
  const i = LEVEL_INDEX[level];
  const band = e.band ? (i >= e.band.from && i <= e.band.to ? BAND_WEIGHT : -BAND_WEIGHT) : 0;
  return band + LIKED_WEIGHT * Math.min(LIKED_CAP, e.liked[level] ?? 0);
}

/** The level gate (owner 2026-11-15): with a gate (lib/niche fit.levelGate), a racket shows for a picked level only when its
 *  suits score for that level reaches the bar. No suits scores: no gate (nothing to judge by). */
export type LevelGate = Record<Level, number>;
export const passesLevel = (e: LevelEvidence | undefined, level: Level | undefined, gate: LevelGate | undefined) => !gate || !level || !e?.suits || e.suits[level] >= gate[level];

/** Being on the chosen style's ranking puts a racket ahead of every racket that isn't; its place orders the list members. */
const ON_LIST = 2, LIST_PLACE = 0.6;

export type QuickMatch<P> = { product: P; score: number; reasons: Reason[]; watch: Reason | null; arm: number; levelLiked: number; inBand: boolean | null };

/** The ranked list for a choice. Nothing chosen: the Player score order (signal), as the home page always was. */
export function quickMatch<P extends FinderProduct>(pool: P[], finder: Pick<Finder, "questions">, c: QuickChoice, opts: {
  signal: (id: string) => number | null; negativeTags: readonly string[]; level: (id: string) => LevelEvidence | undefined; count: number; rankWeight?: number; cfg?: FitConfig;
  /** With picks, only rackets that pass the level gate are candidates. */ levelGate?: LevelGate;
}): QuickMatch<P>[] {
  const cfg = opts.cfg ?? PADEL;
  const extra = (p: P) => {
    if (!c.level) return { arm: p.tags[cfg.arm.plus] ?? 0, levelLiked: 0, inBand: null };
    const e = opts.level(p.id), i = LEVEL_INDEX[c.level];
    return { arm: p.tags[cfg.arm.plus] ?? 0, levelLiked: e?.liked[c.level] ?? 0, inBand: e?.band ? i >= e.band.from && i <= e.band.to : null };
  };
  if (isDefault(c)) {
    return pool.filter(p => opts.signal(p.id) !== null).sort((a, b) => opts.signal(b.id)! - opts.signal(a.id)! || b.reviews - a.reviews || a.id.localeCompare(b.id))
      .slice(0, opts.count).map(p => ({ product: p, score: opts.signal(p.id)!, reasons: [], watch: null, ...extra(p) }));
  }
  // A style that stands for a ranking (Best for control / power): rackets on that live list come first, in list order, and the
  // rest still follow on their tag counts (owner 2026-11-15), instead of the finder's hard cut to the list.
  const chosen = chosenOptions(finder, c, cfg), lists = chosen.flatMap(o => o.list ? [o.list] : []);
  pool = pool.filter(p => passesLevel(opts.level(p.id), c.level, opts.levelGate));
  const matched = matchFinder(pool, chosen.map(({ list: _list, ...o }) => o), opts.negativeTags, pool.length, opts.rankWeight);
  const listBonus = (p: P) => lists.reduce((a, slug) => { const place = p.lists?.[slug]; return a + (place ? ON_LIST + LIST_PLACE * Math.max(0, 1 - (place - 1) / 10) : 0); }, 0);
  return matched.map(m => ({ ...m, score: m.score + listBonus(m.product) + levelBonus(opts.level(m.product.id), c.level), ...extra(m.product) }))
    .sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews || a.product.id.localeCompare(b.product.id)).slice(0, opts.count);
}

/** "beginners" / "intermediates" / "advanced players". */
export const levelPeople = (l: Level) => l === "advanced" ? "advanced players" : `${l}s`;

/** "Top control rackets for you" / "ranked for beginners · arm-friendly first". */
export function matchTitle(c: QuickChoice, many: string, cfg: FitConfig | undefined = fitConfigFor(niche)) {
  if (cfg?.quick) return quickTitle(c, many, cfg);
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  if (isDefault(c)) return { title: `Top ${many} right now`, sub: "ranked by Player score" };
  return { title: `Top ${what} for you`, sub: [c.level ? `ranked for ${levelPeople(c.level)}` : "ranked for your picks", c.arm ? "arm-friendly first" : null].filter(Boolean).join(" · ") };
}
/** The page title for a shared choice: "Best control padel rackets for beginners". */
export function matchSeoTitle(c: QuickChoice, many: string, cfg: FitConfig | undefined = fitConfigFor(niche)) {
  if (cfg?.quick) { const t = quickWhat(c, many, cfg), who = c.level ? levelPeople(c.level) : c.arm ? "slower arms" : null; return `Best ${t}${who ? ` for ${who}${c.level && c.arm ? " with a slower arm" : ""}` : ""}`; }
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  const who = [c.level ? levelPeople(c.level) : c.arm ? "players" : null, c.arm ? "with a sore elbow or wrist" : null].filter(Boolean).join(" ");
  return who ? `Best ${what} for ${who}` : `Best ${what}`;
}

/** A type-picker site's words (lib/fit-config.ts quick): "understable putters", "fairway drivers". */
function quickWhat(c: QuickChoice, many: string, cfg: FitConfig) {
  const q = cfg.quick!, t = q.types.find(x => x.key === c.kind)?.many ?? many;
  return c.style === "any" ? t : `${cfg.styleLabels[c.style].toLowerCase()} ${t}`;
}
function quickTitle(c: QuickChoice, many: string, cfg: FitConfig) {
  if (isDefault(c)) return { title: `Top ${many} right now`, sub: "ranked by player score" };
  return { title: `Top ${quickWhat(c, many, cfg)} for you`, sub: [c.level ? `ranked for ${levelPeople(c.level)}` : "ranked for your picks", c.arm ? `${cfg.quick!.armChip} first` : null].filter(Boolean).join(" · ") };
}

/** The home's cache key for picks plus "show older models" (batch D): proxy.ts rewrites a home address to
 *  /quick/<key>, one cached page per combination. "power.beginner.1.round.-.-.0.0" = style.level.arm.shape.weight.feel.sweet.older. */
export function choiceKey(c: QuickChoice, older: boolean) {
  const f = c.fine ?? {};
  // A type picker's pick goes last, and only on those sites, so every other site keeps its keys.
  return [c.style, c.level ?? "-", c.arm ? 1 : 0, f.shape ?? "-", f.weight ?? "-", f.feel ?? "-", f.sweet ? 1 : 0, older ? 1 : 0, ...(fitConfigFor(niche)?.quick ? [c.kind ?? "-"] : [])].join(".");
}
/** The picks a key stands for, or null when it isn't the canonical key of any (so each page has one address). */
export function readChoiceKey(key: string): { choice: QuickChoice; older: boolean } | null {
  const [style, level, arm, shape, weight, feel, sweet, older, kind] = key.split(".");
  const v = (x: string | undefined) => x === "-" ? undefined : x;
  const choice = readChoice({ style, level: v(level), arm, shape: v(shape), weight: v(weight), feel: v(feel), sweet: sweet === "1" ? "1" : undefined, kind: v(kind) });
  const out = { choice, older: older === "1" };
  return choiceKey(choice, out.older) === key ? out : null;
}
/** The indexable picks: style × (no level or one) × sore arm (padel: 31), without the default one ("/"). */
export const INDEXABLE_CHOICES: QuickChoice[] = (fitConfigFor(niche)?.quick
  // A type-picker site (DiscGolfRecs): type × level × slower arm, any stability.
  ? [undefined, ...fitConfigFor(niche)!.quick!.types.map(t => t.key)].flatMap(kind => [undefined, ...LEVELS].flatMap(level => [false, true].map(arm => ({ style: "any" as Style, ...(kind ? { kind } : {}), ...(level ? { level } : {}), arm }))))
  : STYLES.flatMap(style => [undefined, ...LEVELS].flatMap(level => [false, true].map(arm => ({ style, ...(level ? { level } : {}), arm })))))
  .filter(c => !isDefault(c));
/** The home address for picks plus "show older models" (?older=1). */
export const homeHref = (c: QuickChoice, older: boolean) => { const base = choiceHref(c, ""); return older ? `${base}${base.includes("?") ? "&" : "?"}older=1` : base; };
/** The quick-match home's own query (proxy.ts): any other of these is another home view (app/page.tsx), not a cached page. */
export const OTHER_HOME_PARAMS = ["home", "type", "feed", "q"] as const;
