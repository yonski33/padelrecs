// The data the PadelRecs home and catalogue lists share (v3 handoff): listed rows, brands by count, one vote pill per row
// (lib/thread/vote-pill.ts), when each racket joined, and the "PadelRecs picks" order (db/curated/padel.json interleaved).
import { cache } from "react";
import { threadRows, traitCounts, traitGroup, audioOf, skinOf } from "./data";
import { votePill, AUDIO_PILL_LABELS, PILL_WORDS, PILL_LABELS, SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS, TENNIS_PILL_WORDS, TENNIS_PILL_LABELS, PICKLEBALL_PILL_WORDS, PICKLEBALL_PILL_LABELS, DISCGOLF_PILL_LABELS, SKIN_PILL_WORDS, SKIN_PILL_LABELS } from "../../lib/thread/vote-pill";
import { niche } from "../../lib/niche";
import { W } from "../../lib/thread/words";
import type { ThreadRow } from "./ui";
import { TRAIT_GROUPS } from "../../lib/thread/traits";
import padelCurated from "../../db/curated/padel.json";
import pickleballCurated from "../../db/curated/pickleball.json";
import { seasonIds } from "../../lib/thread/home-order";
import { modelFamily } from "../../lib/compare-pairs";

/** "PadelRecs picks": the owner's curated lists interleaved by place (#1 of each, then #2 …). */
/** PickleballRecs uses its own curated file (db/curated/pickleball.json, the same shape). */
const PB = niche.id === "pickleball";
const curatedOrder = () => { const lists = Object.values(((PB ? pickleballCurated : padelCurated) as { lists: Record<string, { slug: string }[]> }).lists), out: string[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map(l => l.length)); i++) for (const l of lists) { const s = l[i]?.slug; if (s && !out.includes(s)) out.push(s); }
  return out; };

/** AudioRecs (V3-ROLLOUT-BRIEF): the same list with its kind as the row's tag and Type filter (`shape`), the tuning as the Sound
 *  filter (`feel`), its quality-first pills, no curated order, and the match inputs (app/audio/context.ts) for its quick match. */
const AUDIO = niche.id === "audio";
/** SimRacingRecs (v3 rollout 2026-11-21): the same list with its drive kind as the Drive filter (`feel`), its pills, no curated
 *  order (Most loved leads). */
const SR = niche.id === "simracing", TN = niche.id === "tennis";
const DRIVE = (d: string | null | undefined) => !d ? null : /direct/i.test(d) ? "Direct drive" : /belt/i.test(d) ? "Belt" : /gear/i.test(d) ? "Gear" : null;
/** DiscGolfRecs: its stability (from the flight numbers, as its catalogue filter) as the Stability fine-tune (`feel`). */
const DG = niche.id === "discgolf";
const stabOf = (r: ThreadRow) => { if (!r.flight) return null; const [, , turn, fade] = r.flight;
  return turn + fade >= 3 ? "Overstable" : turn <= -2 || turn + fade <= -1 ? "Understable" : "Stable"; };
const asDisc = (r: ThreadRow): ThreadRow => ({ ...r, feel: stabOf(r) as ThreadRow["feel"] });
const asSim = (r: ThreadRow): ThreadRow => ({ ...r, feel: DRIVE(r.drive) as ThreadRow["feel"] });
/** TennisRecs (v3 wave 2): head size bands as the Shape filter (its shape column is the head size) and the stiffness as Feel
 *  (62 RA or less soft, 68 or more crisp), no curated order. */
const HEAD = (s: string | null) => { const n = Number(s?.match(/(\d{2,3})\s*sq/)?.[1] ?? NaN); return !Number.isFinite(n) ? null : n >= 104 ? "104 sq in +" : n >= 100 ? "100-103 sq in" : "Under 100 sq in"; };
const STIFF = (s: string | null | undefined) => { const ra = Number(s?.match(/(\d{2})\s*RA/i)?.[1] ?? NaN); return !Number.isFinite(ra) ? null : ra <= 62 ? "Soft" : ra >= 68 ? "Crisp" : "Medium"; };
// Feel is already the tennis rule (app/thread/data.ts threadRows: stiffness unless the votes clearly disagree).
const asTennis = (r: ThreadRow, ra: string | null | undefined): ThreadRow => ({ ...r, shape: HEAD(r.shape), feel: (r.feel ?? STIFF(ra)) as ThreadRow["feel"] });
/** SkinRecs (v3 rollout): the product type as the row's tag and Type filter (`shape`), the texture people report as the
 *  Texture filter (`feel`), its pills, no curated order, no model years (every product with reviews, like AudioRecs), and the
 *  skin engine's ranking inputs (app/skin/payload.ts wireOf) for its quick match. */
const SKIN = niche.id === "skin";
const asSkin = (r: ThreadRow): ThreadRow => ({ ...r, feel: (r.facets?.texture ?? null) as ThreadRow["feel"] });
/** LaptopRecs (owner 2026-11-24): its category as the row's tag and Category filter (`shape`, already so), no Feel, no curated
 *  order, no model years, and its quick match inputs (lib/laptop-wire.ts) from tags, creator words and spec weights. */
const LT = niche.id === "laptop";
async function laptopWires(ctx: NonNullable<Awaited<ReturnType<typeof threadRows>>["ctx"]>, ids: Set<string>) {
  const [{ laptopWire }, { creatorPagesAll }] = await Promise.all([import("../../lib/laptop-wire"), import("../../lib/thread/creator-data")]);
  const pages = await creatorPagesAll(niche.id), ops = new Map<string, { tags: string[]; sentiment: "positive" | "mixed" | "negative" | null }[]>();
  for (const x of [...ctx.data.reviews, ...ctx.data.external] as { racketId: string; tags?: string[] | null; sentiment?: string | null; rating?: number }[]) {
    const sentiment = x.sentiment === "positive" || x.sentiment === "mixed" || x.sentiment === "negative" ? x.sentiment
      : x.rating != null ? (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") : null;
    const list = ops.get(x.racketId) ?? []; list.push({ tags: x.tags ?? [], sentiment }); ops.set(x.racketId, list);
  }
  return ctx.data.listed.filter(r => ids.has(r.id)).map(r => laptopWire({ id: r.id, category: r.shape, weight: r.weight, opinions: ops.get(r.id) ?? [],
    creators: (pages?.get(r.slug)?.reviews ?? []).map(c => ({ attrs: c.attrs as Record<string, string>, stance: c.stance })) }));
}
/** CoffeeRecs (2026-11-28, the v3 port): its category as the row's tag and Category filter (`shape`), no Feel, no curated order,
 *  no model years, and its quick match inputs (lib/coffee-wire.ts) from tags, creator words and the maker specs. */
const CF = niche.id === "coffee";
async function coffeeWires(ctx: NonNullable<Awaited<ReturnType<typeof threadRows>>["ctx"]>, ids: Set<string>) {
  const [{ coffeeWire }, { coffeeSpec }, { creatorPagesAll }] = await Promise.all([import("../../lib/coffee-wire"), import("../../lib/coffee-specs"), import("../../lib/thread/creator-data")]);
  const pages = await creatorPagesAll(niche.id), ops = new Map<string, { tags: string[]; sentiment: "positive" | "mixed" | "negative" | null }[]>();
  for (const x of [...ctx.data.reviews, ...ctx.data.external] as { racketId: string; tags?: string[] | null; sentiment?: string | null; rating?: number }[]) {
    const sentiment = x.sentiment === "positive" || x.sentiment === "mixed" || x.sentiment === "negative" ? x.sentiment
      : x.rating != null ? (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") : null;
    const list = ops.get(x.racketId) ?? []; list.push({ tags: x.tags ?? [], sentiment }); ops.set(x.racketId, list);
  }
  return ctx.data.listed.filter(r => ids.has(r.id)).map(r => coffeeWire({ id: r.id, category: r.shape, spec: coffeeSpec(r), opinions: ops.get(r.id) ?? [],
    creators: (pages?.get(r.slug)?.reviews ?? []).map(c => ({ attrs: c.attrs as Record<string, string>, stance: c.stance })) }));
}
const asAudio = (r: ThreadRow): ThreadRow => ({ ...r, shape: r.audio?.kind ?? r.shape, feel: (r.audio?.sound[0] ?? null) as ThreadRow["feel"] });
export const padelListData = cache(async () => {
  const { all: rowsAll, ctx } = await threadRows();
  const surface = TN ? new Map((ctx?.data.rackets ?? []).map(x => [x.id, x.surface])) : null;
  const all = AUDIO ? rowsAll.map(asAudio) : SR ? rowsAll.map(asSim) : TN ? rowsAll.map(r => asTennis(r, surface?.get(r.id))) : DG ? rowsAll.map(asDisc) : SKIN ? rowsAll.map(asSkin) : rowsAll;
  // LaptopRecs (owner 2026-11-24): current models only, reviews or not (a new one shows "New, reviews coming"); older
  // generations are reference pages and never list (lib/thread/laptop-lines.ts).
  const rows = LT ? all.filter(r => r.current) : all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b]) => b).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  const tc = ctx ? await traitCounts() : null;
  const pills = Object.fromEntries(rows.flatMap(r => { const p = tc ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(tc, r.id, g.key)])), W.people, AUDIO ? AUDIO_PILL_LABELS : SR ? SIMRACING_PILL_WORDS : TN ? TENNIS_PILL_WORDS : PB ? PICKLEBALL_PILL_WORDS : DG ? DISCGOLF_PILL_LABELS : SKIN ? SKIN_PILL_WORDS : PILL_WORDS, AUDIO ? AUDIO_PILL_LABELS : SR ? SIMRACING_PILL_LABELS : TN ? TENNIS_PILL_LABELS : PB ? PICKLEBALL_PILL_LABELS : DG ? DISCGOLF_PILL_LABELS : SKIN ? SKIN_PILL_LABELS : PILL_LABELS) : null; return p ? [[r.id, p]] : []; }));
  // LaptopRecs lists unreviewed current models too, so its join dates come from every visible laptop.
  const listed = new Map(((LT ? ctx?.data.rackets : ctx?.data.listed) ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(rows.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const bySlug = new Map(rows.map(r => [r.slug, r.id])), curated = AUDIO || SR || TN || DG || SKIN || LT || CF ? [] : curatedOrder().flatMap(s => bySlug.get(s) ?? []);
  // The home's pool (lib/thread/home-order.ts): this season's models with 10+ opinions, one per model.
  // AudioRecs has no model years (niche.productYears false), so its home lists every pair with reviews.
  const season = AUDIO || DG || SKIN || LT || CF ? undefined : seasonIds(rows.flatMap(r => { const p = listed.get(r.id); return p ? [{ id: r.id, family: modelFamily(p), year: r.year, opinions: r.pos + r.mix + r.neg }] : []; }),
    new Date().getUTCFullYear());
  const au = AUDIO && ctx ? audioOf(ctx) : null;
  const wire = au ? rows.flatMap(r => au.wire.get(r.id) ?? []) : undefined;
  const sk = SKIN && ctx ? skinOf(ctx) : null, ids = new Set(rows.map(r => r.id));
  const skin = sk ? (await import("../skin/payload")).wireOf(sk, sk.data.listed.filter(r => ids.has(r.id))) : undefined;
  const laptop = LT ? ctx ? await laptopWires(ctx, ids) : [] : undefined;
  const coffee = CF ? ctx ? await coffeeWires(ctx, ids) : [] : undefined;
  return { rows, brands, pills, added, curated, season, ...(wire ? { wire } : {}), ...(skin ? { skin } : {}), ...(laptop ? { laptop } : {}), ...(coffee ? { coffee } : {}) };
});
