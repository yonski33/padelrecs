import { cache } from "react";
import { catalog } from "../db/data";
import { productSignals } from "./signals";
import { rankedLists } from "./rankings/lists";
import { finderPool, type FinderProduct } from "../lib/finder";
import { LEVELS, type Level, type LevelEvidence } from "../lib/quick-match";
import { combinedBand, type FitFacts, type LevelSources } from "../lib/fit-verdict";
import padelLevels from "../db/level-sources/padel.json";
import { ratingVerdict } from "../lib/top-lists";
import { niche } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";
import { traitOverrides } from "../db/trait-override";
import { traitScores, type TraitInput } from "../lib/trait-score";

/** What quick match (home) and the fit check (racket pages) read, built once per request: the finder's pool and tag counts
 *  over the models the home page shows, the Player scores, the quick-take hooks and level bands, and players' stated levels. */
/** Maker and YouTube levels by product slug (db/level-sources/<niche>.json), beside the players' band. */
const LEVEL_SOURCES: Record<string, Record<string, LevelSources>> = { padel: padelLevels as unknown as Record<string, LevelSources> };
const LEVEL_VALUE: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const matchContext = cache(async () => {
  const [data, sigs, takes, live, overrides] = await Promise.all([catalog(), productSignals(), quickTakeHooks(), rankedLists(), traitOverrides()]);
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
  const sourcesOf = (id: string): LevelSources | undefined => LEVEL_SOURCES[niche.id]?.[slugOf.get(id) ?? ""];
  // The band quick match ranks with is the one the sources agree on (brand, reviewers, players), like the fit check.
  const level = (id: string): LevelEvidence | undefined => {
    const liked = likedBy.get(id), band = combinedBand({ reports: 0, tags: {}, band: takes.get(id)?.band, levels: sourcesOf(id) });
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
    return { reports, tags, band: takes.get(id)?.band, levels: sourcesOf(id), places: { control: controlList ? inPool?.lists?.[controlList] : undefined, power: powerList ? inPool?.lists?.[powerList] : undefined } };
  };
  // Trait scores (lib/trait-score.ts) for every listed racket: tags counted like the finder (a good tag doesn't count from a
  // negative report), "tagged" = reports with at least one counted tag.
  const goodSet = new Set(good), tagIn = new Map<string, TraitInput>();
  const listed = new Set(data.listed.map(r => r.id));
  for (const x of [...data.reviews.map(r => ({ id: r.racketId, v: ratingVerdict(r.rating), tags: r.tags })), ...data.external.map(e => ({ id: e.racketId, v: e.sentiment, tags: e.tags }))]) {
    if (!listed.has(x.id)) continue;
    const counted = x.tags.filter(t => !(goodSet.has(t) && x.v === "negative"));
    const t = tagIn.get(x.id) ?? { id: x.id, tagged: 0, tags: {}, override: overrides.get(x.id) }; tagIn.set(x.id, t);
    if (counted.length) t.tagged++;
    for (const tag of counted) t.tags[tag] = (t.tags[tag] ?? 0) + 1;
  }
  for (const [id, o] of overrides) if (!tagIn.has(id) && listed.has(id)) tagIn.set(id, { id, tagged: 0, tags: {}, override: o });
  const traitMap = traitScores([...tagIn.values()]);
  const traits = (id: string) => ({ scores: traitMap.get(id) ?? null, tagged: tagIn.get(id)?.tagged ?? 0, tags: tagIn.get(id)?.tags ?? {} });
  return { data, sigs, takes, finder, bad, pool: pool as FinderProduct[], level, signal, facts, traits };
});
