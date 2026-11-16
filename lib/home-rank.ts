// The quick-match home list (app/home-v2.tsx) and the match % (racket pages too), as pure functions over one compact item per
// listed racket. The server builds the items (app/match-context.ts) and renders the first list; the browser re-ranks the
// same items when a chip is tapped (app/home-match.tsx), with no round trip (batch D, owner 2026-11-15). One implementation,
// so a tap and a direct visit to the same address always give the same list.
import { curatedEntries, CURATED_MIN } from "./curated";
import type { Finder } from "./niche/types";
import { hardOnLevelOrArm } from "./fit-verdict";
import { quickMatch, isDefault, passesLevel, ARM_OPTION, type QuickChoice, type LevelEvidence, type LevelGate, type Level } from "./quick-match";
import { fitVerdict, styleLean, MIN_FIT_REPORTS, type FitFacts, type FitVerdict } from "./fit-verdict";
import { matchFit, spreadMatch } from "./match-score";
import { fineFit } from "./fine-tune";
import type { FinderProduct } from "./finder";
import { engineBase, engineScore, engineCandidates, engineAnchors, enginePct, engineKind, type EngineFacts, type EngineProfile } from "./engine";

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
  /** What the match engine reads (lib/engine), on sites that use it. */
  eng?: EngineFacts;
  /** The product type key (type-picker sites, lib/fit-config.ts quick.types): the picked type filters on it. */
  kind?: string;
  /** The product slug, on sites with curated lists (lib/curated.ts). */ slug?: string;
  /** A high (or medium-high) balance spec, on sites with curated lists: the beginner rule. */ headHeavy?: boolean;
  /** A site's ranking flags (DiscGolfRecs, lib/discgolf-hard.ts): a specialty disc is never #1 for "any"; without flight
   *  numbers it isn't ranked. */
  flags?: { specialty?: true; noFlight?: true };
};
/** The finder's questions, plus the level gate (lib/niche fit.levelGate): with a level picked, only rackets whose suits score
 *  reaches the bar are candidates, and the % is spread within that eligible set (owner 2026-11-15). */
export type RankSetup = Pick<Finder, "questions" | "rankWeight"> & { levelGate?: LevelGate;
  /** The match engine's profile (lib/niche fit.engine): when set, it orders the list and gives the % and the verdict word. */ engine?: EngineProfile };
export type RankedRow = { id: string; pct: number | null; fit: Pick<FitVerdict, "kind" | "short"> | null; arm: number;
  /** A curated pick whose real match is under LOW_MATCH: the row says why it is here. */ low?: boolean };
/** Under this a curated pick's row explains itself (owner 2026-11-17). */
export const LOW_MATCH = 55;

const LIST_SIZE = 10;
const memo = new WeakMap<RankItem[], Map<string, unknown>>();
function cached<T>(items: RankItem[], key: string, make: () => T): T {
  let m = memo.get(items); if (!m) memo.set(items, m = new Map());
  if (!m.has(key)) m.set(key, make());
  return m.get(key) as T;
}
const byIdOf = (items: RankItem[]) => cached(items, "byId", () => new Map(items.map(x => [x.id, x])));

// The match engine (lib/engine, ENGINE-ALGO.md §5). Its per-product base and the display anchors depend only on the items, so
// they are worked out once per item set (server request or browser payload).
type EngItem = { id: string; n: number; e: EngineFacts; family: string; year: number; it: RankItem };
const engItems = (items: RankItem[]) => cached(items, "eng:items", () => items.flatMap(x => x.eng ? [{ id: x.id, n: x.facts.reports, e: x.eng, family: x.row, year: x.eng.year, it: x } as EngItem] : []));
const engBase = (items: RankItem[], p: EngineProfile) => cached(items, "eng:base", () => engineBase(engItems(items), p));
const engAnchors = (items: RankItem[], p: EngineProfile, gate: LevelGate | undefined) => cached(items, `eng:anchors:${JSON.stringify(gate ?? null)}`,
  () => engineAnchors(engItems(items), engBase(items, p), (x, level) => passesLevel(x.it.level, level as Level, gate), p, (x, level) => x.it.level?.suits?.[level as Level]));
const engPick = (choice: QuickChoice) => ({ style: choice.style, arm: choice.arm, fine: undefined as number | null | undefined });
/** The engine's cautious score and % for every product with enough reports, for these picks. A product the level gate keeps
 *  out says "Probably not" (its % held under that line). */
type EngView = { cautious: number; pct: number; hard?: boolean; curated?: boolean; /** Its place on the curated list. */ ci?: number };
function engineView(items: RankItem[], choice: QuickChoice, gate: LevelGate | undefined, p: EngineProfile): Map<string, EngView> {
  return cached(items, `eng:view:${JSON.stringify([choice, gate ?? null])}`, () => {
    const base = engBase(items, p), all = engAnchors(items, p, gate), anchors = all.byStyle?.[choice.style] ?? all, out = new Map<string, EngView>();
    const fineOf = (x: RankItem) => { const fi = choice.fine && { ...choice.fine, shape: undefined }; return fi && x.facts.fine ? fineFit(fi, x.facts.fine) : null; };
    // Curated top 10 (owner 2026-11-17): these products lead in this order whatever their reports or level gate. A drafted
    // pick needs real evidence (10+ reviews, a Player score of 70+); the owner's own picks stay regardless (owner 2026-11-17).
    const cur = curatedEntries(choice), curIx = new Map<string, number>();
    if (cur.length) { const bySlug = new Map(engItems(items).map(x => [x.it.slug, x])); cur.forEach(e => { const x = bySlug.get(e.slug);
      if (x && !curIx.has(x.id) && (e.owner || (x.n >= CURATED_MIN.reviews && (x.it.signal ?? 0) >= CURATED_MIN.score))) curIx.set(x.id, curIx.size); }); }
    const shapeRule = p.shapeOrder && choice.level && p.shapeOrder.styles.includes(choice.style) && p.shapeOrder.levels.includes(choice.level) ? p.shapeOrder.below : null;
    for (const x of engItems(items)) {
      if (x.n < p.minReports && !curIx.has(x.id)) continue;
      const suits = choice.level ? x.it.level?.suits?.[choice.level] : undefined;
      let { cautious } = engineScore(base.get(x.id)!, { ...engPick(choice), fine: fineOf(x.it), suits, low: choice.level === "beginner" || choice.arm }, p);
      // Sore arm (PickleballRecs, audit 2026-11-16): a thin 14 mm core and a firm feel pass on more shock.
      if (choice.arm && p.armSpecDemote) { const fi = x.it.facts.fine; if (fi?.core === "14mm") cautious -= p.armSpecDemote.core14; if (fi?.feel === "firm") cautious -= p.armSpecDemote.firm; }
      // A hard reason on level or arm (audit 2026-11-16): never Strong fit, the hard reason leads the verdict. With hardPenalty
      // (DiscGolfRecs) it also costs score and the row goes after every other one.
      const hard = p.hardCap !== undefined && hardOnLevelOrArm(choice, x.it.facts);
      if (hard && p.hardPenalty) cautious -= p.hardPenalty;
      let pct = enginePct(cautious, anchors, p.display);
      if (choice.level && !passesLevel(x.it.level, choice.level, gate)) pct = Math.min(pct, p.cuts.maybe - 1);
      if (hard) pct = Math.min(pct, p.hardCap!);
      // The shape rule (owner 2026-11-17): for control and balance at beginner and intermediate, a diamond goes after every
      // round, teardrop or hybrid racket and is never "Worth a look" or better.
      // And for beginners a high balance (owner's brief 2026-11-17: no head-heavy racket in a beginner list).
      const lowShape = (!!shapeRule && shapeRule.includes(x.it.facts.fine?.shape ?? "")) || (!!x.it.headHeavy && !!choice.level && !!p.headHeavyBelow?.includes(choice.level));
      if (lowShape) pct = Math.min(pct, p.cuts.maybe - 1);
      // A curated pick keeps its place, and its % is its real match (owner 2026-11-17: "the % shown is the real match").
      const i = curIx.get(x.id);
      out.set(x.id, { cautious, pct, ...(i !== undefined ? { curated: true, ci: i } : (hard && p.hardPenalty) || lowShape ? { hard: true } : {}) });
    }
    return out;
  });
}
/** The fit check for a product with these picks: the engine's word (from its %) with the checks' reasons, or the checks alone. */
export function verdictFor(items: RankItem[], choice: QuickChoice, facts: FitFacts, id: string, gate?: LevelGate, engine?: EngineProfile): FitVerdict {
  const f = factsWith(items, choice, facts, id);
  if (!engine) return fitVerdict(choice, f);
  return fitVerdict(choice, f, undefined, engineKind(engineView(items, choice, gate, engine).get(id)?.pct ?? null, engine));
}

/** With a shape picked (owner 2026-11-15: "it should also be compared inside its own filter"): each rated racket's place for
 *  the picked style among the rated rackets of that shape, 0 bottom … 1 top. Half the style's trait score, half how many
 *  players praise that style, each as a percentile (ties share it). Rated = enough reports for a verdict. */
export function styleWithin(items: RankItem[], choice: QuickChoice): Map<string, number> | null {
  const shape = choice.fine?.shape; if (!shape || choice.style === "any") return null;
  return cached(items, `within:${shape}:${choice.style}`, () => {
    const rated = items.filter(x => x.facts.fine?.shape === shape && x.facts.reports >= MIN_FIT_REPORTS);
    const pick = (c: number | null | undefined, p: number | null | undefined) => choice.style === "power" ? p ?? 0 : choice.style === "control" ? c ?? 0 : Math.min(c ?? 0, p ?? 0);
    const trait = new Map(rated.map(x => [x.id, pick(x.control, x.power)] as const));
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
export function matchPcts(items: RankItem[], choice: QuickChoice, gate?: LevelGate, engine?: EngineProfile): Map<string, number | null> {
  if (engine) { const v = engineView(items, choice, gate, engine); return new Map(items.map(x => [x.id, v.get(x.id)?.pct ?? null])); }
  return cached(items, `pct:${gate ? "g" : ""}:${JSON.stringify(choice)}`, () => {
    const within = styleWithin(items, choice);
    const rows = items.map(x => {
      const fv = fitVerdict(choice, factsWith(items, choice, x.facts, x.id)), lv = x.level;
      const fit = matchFit(choice, { control: x.control, power: x.power, arm: x.arm, band: lv?.band, likedAtLevel: choice.level ? lv?.liked[choice.level] ?? 0 : 0,
        suits: choice.level ? lv?.suits?.[choice.level] : undefined, levelGated: !!gate, signal: x.signal, fine: x.facts.fine ? fineFit(choice.fine, x.facts.fine) : null, styleWithin: within?.get(x.id) });
      const styleScore = choice.style === "power" ? x.power ?? 0 : choice.style === "control" ? x.control ?? 0 : choice.style === "balance" ? Math.min(x.control ?? 0, x.power ?? 0) : x.signal ?? 0;
      return { id: x.id, kind: fv.kind, fit, tie1: within?.get(x.id) ?? styleScore, tie2: x.signal ?? 0 };
    });
    // Spread among comparable rackets: the level-eligible ones apart from the rest, and with a shape picked, that shape apart
    // from the others, so the best rackets for the picks reach the top of their band.
    const byId = byIdOf(items), shape = choice.fine?.shape;
    const group = (id: string) => { const x = byId.get(id); return `${!shape || x?.facts.fine?.shape === shape}|${passesLevel(x?.level, choice.level, gate)}`; };
    const groups = new Map<string, typeof rows>(); for (const r of rows) groups.set(group(r.id), [...groups.get(group(r.id)) ?? [], r]);
    const spread = new Map([...groups.values()].flatMap(g => [...spreadMatch(g)]));
    return new Map(rows.map(r => [r.id, r.kind === "thin" ? null : spread.get(r.id) ?? null]));
  });
}

/** The engine's list for the picks: enough reports, past the level gate and a picked shape, one row per model (the newest year
 *  that passes) unless every year is asked for, ordered by the cautious score (ENGINE-ALGO.md §5). */
function rankEngine(items: RankItem[], setup: RankSetup, choice: QuickChoice, older: boolean, size: number): { rows: RankedRow[]; olderN: number } {
  const p = setup.engine!, view = engineView(items, choice, setup.levelGate, p), shape = choice.fine?.shape, all = engItems(items);
  // A picked type (type-picker sites) is a hard filter, never a score.
  const ok = (x: EngItem) => view.has(x.id) && !x.it.flags?.noFlight && (view.get(x.id)!.curated || x.n >= p.minReports) && (view.get(x.id)!.curated || !choice.level || passesLevel(x.it.level, choice.level, setup.levelGate)) && (!shape || x.it.facts.fine?.shape === shape) && (!choice.kind || x.it.kind === choice.kind);
  // Newest model wins (owner 2026-11-17): an older year is left out once a newer year of the model has newestAt reports, even
  // when that newer year doesn't pass these picks ("show older models" shows it again).
  const newerWith = cached(items, `eng:newer:${p.newestAt}`, () => { const top = new Map<string, number>();
    for (const x of all) if (p.newestAt !== undefined && x.n >= p.newestAt && x.year > (top.get(x.family) ?? -1)) top.set(x.family, x.year); return top; });
  const okAll = ok, okNew = (x: EngItem) => okAll(x) && (older || view.get(x.id)!.curated || !(x.year < (newerWith.get(x.family) ?? -1)));
  const best = p.familyBestWithin !== undefined ? { pct: (x: EngItem) => view.get(x.id)!.pct, within: p.familyBestWithin, newestAt: p.newestAt } : undefined;
  // Curated picks are never folded into another member of their model (each is the owner's own choice of year and version).
  const isCur = (x: EngItem) => !!view.get(x.id)?.curated;
  const cands = [...all.filter(x => isCur(x) && okNew(x)), ...engineCandidates(all.filter(x => !isCur(x)), okNew, 0, older, best)].sort((a, b) => (view.get(a.id)!.ci ?? 1e9) - (view.get(b.id)!.ci ?? 1e9)
    || Number(!!view.get(a.id)!.hard) - Number(!!view.get(b.id)!.hard)
    // The shown % first (a capped row never sits above a higher %), then the score behind it.
    || view.get(b.id)!.pct - view.get(a.id)!.pct || view.get(b.id)!.cautious - view.get(a.id)!.cautious || (p.tieByReports ? b.n - a.n : 0) || a.id.localeCompare(b.id));
  // A specialty disc (DiscGolfRecs: a roller / turnover disc, turn ≤ −4) is never the #1 for "any stability".
  if (choice.style === "any" && cands[0]?.it.flags?.specialty) { const i = cands.findIndex(x => !x.it.flags?.specialty); if (i > 0) cands.unshift(...cands.splice(i, 1)); }
  const rows = cands.slice(0, size).map(x => { const v = verdictFor(items, choice, x.it.facts, x.id, setup.levelGate, p);
    const w = view.get(x.id)!;
    return { id: x.id, pct: w.pct, fit: { kind: v.kind, short: v.short }, arm: x.it.facts.tags["arm-friendly"] ?? 0, ...(w.curated && w.pct < LOW_MATCH ? { low: true } : {}) }; });
  return { rows, olderN: older ? 0 : engineCandidates(all, ok, 0, true).length - cands.length };
}

/** The home list for the picks: quick match picks the candidates (lib/quick-match.ts); with picks, rows are ordered by the
 *  match %, which always agrees with the fit word (thin data has no % and goes last); no picks: the Player score order.
 *  One row per model, the family's row year (owner 2026-11-15), unless `older` ("show older models"): every year its own row.
 *  A picked shape holds for the row too: a family whose row year is another shape keeps the year that matched. */
export function rankHome(items: RankItem[], setup: RankSetup, negativeTags: readonly string[], choice: QuickChoice, older: boolean, size = LIST_SIZE): { rows: RankedRow[]; olderN: number } {
  const byId = byIdOf(items);
  if (setup.engine && !isDefault(choice)) return rankEngine(items, setup, choice, older, size);
  const pool = cached(items, "pool", () => items.flatMap(x => x.pool && !x.flags?.noFlight ? [{ ...x.pool, id: x.id, tags: x.facts.tags }] : []));
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

/** "Better matches for you" on a racket page: the best rows for the picks (the home list's own order), without this racket. */
export function alternatives(items: RankItem[], setup: RankSetup, negativeTags: readonly string[], choice: QuickChoice, exclude: string, n = 4): RankedRow[] {
  return rankHome(items, setup, negativeTags, choice, false, n + 1).rows.filter(r => r.id !== exclude).slice(0, n);
}

/** Each product's control ↔ power axis position, 0 control … 1 power (lib/engine engineBase), for copy and display that must
 *  tell the same story as the ranking. Empty without an engine profile. */
/** The engine's axis next to what players alone say (playerAxis), for the content checker: a gap over 0.3 is flagged. */
export function engineAxisCheck(items: RankItem[], engine: EngineProfile | undefined): Map<string, { axis: number; playerAxis: number | null; gap: number | null }> {
  if (!engine) return new Map();
  return new Map([...engBase(items, engine)].map(([id, b]) => [id, { axis: b.axis, playerAxis: b.playerAxis, gap: b.playerAxis === null ? null : Math.abs(b.axis - b.playerAxis) }]));
}
export function engineAxis(items: RankItem[], engine: EngineProfile | undefined): Map<string, number> {
  if (!engine) return new Map();
  return new Map([...engBase(items, engine)].map(([id, b]) => [id, b.axis]));
}
