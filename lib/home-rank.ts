// The quick-match home list (app/home-v2.tsx) and the match % (racket pages too), as pure functions over one compact item per
// listed racket. The server builds the items (app/match-context.ts) and renders the first list; the browser re-ranks the
// same items when a chip is tapped (app/home-match.tsx), with no round trip (batch D, owner 2026-11-15). One implementation,
// so a tap and a direct visit to the same address always give the same list.
import type { Finder } from "./niche/types";
import { quickMatch, isDefault, passesLevel, ARM_OPTION, type QuickChoice, type LevelEvidence, type LevelGate } from "./quick-match";
import { fitVerdict, styleLean, MIN_FIT_REPORTS, FEW_FIT_REPORTS, type FitFacts, type FitVerdict } from "./fit-verdict";
import { matchFit, spreadMatch, MATCH_BANDS } from "./match-score";
import { fineFit } from "./fine-tune";
import type { FinderProduct } from "./finder";

export type RankItem = {
  id: string;
  /** The fit check's facts (app/match-context.ts facts()), before the place inside a picked shape is added. */
  facts: FitFacts;
  /** Trait scores 0–99 (lib/trait-score.ts), null when too thin. */
  control: number | null; power: number | null; arm: number | null;
  level?: LevelEvidence;
  /** The Player score (lib/signal.ts). */
  signal: number | null;
  /** In the quick-match pool (lib/finder.ts finderPool): the review counts and ranking places it is matched on. */
  pool?: Omit<FinderProduct, "id" | "tags">;
  /** The family's row (lib/compare-pairs.ts rowOfFamily): the year that takes this model's one row. */
  row: string;
};
/** The finder's questions, plus the level gate (lib/niche fit.levelGate): with a level picked, only rackets whose suits score
 *  reaches the bar are candidates, and the % is spread within that eligible set (owner 2026-11-15). */
export type RankSetup = Pick<Finder, "questions" | "rankWeight"> & { levelGate?: LevelGate };
export type RankedRow = { id: string; pct: number | null; fit: Pick<FitVerdict, "kind" | "short"> | null; arm: number };

const LIST_SIZE = 10;
/** Confidence (owner 2026-11-15: "we are placing in high places rackets with very few reviews and low player score"):
 *  - trait scores are pulled toward the catalog mean by report count, adj = (n·trait + K·mean) / (n + K), so a racket with
 *    a handful of reports can't win on one extreme trait;
 *  - a Strong fit needs CONFIDENT reports (lib/fit-verdict.ts, the site's fewReports line), and under it a racket can't take the top 3 (nor "best match") while 3 rackets with CONFIDENT+ reports fit
 *    (Strong fit or Worth a look) in the same eligible set, among the years the list shows: its % is held just under the third of those. */
export const SHRINK_K = 15, CONFIDENT = FEW_FIT_REPORTS;
const memo = new WeakMap<RankItem[], Map<string, unknown>>();
function cached<T>(items: RankItem[], key: string, make: () => T): T {
  let m = memo.get(items); if (!m) memo.set(items, m = new Map());
  if (!m.has(key)) m.set(key, make());
  return m.get(key) as T;
}
const byIdOf = (items: RankItem[]) => cached(items, "byId", () => new Map(items.map(x => [x.id, x])));
/** The trait scores after shrinking toward the catalog mean by report count (see SHRINK_K). */
type Traits = { control: number | null; power: number | null; arm: number | null };
export function shrunkTraits(items: RankItem[]): Map<string, Traits> {
  return cached(items, "shrunk", () => {
    const mean = (k: keyof Traits) => { const v = items.map(x => x[k]).filter((n): n is number => n !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 50; };
    const m = { control: mean("control"), power: mean("power"), arm: mean("arm") };
    const adj = (t: number | null, n: number, mu: number) => t === null ? null : (n * t + SHRINK_K * mu) / (n + SHRINK_K);
    return new Map(items.map(x => [x.id, { control: adj(x.control, x.facts.reports, m.control), power: adj(x.power, x.facts.reports, m.power), arm: adj(x.arm, x.facts.reports, m.arm) }]));
  });
}

/** With a shape picked (owner 2026-11-15: "it should also be compared inside its own filter"): each rated racket's place for
 *  the picked style among the rated rackets of that shape, 0 bottom … 1 top. Half the style's trait score, half how many
 *  players praise that style, each as a percentile (ties share it). Rated = enough reports for a verdict. */
export function styleWithin(items: RankItem[], choice: QuickChoice): Map<string, number> | null {
  const shape = choice.fine?.shape; if (!shape || choice.style === "any") return null;
  return cached(items, `within:${shape}:${choice.style}`, () => {
    const rated = items.filter(x => x.facts.fine?.shape === shape && x.facts.reports >= MIN_FIT_REPORTS);
    const pick = (c: number | null | undefined, p: number | null | undefined) => choice.style === "power" ? p ?? 0 : choice.style === "control" ? c ?? 0 : Math.min(c ?? 0, p ?? 0);
    const sh = shrunkTraits(items);
    const trait = new Map(rated.map(x => { const t = sh.get(x.id)!; return [x.id, pick(t.control, t.power)] as const; }));
    const praise = new Map(rated.map(x => { const l = styleLean(x.facts); return [x.id, pick(l.control, l.power)] as const; }));
    const pctl = (m: Map<string, number>, id: string) => { const v = m.get(id)!; let below = 0, same = 0; for (const x of m.values()) { if (x < v) below++; else if (x === v) same++; }
      return rated.length > 1 ? (below + (same - 1) / 2) / (rated.length - 1) : 1; };
    return new Map(rated.map(x => [x.id, 0.5 * pctl(trait, x.id) + 0.5 * pctl(praise, x.id)]));
  });
}

/** The fit check's facts for these picks: the item's facts plus its place inside a picked shape. */
export function factsWith(items: RankItem[], choice: QuickChoice, facts: FitFacts, id: string): FitFacts {
  const r = styleWithin(items, choice)?.get(id);
  return r === undefined ? facts : { ...facts, styleWithin: { rank: r, shape: choice.fine!.shape! } };
}

/** The match % for a set of picks, for every item, spread inside each verdict band (lib/match-score.ts spreadMatch), so the
 *  home list and the racket page show the same number. Null on thin data. With a shape picked, the % is spread among that
 *  shape's rackets only (the others are spread on their own), so the best of the shape reach the top of its band. */
export function matchPcts(items: RankItem[], choice: QuickChoice, gate?: LevelGate): Map<string, number | null> {
  return cached(items, `pct:${gate ? "g" : ""}:${JSON.stringify(choice)}`, () => {
    const within = styleWithin(items, choice);
    const rows = items.map(x => {
      const fv = fitVerdict(choice, factsWith(items, choice, x.facts, x.id)), lv = x.level;
      const t = shrunkTraits(items).get(x.id)!;
      const fit = matchFit(choice, { control: t.control, power: t.power, arm: t.arm, band: lv?.band, likedAtLevel: choice.level ? lv?.liked[choice.level] ?? 0 : 0,
        suits: choice.level ? lv?.suits?.[choice.level] : undefined, levelGated: !!gate, signal: x.signal, fine: x.facts.fine ? fineFit(choice.fine, x.facts.fine) : null, styleWithin: within?.get(x.id) });
      const styleScore = choice.style === "power" ? t.power ?? 0 : choice.style === "control" ? t.control ?? 0 : choice.style === "balance" ? Math.min(t.control ?? 0, t.power ?? 0) : x.signal ?? 0;
      // Ties: the Player score first (liked share and volume), then the style (owner 2026-11-15).
      return { id: x.id, kind: fv.kind, fit, tie1: x.signal ?? 0, tie2: within?.get(x.id) ?? styleScore };
    });
    // Spread among comparable rackets: the level-eligible ones apart from the rest, and with a shape picked, that shape apart
    // from the others, so the best rackets for the picks reach the top of their band.
    const byId = byIdOf(items), shape = choice.fine?.shape;
    const group = (id: string) => { const x = byId.get(id); return `${!shape || x?.facts.fine?.shape === shape}|${passesLevel(x?.level, choice.level, gate)}`; };
    const groups = new Map<string, typeof rows>(); for (const r of rows) groups.set(group(r.id), [...groups.get(group(r.id)) ?? [], r]);
    const spread = new Map([...groups.values()].flatMap(g => [...spreadMatch(g)]));
    // The confidence floor, per group: under CONFIDENT reports, held just under the third confident fit (never below its band).
    for (const g of groups.values()) {
      // Counted among the years that take a model's row (lib/compare-pairs.ts rowOfFamily), the ones the list can show.
      const sure = g.filter(r => (r.kind === "good" || r.kind === "maybe") && byId.get(r.id)!.row === r.id && byId.get(r.id)!.facts.reports >= CONFIDENT)
        .map(r => spread.get(r.id)!).sort((a, b) => b - a);
      if (sure.length < 3) continue;
      for (const r of g) if (r.kind !== "thin" && byId.get(r.id)!.facts.reports < CONFIDENT && spread.get(r.id)! >= sure[2])
        spread.set(r.id, Math.max(MATCH_BANDS[r.kind][0], sure[2] - 1));
    }
    return new Map(rows.map(r => [r.id, r.kind === "thin" ? null : spread.get(r.id) ?? null]));
  });
}

/** The home list for the picks: quick match picks the candidates (lib/quick-match.ts); with picks, rows are ordered by the
 *  match %, which always agrees with the fit word (thin data has no % and goes last); no picks: the Player score order.
 *  One row per model, the family's row year (owner 2026-11-15), unless `older` ("show older models"): every year its own row.
 *  A picked shape holds for the row too: a family whose row year is another shape keeps the year that matched. */
export function rankHome(items: RankItem[], setup: RankSetup, negativeTags: readonly string[], choice: QuickChoice, older: boolean, size = LIST_SIZE): { rows: RankedRow[]; olderN: number } {
  const byId = byIdOf(items);
  const pool = cached(items, "pool", () => items.flatMap(x => x.pool ? [{ ...x.pool, id: x.id, tags: x.facts.tags }] : []));
  const level = (id: string) => byId.get(id)?.level, signal = (id: string) => byId.get(id)?.signal ?? null;
  const shapeOf = (id: string) => byId.get(id)?.facts.fine?.shape;
  const candidates = quickMatch(pool, setup, choice, { signal, negativeTags, level, count: pool.length, rankWeight: setup.rankWeight, levelGate: setup.levelGate })
    .filter(m => isDefault(choice) || !choice.fine?.shape || shapeOf(m.product.id) === choice.fine.shape);
  const pcts = isDefault(choice) ? null : matchPcts(items, choice, setup.levelGate);
  const newestOf = (id: string) => older ? id : byId.get(id)?.row ?? id;
  const order = new Map(candidates.map((m, i) => [m.product.id, i]));
  const seen = new Set<string>();
  const shapeOk = (id: string) => !choice.fine?.shape || shapeOf(id) === choice.fine.shape;
  // So does the level gate: a family whose row year isn't for the picked level keeps the year that is.
  const levelOk = (id: string) => isDefault(choice) || passesLevel(level(id), choice.level, setup.levelGate);
  const models = candidates.flatMap(m => { const n = newestOf(m.product.id), id = shapeOk(n) && levelOk(n) ? n : m.product.id; if (seen.has(id)) return []; seen.add(id);
    return [{ id, i: order.get(id) ?? candidates.length + (order.get(m.product.id) ?? 0) }]; });
  const rated = models.map(m => {
    const it = byId.get(m.id)!, fit = pcts ? fitVerdict(choice, factsWith(items, choice, it.facts, m.id)) : null;
    return { id: m.id, i: m.i, pct: pcts?.get(m.id) ?? null, fit: fit ? { kind: fit.kind, short: fit.short } : null, arm: it.facts.tags["arm-friendly"] ?? 0 };
  });
  const rows = rated.sort((a, b) => (pcts ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || a.i - b.i).slice(0, size).map(({ i: _i, ...r }) => r);
  const olderN = older ? 0 : candidates.filter(m => newestOf(m.product.id) !== m.product.id).length;
  return { rows, olderN };
}

/** Tags the ranking reads (the finder's options, sore arm, the fit check's style / level / arm words); the browser payload
 *  carries only these. */
export function rankTags(setup: Pick<Finder, "questions">): Set<string> {
  return new Set([...setup.questions.flatMap(q => q.options.flatMap(o => [...o.want ?? [], ...o.avoid ?? []])), ...ARM_OPTION.want ?? [], ...ARM_OPTION.avoid ?? [],
    "good control", "great in defence", "easy power", "great on smashes", "forgiving", "demanding", "small sweet spot", "arm-friendly", "vibrates on mishits"]);
}

/** The items as the browser gets them: only the tags the ranking counts, and level sources without the brand's words and link
 *  (those feed the racket page's reasons, never the list's order or its one short reason). */
export function slimItems(items: RankItem[], setup: Pick<Finder, "questions">): RankItem[] {
  const keep = rankTags(setup);
  return items.map(x => {
    const { levels, tags, ...facts } = x.facts;
    const lv = levels && Object.fromEntries(Object.entries(levels).filter(([, b]) => b).map(([k, b]) => [k, k === "maker" ? { from: b!.from, to: b!.to, words: "", url: "" } : b]));
    return { ...x, facts: { ...facts, tags: Object.fromEntries(Object.entries(tags).filter(([t]) => keep.has(t))), ...(lv ? { levels: lv } : {}) } };
  });
}
