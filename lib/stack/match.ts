// StackRecs "Find my match" (plan PR #517 section 4, owner sign-off 2026-11-19). Pure: the home's server view and the
// browser run the same function, so a tap never asks the server (lib/niche/README.md "Filters and picks are client-side").
//
// Three picks: the side, who you are and a budget. The budget is a gate on the catalog's price facts. Who you are ranks by
// the "Best for" group (votes plus what reviews say): a tool with fewer than MIN_FIT reports there gets no match % and sits
// after the ones that have them, ordered by score (the caution rule padel's engine follows). Commission never enters.
import { STACK_TOOLS, type Side, type StackTool } from "./catalog";

export type Who = "non_coder" | "some_code" | "developer" | "solo" | "agency" | "in_house";
export type Budget = "free" | "low" | "any";
export type Picks = { side: Side; who: Who | null; budget: Budget };

export const WHO: Record<Side, [Who, string][]> = {
  build: [["non_coder", "Non-coder"], ["some_code", "Some code"], ["developer", "Developer"]],
  grow: [["solo", "Solo"], ["agency", "Agency"], ["in_house", "In-house team"]],
};
/** Budget steps per side (Grow's "under" step is higher: SEO suites start near $130 a month). */
export const BUDGET: Record<Side, [Budget, string, number | null][]> = {
  build: [["free", "Free", 0], ["low", "Under $30 a month", 30], ["any", "Any", null]],
  grow: [["free", "Free or trial", 0], ["low", "Under $150 a month", 150], ["any", "Any", null]],
};
/** The "Best for" choice each "I am" pick reads. */
export const BEST_FOR: Record<Who, string> = { non_coder: "non_coder", some_code: "hobby_dev", developer: "pro_team", solo: "solo", agency: "agency", in_house: "in_house" };
export const MIN_FIT = 3;
export const DEFAULT_PICKS: Picks = { side: "build", who: null, budget: "any" };

export function withinBudget(t: Pick<StackTool, "free" | "fromUsd">, side: Side, budget: Budget) {
  if (budget === "any") return true;
  if (t.free) return true;
  const cap = BUDGET[side].find(b => b[0] === budget)?.[2] ?? null;
  return budget === "low" && cap != null && t.fromUsd != null && t.fromUsd <= cap;
}

export type MatchInput = { id: string; slug: string; side: Side; score: number | null;
  /** "Best for" counts, votes plus review mentions: choice → n. */ bestFor: Record<string, number> };
export type MatchRow = { id: string; pct: number | null };

/** The share of "Best for" reports for the pick, pulled toward a third by one imaginary report per option. */
export const fitShare = (bestFor: Record<string, number>, choice: string) => {
  const total = Object.values(bestFor).reduce((a, b) => a + b, 0);
  return { total, share: ((bestFor[choice] ?? 0) + 1) / (total + 3) };
};

/** The ranked tools for the picks. With no "I am" pick, the side's tools inside the budget by score. */
export function rankMatch(rows: MatchInput[], picks: Picks, tools: StackTool[] = STACK_TOOLS): MatchRow[] {
  const facts = new Map(tools.map(t => [t.slug, t]));
  const inside = rows.filter(r => r.side === picks.side && (() => { const f = facts.get(r.slug); return !f || withinBudget(f, picks.side, picks.budget); })());
  const byScore = (a: MatchInput, b: MatchInput) => (b.score ?? -1) - (a.score ?? -1) || a.slug.localeCompare(b.slug);
  if (!picks.who) return inside.sort(byScore).map(r => ({ id: r.id, pct: null }));
  const choice = BEST_FOR[picks.who];
  const scored = inside.map(r => { const f = fitShare(r.bestFor, choice);
    const pct = r.score != null && f.total >= MIN_FIT ? Math.round(r.score * (0.7 + 0.3 * Math.min(1, f.share * 1.5))) : null;
    return { r, pct }; });
  return scored.sort((a, b) => (a.pct == null ? 1 : 0) - (b.pct == null ? 1 : 0) || (b.pct ?? 0) - (a.pct ?? 0) || byScore(a.r, b.r))
    .map(x => ({ id: x.r.id, pct: x.pct }));
}

/** Picks from an address (?side=grow&who=agency&budget=low); anything unknown falls back to the default. */
export function readPicks(q: URLSearchParams): Picks {
  const side: Side = q.get("side") === "grow" ? "grow" : "build";
  const who = WHO[side].find(([k]) => k === q.get("who"))?.[0] ?? null;
  const budget = (["free", "low", "any"] as const).find(b => b === q.get("budget")) ?? "any";
  return { side, who, budget };
}
export function picksHref(p: Picks, path = "/") {
  const q = new URLSearchParams();
  if (p.side !== "build") q.set("side", p.side);
  if (p.who) q.set("who", p.who);
  if (p.budget !== "any") q.set("budget", p.budget);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
