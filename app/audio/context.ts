// AudioRecs' Thread data (owner design handoff 2026-11-21): the catalogue, the listener scores (lib/signal.ts) and the
// attribute scores (lib/audio-profile.ts AUDIO, from the reviews' quick tags), worked out once and kept a few minutes, as
// app/skin/context.ts does for SkinRecs. The match itself runs in the browser (lib/audio-match.ts) on wireOf's inputs.
import { catalog, type Catalog } from "../../db/data";
import { scoreAll, type ProductAttrs } from "../../lib/attr-score";
import { AUDIO, tagEvidence, audioKind, hasAnc } from "../../lib/audio-profile";
import type { AudioWire } from "../../lib/audio-match";
import { productSignals } from "../signals";

export type AudioContext = {
  data: Catalog; attrs: Map<string, ProductAttrs>; wire: Map<string, AudioWire>;
  counts: Map<string, { n: number; positive: number; mixed: number; negative: number }>; signal: (id: string) => number | null;
};
const TTL = 5 * 60_000;
let memo: { at: number; value: Promise<AudioContext> } | null = null;

export function audioContext(): Promise<AudioContext> {
  if (memo && Date.now() - memo.at < TTL) return memo.value;
  const value = load();
  memo = { at: Date.now(), value };
  value.catch(() => { if (memo?.value === value) memo = null; });
  return value;
}

async function load(): Promise<AudioContext> {
  const [data, sigs] = await Promise.all([catalog(), productSignals()]);
  const counts = new Map(data.listed.map(r => [r.id, { n: 0, positive: 0, mixed: 0, negative: 0 }]));
  for (const r of data.reviews) { const c = counts.get(r.racketId); if (!c) continue; c.n++; if (r.rating >= 4) c.positive++; else if (r.rating === 3) c.mixed++; else c.negative++; }
  for (const e of data.external) { const c = counts.get(e.racketId); if (!c) continue; c.n++; if (e.sentiment) c[e.sentiment]++; }
  const rows = [
    ...data.reviews.flatMap(r => tagEvidence({ productId: r.racketId, ref: `p:${r.id}`, kind: "own_review", at: r.createdAt, tags: r.tags })),
    ...data.external.flatMap(e => tagEvidence({ productId: e.racketId, ref: `w:${e.id}`, kind: e.sourcePlatform === "YouTube" ? "youtube" : e.sourcePlatform === "Blog" ? "blog" : "player_report",
      at: e.sourceDate ?? e.createdAt, tags: e.tags })),
  ];
  const attrs = scoreAll(AUDIO, data.listed.map(r => {
    const c = counts.get(r.id)!, judged = c.positive + c.mixed + c.negative;
    return { id: r.id, shape: r.shape, reports: c.n, verdict: judged ? (c.positive - c.negative) / judged : null };
  }), rows);
  const signal = (id: string) => sigs.get(id)?.signal ?? null;
  const wire = new Map(data.listed.map(r => {
    const a = attrs.get(r.id), s: AudioWire["s"] = {};
    for (const [k, v] of Object.entries(a?.scores ?? {})) if (v) s[k] = [v.score, v.n];
    return [r.id, { id: r.id, kind: audioKind(r), wireless: r.weight === "Wireless" || r.shape === "Earbuds", anc: hasAnc(r, a?.scores.anc?.plus ?? 0),
      signal: signal(r.id), n: counts.get(r.id)!.n, s } satisfies AudioWire];
  }));
  return { data, attrs, wire, counts, signal };
}
