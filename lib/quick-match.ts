// Quick match (owner 2026-11-15: "the home page IS the quiz — you see the rackets according to what you need, not what we
// set"). A one-sentence version of the finder (lib/finder.ts): "I want [any | control | balance | power] and I'm [beginner |
// intermediate | advanced] [✓ sore elbow / wrist]". It reuses the finder's own options and scoring (tags counted from
// published reviews, the rankings' places), adds the level evidence we hold (players' stated levels, the quick-take level
// band), and with nothing chosen it is simply the Player score order. Pure functions, so tests feed plain objects.
import { matchFinder, type FinderProduct, type Reason } from "./finder";
import type { Finder, FinderOption } from "./niche/types";

export const STYLES = ["any", "control", "balance", "power"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Style = typeof STYLES[number];
export type Level = typeof LEVELS[number];
export type QuickChoice = { style: Style; level: Level; arm: boolean };
export const DEFAULT_CHOICE: QuickChoice = { style: "any", level: "intermediate", arm: false };

/** Reads ?style=&level=&arm= (unknown values fall back to the default). */
export function readChoice(q: { style?: string; level?: string; arm?: string }): QuickChoice {
  return {
    style: STYLES.includes(q.style as Style) ? q.style as Style : DEFAULT_CHOICE.style,
    level: LEVELS.includes(q.level as Level) ? q.level as Level : DEFAULT_CHOICE.level,
    arm: q.arm === "1",
  };
}
export const isDefault = (c: QuickChoice) => c.style === DEFAULT_CHOICE.style && c.level === DEFAULT_CHOICE.level && !c.arm;
/** The address for a choice: only what differs from the default, so "/" is the default list. */
export function choiceHref(c: QuickChoice, anchor = "#match") {
  const q = new URLSearchParams();
  if (c.style !== DEFAULT_CHOICE.style) q.set("style", c.style);
  if (c.level !== DEFAULT_CHOICE.level) q.set("level", c.level);
  if (c.arm) q.set("arm", "1");
  return `${q.size ? `/?${q}` : "/"}${anchor}`;
}

const STYLE_LABEL: Record<Exclude<Style, "any">, string> = { control: "Control", balance: "A balance of both", power: "Power" };
const LEVEL_LABEL: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
/** Sore elbow or wrist: rackets players call arm-friendly rank first (a strong weight, not a filter, so the list stays full),
 *  with vibration complaints counting against. */
export const ARM_OPTION: FinderOption = { label: "Sore elbow / wrist", want: ["arm-friendly"], avoid: ["vibrates on mishits"], weight: 2.5 };

/** The finder options a choice stands for. */
export function chosenOptions(finder: Pick<Finder, "questions">, c: QuickChoice): FinderOption[] {
  const q = (id: string) => finder.questions.find(x => x.id === id);
  const opts: FinderOption[] = [];
  if (c.style !== "any") { const o = q("style")?.options.find(x => x.label === STYLE_LABEL[c.style as Exclude<Style, "any">]); if (o) opts.push(o); }
  const lv = q("level")?.options.find(x => x.label === LEVEL_LABEL[c.level]);
  if (lv && !isDefault(c)) opts.push(lv);
  if (c.arm) opts.push(ARM_OPTION);
  return opts;
}

/** What we know about a racket's level fit: players who gave their level (and whether they liked it), and the quick-take
 *  level band (0 beginner … 2 advanced) where a block exists. */
export type LevelEvidence = { liked: Partial<Record<Level, number>>; band?: { from: number; to: number } };
const LEVEL_INDEX: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
/** How much the level evidence moves a match: inside the band helps, outside it hurts; each player at that level who liked
 *  it adds a little (capped), so a racket nobody at your level reviewed isn't pushed down for it. */
const BAND_WEIGHT = 0.25, LIKED_WEIGHT = 0.04, LIKED_CAP = 5;
export function levelBonus(e: LevelEvidence | undefined, level: Level) {
  if (!e) return 0;
  const i = LEVEL_INDEX[level];
  const band = e.band ? (i >= e.band.from && i <= e.band.to ? BAND_WEIGHT : -BAND_WEIGHT) : 0;
  return band + LIKED_WEIGHT * Math.min(LIKED_CAP, e.liked[level] ?? 0);
}

export type QuickMatch<P> = { product: P; score: number; reasons: Reason[]; watch: Reason | null; arm: number; levelLiked: number; inBand: boolean | null };

/** The ranked list for a choice. Nothing chosen: the Player score order (signal), as the home page always was. */
export function quickMatch<P extends FinderProduct>(pool: P[], finder: Pick<Finder, "questions">, c: QuickChoice, opts: {
  signal: (id: string) => number | null; negativeTags: readonly string[]; level: (id: string) => LevelEvidence | undefined; count: number; rankWeight?: number;
}): QuickMatch<P>[] {
  const extra = (p: P) => {
    const e = opts.level(p.id), i = LEVEL_INDEX[c.level];
    return { arm: p.tags["arm-friendly"] ?? 0, levelLiked: e?.liked[c.level] ?? 0, inBand: e?.band ? i >= e.band.from && i <= e.band.to : null };
  };
  if (isDefault(c)) {
    return pool.filter(p => opts.signal(p.id) !== null).sort((a, b) => opts.signal(b.id)! - opts.signal(a.id)! || b.reviews - a.reviews || a.id.localeCompare(b.id))
      .slice(0, opts.count).map(p => ({ product: p, score: opts.signal(p.id)!, reasons: [], watch: null, ...extra(p) }));
  }
  const matched = matchFinder(pool, chosenOptions(finder, c), opts.negativeTags, pool.length, opts.rankWeight);
  return matched.map(m => ({ ...m, score: m.score + levelBonus(opts.level(m.product.id), c.level), ...extra(m.product) }))
    .sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews || a.product.id.localeCompare(b.product.id)).slice(0, opts.count);
}

/** "Top control rackets for you" / "ranked for beginners · arm-friendly first". */
export function matchTitle(c: QuickChoice, many: string) {
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  if (isDefault(c)) return { title: `Top ${many} right now`, sub: "ranked by Player score" };
  return { title: `Top ${what} for you`, sub: [`ranked for ${c.level === "advanced" ? "advanced players" : `${c.level}s`}`, c.arm ? "arm-friendly first" : null].filter(Boolean).join(" · ") };
}
/** The page title for a shared choice: "Best control padel rackets for beginners". */
export function matchSeoTitle(c: QuickChoice, many: string) {
  const what = c.style === "any" ? many : c.style === "balance" ? `all-round ${many}` : `${c.style} ${many}`;
  const who = [c.level === "advanced" ? "advanced players" : `${c.level}s`, c.arm ? "with a sore elbow or wrist" : null].filter(Boolean).join(" ");
  return `Best ${what} for ${who}`;
}
