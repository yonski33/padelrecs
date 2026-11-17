import { cache } from "react";
import { pageBar, PAGE_BAR_TRAITS } from "../lib/page-bars";
import { pageContent } from "../lib/racket-page";
import { kept } from "../db/keep";
import { catalog } from "../db/data";
import { productSignals } from "./signals";
import { baseLists } from "./rankings/lists";
import { finderPool, type FinderProduct } from "../lib/finder";
import { LEVELS, type Level, type LevelEvidence } from "../lib/quick-match";
import { combinedBand, type FitFacts, type LevelSources } from "../lib/fit-verdict";
import type { Trait } from "../lib/trait-score";
import { ratingVerdict } from "../lib/top-lists";
import { niche } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";
import { traitOverrides, levelToSuits } from "../db/trait-override";
import { traitScores, type TraitInput } from "../lib/trait-score";
import { armFromReportText } from "../lib/youtube-trait-rules";
import { evidenceRows } from "../db/evidence";
import { evidenceBalance, labPercentiles, reportOf } from "../lib/evidence";
import { balanceScores, type BalanceInput, type Trait as TraitKey } from "../lib/trait-score";
import { levelSuits, levelDisagreement, type Suits, type SuitsInput } from "../lib/level-suits";
import { levelTier, applyTier } from "../lib/level-tiers";
import { EXTRACTORS } from "../lib/evidence";
import { shapeOf, gramsOf, feelLean, feelClasses, type FineFacts , coreClass, FINE_ROWS } from "../lib/fine-tune";
import { MIN_FIT_REPORTS } from "../lib/fit-verdict";
import { factsWith, matchPcts, type RankItem } from "../lib/home-rank";
import { engineBase, engineTraitDots, DOT_TRAITS, type EngineFacts, type DotTrait } from "../lib/engine";
import { rowOfFamily } from "../lib/compare-pairs";
import { hasCurated } from "../lib/curated";
import { matchData } from "../db/match-data";
import type { QuickChoice } from "../lib/quick-match";

import { fitConfigFor } from "../lib/fit-config";
import { discRules, type SiteRules } from "../lib/discgolf-hard";
import { paddleRules } from "../lib/pickleball-hard";

/** What quick match (home) and the fit check (racket pages) read, built once per request: the finder's pool and tag counts
 *  over the models the home page shows, the Player scores, the quick-take hooks and level bands, and players' stated levels. */
// The site's hand-kept match data (db/match-data.ts): owner calls, maker / YouTube levels, YouTube trait mentions.
const MATCH = matchData(niche.id);
const GATE = niche.fit?.levelGate, ENGINE = niche.fit?.engine, ENGINE_TRAITS = ENGINE?.traits ?? DOT_TRAITS;
const BEGINNER_LINES = (niche.fit?.beginnerLines ?? []).map(p => new RegExp(p, "i"));
const PRO_LINES = (niche.fit?.proLines ?? []).map(p => new RegExp(p, "i"));
/** A site's own hard rules and level floors (DiscGolfRecs, lib/discgolf-hard.ts; PickleballRecs, lib/pickleball-hard.ts). */
type SiteRuleFn = (d: { slug: string; weight: string | null }, noLevel?: boolean) => SiteRules;
const SITE_RULES: Partial<Record<string, SiteRuleFn>> = { discgolf: discRules, pickleball: paddleRules };
const RULES: SiteRuleFn | undefined = SITE_RULES[niche.id];
const LEVEL_VALUE: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
// Built once per server instance and kept (db/keep.ts), not once per page: it takes seconds over a big catalog (owner
// 2026-11-16: first visits to the v2 sites took 8–49 s). Still read once per request through cache(), so one page sees one copy.
export const matchContext = cache(() => keptContext.get());
const keptContext = kept(async () => {
  const [data, sigs, takes, live, overrides, stored] = await Promise.all([catalog(), productSignals(), quickTakeHooks(), baseLists(), traitOverrides(), evidenceRows()]);
  const finder = niche.finder!;
  // The site's fit rules (lib/fit-config.ts); only sites with one call this.
  const cfg = fitConfigFor(niche)!;
  const rulesMemo = new Map<string, SiteRules>();
  // `noLevel`: the product has no level data, so a rule may read the page's own level (PickleballRecs, lib/pickleball-hard.ts).
  const rulesOf = (id: string, noLevel = false): SiteRules => { const key = `${id}|${noLevel}`; let r = rulesMemo.get(key); if (!r) { const x = data.rackets.find(y => y.id === id); r = RULES && x ? RULES({ slug: x.slug, weight: x.weight }, noLevel) : {}; rulesMemo.set(key, r); } return r; };
  // A site with its own evidence names (DiscGolfRecs) hands the engine the rows it reads; everyone else's pass through.
  const evidence = cfg.evidenceAdapter ? cfg.evidenceAdapter(stored) : stored;
  // The owner's facts per product (owner evidence rows, the latest per attribute), for the hard filters' facts (quick.factValues).
  const ownerFacts = new Map<string, Record<string, string | number | null>>();
  if (cfg.quick?.factValues) for (const r of [...stored].filter(x => x.sourceKind === "owner").sort((a, b) => (a.saidAt ?? "").localeCompare(b.saidAt ?? "")))
    (ownerFacts.get(r.productId) ?? ownerFacts.set(r.productId, {}).get(r.productId)!)[r.attribute] = r.valueText ?? r.value;
  const good = niche.tags.filter(t => t.tone === "pos").map(t => t.label), bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  // Places come from the live rankings (the lists people see, ordered by Player score), not a second ranking worked out here:
  // that one used another order, so "control" picked a different ten than the Best for control page (owner, 2026-11-15).
  const places = new Map<string, Record<string, number>>();
  for (const slug of new Set(finder.questions.flatMap(q => q.options.flatMap(o => o.list ?? [])))) {
    live.lists.find(l => l.list.slug === slug)?.entries.forEach(e => places.set(e.product.id, { ...places.get(e.product.id), [slug]: e.rank }));
  }
  const pool = finderPool({ ...finder, maxAgeYears: niche.feedMaxAgeYears }, data, good).map(p => ({ ...p, lists: places.get(p.id) ?? {} }));
  const byId = new Map(pool.map(p => [p.id, p]));
  const likedBy = new Map<string, Partial<Record<Level, number>>>();
  for (const r of data.reviews) {
    const lv = LEVELS.find(l => LEVEL_VALUE[l] === r.playerLevel) ?? (r.playerLevel === "Competitive" ? "advanced" : undefined);
    if (!lv || r.rating < 4) continue;
    const m = likedBy.get(r.racketId) ?? {}; m[lv] = (m[lv] ?? 0) + 1; likedBy.set(r.racketId, m);
  }
  const slugOf = new Map(data.rackets.map(r => [r.id, r.slug]));
  const sourcesOf = (id: string): LevelSources | undefined => MATCH.levelSources[slugOf.get(id) ?? ""];
  // Level as a "suits" score per level (lib/level-suits.ts, filled below from the evidence store); without it, the band the
  // sources agree on (brand, reviewers, players), like the fit check.
  const suitsOf = new Map<string, { suits: Suits; disagree: string | null }>(), suitsAutoOf = new Map<string, Suits>();
  // Fine-tune facts per racket (lib/fine-tune.ts), filled with the trait scores below.
  const fineOf = new Map<string, FineFacts & { weightSpec: string | null }>();
  const level = (id: string): LevelEvidence | undefined => {
    const liked = likedBy.get(id), band = combinedBand({ reports: 0, tags: {}, band: takes.get(id)?.band, levels: sourcesOf(id) }), su = suitsOf.get(id);
    if (su) return { liked: liked ?? {}, band, suits: su.suits };
    return liked || band ? { liked: liked ?? {}, band } : undefined;
  };
  const signal = (id: string) => sigs.get(id)?.signal ?? null;
  const listOf = (label: string) => finder.questions.find(q => q.id === "style")?.options.find(o => o.label === label)?.list;
  const [controlList, powerList] = [listOf(cfg.styleLabels.control), listOf(cfg.styleLabels.power)];
  /** The fit check's facts for one racket: its tags counted like the finder (outside the pool too), and its ranking places. */
  const facts = (id: string): FitFacts => {
    const inPool = byId.get(id);
    let tags: Record<string, number>;
    if (inPool) tags = inPool.tags;
    else {
      const goodSet = new Set(good); tags = {};
      const notes = [...data.reviews.filter(r => r.racketId === id).map(r => ({ v: ratingVerdict(r.rating), tags: r.tags })),
        ...data.external.filter(e => e.racketId === id && e.sentiment).map(e => ({ v: e.sentiment!, tags: e.tags }))];
      for (const x of notes) for (const t of x.tags) if (!(goodSet.has(t) && x.v === "negative")) tags[t] = (tags[t] ?? 0) + 1;
    }
    const reports = data.reviews.filter(r => r.racketId === id).length + data.external.filter(e => e.racketId === id).length;
    const su = suitsOf.get(id), fi = fineOf.get(id);
    const armDots = traitMap?.get(id)?.arm?.dots;
    // The Attack and Control bars as shown (owner audit 2026-11-17: one style per racket on every page).
    const pd = traitMap?.get(id)?.power?.dots, cd = traitMap?.get(id)?.control?.dots, sp = traitMap?.get(id)?.spin?.dots;
    const styleDots = pd && cd ? { power: pd, control: cd, ...(sp ? { spin: sp } : {}) } : undefined;
    // A hard-filter arm pick (SimRacingRecs: console): a product without the fact is held back for it, with the site's reason.
    const noArm = cfg.quick?.armFilter && cfg.quick.factValues && cfg.words?.hardArm ? (() => { const x = data.rackets.find(y => y.id === id);
      return !!x && !cfg.quick!.factValues!(x, ownerFacts.get(id) ?? {})[cfg.quick!.armFilter!.key]?.includes(cfg.quick!.armFilter!.value); })() : false;
    const hard = noArm ? { ...(RULES && rulesOf(id, !su).hard), arm: cfg.words!.hardArm } : RULES && rulesOf(id, !su).hard, warn = RULES && rulesOf(id, !su).warn, lean = RULES && rulesOf(id, !su).lean;
    return { reports, tags, ...(armDots ? { armDots } : {}), ...(styleDots ? { styleDots } : {}), ...(hard ? { hard } : {}), ...(warn ? { warn } : {}), ...(lean ? { lean } : {}), ...(fi ? { fine: fi } : {}), band: takes.get(id)?.band, levels: sourcesOf(id), ...(su ? { suits: su.suits, levelDisagree: su.disagree ?? undefined } : {}), places: { control: controlList ? inPool?.lists?.[controlList] : undefined, power: powerList ? inPool?.lists?.[powerList] : undefined } };
  };
  // Trait scores (lib/trait-score.ts) for every listed racket: tags counted like the finder (a good tag doesn't count from a
  // negative report), "tagged" = reports with at least one counted tag.
  const goodSet = new Set(good), tagIn = new Map<string, TraitInput>();
  const listed = new Set(data.listed.map(r => r.id));
  const taggedReports = new Map<string, Set<string>>();
  for (const x of [...data.reviews.map(r => ({ ref: `p:${r.id}`, id: r.racketId, v: ratingVerdict(r.rating), tags: r.tags, text: r.reviewText })), ...data.external.map(e => ({ ref: `w:${e.id}`, id: e.racketId, v: e.sentiment, tags: e.tags, text: [e.summary, e.excerptTranslation ?? e.excerpt].filter(Boolean).join(" ") }))]) {
    if (!listed.has(x.id)) continue;
    const counted = x.tags.filter(t => !(goodSet.has(t) && x.v === "negative"));
    const t = tagIn.get(x.id) ?? { id: x.id, tagged: 0, tags: {} }; tagIn.set(x.id, t);
    if (counted.length) { t.tagged++; const s = taggedReports.get(x.id) ?? new Set(); s.add(x.ref); taggedReports.set(x.id, s); }
    for (const tag of counted) t.tags[tag] = (t.tags[tag] ?? 0) + 1;
    // Arm comfort said only in words (no arm tag): read with fixed rules (lib/youtube-trait-rules.ts armFromReportText).
    if (!x.tags.includes(cfg.arm.plus) && !(cfg.arm.minus && x.tags.includes(cfg.arm.minus)) && x.text) {
      const a = armFromReportText(x.text);
      if (a) { t.textArm = t.textArm ?? { plus: 0, minus: 0 }; if (a > 0) t.textArm.plus++; else t.textArm.minus++; }
    }
  }
  for (const id of listed) if (!tagIn.has(id)) tagIn.set(id, { id, tagged: 0, tags: {} });
  // YouTube reviewers' mentions (db/youtube-traits, one per channel) and the specs as a small prior (lib/trait-score.ts).
  const ytTraits = MATCH.youtubeTraits;
  for (const [id, p] of tagIn) { const r = data.rackets.find(x => x.id === id); if (!r) continue;
    p.youtube = ytTraits[r.slug]; p.specs = { shape: r.shape, balance: r.balance, weight: r.weight, core: r.core, surface: r.surface }; }
  // Worked out from reports ("auto"), and with the owner's hand-set dots on top (admin area, db/trait-override.ts).
  const dotsSet = (id: string) => Object.fromEntries(Object.entries(overrides.get(id)?.traits ?? {}).filter(([, e]) => e?.dots).map(([t, e]) => [t, e!.dots!]));
  let traitAuto: ReturnType<typeof traitScores>, traitMap: ReturnType<typeof traitScores>;
  /** What scorer v2 ranked (for the tuning and check scripts). */
  let scoreInputs: BalanceInput[] = [];
  if (evidence.length) {
    // Scorer v2 (owner 2026-11-15): the evidence store's praise / complaint balance, one voice once (lib/evidence.ts,
    // lib/trait-score.ts balanceScores). A voice is our reviewer's nickname, a YouTube channel's video or a blog; a forum
    // report or a YouTube comment is its own voice (the stored source name there is the forum or the channel, not the person).
    const voice = new Map<string, string>();
    for (const r of data.reviews) voice.set(`p:${r.id}`, r.alias ? `own:${r.alias.toLowerCase()}` : `p:${r.id}`);
    for (const e of data.external) voice.set(`w:${e.id}`, e.sourcePlatform === "Reddit" || /[?&]lc=/.test(e.sourceUrl) || !e.sourceName ? `w:${e.id}` : `${e.sourcePlatform}:${e.sourceName.toLowerCase()}`);
    const bal = evidenceBalance(evidence, ref => voice.get(ref) ?? ref, 2, cfg);
    const known = MATCH.knownDots;
    const knownSet = (slug: string) => Object.fromEntries(Object.entries(known[slug] ?? {}).filter(([, e]) => typeof e?.dots === "number").map(([t, e]) => [t, e.dots!])) as Partial<Record<TraitKey, number>>;
    const reportsOf = new Map<string, number>();
    for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
    // Lab measurements as percentiles (sites whose profile weighs them; the maker's swing weight where no lab has one).
    // "113", "116.8", "114-117" (midpoint) or "111 ± 3".
    const swing = (s?: string | null) => { const m = s?.match(/^\s*(\d{2,3}(?:\.\d+)?)\s*(?:[-–]\s*(\d{2,3}(?:\.\d+)?)|±\s*\d+(?:\.\d+)?)?\s*$/); return m ? (Number(m[1]) + Number(m[2] ?? m[1])) / 2 : NaN; };
    const specValues = Object.fromEntries(Object.entries(cfg.lab?.specMetric ?? {}).map(([m, col]) => [m, new Map(data.rackets.map(r => [r.id, swing(r[col])] as const).filter(([, v]) => Number.isFinite(v)))]));
    const lab = cfg.lab ? labPercentiles(evidence, cfg, specValues) : new Map();
    const inputs = [...tagIn.values()].map(p => ({ id: p.id, reports: reportsOf.get(p.id) ?? 0, balance: bal.get(p.id) ?? {}, youtube: p.youtube, specs: p.specs, lab: lab.get(p.id) }));
    scoreInputs = inputs;
    traitAuto = balanceScores(inputs, cfg);
    // Level "suits" scores (owner 2026-11-15): players' stated levels (reader rows say what it suits; writers who state their
    // level count when they liked it, and a little against when they didn't), YouTube's band, forgiving vs demanding, and the
    // brand's label as a weak prior (db: brand-level-v1 rows, the owner's sheet).
    const likedRef = new Map<string, boolean | null>();
    for (const r of data.reviews) likedRef.set(`p:${r.id}`, r.rating >= 4 ? true : r.rating <= 2 ? false : null);
    for (const e of data.external) likedRef.set(`w:${e.id}`, e.sentiment === "positive" ? true : e.sentiment === "negative" ? false : null);
    const sIn = new Map<string, SuitsInput>(), get = (id: string) => sIn.get(id) ?? sIn.set(id, { players: [] }).get(id)!;
    const seenVoice = new Set<string>();
    // A level read from the specs by a site's rule (scripts/tennis-spec-levels.mts): half the weight of an expert level, and
    // only where no expert level is set.
    const specLevel = new Map<string, string>();
    for (const r of evidence) {
      if (r.attribute !== "level" || r.value === null) continue;
      if (r.extractedBy === EXTRACTORS.specLevel) { if (r.valueText) specLevel.set(r.productId, r.valueText); continue; }
      if (r.extractedBy === EXTRACTORS.brandLevel) {
        const [from, to] = (r.valueText ?? "").split("-").map(Number);
        if (Number.isInteger(from) && Number.isInteger(to)) get(r.productId).brand = { from, to, notForBeginners: /not (suitable |recommended |aimed |meant )?for beginners|no (apta|recomendada) para principiantes/i.test(r.quote ?? "") };
      } else if (r.extractedBy === EXTRACTORS.reader || r.extractedBy === EXTRACTORS.level) {
        const ref = reportOf(r.sourceRef), v = `${r.productId}|${voice.get(ref) ?? ref}`;
        if (seenVoice.has(v)) continue; seenVoice.add(v);
        get(r.productId).players!.push({ level: Math.max(0, Math.min(2, Math.round(r.value))), liked: r.extractedBy === EXTRACTORS.reader ? null : likedRef.get(ref) ?? null });
      }
    }
    for (const id of listed) {
      const x = get(id), yt = sourcesOf(id)?.youtube, f = bal.get(id)?.forgiveness;
      if (yt) x.youtube = { from: yt.from, to: yt.to, channels: yt.channels };
      if (f) x.forgiveness = { P: f.P, C: f.C };
      // Pro / competition lines (the site's profile, lib/niche fit.proLines) and "demanding" reports feed the level caps.
      const name = data.rackets.find(r => r.id === id)?.name ?? "";
      if (PRO_LINES.some(re => re.test(name))) x.proLine = true;
      const dem = tagIn.get(id)?.tags.demanding; if (dem) x.demanding = dem;
      const shape = data.rackets.find(r => r.id === id)?.shape?.toLowerCase() ?? "";
      if ((niche.fit?.beginnerShapesOut ?? []).some(s => shape.startsWith(s))) x.hardShape = true;
      if (BEGINNER_LINES.some(re => re.test(name))) x.beginnerLine = true;
      const su = levelSuits(x), ex = overrides.get(id)?.expert;
      suitsAutoOf.set(id, { ...su, basis: [...su.basis] });
      // An expert's suits scores win, and count as backing (not the brand alone).
      let expertLevel = false;
      if (ex) { let any = false; for (const l of ["beginner", "intermediate", "advanced"] as const) { const e = ex[`suits_${l}`]; if (e) { su[l] = e.value; any = true; } } if (any) { expertLevel = true; su.basis = su.basis.filter(b => !["a pro line", "advanced players", "its shape", "the owner's beginner list"].includes(b)); su.basis.push("expert"); } }
      const sp = expertLevel ? null : levelToSuits(specLevel.get(id));
      // Thin level data (PickleballRecs, audit 2026-11-16): with fewer than gateMinPlayers players and no expert value, the
      // specs' level stands in alone, or there is no level score (no gate, no level term) rather than one from 1–3 players.
      const minPlayers = niche.fit?.gateMinPlayers;
      if (minPlayers && !expertLevel && (x.players?.length ?? 0) < minPlayers) {
        if (sp) { for (const l of ["beginner", "intermediate", "advanced"] as const) su[l] = sp[`suits_${l}`]!; su.basis = ["the specs"]; suitsOf.set(id, { suits: su, disagree: levelDisagreement(x) }); }
        continue;
      }
      if (sp) { for (const l of ["beginner", "intermediate", "advanced"] as const) su[l] = Math.round((su[l] + sp[`suits_${l}`]!) / 2); su.basis.push("the specs"); }
      // Thin level data on a site with spec levels (DiscGolfRecs, audit 2026-11-17 #7: every 3-player disc read 71 / 63 / 37): the
      // flight numbers' levels weigh in until 8 players have said theirs.
      const ss = RULES && !expertLevel ? rulesOf(id).specSuits : undefined, pn = Math.min(8, x.players?.length ?? 0);
      if (ss) for (const l of ["beginner", "intermediate", "advanced"] as const) su[l] = Math.round((su[l] * pn + ss[l] * (8 - pn)) / 8);
      // A site's level floor (DiscGolfRecs: a speed ≤ 7 disc suits advanced players at least 50, lib/discgolf-hard.ts).
      const floor = RULES && rulesOf(id).suitsFloor;
      if (floor) for (const l of ["beginner", "intermediate", "advanced"] as const) su[l] = Math.max(su[l], floor[l] ?? 0);
      // The owner's level tiers (lib/level-tiers.ts): the last word on intermediate+ and truly advanced rackets.
      const tier = levelTier(niche.id, name, su);
      if (tier) { suitsOf.set(id, { suits: applyTier(tier, su), disagree: null }); continue; }
      suitsOf.set(id, { suits: su, disagree: levelDisagreement(x) });
    }
    // Expert values (admin expert grid) win over the calculated score and hand-set dots.
    const expertTraits = (id: string) => ({ ...Object.fromEntries(Object.entries(overrides.get(id)?.expert ?? {}).filter(([k]) => !k.startsWith("suits_")).map(([k, e]) => [k, e!.value])),
      ...Object.fromEntries(Object.entries(cfg.expertAlias ?? {}).flatMap(([t, k]) => { const v = (overrides.get(id)?.expert as Record<string, { value: number } | undefined> | undefined)?.[k]?.value; return v === undefined ? [] : [[t, v]]; })) }) as Partial<Record<TraitKey, number>>;
    traitMap = balanceScores(inputs.map(p => ({ ...p, override: { ...knownSet(slugOf.get(p.id) ?? ""), ...dotsSet(p.id) }, expert: expertTraits(p.id) })), cfg);
  } else {
    traitAuto = traitScores([...tagIn.values()], cfg);
    traitMap = traitScores([...tagIn.values()].map(p => ({ ...p, override: dotsSet(p.id) })), cfg);
  }
  // The match engine's facts (lib/engine): verdict counts, praising / faulting voices, the specs' lean and expert values.
  const sentOf = new Map<string, { pos: number; mix: number; neg: number }>();
  const addSent = (id: string, v: string | null | undefined) => { const x = sentOf.get(id) ?? { pos: 0, mix: 0, neg: 0 }; if (v === "positive") x.pos++; else if (v === "mixed") x.mix++; else if (v === "negative") x.neg++; sentOf.set(id, x); };
  for (const r of data.reviews) addSent(r.racketId, ratingVerdict(r.rating));
  for (const e of data.external) addSent(e.racketId, e.sentiment);
  const engOf = (id: string, r: (typeof data.rackets)[number]): EngineFacts => {
    const t = traitMap.get(id), ex = overrides.get(id)?.expert ?? {};
    const vo = (k: DotTrait) => ({ plus: t?.[k]?.plus ?? 0, minus: t?.[k]?.minus ?? 0 });
    const exv = (k: DotTrait) => (ex as Record<string, { value: number } | undefined>)[cfg.expertAlias?.[k] ?? k]?.value;
    return { name: r.name, year: r.year, ...(sentOf.get(id) ?? { pos: 0, mix: 0, neg: 0 }),
      voices: { control: vo("control"), power: vo("power"), ...Object.fromEntries(ENGINE_TRAITS.map(k => [k, vo(k)])) },
      spec: { control: t?.control?.spec ?? 0, power: t?.power?.spec ?? 0, ...Object.fromEntries(ENGINE_TRAITS.map(k => [k, t?.[k]?.spec ?? 0])) },
      expert: Object.fromEntries(ENGINE_TRAITS.flatMap(k => exv(k) !== undefined ? [[k, exv(k)!]] : [])),
      // The mould, only where the profile bounds the axis by it (padel), so other sites' payloads stay as they were.
      ...(RULES ? { shape: rulesOf(id).axisKey ?? null } : ENGINE?.shapeBounds ? { shape: shapeOf(r.shape) } : {}) };
  };
  // Trait dots from the engine (lib/engine engineTraitDots; PM / owner 2026-11-15, one story across the page): they replace the
  // per-report-rate dots everywhere (racket page, filters, the fit check), and hand-set dots still win.
  if (ENGINE) {
    const reportsN = new Map<string, number>(); for (const x of [...data.reviews, ...data.external]) reportsN.set(x.racketId, (reportsN.get(x.racketId) ?? 0) + 1);
    const engList = [...listed].map(id => ({ id, n: reportsN.get(id) ?? 0, e: engOf(id, data.rackets.find(x => x.id === id)!) }));
    const dots = engineTraitDots(engList, engineBase(engList, ENGINE), ENGINE);
    for (const id of listed) { const m = traitMap.get(id), d = dots.get(id), ex = overrides.get(id)?.expert ?? {}; if (!m || !d) continue;
      for (const k of ENGINE_TRAITS) { const cur = m[k]; if (!cur) continue;
        const hand = cur.set && !(k in ex); if (hand) continue;
        m[k] = { ...cur, dots: d[k].dots, score: d[k].score }; } }
    // The page's own clear claims (engine pageBars, PickleballRecs Grok audit 2026-11-17): a bar never reads the opposite of
    // its Why yes / Why not (lib/page-bars.ts). Hand-set and expert dots still win.
    // An expert 3 or less gives way to 4 only where the page claims the strength and the reviews (the auto dots) say 4+ too
    // (owner 2026-11-17: "Raise to 4" for the 9 paddles in the Grok audit, e.g. the Ruby's spin). It only ever raises.
    if (ENGINE.pageBars) for (const id of listed) { const m = traitMap.get(id), ex = overrides.get(id)?.expert ?? {}, page = pageContent(slugOf.get(id) ?? ""); if (!m || !page) continue;
      for (const k of PAGE_BAR_TRAITS as TraitKey[]) { const cur = m[k]; if (!cur) continue;
        if (k in ex) { const auto = traitAuto.get(id)?.[k]?.dots ?? 0;
          if (cur.dots < 4 && auto >= 4 && pageBar(k, cur.dots, page) >= 4) m[k] = { ...cur, dots: 4, score: 70 };
          continue; }
        if (cur.set) continue;
        const dots = pageBar(k, cur.dots, page); if (dots !== cur.dots) m[k] = { ...cur, dots, score: (dots - 1) * 20 + 10 }; } }
  }
  // A site's arm-dot limits from the specs (DiscGolfRecs: speed 11+ is never "easy to throw", a speed-5 putter always is), over
  // players and hand-set dots alike, so the bar, the arm check and the chips say what the flight numbers allow.
  if (RULES) for (const id of listed) { const m = traitMap?.get(id) as Record<string, { dots: number; score: number } | undefined> | undefined;
    for (const [k, b] of Object.entries(rulesOf(id).dotBounds ?? {})) { const cur = m?.[k]; if (!m || !cur) continue;
      const dots = Math.min(b[1], Math.max(b[0], cur.dots)); if (dots !== cur.dots) m[k] = { ...cur, dots, score: Math.min(Math.max(cur.score, (dots - 1) * 20), (dots - 1) * 20 + 19) }; } }

  const leans = new Map([...listed].map(id => { const r = data.rackets.find(x => x.id === id); return [id, feelLean(tagIn.get(id)?.tags ?? {}, r?.core)] as const; }));
  const feels = feelClasses(leans);
  for (const id of listed) { const r = data.rackets.find(x => x.id === id);
    fineOf.set(id, { shape: shapeOf(r?.shape), grams: gramsOf(r?.weight), feel: feels.get(id) ?? null, forgiveness: traitMap.get(id)?.forgiveness?.score ?? null, weightSpec: r?.weight ?? null, ...(FINE_ROWS.includes("core") ? { core: coreClass(r?.core) } : {}) }); }
  // One compact item per listed racket (lib/home-rank.ts): the place inside a picked shape, the match % and the home list are
  // worked out from these, on the server and (for chip taps) in the browser, with the same functions.
  const items: RankItem[] = [...listed].map(id => {
    const t = traitMap.get(id), p = byId.get(id), r = data.rackets.find(x => x.id === id)!;
    const pool = p ? { reviews: p.reviews, positive: p.positive, mixed: p.mixed, negative: p.negative, shape: p.shape, lists: p.lists } : undefined;
    return { id, facts: facts(id), control: t?.control?.score ?? null, power: t?.power?.score ?? null, arm: t?.arm?.score ?? null, level: level(id), signal: signal(id),
      ...(pool ? { pool } : {}), row: rowOfFamily(r, data.listed, x => facts(x.id).reports >= MIN_FIT_REPORTS).shown.id, ...(ENGINE ? { eng: engOf(id, r) } : {}),
      ...(hasCurated() ? { slug: r.slug, ...(/high/i.test(r.balance ?? "") ? { headHeavy: true } : {}) } : {}),
      ...(cfg.quick ? { kind: cfg.quick.types.find(t => t.shape === r.shape)?.key } : {}), ...(RULES && rulesOf(id).flags ? { flags: rulesOf(id).flags } : {}),
      ...(cfg.quick?.factValues ? { ff: cfg.quick.factValues(r, ownerFacts.get(id) ?? {}) } : {}) };
  });
  /** The fit check's facts for these picks: facts() plus the racket's place inside a picked shape. */
  const factsFor = (choice: QuickChoice, id: string): FitFacts => factsWith(items, choice, facts(id), id);
  /** The match % for a set of picks, for every listed racket (lib/home-rank.ts matchPcts). */
  const matchPct = (choice: QuickChoice) => matchPcts(items, choice, GATE, ENGINE);
  /** The level suits scores before any expert value (for the admin expert grid). */
  const suitsAuto = (id: string) => suitsAutoOf.get(id) ?? null;
  const traits = (id: string) => ({ scores: traitMap.get(id) ?? null, auto: traitAuto.get(id) ?? null, tagged: tagIn.get(id)?.tagged ?? 0, tags: tagIn.get(id)?.tags ?? {}, edits: overrides.get(id) ?? null });
  return { cfg, data, sigs, takes, finder, bad, pool: pool as FinderProduct[], items, levelGate: GATE, level, signal, facts, factsFor, traits, matchPct, fineOf: (id: string) => fineOf.get(id), suitsAuto, evidence, scoreInputs };
});
