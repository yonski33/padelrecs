// The data the PadelRecs home and catalogue lists share (v3 handoff): listed rows, brands by count, one vote pill per row
// (lib/thread/vote-pill.ts), when each racket joined, and the "PadelRecs picks" order (db/curated/padel.json interleaved).
import { cache } from "react";
import { threadRows, traitCounts, traitGroup } from "./data";
import { votePill } from "../../lib/thread/vote-pill";
import { TRAIT_GROUPS } from "../../lib/thread/traits";
import padelCurated from "../../db/curated/padel.json";
import { seasonIds } from "../../lib/thread/home-order";
import { modelFamily } from "../../lib/compare-pairs";

/** "PadelRecs picks": the owner's curated lists interleaved by place (#1 of each, then #2 …). */
const curatedOrder = () => { const lists = Object.values((padelCurated as { lists: Record<string, { slug: string }[]> }).lists), out: string[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map(l => l.length)); i++) for (const l of lists) { const s = l[i]?.slug; if (s && !out.includes(s)) out.push(s); }
  return out; };

export const padelListData = cache(async () => {
  const { all, ctx } = await threadRows();
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b]) => b).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  const tc = ctx ? await traitCounts() : null;
  const pills = Object.fromEntries(rows.flatMap(r => { const p = tc ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(tc, r.id, g.key)]))) : null; return p ? [[r.id, p]] : []; }));
  const listed = new Map((ctx?.data.listed ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(rows.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const bySlug = new Map(rows.map(r => [r.slug, r.id])), curated = curatedOrder().flatMap(s => bySlug.get(s) ?? []);
  // The home's pool (lib/thread/home-order.ts): this season's models with 10+ opinions, one per model.
  const season = seasonIds(rows.flatMap(r => { const p = listed.get(r.id); return p ? [{ id: r.id, family: modelFamily(p), year: r.year, opinions: r.pos + r.mix + r.neg }] : []; }),
    new Date().getUTCFullYear());
  // The "I want" order and pills (lib/thread/home-order.ts): each row's "How does it play?" counts and its Arm comfort votes.
  const plays = Object.fromEntries(rows.map(r => [r.id, tc ? traitGroup(tc, r.id, "plays_like") : {}]));
  const armVotes = Object.fromEntries(rows.flatMap(r => { const n = tc ? traitGroup(tc, r.id, "arm").very ?? 0 : 0; return n ? [[r.id, n]] : []; }));
  return { rows, brands, pills, added, curated, season, plays, armVotes };
});
