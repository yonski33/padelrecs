// The data the PadelRecs home and catalogue lists share (v3 handoff): listed rows, brands by count, one vote pill per row
// (lib/thread/vote-pill.ts), when each racket joined, and the "PadelRecs picks" order (db/curated/padel.json interleaved).
import { cache } from "react";
import { threadRows, traitCounts, traitGroup, audioOf, skinOf } from "./data";
import { votePill, AUDIO_PILL_LABELS, PILL_WORDS, PILL_LABELS, SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS, SKIN_PILL_WORDS, SKIN_PILL_LABELS } from "../../lib/thread/vote-pill";
import { niche } from "../../lib/niche";
import { W } from "../../lib/thread/words";
import type { ThreadRow } from "./ui";
import { TRAIT_GROUPS } from "../../lib/thread/traits";
import padelCurated from "../../db/curated/padel.json";
import { seasonIds } from "../../lib/thread/home-order";
import { modelFamily } from "../../lib/compare-pairs";

/** "PadelRecs picks": the owner's curated lists interleaved by place (#1 of each, then #2 …). */
const curatedOrder = () => { const lists = Object.values((padelCurated as { lists: Record<string, { slug: string }[]> }).lists), out: string[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map(l => l.length)); i++) for (const l of lists) { const s = l[i]?.slug; if (s && !out.includes(s)) out.push(s); }
  return out; };

/** AudioRecs (V3-ROLLOUT-BRIEF): the same list with its kind as the row's tag and Type filter (`shape`), the tuning as the Sound
 *  filter (`feel`), its quality-first pills, no curated order, and the match inputs (app/audio/context.ts) for its quick match. */
const AUDIO = niche.id === "audio";
/** SimRacingRecs (v3 rollout 2026-11-21): the same list with its drive kind as the Drive filter (`feel`), its pills, no curated
 *  order (Most loved leads). */
const SR = niche.id === "simracing";
const DRIVE = (d: string | null | undefined) => !d ? null : /direct/i.test(d) ? "Direct drive" : /belt/i.test(d) ? "Belt" : /gear/i.test(d) ? "Gear" : null;
const asSim = (r: ThreadRow): ThreadRow => ({ ...r, feel: DRIVE(r.drive) as ThreadRow["feel"] });
/** SkinRecs (v3 rollout 2026-11-21): the product type as the row's tag and Type filter (`shape`), the texture people report as
 *  the Texture filter (`feel`), its pills, no curated order, no model years (every product with reviews, like AudioRecs), and
 *  the skin engine's ranking inputs (app/skin/payload.ts wireOf) for its quick match. */
const SKIN = niche.id === "skin";
const asSkin = (r: ThreadRow): ThreadRow => ({ ...r, feel: (r.facets?.texture ?? null) as ThreadRow["feel"] });
const asAudio = (r: ThreadRow): ThreadRow => ({ ...r, shape: r.audio?.kind ?? r.shape, feel: (r.audio?.sound[0] ?? null) as ThreadRow["feel"] });
export const padelListData = cache(async () => {
  const { all: rowsAll, ctx } = await threadRows();
  const all = AUDIO ? rowsAll.map(asAudio) : SR ? rowsAll.map(asSim) : SKIN ? rowsAll.map(asSkin) : rowsAll;
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b]) => b).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  const tc = ctx ? await traitCounts() : null;
  const pills = Object.fromEntries(rows.flatMap(r => { const p = tc ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(tc, r.id, g.key)])), W.people, AUDIO ? AUDIO_PILL_LABELS : SR ? SIMRACING_PILL_WORDS : SKIN ? SKIN_PILL_WORDS : PILL_WORDS, AUDIO ? AUDIO_PILL_LABELS : SR ? SIMRACING_PILL_LABELS : SKIN ? SKIN_PILL_LABELS : PILL_LABELS) : null; return p ? [[r.id, p]] : []; }));
  const listed = new Map((ctx?.data.listed ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(rows.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const bySlug = new Map(rows.map(r => [r.slug, r.id])), curated = AUDIO || SR || SKIN ? [] : curatedOrder().flatMap(s => bySlug.get(s) ?? []);
  // The home's pool (lib/thread/home-order.ts): this season's models with 10+ opinions, one per model.
  // AudioRecs has no model years (niche.productYears false), so its home lists every pair with reviews.
  const season = AUDIO || SKIN ? undefined : seasonIds(rows.flatMap(r => { const p = listed.get(r.id); return p ? [{ id: r.id, family: modelFamily(p), year: r.year, opinions: r.pos + r.mix + r.neg }] : []; }),
    new Date().getUTCFullYear());
  const au = AUDIO && ctx ? audioOf(ctx) : null;
  const wire = au ? rows.flatMap(r => au.wire.get(r.id) ?? []) : undefined;
  const sk = SKIN && ctx ? skinOf(ctx) : null, ids = new Set(rows.map(r => r.id));
  const skin = sk ? (await import("../skin/payload")).wireOf(sk, sk.data.listed.filter(r => ids.has(r.id))) : undefined;
  return { rows, brands, pills, added, curated, season, ...(wire ? { wire } : {}), ...(skin ? { skin } : {}) };
});
