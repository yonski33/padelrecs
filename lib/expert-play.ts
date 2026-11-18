// Expert "How it plays" (owner decision 2026-11-18): an expert's blind 1–5 per trait become the bars a product page shows,
// with the expert's reason, reworded in the site voice, as the bar's line (db/expert-play/<niche>.json, made by
// scripts/import-expert-play.mts). The engine keeps its own evidence for the match %; only what a page shows about the
// product (bars, lines, the style it is filed under, "more X than" lines) reads these. An admin hand-set dot or line still wins.
// Pure, so tests can feed plain objects.

export const MAX_EXPERT_LINE = 105;
export type ExpertPlayTrait = { dots: number; note: string; line?: string };
export type ExpertPlayEntry = { confidence?: string; traits: Partial<Record<string, ExpertPlayTrait>> };
export type ExpertPlayFile = { _about: string; products: Record<string, ExpertPlayEntry> };

/** Only whole dots 1–5 survive; a line over the limit is dropped (the page then says the dots in its own words). */
export function readExpertPlay(v: unknown): ExpertPlayFile {
  const o = (v && typeof v === "object" ? v : {}) as { _about?: unknown; products?: Record<string, { confidence?: unknown; traits?: Record<string, unknown> }> };
  const products: Record<string, ExpertPlayEntry> = {};
  for (const [slug, e] of Object.entries(o.products ?? {})) {
    const traits: Partial<Record<string, ExpertPlayTrait>> = {};
    for (const [k, t] of Object.entries(e?.traits ?? {})) {
      const x = t as { dots?: unknown; note?: unknown; line?: unknown };
      if (!Number.isInteger(x?.dots) || (x.dots as number) < 1 || (x.dots as number) > 5) continue;
      const line = typeof x.line === "string" && x.line.trim() && x.line.trim().length <= MAX_EXPERT_LINE ? x.line.trim() : undefined;
      traits[k] = { dots: x.dots as number, note: typeof x.note === "string" ? x.note : "", ...(line ? { line } : {}) };
    }
    if (Object.keys(traits).length) products[slug] = { ...(typeof e?.confidence === "string" ? { confidence: e.confidence } : {}), traits };
  }
  return { _about: typeof o._about === "string" ? o._about : "", products };
}

/** Bar lines must read as plain expert advice (fit-expert-positioning): no head counts, no testing claims, no lab numbers. */
const BAD_LINE = [
  /\b\d+\s*(players?|reviewers?|people|testers?|users?|reviews?)\b/i,
  /\b(we|us|our)\b/i,
  /\b(tested|testing|our test|lab test|in the lab)\b/i,
  /\b(rpm|mph|pct|percentile|swing ?weight|twist ?weight|firepower|\/100)\b/i,
  /\d+(st|nd|rd|th)\b/i,
];
export const lineProblem = (line: string): string | null =>
  line.length > MAX_EXPERT_LINE ? `over ${MAX_EXPERT_LINE} characters` : BAD_LINE.find(re => re.test(line)) ? `reads as a count, test or lab number (${BAD_LINE.find(re => re.test(line))})` : null;

/** The shown dots per trait for one product: the expert's, except where an admin hand-set dot exists (`hand`). */
export function shownDots(entry: ExpertPlayEntry | undefined, hand: Partial<Record<string, number>> = {}): Partial<Record<string, number>> {
  const out: Partial<Record<string, number>> = {};
  for (const [k, t] of Object.entries(entry?.traits ?? {})) if (t && hand[k] === undefined) out[k] = t.dots;
  return out;
}
