/**
 * Checks for an "In short" review summary before it is written (scripts/set-review-summaries.ts). Summaries are drafted by
 * hand from scripts/export-summary-input.ts, one product at a time; this catches the drafting slips found on 2026-11-19
 * (grok/site-voices/results/DATA-CHECKS-FINDINGS.md): text carried over from the product drafted just before, and text
 * that may sit on the wrong product.
 *   - every name-like word (a capitalised word inside a sentence, or a word with a digit: Micra, Harp, E61, K1) must
 *     appear in the product's own name or reviews;
 *   - a run of SHARED_RUN or more words shared with another product's summary is flagged;
 *   - a summary that never names its product is flagged.
 * Flags are for a person to read, not errors: comparisons ("chose it over a Micra") pass when the reviews say so.
 */
export const SHARED_RUN = 8;

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s*\bplus\b/g, "+");
const tokens = (s: string): string[] => fold(s).match(/[\p{L}\p{N}][\p{L}\p{N}'+-]*/gu) ?? [];

/** Name-like words: capitalised words that don't start a sentence, and any word with a digit. */
export function nameWords(summary: string): string[] {
  const out = new Set<string>();
  for (const sentence of summary.split(/(?<=[.!?:;])\s+/)) {
    const words = sentence.match(/[\p{L}\p{N}][\p{L}\p{N}'+-]*/gu) ?? [];
    words.forEach((w, i) => {
      const bare = w.replace(/['’]s$/, "").replace(/-+$/, "");
      if (/\p{N}/u.test(bare) || (i > 0 && /^\p{Lu}/u.test(bare))) out.add(bare);
    });
  }
  return [...out];
}

/** Runs of `n` words this summary shares with another one. */
export function sharedRuns(a: string, b: string, n = SHARED_RUN): string[] {
  const ta = tokens(a), tb = tokens(b), seen = new Set<string>();
  for (let i = 0; i + n <= tb.length; i++) seen.add(tb.slice(i, i + n).join(" "));
  const runs: string[] = [];
  for (let i = 0; i + n <= ta.length; i++) {
    const run = ta.slice(i, i + n).join(" ");
    if (seen.has(run)) {
      // Grow the last run instead of listing every overlapping window.
      const last = runs.at(-1), prev = ta.slice(i - 1, i - 1 + n).join(" ");
      if (last && i > 0 && seen.has(prev)) runs[runs.length - 1] = `${last} ${ta[i + n - 1]}`;
      else runs.push(run);
    }
  }
  return runs;
}

export type SummaryInput = { slug: string; name: string; brand?: string | null; summary: string; reviews: string[] };

export function checkSummary(p: SummaryInput, others: { slug: string; summary: string }[]): string[] {
  const flags: string[] = [];
  const own = ` ${tokens([p.brand ?? "", p.name, ...p.reviews].join(" ")).join(" ")} `;
  const missing = nameWords(p.summary).filter(w => !own.includes(` ${tokens(w).join(" ")} `) && !own.includes(` ${tokens(w).join(" ")}`));
  if (missing.length) flags.push(`names not found in its own name or reviews: ${missing.join(", ")}`);
  for (const o of others) {
    if (o.slug === p.slug) continue;
    for (const run of sharedRuns(p.summary, o.summary)) flags.push(`shares "${run}" with ${o.slug}`);
  }
  const summaryWords = ` ${tokens(p.summary).join(" ")} `;
  const modelWords = tokens(p.name).filter(w => !tokens(p.brand ?? "").includes(w));
  if (modelWords.length && !modelWords.some(w => summaryWords.includes(` ${w}`)))
    flags.push(`does not name the product (${p.name})`);
  return flags;
}
