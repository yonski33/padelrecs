// CoffeeRecs' level rules for the match (Grok's coffeerecs-match-profile.md, PM 2026-11-18). Server side, like
// lib/discgolf-hard.ts: they read db/specs/coffee.json and go into the match payload (app/match-context.ts).
//   level tiers  beginner / middle / enthusiast per product (profile section 3; most products in the middle tier) as the level
//                scores: coffee has no stated player levels, so the tier decides until players say theirs.
//   hard         E9: a manual lever is never for "new, I want it simple".
//   soft         E6: a heat exchanger without a PID for a newcomer (it runs hot unless flushed); E10: pressure or flow profiling
//                for a newcomer is "worth a look", never a strong fit; a hand-pumped maker needs a fine, even grind; an
//                enthusiast grinder or brewer for a newcomer.
import { coffeeSpec, type CoffeeLevel } from "./coffee-specs";
import type { SiteRules } from "./discgolf-hard";

/** Level scores per tier (SUITS_OK = 62 passes a level, under 40 holds it back). The middle tier suits all three levels and
 *  ranks highest for "comfortable"; the beginner tier ranks first for newcomers; the enthusiast tier is a stretch for them. */
export const TIER_SUITS: Record<CoffeeLevel, { beginner: number; intermediate: number; advanced: number }> = {
  beginner: { beginner: 82, intermediate: 70, advanced: 45 },
  middle: { beginner: 66, intermediate: 80, advanced: 72 },
  enthusiast: { beginner: 42, intermediate: 64, advanced: 86 },
};

export function coffeeRules(d: { slug: string }): SiteRules {
  const s = coffeeSpec({ slug: d.slug });
  if (!s) return {};
  const hard: NonNullable<SiteRules["hard"]> = {}, warn: NonNullable<SiteRules["warn"]> = {};
  if (s.cat === "espresso") {
    if (s.type === "Manual lever") hard.beginner = "A manual lever: you make the pressure by hand, shot by shot. Not a simple first machine.";
    else if (s.type === "Manual pump") warn.beginner = "Hand-pumped: it needs a fine, even grind and some practice before shots taste right.";
    else if (s.profiling || s.flowControl) warn.beginner = "Pressure or flow profiling pays off with practice; most people start on a simpler machine.";
    else if (s.type === "Heat exchanger" && !s.pid) warn.beginner = "A heat exchanger without a PID runs hot at the group until you learn a cooling flush.";
  } else if (s.level === "enthusiast" && s.cat === "grinder") warn.beginner = "Big burrs and fine control pay off once you are dialled in; a simpler grinder is easier to start on.";
  else if (s.level === "enthusiast" && s.cat === "brewer") warn.beginner = "It rewards a steady, practised pour; an AeroPress or a Hario Switch is easier to start with.";
  return { ...(Object.keys(hard).length ? { hard } : {}), ...(Object.keys(warn).length ? { warn } : {}), specSuits: TIER_SUITS[s.level] };
}
