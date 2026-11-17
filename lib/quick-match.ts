// Quick match (owner 2026-11-15: "the home page IS the quiz — you see the rackets according to what you need, not what we
// set"). A one-sentence version of the finder (lib/finder.ts): "I want [any | control | balance | power] and I'm [beginner |
// intermediate | advanced] [✓ sore elbow / wrist]". It reuses the finder's own options and scoring (tags counted from
// published reviews, the rankings' places), adds the level evidence we hold (players' stated levels, the quick-take level
// band), and with nothing chosen it is simply the Player score order. Pure functions, so tests feed plain objects.
import { matchFinder, type FinderProduct, type Reason } from "./finder";
import type { Finder, FinderOption } from "./niche/types";
import { fitConfigFor, SITE_FIT, type FitConfig } from "./fit-config";

import { readFine, fineEmpty, fineParams, type FineTune } from "./fine-tune";
import { niche, ownScore } from "./niche";

/** Every style pick any site has; a site's own (lib/fit-config.ts styles) are STYLES. */
export const ALL_STYLES = ["any", "control", "balance", "power", "spin"] as const;
export type Style = typeof ALL_STYLES[number];
/** The running site's style picks: "any", then its own (default control / balance / power). */
export const STYLES: readonly Style[] = ["any", ...(SITE_FIT.styles ?? ["control", "balance", "power"])];
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = typeof LEVELS[number];
export type QuickChoice = { style: Style; /** Unset until the visitor taps a level (owner 2026-11-15: picking a style must not
 *  pick "intermediate" too); no level means no level gate, bonus or check. */ level?: Level; arm: boolean; /** "Not sure yet? fine-tune" (lib/fine-tune.ts). */ fine?: FineTune;
  /** The product type picked first (sites with a type picker, lib/fit-config.ts quick.types: DiscGolfRecs): a hard filter. */ kind?: string;
  /** Fine-tune hard filters (lib/fit-config.ts quick.filters: SimRacingRecs' drive / budget / rim), key → value. */ ff?: Record<string, string> };
export const DEFAULT_CHOICE: QuickChoice = { style: "any", arm: false };

/** Reads ?style=&level=&arm= (unknown values fall back to the default), and the fine-tune on a site that has one (padel's
 *  shapes and weights; lib/fit-config.ts fineTune). */
export function readChoice(q: { style?: string; level?: string; arm?: string; shape?: string; weight?: string; feel?: string; sweet?: string; kind?: string; core?: string } & Record<string, unknown>, cfg: FitConfig | undefined = fitConfigFor(niche)): QuickChoice {
  const fine = cfg?.fineTune ? readFine(q) : {};
  const kind = cfg?.quick?.types.some(t => t.key === q.kind) ? q.kind : undefined;
  // A fine-tune filter counts only with a known value, and only for the type it belongs to (or with no type picked).
  const ff = Object.fromEntries((cfg?.quick?.filters ?? []).flatMap(f => { const v = q[f.key]; return typeof v === "string" && f.options.some(([o]) => o === v) && (!kind || !f.kinds || f.kinds.includes(kind)) ? [[f.key, v]] : []; }));
  return {
    ...(fineEmpty(fine) ? {} : { fine }),
    ...(kind ? { kind } : {}),
    ...(Object.keys(ff).length ? { ff } : {}),
    style: STYLES.includes(q.style as Style) ? q.style as Style : DEFAULT_CHOICE.style,
    ...(LEVELS.includes(q.level as Level) ? { level: q.level as Level } : {}),
    arm: q.arm === "1",
  };
}
export const isDefault = (c: QuickChoice) => c.style === DEFAULT_CHOICE.style && !c.level && !c.arm && fineEmpty(c.fine) && !c.kind && !Object.keys(c.ff ?? {}).length;
/** The address for a choice: only what differs from the default, so "/" is the default list. */
export function choiceHref(c: QuickChoice, anchor = "#match") {
  const q = new URLSearchParams();
  if (c.kind) q.set("kind", c.kind);
  if (c.style !== DEFAULT_CHOICE.style) q.set("style", c.style);
  if (c.level) q.set("level", c.level);
  if (c.arm) q.set("arm", "1");
  for (const [k, v] of fineParams(c.fine)) q.set(k, v);
  for (const [k, v] of Object.entries(c.ff ?? {}).sort()) q.set(k, v);
  return `${q.size ? `/?${q}` : "/"}${anchor}`;
}

const LEVEL_LABEL: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
/** How a level pick reads on this site: "beginner", or pickleball's "2.5". */
export const levelLabel = (l: Level) => SITE_FIT.levelLabels?.[l] ?? l;
/** How a style pick reads: "control", "balance", "spin". */
export const STYLE_WORD: Record<Style, string> = { any: "any", control: "control", balance: "balance", power: "power", spin: "spin" };
/** A style pick in the site's words: a type-picker site's own labels (DiscGolfRecs "understable"), else STYLE_WORD. */
export const styleWordOf = (s: Style) => SITE_FIT.quick && s !== "any" ? (SITE_FIT.styleLabels[s as "control"] ?? s).toLowerCase() : STYLE_WORD[s];
/** The arm pick's words: a type-picker site's own ("slower arm speed"), else padel's. */
export const ARM_PICK = SITE_FIT.quick?.arm ?? "sore elbow / wrist";
/** The arm pick in a chip or a profile line: "sore arm", or "slower arm" on a type-picker site (DiscGolfRecs). */
export const ARM_SHORT = SITE_FIT.words?.armShort ?? (SITE_FIT.quick ? "slower arm" : "sore arm");
/** Sore elbow or wrist: rackets players call arm-friendly rank first (a strong weight, not a filter, so the list stays full),
 *  with vibration complaints counting against. */
export const armOption = (cfg: FitConfig = SITE_FIT): FinderOption => ({ label: "Sore elbow / wrist", want: [cfg.arm.plus], avoid: cfg.arm.minus ? [cfg.arm.minus] : [], weight: 2.5 });
export const ARM_OPTION: FinderOption = armOption();

/** The finder options a choice stands for. */
export function chosenOptions(finder: Pick<Finder, "questions">, c: QuickChoice, cfg: FitConfig = SITE_FIT): FinderOption[] {
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
  const cfg = opts.cfg ?? SITE_FIT;
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
export const levelPeople = (l: Level) => SITE_FIT.levelPeople?.[l] ?? (SITE_FIT.levelLabels ? `${SITE_FIT.levelLabels[l]} players` : l === "advanced" ? "advanced players" : `${l}s`);

/** "Top control rackets for you" / "ranked for beginners · arm-friendly first". */
export function matchTitle(c: QuickChoice, many: string, cfg: FitConfig | undefined = fitConfigFor(niche)) {
  if (cfg?.quick) return quickTitle(c, many, cfg);
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  if (isDefault(c)) return { title: `Top ${many} right now`, sub: `ranked by ${ownScore("Player score")}` };
  return { title: `Top ${what} for you`, sub: [c.level ? `ranked for ${levelPeople(c.level)}` : "ranked for your picks", c.arm ? "arm-friendly first" : null].filter(Boolean).join(" · ") };
}
/** The page title for a shared choice: "Best control padel rackets for beginners". */
export function matchSeoTitle(c: QuickChoice, many: string, cfg: FitConfig | undefined = fitConfigFor(niche)) {
  if (cfg?.quick?.armFilter) { const t = quickWhat(c, many, cfg), who = c.level ? levelPeople(c.level) : null, m = cfg.quick.filters?.find(f => f.main && c.ff?.[f.key]), on = m ? m.options.find(([v]) => v === c.ff![m.key])?.[1] : null; return `Best ${on ? `${on} ` : c.arm ? "console " : ""}${t}${who ? ` for ${who}` : ""}`; }
  if (cfg?.quick) { const t = quickWhat(c, many, cfg), who = c.level ? levelPeople(c.level) : c.arm ? "slower arms" : null; return `Best ${t}${who ? ` for ${who}${c.level && c.arm ? " with a slower arm" : ""}` : ""}`; }
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  const who = [c.level ? levelPeople(c.level) : c.arm ? "players" : null, c.arm ? "with a sore elbow or wrist" : null].filter(Boolean).join(" ");
  return who ? `Best ${what} for ${who}` : `Best ${what}`;
}

/** A type-picker site's words (lib/fit-config.ts quick): "understable putters", "fairway drivers". */
function quickWhat(c: QuickChoice, many: string, cfg: FitConfig) {
  const q = cfg.quick!, t = q.types.find(x => x.key === c.kind)?.many ?? many;
  return c.style === "any" ? t : `${(cfg.styleLabels[c.style] ?? c.style).toLowerCase()} ${t}`;
}
function quickTitle(c: QuickChoice, many: string, cfg: FitConfig) {
  if (isDefault(c)) return { title: `Top ${many} right now`, sub: `ranked by ${ownScore("player score")}` };
  return { title: `Top ${quickWhat(c, many, cfg)} for you`, sub: [c.level ? `ranked for ${levelPeople(c.level)}` : "ranked for your picks", c.arm ? `${cfg.quick!.armChip} ${cfg.quick!.armFilter ? "only" : "first"}` : null].filter(Boolean).join(" · ") };
}

/** The home's cache key for picks plus "show older models" (batch D): proxy.ts rewrites a home address to
 *  /quick/<key>, one cached page per combination. "power.beginner.1.round.-.-.0.0" = style.level.arm.shape.weight.feel.sweet.older. */
export function choiceKey(c: QuickChoice, older: boolean) {
  const f = c.fine ?? {};
  // A type picker's pick (DiscGolfRecs) goes ninth on those sites only; a core pick (pickleball) is a ninth part only when set,
  // so padel's keys are as before.
  // Fine-tune filters (lib/fit-config.ts quick.filters: SimRacingRecs) follow, one part each, only on sites that have them.
  const filters = fitConfigFor(niche)?.quick?.filters ?? [];
  return [c.style, c.level ?? "-", c.arm ? 1 : 0, f.shape ?? "-", f.weight ?? "-", f.feel ?? "-", f.sweet ? 1 : 0, older ? 1 : 0, ...(fitConfigFor(niche)?.quick ? [c.kind ?? "-"] : f.core ? [f.core] : []),
    ...filters.map(x => keyPart(c.ff?.[x.key]))].join(".");
}
/** A filter value as a cache-key part: "$$" → "2d" (dots and "$" stay out of the path), unset → "-". */
const keyPart = (x: string | undefined) => x === undefined ? "-" : /^\$+$/.test(x) ? `${x.length}d` : x;
const keyValue = (x: string | undefined) => x === undefined || x === "-" ? undefined : /^[1-3]d$/.test(x) ? "$".repeat(Number(x[0])) : x;
/** The picks a key stands for, or null when it isn't the canonical key of any (so each page has one address). */
export function readChoiceKey(key: string): { choice: QuickChoice; older: boolean } | null {
  const [style, level, arm, shape, weight, feel, sweet, older, ninth, ...rest] = key.split(".");
  const v = (x: string | undefined) => x === "-" ? undefined : x;
  const quick = !!fitConfigFor(niche)?.quick;
  const ffq = Object.fromEntries((fitConfigFor(niche)?.quick?.filters ?? []).map((x, i) => [x.key, keyValue(rest[i])]));
  const choice = readChoice({ ...ffq, style, level: v(level), arm, shape: v(shape), weight: v(weight), feel: v(feel), sweet: sweet === "1" ? "1" : undefined, ...(quick ? { kind: v(ninth) } : { core: ninth }) });
  const out = { choice, older: older === "1" };
  return choiceKey(choice, out.older) === key ? out : null;
}
/** The indexable picks: style × (no level or one) × sore arm (padel: 31), without the default one ("/"). */
export const INDEXABLE_CHOICES: QuickChoice[] = (fitConfigFor(niche)?.quick
  // A type-picker site (DiscGolfRecs): type × level × slower arm, any stability.
  ? [undefined, ...fitConfigFor(niche)!.quick!.types.map(t => t.key)].flatMap(kind => [undefined, ...LEVELS].flatMap(level => [false, true].map(arm => ({ style: "any" as Style, ...(kind ? { kind } : {}), ...(level ? { level } : {}), arm }))))
  : STYLES.flatMap(style => [undefined, ...LEVELS].flatMap(level => [false, true].map(arm => ({ style, ...(level ? { level } : {}), arm })))))
  .filter(c => !isDefault(c));
/** The hard filters a choice adds on a type-picker site (lib/fit-config.ts quick): fine-tune filters (only for the types they
 *  belong to), the arm tick when it is a fact filter (console), and a level's own filter (all-in → the $$$ third). Every
 *  other site: always true. */
export function passesFilters(x: { kind?: string; ff?: Record<string, string[]> }, c: QuickChoice, cfg: FitConfig | undefined = fitConfigFor(niche)): boolean {
  const q = cfg?.quick; if (!q) return true;
  const has = (k: string, v: string) => !!x.ff?.[k]?.includes(v);
  // A product the maker no longer sells (SimRacingRecs' "gone" fact) never ranks (Grok audit 2026-11-17 #8).
  if (has("gone", "yes")) return false;
  for (const [k, v] of Object.entries(c.ff ?? {})) { const f = q.filters?.find(y => y.key === k); if (!f || (f.kinds && !(x.kind && f.kinds.includes(x.kind)))) continue; if (!has(k, v)) return false; }
  if (c.arm && q.armFilter && !has(q.armFilter.key, q.armFilter.value)) return false;
  const lf = c.level && q.levelFilter?.[c.level];
  if (lf && !lf.values.some(v => has(lf.key, v))) return false;
  return true;
}
/** The arm pick as the engine reads it: off where the arm tick is a fact filter (console), not a score. */
export const engineArm = (c: QuickChoice, cfg: FitConfig | undefined = fitConfigFor(niche)) => c.arm && !cfg?.quick?.armFilter;
/** The style the engine ranks by: the pick's, or the level's slot on a site that maps levels onto it (quick.levelStyle). */
export const engineStyle = (c: QuickChoice, cfg: FitConfig | undefined = fitConfigFor(niche)): Style => (c.level && cfg?.quick?.levelStyle?.[c.level]) || c.style;
/** The home address for picks plus "show older models" (?older=1). */
export const homeHref = (c: QuickChoice, older: boolean) => { const base = choiceHref(c, ""); return older ? `${base}${base.includes("?") ? "&" : "?"}older=1` : base; };
/** The quick-match home's own query (proxy.ts): any other of these is another home view (app/page.tsx), not a cached page. */
export const OTHER_HOME_PARAMS = ["home", "type", "feed", "q"] as const;
