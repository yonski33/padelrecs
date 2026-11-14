import { cache } from "react";
import { catalog } from "../db/data";
import { productSignals } from "./signals";
import { topLists } from "./rankings/lists";
import { finderPool, withRankings, type FinderProduct } from "../lib/finder";
import { LEVELS, type Level, type LevelEvidence } from "../lib/quick-match";
import type { FitFacts } from "../lib/fit-verdict";
import { ratingVerdict } from "../lib/top-lists";
import { niche } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";

/** What quick match (home) and the fit check (racket pages) read, built once per request: the finder's pool and tag counts
 *  over the models the home page shows, the Player scores, the quick-take hooks and level bands, and players' stated levels. */
const LEVEL_VALUE: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const matchContext = cache(async () => {
  const [data, sigs, takes] = await Promise.all([catalog(), productSignals(), quickTakeHooks()]);
  const finder = niche.finder!;
  const good = niche.tags.filter(t => t.tone === "pos").map(t => t.label), bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const pool = withRankings(finderPool({ ...finder, maxAgeYears: niche.feedMaxAgeYears }, data, good), finder, topLists, data, niche.tags);
  const byId = new Map(pool.map(p => [p.id, p]));
  const likedBy = new Map<string, Partial<Record<Level, number>>>();
  for (const r of data.reviews) {
    const lv = LEVELS.find(l => LEVEL_VALUE[l] === r.playerLevel) ?? (r.playerLevel === "Competitive" ? "advanced" : undefined);
    if (!lv || r.rating < 4) continue;
    const m = likedBy.get(r.racketId) ?? {}; m[lv] = (m[lv] ?? 0) + 1; likedBy.set(r.racketId, m);
  }
  const level = (id: string): LevelEvidence | undefined => { const liked = likedBy.get(id), band = takes.get(id)?.band; return liked || band ? { liked: liked ?? {}, band } : undefined; };
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
    return { reports, tags, band: takes.get(id)?.band, places: { control: controlList ? inPool?.lists?.[controlList] : undefined, power: powerList ? inPool?.lists?.[powerList] : undefined } };
  };
  return { data, sigs, takes, finder, bad, pool: pool as FinderProduct[], level, signal, facts };
});
