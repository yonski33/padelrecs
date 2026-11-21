// PadelRecs info pages v3 (owner design 2026-11-21, design_handoff_padelrecs_v3): the same copy as today (owner: keep the
// page's content where the mock has less), with the lines about the 0-100 player score reworded for the v3 rule "no
// 0-100 score anywhere; sentiment as counts". Padel only: the other sites keep lib/thread/copy.ts as it is.
import type { InfoCopy } from "./copy";

/** Exact sentence swaps (each must match, tests/info-v3.test.ts), and sections dropped, by page. */
export const V3_SWAPS: Record<"about" | "affiliate", [string, string][]> = {
  about: [
    ["Every racket gets one player score, so you can see at a glance what people actually think.", "Sentiment is shown as plain counts: loved it, mixed, not for me."],
    ["Scores come only from players,", "Rankings come only from players,"],
    ["If a racket is bad, the score says so.", "If a racket is bad, the counts say so."],
    ["It never changes a score or a ranking.", "It never changes a ranking or a review."],
  ],
  affiliate: [
    ["never changes a score, a ranking or a review.", "never changes a ranking, a review or a vote count."],
    ["Scores, rankings and reviews come only from players.", "Rankings, reviews and vote counts come only from players."],
  ],
};
export const V3_DROP: Record<string, string[]> = { about: ["How the score works"] };

const swap = (t: string, pairs: [string, string][]) => pairs.reduce((s, [a, b]) => s.replace(a, b), t);
export function infoV3(c: InfoCopy): InfoCopy {
  const pairs = c.key === "about" || c.key === "affiliate" ? V3_SWAPS[c.key] : [];
  const drop = new Set(V3_DROP[c.key] ?? []);
  const links = (c.extra?.sectionLinks ?? {}) as Record<string, unknown>;
  return { ...c, intro: c.intro.map(t => swap(t, pairs)),
    sections: c.sections.filter(s => !drop.has(s.title)).map(s => ({ ...s, body: s.body.map(t => swap(t, pairs)) })),
    extra: { ...c.extra, sectionLinks: Object.fromEntries(Object.entries(links).filter(([k]) => !drop.has(k))) } };
}
