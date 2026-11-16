// The racket page's fit check for the picks in its address, worked out on the server (owner 2026-11-16: racket pages were
// ~380 KB, 270 KB of it the engine's items for the browser). The page sends this small answer instead; the browser loads the
// items (/api/rank-items) for any other picks. Same setup and functions as the browser (app/rackets/[slug]/fit-live.tsx).
import { matchPcts, alternatives, verdictFor, type RankItem, type RankedRow } from "./home-rank";
import type { FitFacts, FitVerdict } from "./fit-verdict";
import type { QuickChoice } from "./quick-match";
import { niche } from "./niche";

export const RANK_SETUP = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
export const NEGATIVE_TAGS = niche.tags.filter(t => t.tone === "neg").map(t => t.label);

/** The answers for one set of picks: the verdict, the match %, and the better matches (4 for the list, 6 for compare). */
export type RankSeed = { choice: QuickChoice; verdict: FitVerdict; pct: number | null; alts4: RankedRow[]; alts6: RankedRow[] };

export function rankSeed(items: RankItem[], choice: QuickChoice, facts: FitFacts, id: string): RankSeed {
  const { levelGate, engine } = RANK_SETUP;
  return { choice, verdict: verdictFor(items, choice, facts, id, levelGate, engine), pct: matchPcts(items, choice, levelGate, engine).get(id) ?? null,
    alts4: alternatives(items, RANK_SETUP, NEGATIVE_TAGS, choice, id), alts6: alternatives(items, RANK_SETUP, NEGATIVE_TAGS, choice, id, 6) };
}

/** Same picks: the key a QuickChoice reads back as (field order and unset fields don't matter). */
export const sameChoice = (a: QuickChoice, b: QuickChoice) => {
  const k = (c: QuickChoice) => JSON.stringify([c.style, c.level ?? null, !!c.arm, c.kind ?? null, c.fine ? [c.fine.shape ?? null, c.fine.weight ?? null, c.fine.feel ?? null, !!c.fine.sweet, c.fine.core ?? null] : null]);
  return k(a) === k(b);
};
