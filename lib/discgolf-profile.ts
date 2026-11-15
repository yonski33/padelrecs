// DiscGolfRecs on the match engine (ENGINE-PLAN.md §2C; plan: side-session notes discgolf-engine-plan.md; owner OK
// 2026-11-15 via the PM: "you can give them my ok"). Attribute kinds as in lib/attr-profile.ts (suits / quality / axis / fact).
// Not registered in attr-profile's PROFILES on purpose: that list switches a site's v2 pages to the skin layouts, and the
// disc golf design waits for the padel template. Scripts import it directly. The shared lib/engine module (ENGINE-ALGO.md)
// takes this profile, the flight-number priors below and the raw counts; no disc golf match weights are tuned here.
import type { AttrProfile } from "./attr-profile";

export const DISC_GROUPS = [
  { key: "beginner", label: "Beginner", display: "beginners" },
  { key: "intermediate", label: "Intermediate", display: "intermediate players" },
  { key: "advanced", label: "Advanced", display: "advanced players" },
  { key: "arm_slow", label: "Under 250 ft", display: "slower arms (under 250 ft)" },
  { key: "arm_mid", label: "250–325 ft", display: "medium arms (250–325 ft)" },
  { key: "arm_fast", label: "325 ft +", display: "big arms (325 ft +)" },
] as const;
export type DiscGroup = typeof DISC_GROUPS[number]["key"];

const DRIVERS_MIDS = ["Distance driver", "Fairway driver", "Midrange"];
export const DISCGOLF: AttrProfile = {
  groups: DISC_GROUPS.map(g => ({ ...g })),
  concerns: [],
  minGroup: 3, minAxis: 3,
  // Placeholder only: the shared lib/engine module sets the match weights (ENGINE-ALGO.md); nothing reads these yet.
  weights: { group: 0.4, concerns: 0, feel: 0.3, score: 0.1 },
  attrs: [
    { key: "suits_beginner", label: "Beginners", kind: "suits", prior: { attr: "stability", sign: -1 } },
    { key: "suits_intermediate", label: "Intermediate players", kind: "suits" },
    { key: "suits_advanced", label: "Advanced players", kind: "suits" },
    { key: "suits_arm_slow", label: "Slower arms", kind: "suits", prior: { attr: "stability", sign: -1 } },
    { key: "suits_arm_mid", label: "Medium arms", kind: "suits" },
    { key: "suits_arm_fast", label: "Big arms", kind: "suits", prior: { attr: "stability", sign: 1 } },
    { key: "accuracy", label: "Accuracy", kind: "quality", complaint: true, plus: [["accurate", 1], ["holds lines", 1]], minus: [["inconsistent between runs", 1]],
      words: ["dead accurate", "accurate", "usually on line", "can be erratic", "often erratic"] },
    { key: "distance", label: "Distance", kind: "quality", appliesTo: DRIVERS_MIDS, plus: [["long", 1]], words: ["very long", "long", "average distance", "on the short side", "short"] },
    { key: "wind", label: "Wind", kind: "quality", plus: [["good in wind", 1]], words: ["great in wind", "good in wind", "fine in wind", "gets pushed around", "struggles in wind"] },
    { key: "forehand", label: "Forehand", kind: "quality", plus: [["good for forehands", 1]], words: ["great for forehands", "good for forehands", "OK for forehands", "turns on forehands", "not for forehands"] },
    // Axes: + is towards the second end. "too flippy" / "too overstable" are complaints, but on the axis they are positions.
    { key: "stability", label: "Stability", kind: "axis", ends: ["understable", "overstable"],
      plus: [["overstable", 1], ["too overstable", 1]], minus: [["understable", 1], ["too flippy", 1]] },
    { key: "glide", label: "Glide", kind: "axis", ends: ["little glide", "lots of glide"], plus: [["lots of glide", 1]] },
    { key: "grip", label: "Grip & feel", kind: "axis", ends: ["slick", "grippy"], plus: [["great grip", 1]], minus: [["slippery", 1]] },
    { key: "beat_in", label: "Beat-in", kind: "axis", ends: ["holds its flight", "seasons fast"], plus: [["beats in fast", 1]] },
    { key: "flight", label: "Flight numbers", kind: "fact" },
    { key: "plastics", label: "Plastics", kind: "fact" },
    { key: "rim", label: "Rim width", kind: "fact" },
    { key: "max_weight", label: "Max weight", kind: "fact" },
  ],
};

/** Words the readers use for a level or an arm (guidance for scripts/evidence-rules-discgolf.md). PDGA ratings are three
 *  digits: under 850 beginner, 850–929 intermediate, 930+ advanced (the review form: intermediate "rated under 900",
 *  advanced "900–950"; we keep 850–929 so most league players read as intermediate). */
export const LEVEL_WORDS = {
  beginner: ["first disc", "first driver", "new to disc golf", "just started", "noodle arm", "newer player"],
  intermediate: ["league", "casual rounds", "rated 850–929", "throws 250–325 ft"],
  advanced: ["tournament", "rated 930+", "throws 400 ft", "big arm", "pro"],
  rating: { beginnerBelow: 850, advancedFrom: 930 },
  arm: { slowBelow: 250, fastFrom: 325 },
};

export type Flight = { speed: number; glide: number; turn: number; fade: number };
/** "12 / 5 / -1 / 3" → numbers, or null. */
export function flightOf(s: string | null | undefined): Flight | null {
  const m = (s ?? "").match(/^\s*(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s*$/);
  return m ? { speed: +m[1], glide: +m[2], turn: +m[3], fade: +m[4] } : null;
}

const clamp = (x: number) => Math.max(5, Math.min(95, Math.round(x)));
/** The starting point before any reports (ENGINE-ALGO step 2: specs give the starting point), 0–100 per attribute, from
 *  the maker's flight numbers. `mid` is the catalog's median turn + fade and glide, so 50 means "a typical disc".
 *  Stability: turn + fade. Glide: the glide number. Suits: speed against arm (a speed-12+ driver fades early for a slower
 *  arm; a very understable disc turns over for a big arm). Grip and beat-in depend on the plastic: no prior. */
export function flightPrior(f: Flight | null, mid: { tf: number; glide: number }): Record<string, number> {
  if (!f) return {};
  const tf = f.turn + f.fade, out: Record<string, number> = {};
  out.stability = clamp(50 + 10 * (tf - mid.tf));
  out.glide = clamp(50 + 12 * (f.glide - mid.glide));
  let easy = 50; // beginner / slower arm
  if (f.speed <= 5) easy += 15; else if (f.speed <= 9) easy += tf <= 1 ? 12 : tf >= 4 ? -8 : 2;
  else if (f.speed <= 11) easy += f.turn <= -2 ? 2 : -12; else easy += f.turn <= -2 ? -10 : -25;
  if (tf >= 4 && f.speed >= 9) easy -= 8;
  out.suits_beginner = clamp(easy);
  out.suits_arm_slow = clamp(easy);
  out.suits_intermediate = 50;
  out.suits_arm_mid = clamp(50 - (f.speed >= 13 && tf >= 3 ? 10 : 0));
  out.suits_advanced = clamp(50 + (f.speed >= 12 && tf >= 3 ? 10 : 0));
  out.suits_arm_fast = clamp(50 + (f.speed >= 12 ? 12 : 0) + (tf >= 4 ? 5 : 0) - (f.turn <= -2 && f.speed <= 10 ? 12 : 0));
  return out;
}

/** The level gate (padel #355 rule, ENGINE-ALGO step 6): out of beginner lists only when the flight numbers AND the
 *  evidence both say advanced. A maker's or one source's label alone is never enough. */
export const beginnerGated = (prior: number | undefined, suits: { score: number; n: number } | null) =>
  prior !== undefined && prior <= 30 && !!suits && suits.n >= 3 && suits.score < 45;
