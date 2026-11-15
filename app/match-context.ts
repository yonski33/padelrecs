import { cache } from "react";
import { catalog } from "../db/data";
import { productSignals } from "./signals";
import { rankedLists } from "./rankings/lists";
import { finderPool, type FinderProduct } from "../lib/finder";
import { LEVELS, type Level, type LevelEvidence } from "../lib/quick-match";
import { combinedBand, type FitFacts, type LevelSources } from "../lib/fit-verdict";
import padelLevels from "../db/level-sources/padel.json";
import padelYoutubeTraits from "../db/youtube-traits/padel.json";
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
import padelKnownDots from "../db/known-dots/padel.json";
import { levelSuits, levelDisagreement, type Suits, type SuitsInput } from "../lib/level-suits";
import { EXTRACTORS } from "../lib/evidence";

/** The owner's hand-set calls per site (db/known-dots), applied like admin overrides (an admin override wins). */
const KNOWN_DOTS: Record<string, Record<string, Record<string, { dots?: number }>>> = { padel: padelKnownDots as unknown as Record<string, Record<string, { dots?: number }>> };

/** What quick match (home) and the fit check (racket pages) read, built once per request: the finder's pool and tag counts
 *  over the models the home page shows, the Player scores, the quick-take hooks and level bands, and players' stated levels. */
/** Maker and YouTube levels by product slug (db/level-sources/<niche>.json), beside the players' band. */
const LEVEL_SOURCES: Record<string, Record<string, LevelSources>> = { padel: padelLevels as unknown as Record<string, LevelSources> };
const YOUTUBE_TRAITS: Record<string, Record<string, Partial<Record<Trait, { plus: number; minus: number }>>>> = { padel: padelYoutubeTraits };
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
  const sourcesOf = (id: string): LevelSources | undefined => LEVEL_SOURCES[niche.id]?.[slugOf.get(id) ?? ""];
  // Level as a "suits" score per level (lib/level-suits.ts, filled below from the evidence store); without it, the band the
  // sources agree on (brand, reviewers, players), like the fit check.
  const suitsOf = new Map<string, { suits: Suits; disagree: string | null }>();
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
    const su = suitsOf.get(id);
    return { reports, tags, band: takes.get(id)?.band, levels: sourcesOf(id), ...(su ? { suits: su.suits, levelDisagree: su.disagree ?? undefined } : {}), places: { control: controlList ? inPool?.lists?.[controlList] : undefined, power: powerList ? inPool?.lists?.[powerList] : undefined } };
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
  const ytTraits = YOUTUBE_TRAITS[niche.id] ?? {};
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
    const known = KNOWN_DOTS[niche.id] ?? {};
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
      suitsOf.set(id, { suits: levelSuits(x), disagree: levelDisagreement(x) });
    }
    traitMap = balanceScores(inputs.map(p => ({ ...p, override: { ...knownSet(slugOf.get(p.id) ?? ""), ...dotsSet(p.id) } })));
  } else {
    traitAuto = traitScores([...tagIn.values()]);
    traitMap = traitScores([...tagIn.values()].map(p => ({ ...p, override: dotsSet(p.id) })));
  }
  const traits = (id: string) => ({ scores: traitMap.get(id) ?? null, auto: traitAuto.get(id) ?? null, tagged: tagIn.get(id)?.tagged ?? 0, tags: tagIn.get(id)?.tags ?? {}, edits: overrides.get(id) ?? null });
  return { data, sigs, takes, finder, bad, pool: pool as FinderProduct[], level, signal, facts, traits };
});
