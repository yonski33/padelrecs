import { cache } from "react";
import { catalog } from "../db/data";
import { productSignals } from "./signals";
import { rankedLists } from "./rankings/lists";
import { finderPool, type FinderProduct } from "../lib/finder";
import { LEVELS, passesLevel, type Level, type LevelEvidence } from "../lib/quick-match";
import { combinedBand, type FitFacts, type LevelSources } from "../lib/fit-verdict";
import type { Trait } from "../lib/trait-score";
import { ratingVerdict } from "../lib/top-lists";
import { niche } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";
import { traitOverrides } from "../db/trait-override";
import { traitScores, type TraitInput } from "../lib/trait-score";
import { armFromReportText } from "../lib/youtube-trait-rules";
import { evidenceRows } from "../db/evidence";
import { evidenceBalance, reportOf } from "../lib/evidence";
import { balanceScores, type Trait as TraitKey } from "../lib/trait-score";
import { levelSuits, levelDisagreement, type Suits, type SuitsInput } from "../lib/level-suits";
import { EXTRACTORS } from "../lib/evidence";
import { shapeOf, gramsOf, feelLean, feelClasses, fineFit, type FineFacts } from "../lib/fine-tune";
import { fitVerdict, styleLean, MIN_FIT_REPORTS } from "../lib/fit-verdict";
import { matchFit, spreadMatch } from "../lib/match-score";
import { matchData } from "../db/match-data";
import type { QuickChoice } from "../lib/quick-match";


/** What quick match (home) and the fit check (racket pages) read, built once per request: the finder's pool and tag counts
 *  over the models the home page shows, the Player scores, the quick-take hooks and level bands, and players' stated levels. */
// The site's hand-kept match data (db/match-data.ts): owner calls, maker / YouTube levels, YouTube trait mentions.
const MATCH = matchData(niche.id);
const GATE = niche.fit?.levelGate;
const BEGINNER_LINES = (niche.fit?.beginnerLines ?? []).map(p => new RegExp(p, "i"));
const PRO_LINES = (niche.fit?.proLines ?? []).map(p => new RegExp(p, "i"));
const LEVEL_VALUE: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const matchContext = cache(async () => {
  const [data, sigs, takes, live, overrides, evidence] = await Promise.all([catalog(), productSignals(), quickTakeHooks(), rankedLists(), traitOverrides(), evidenceRows()]);
  const finder = niche.finder!;
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
  const [controlList, powerList] = [listOf("Control"), listOf("Power")];
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
    return { reports, tags, ...(armDots ? { armDots } : {}), ...(fi ? { fine: fi } : {}), band: takes.get(id)?.band, levels: sourcesOf(id), ...(su ? { suits: su.suits, levelDisagree: su.disagree ?? undefined } : {}), places: { control: controlList ? inPool?.lists?.[controlList] : undefined, power: powerList ? inPool?.lists?.[powerList] : undefined } };
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
    if (!x.tags.includes("arm-friendly") && !x.tags.includes("vibrates on mishits") && x.text) {
      const a = armFromReportText(x.text);
      if (a) { t.textArm = t.textArm ?? { plus: 0, minus: 0 }; if (a > 0) t.textArm.plus++; else t.textArm.minus++; }
    }
  }
  for (const id of listed) if (!tagIn.has(id)) tagIn.set(id, { id, tagged: 0, tags: {} });
  // YouTube reviewers' mentions (db/youtube-traits, one per channel) and the specs as a small prior (lib/trait-score.ts).
  const ytTraits = MATCH.youtubeTraits;
  for (const [id, p] of tagIn) { const r = data.rackets.find(x => x.id === id); if (!r) continue;
    p.youtube = ytTraits[r.slug]; p.specs = { shape: r.shape, balance: r.balance, weight: r.weight, core: r.core }; }
  // Worked out from reports ("auto"), and with the owner's hand-set dots on top (admin area, db/trait-override.ts).
  const dotsSet = (id: string) => Object.fromEntries(Object.entries(overrides.get(id)?.traits ?? {}).filter(([, e]) => e?.dots).map(([t, e]) => [t, e!.dots!]));
  let traitAuto: ReturnType<typeof traitScores>, traitMap: ReturnType<typeof traitScores>;
  if (evidence.length) {
    // Scorer v2 (owner 2026-11-15): the evidence store's praise / complaint balance, one voice once (lib/evidence.ts,
    // lib/trait-score.ts balanceScores). A voice is our reviewer's nickname, a YouTube channel's video or a blog; a forum
    // report or a YouTube comment is its own voice (the stored source name there is the forum or the channel, not the person).
    const voice = new Map<string, string>();
    for (const r of data.reviews) voice.set(`p:${r.id}`, r.alias ? `own:${r.alias.toLowerCase()}` : `p:${r.id}`);
    for (const e of data.external) voice.set(`w:${e.id}`, e.sourcePlatform === "Reddit" || /[?&]lc=/.test(e.sourceUrl) || !e.sourceName ? `w:${e.id}` : `${e.sourcePlatform}:${e.sourceName.toLowerCase()}`);
    const bal = evidenceBalance(evidence, ref => voice.get(ref) ?? ref);
    const known = MATCH.knownDots;
    const knownSet = (slug: string) => Object.fromEntries(Object.entries(known[slug] ?? {}).filter(([, e]) => typeof e?.dots === "number").map(([t, e]) => [t, e.dots!])) as Partial<Record<TraitKey, number>>;
    const reportsOf = new Map<string, number>();
    for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
    const inputs = [...tagIn.values()].map(p => ({ id: p.id, reports: reportsOf.get(p.id) ?? 0, balance: bal.get(p.id) ?? {}, youtube: p.youtube, specs: p.specs }));
    traitAuto = balanceScores(inputs);
    // Level "suits" scores (owner 2026-11-15): players' stated levels (reader rows say what it suits; writers who state their
    // level count when they liked it, and a little against when they didn't), YouTube's band, forgiving vs demanding, and the
    // brand's label as a weak prior (db: brand-level-v1 rows, the owner's sheet).
    const likedRef = new Map<string, boolean | null>();
    for (const r of data.reviews) likedRef.set(`p:${r.id}`, r.rating >= 4 ? true : r.rating <= 2 ? false : null);
    for (const e of data.external) likedRef.set(`w:${e.id}`, e.sentiment === "positive" ? true : e.sentiment === "negative" ? false : null);
    const sIn = new Map<string, SuitsInput>(), get = (id: string) => sIn.get(id) ?? sIn.set(id, { players: [] }).get(id)!;
    const seenVoice = new Set<string>();
    for (const r of evidence) {
      if (r.attribute !== "level" || r.value === null) continue;
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
      if (ex) { let any = false; for (const l of ["beginner", "intermediate", "advanced"] as const) { const e = ex[`suits_${l}`]; if (e) { su[l] = e.value; any = true; } } if (any) { su.basis = su.basis.filter(b => !["a pro line", "advanced players", "its shape", "the owner's beginner list"].includes(b)); su.basis.push("expert"); } }
      suitsOf.set(id, { suits: su, disagree: levelDisagreement(x) });
    }
    // Expert values (admin expert grid) win over the calculated score and hand-set dots.
    const expertTraits = (id: string) => Object.fromEntries(Object.entries(overrides.get(id)?.expert ?? {}).filter(([k]) => !k.startsWith("suits_")).map(([k, e]) => [k, e!.value])) as Partial<Record<TraitKey, number>>;
    traitMap = balanceScores(inputs.map(p => ({ ...p, override: { ...knownSet(slugOf.get(p.id) ?? ""), ...dotsSet(p.id) }, expert: expertTraits(p.id) })));
  } else {
    traitAuto = traitScores([...tagIn.values()]);
    traitMap = traitScores([...tagIn.values()].map(p => ({ ...p, override: dotsSet(p.id) })));
  }
  const leans = new Map([...listed].map(id => { const r = data.rackets.find(x => x.id === id); return [id, feelLean(tagIn.get(id)?.tags ?? {}, r?.core)] as const; }));
  const feels = feelClasses(leans);
  for (const id of listed) { const r = data.rackets.find(x => x.id === id);
    fineOf.set(id, { shape: shapeOf(r?.shape), grams: gramsOf(r?.weight), feel: feels.get(id) ?? null, forgiveness: traitMap.get(id)?.forgiveness?.score ?? null, weightSpec: r?.weight ?? null }); }
  /** With a shape picked (owner 2026-11-15: "it should also be compared inside its own filter"): each rated racket's place for
   *  the picked style among the rated rackets of that shape, 0 bottom … 1 top. Half the style's trait score, half how many
   *  players praise that style, each as a percentile (ties share it). Rated = enough reports for a verdict. */
  const withinCache = new Map<string, Map<string, number>>();
  const styleWithin = (choice: QuickChoice): Map<string, number> | null => {
    const shape = choice.fine?.shape; if (!shape || choice.style === "any") return null;
    const key = `${shape}:${choice.style}`, hit = withinCache.get(key); if (hit) return hit;
    const ids = [...listed].filter(id => fineOf.get(id)?.shape === shape && facts(id).reports >= MIN_FIT_REPORTS);
    const pick = (c: number | undefined, p: number | undefined) => choice.style === "power" ? p ?? 0 : choice.style === "control" ? c ?? 0 : Math.min(c ?? 0, p ?? 0);
    const trait = new Map(ids.map(id => { const t = traitMap.get(id); return [id, pick(t?.control?.score, t?.power?.score)] as const; }));
    const praise = new Map(ids.map(id => { const l = styleLean(facts(id)); return [id, pick(l.control, l.power)] as const; }));
    const pctl = (m: Map<string, number>, id: string) => { const v = m.get(id)!; let below = 0, same = 0; for (const x of m.values()) { if (x < v) below++; else if (x === v) same++; }
      return ids.length > 1 ? (below + (same - 1) / 2) / (ids.length - 1) : 1; };
    const out = new Map(ids.map(id => [id, 0.5 * pctl(trait, id) + 0.5 * pctl(praise, id)]));
    withinCache.set(key, out);
    return out;
  };
  /** The fit check's facts for these picks: facts() plus the racket's place inside a picked shape. */
  const factsFor = (choice: QuickChoice, id: string): FitFacts => {
    const f = facts(id), r = styleWithin(choice)?.get(id);
    return r === undefined ? f : { ...f, styleWithin: { rank: r, shape: choice.fine!.shape! } };
  };
  /** The match % for a set of picks, for every listed racket, spread inside each verdict band (lib/match-score.ts spreadMatch),
   *  so the home list and the racket page show the same number. Null on thin data. With a shape picked, the % is spread among
   *  that shape's rackets only (the others are spread on their own), so the best of the shape reach the top of its band. */
  const pctCache = new Map<string, Map<string, number | null>>();
  const matchPct = (choice: QuickChoice): Map<string, number | null> => {
    const key = JSON.stringify(choice);
    const hit = pctCache.get(key); if (hit) return hit;
    const within = styleWithin(choice);
    const rows = [...listed].map(id => {
      const fv = fitVerdict(choice, factsFor(choice, id)), t = traitMap.get(id), lv = level(id);
      const fit = matchFit(choice, { control: t?.control?.score ?? null, power: t?.power?.score ?? null, arm: t?.arm?.score ?? null, band: lv?.band, likedAtLevel: choice.level ? lv?.liked[choice.level] ?? 0 : 0,
        suits: choice.level ? lv?.suits?.[choice.level] : undefined, levelGated: !!GATE, signal: signal(id), fine: fineFit(choice.fine, fineOf.get(id)!), styleWithin: within?.get(id) });
      const styleScore = choice.style === "power" ? t?.power?.score ?? 0 : choice.style === "control" ? t?.control?.score ?? 0 : choice.style === "balance" ? Math.min(t?.control?.score ?? 0, t?.power?.score ?? 0) : signal(id) ?? 0;
      return { id, kind: fv.kind, fit, tie1: within?.get(id) ?? styleScore, tie2: signal(id) ?? 0 };
    });
    // Spread among comparable rackets: the level-eligible ones (lib/quick-match.ts passesLevel) apart from the rest, and with a
    // shape picked, that shape apart from the others, so the best rackets for the picks reach the top of their band.
    const shape = choice.fine?.shape, group = (id: string) => `${!shape || fineOf.get(id)?.shape === shape}|${passesLevel(level(id), choice.level, GATE)}`;
    const groups = new Map<string, typeof rows>(); for (const r of rows) groups.set(group(r.id), [...groups.get(group(r.id)) ?? [], r]);
    const spread = new Map([...groups.values()].flatMap(g => [...spreadMatch(g)]));
    const out = new Map(rows.map(r => [r.id, r.kind === "thin" ? null : spread.get(r.id) ?? null]));
    pctCache.set(key, out);
    return out;
  };
  /** The level suits scores before any expert value (for the admin expert grid). */
  const suitsAuto = (id: string) => suitsAutoOf.get(id) ?? null;
  const traits = (id: string) => ({ scores: traitMap.get(id) ?? null, auto: traitAuto.get(id) ?? null, tagged: tagIn.get(id)?.tagged ?? 0, tags: tagIn.get(id)?.tags ?? {}, edits: overrides.get(id) ?? null });
  return { data, sigs, takes, finder, bad, pool: pool as FinderProduct[], levelGate: GATE, level, signal, facts, factsFor, traits, matchPct, fineOf: (id: string) => fineOf.get(id), suitsAuto, evidence };
});
