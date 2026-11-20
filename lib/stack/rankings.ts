// StackRecs rankings (plan PR #517): one per category, ordered by score, and one per vote board, ordered by votes. Scores
// and votes only: no hand-picked lists on this site (bias rule, lib/stack/score.ts).
import { CATEGORIES, type Side } from "./catalog";
import { STACK_BOARDS } from "./traits";

export type StackRanking = { slug: string; label: string; blurb: string; side: Side } &
  ({ kind: "category"; category: string } | { kind: "board"; trait: string; choice: string });

const PLURAL: Record<string, [string, string]> = {
  "Coding agent": ["best-coding-agents", "Best AI coding agents"],
  "App builder": ["best-app-builders", "Best AI app and site builders"],
  "SEO suite": ["best-seo-suites", "Best SEO suites"],
  "Content tool": ["best-content-tools", "Best SEO content tools"],
  "AI writer": ["best-ai-writers", "Best AI writing tools"],
  "Technical SEO": ["best-technical-seo-tools", "Best technical SEO crawlers"],
  "AI visibility": ["best-ai-visibility-tools", "Best AI visibility trackers"],
};

export const STACK_RANKINGS: StackRanking[] = [
  ...(["build", "grow"] as const).flatMap(side => CATEGORIES[side].map(c => ({ slug: PLURAL[c][0], label: PLURAL[c][1], side, kind: "category" as const,
    category: c, blurb: "By score, from votes and reviews. Newer opinions weigh more." }))),
  ...STACK_BOARDS.map(b => ({ slug: b.slug, label: b.title, side: b.side, kind: "board" as const, trait: b.trait, choice: b.choice,
    blurb: "By how many people voted it." })),
];
export const rankingBySlug = new Map(STACK_RANKINGS.map(r => [r.slug, r]));
