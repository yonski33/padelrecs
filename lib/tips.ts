/** Player tips (owner 2026-11-15, TIPS-PLAN.md): the small practical pointers a report gives ("ask the shop to weigh a few,
 *  pick one under 370 g"). Phase 1 stores them per review in `reviews.tips` / `external_reviews.tips` (jsonb, migration 0019):
 *  null until a reader has looked, [] when the report gives none (the normal case). Every tip rests on a `quote` that must be
 *  an exact substring of the review's stored text, so a tip can never be invented; scripts/save-tips.mts checks it with
 *  checkTips() below, and scripts/export-tip-input.mts re-exports any review whose saved quotes no longer match. */

import { plainSummary } from "./plain-summary";

/** buying: what to get or check before buying; setup: grips, protectors, strings, weight; conditions: when it plays
 *  differently (heat, cold, altitude, surface); adapting: how long or what it takes to get used to it; care: how to protect it. */
export const TIP_KINDS = ["buying", "setup", "conditions", "adapting", "care"] as const;
export type TipKind = (typeof TIP_KINDS)[number];
export type Tip = { kind: TipKind; text: string; quote: string };

/** At most this many tips per report; a report with more is summarising a guide, not giving tips. */
export const MAX_TIPS = 3;
/** `text` is one sentence of at most this many words. */
export const MAX_TIP_WORDS = 18;
/** A quote shorter than this proves nothing ("it", "grip"). */
export const MIN_QUOTE_CHARS = 12;

/** The stored texts a tip may quote. A player review: its text. A web review: the summary (as stored and as the card shows
 *  it), the excerpt and its English translation. */
export function tipSources(row: { reviewText?: string | null; summary?: string | null; excerpt?: string | null; excerptTranslation?: string | null }): string[] {
  const all = [row.reviewText, row.summary, row.summary ? plainSummary(row.summary) : null, row.excerpt, row.excerptTranslation];
  return [...new Set(all.filter((t): t is string => typeof t === "string" && t.trim().length > 0))];
}

export const quoteFound = (quote: string, sources: readonly string[]) => quote.length > 0 && sources.some(s => s.includes(quote));

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export type DroppedTip = { tip: unknown; reason: string };

/** Keeps the tips that pass every rule and says why each other one was dropped. Order is kept; duplicates (same quote and
 *  kind) and anything past MAX_TIPS are dropped. `raw` is what a reader wrote: an array of {kind, text, quote}. */
export function checkTips(raw: unknown, sources: readonly string[]): { kept: Tip[]; dropped: DroppedTip[] } {
  const kept: Tip[] = [], dropped: DroppedTip[] = [];
  if (!Array.isArray(raw)) return { kept, dropped: raw == null ? [] : [{ tip: raw, reason: "not a list" }] };
  for (const tip of raw) {
    const t = tip as Partial<Record<keyof Tip, unknown>> | null;
    const kind = t?.kind, text = typeof t?.text === "string" ? t.text.trim() : "", quote = typeof t?.quote === "string" ? t.quote.trim() : "";
    const reason =
      !TIP_KINDS.includes(kind as TipKind) ? `unknown kind "${String(kind)}"`
      : !text ? "no text"
      : words(text) > MAX_TIP_WORDS ? `text over ${MAX_TIP_WORDS} words`
      : /[.!?]\s+\S/.test(text) ? "text is more than one sentence"
      : quote.length < MIN_QUOTE_CHARS ? "quote too short"
      : !quoteFound(quote, sources) ? "quote not in the stored text"
      : kept.some(k => k.kind === kind && k.quote === quote) ? "duplicate"
      : kept.length >= MAX_TIPS ? `more than ${MAX_TIPS} tips`
      : null;
    if (reason) dropped.push({ tip, reason });
    else kept.push({ kind: kind as TipKind, text, quote });
  }
  return { kept, dropped };
}

/** Whether a review's saved tips still stand: it has been read (not null) and every quote is still in its stored text.
 *  An edited or re-imported review whose quote went missing is read again. */
export const tipsCurrent = (saved: readonly Tip[] | null | undefined, sources: readonly string[]) =>
  Array.isArray(saved) && saved.every(t => quoteFound(t?.quote ?? "", sources));
