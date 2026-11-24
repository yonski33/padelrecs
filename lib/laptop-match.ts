// LaptopRecs' quick match (its creators home, catalogue and "Is it right for me?"): what you use it for, what matters most
// and quiet fans, matched on what owners and reviewers say about each laptop (its tags and the reviewers' words per part,
// lib/laptop-wire.ts) and its category. Pure and small, so the lists re-rank in the browser on every tap (instant filters)
// and tests feed plain objects. A first pass (2026-11-24), shaped like AudioRecs' (lib/audio-match.ts); the weights wait for
// the owner's yardstick check.
//   - how loved it is is the base (0.4); the use (0.3) and what you want (0.3) count only when picked and backed;
//   - a part counts only with 2+ voices behind it (a tag or a reviewer's word each);
//   - a hard mismatch (games on a Chromebook, quiet fans ticked on a laptop owners call loud) holds the % under "Worth a
//     look" and sorts the row after the rest; a softer one (games on a Mac, a gaming laptop for carrying) under "Strong fit".

export type LaptopUse = "gaming" | "work" | "school" | "creative";
export type LaptopWant = "battery" | "power" | "light";
export type LaptopPicks = { use: LaptopUse | null; want: LaptopWant | null; quiet: boolean };
export const NO_LAPTOP_PICKS: LaptopPicks = { use: null, want: null, quiet: false };
export const laptopPickedAny = (p: LaptopPicks) => !!(p.use || p.want || p.quiet);
/** The parts a laptop is judged on, as the creator reviews name them (lib/thread/creators.ts LAPTOP_ATTRS). */
export type LaptopPart = "performance" | "thermals" | "battery" | "display" | "keyboard" | "build" | "portability" | "value";
/** One laptop's match inputs, as the page sends them to the browser: part → [score 0-100, voices]; `loved` 0-100 or null. */
export type LaptopWire = { id: string; category: string | null; kg: number | null; loved: number | null; n: number; s: Partial<Record<LaptopPart, [number, number]>> };

export const USES: [LaptopUse, string][] = [["gaming", "Gaming"], ["work", "Work"], ["school", "School"], ["creative", "Creative work"]];
export const WANTS: [LaptopWant, string][] = [["battery", "Battery life"], ["power", "Power"], ["light", "Light weight"]];
/** "Best for …" words per use. */
export const USE_WORDS: Record<LaptopUse, string> = { gaming: "gaming", work: "work", school: "school", creative: "creative work" };
const PARTS: Record<LaptopUse, [LaptopPart, number][]> = {
  gaming: [["performance", 3], ["thermals", 2], ["display", 1.5], ["value", 1]],
  work: [["battery", 3], ["keyboard", 2], ["build", 1.5], ["portability", 1.5]],
  school: [["battery", 3], ["portability", 2], ["value", 2], ["build", 1]],
  creative: [["display", 3], ["performance", 2.5], ["thermals", 1], ["build", 1]],
};
const WANT_PART: Record<LaptopWant, LaptopPart> = { battery: "battery", power: "performance", light: "portability" };
const W_LOVED = 0.4, W_USE = 0.3, W_WANT = 0.3, HARD_CAP = 54, WARN_CAP = 74, MIN_VOICES = 2;
/** The categories a use expects: a laptop in one of them gets this lift on the use part (it is built for it). */
const FITS: Record<LaptopUse, string[]> = { gaming: ["Gaming"], work: ["Business", "Ultrabook", "MacBook"], school: ["Ultrabook", "Chromebook", "2-in-1", "MacBook"], creative: ["Creator", "MacBook"] };
const FIT_LIFT = 8, NO_PARTS_FIT = 65, NO_PARTS_MISFIT = 40;

const part = (w: LaptopWire, k: LaptopPart) => { const s = w.s[k]; return s && s[1] >= MIN_VOICES ? s[0] : null; };
/** How light it is, 0-100: 1.2 kg or less is 95, 2.6 kg or more is 15, from the spec weight. */
const weightScore = (kg: number | null) => kg == null ? null : Math.round(95 - Math.max(0, Math.min(1, (kg - 1.2) / 1.4)) * 80);
function useScore(w: LaptopWire, use: LaptopUse): number | null {
  let sum = 0, wt = 0;
  for (const [k, x] of PARTS[use]) { const s = k === "portability" ? portability(w) : part(w, k); if (s != null) { sum += s * x; wt += x; } }
  const fits = FITS[use].includes(w.category ?? "");
  // Nothing said about the parts this use needs: the category alone (built for it or not).
  if (!wt) return fits ? NO_PARTS_FIT : NO_PARTS_MISFIT;
  return Math.min(100, sum / wt + (fits ? FIT_LIFT : 0));
}
/** Portability: what people say, and the spec weight where it is known (the weight counts as one voice more). */
function portability(w: LaptopWire): number | null {
  const said = part(w, "portability"), kg = weightScore(w.kg);
  return said == null ? kg : kg == null ? said : (said * 2 + kg) / 3;
}
const wantScore = (w: LaptopWire, want: LaptopWant) => want === "light" ? portability(w) : part(w, WANT_PART[want]);

/** Why a laptop can't be a strong fit for these picks: [hard reasons, softer warnings]. */
export function catches(w: LaptopWire, p: LaptopPicks): [string[], string[]] {
  const hard: string[] = [], warn: string[] = [];
  const cat = w.category ?? "", thermals = part(w, "thermals");
  if (p.use === "gaming" && cat === "Chromebook") hard.push("Chromebooks don't run most PC games");
  if (p.use === "creative" && cat === "Chromebook") hard.push("Chromebooks don't run most creative apps");
  if (p.use === "gaming" && cat === "MacBook") warn.push("many PC games don't run on macOS");
  else if (p.use === "gaming" && cat !== "Gaming" && cat !== "Creator" && cat !== "Chromebook") warn.push("it isn't built for games");
  if ((p.use === "school" || p.want === "light") && w.kg != null && w.kg >= 2.3) warn.push(`at ${w.kg.toFixed(1)} kg it is heavy to carry every day`);
  if (p.quiet && thermals != null && thermals < 40) hard.push("owners and reviewers say it runs hot or loud");
  else if (p.quiet && cat === "Gaming") warn.push("gaming laptops get loud under load");
  return [hard, warn];
}
export type LaptopMatch = { pct: number | null; hard: boolean; warn: boolean; reasons: string[]; strong: LaptopPart[] };
export function laptopMatch(w: LaptopWire, p: LaptopPicks): LaptopMatch {
  const [hard, warn] = catches(w, p);
  if (w.loved == null) return { pct: null, hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong: [] };
  let sum = w.loved * W_LOVED, wt = W_LOVED;
  const u = p.use ? useScore(w, p.use) : null, x = p.want ? wantScore(w, p.want) : null, q = p.quiet ? part(w, "thermals") : null;
  if (u != null) { sum += u * W_USE; wt += W_USE; }
  if (x != null) { sum += x * W_WANT; wt += W_WANT; }
  if (q != null) { sum += q * W_WANT; wt += W_WANT; }
  let pct = Math.round(sum / wt);
  if (hard.length) pct = Math.min(pct, HARD_CAP); else if (warn.length) pct = Math.min(pct, WARN_CAP);
  // What people praise most among the picked parts (65+).
  const keys = [...(p.use ? PARTS[p.use].map(([k]) => k) : []), ...(p.want ? [WANT_PART[p.want]] : []), ...(p.quiet ? ["thermals" as const] : [])];
  const strong = [...new Set(keys)].filter(k => (part(w, k) ?? 0) >= 65).sort((a, b) => part(w, b)! - part(w, a)!).slice(0, 2);
  return { pct: Math.max(0, Math.min(99, pct)), hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong };
}
/** Ranked for the picks: hard mismatches last, then softer ones, then by match % and by how much backs it. */
export function rankLaptops(wire: LaptopWire[], p: LaptopPicks, keep: (w: LaptopWire) => boolean = () => true) {
  return wire.filter(keep).map(w => ({ w, m: laptopMatch(w, p) })).sort((a, b) =>
    Number(a.m.hard) - Number(b.m.hard) || Number(a.m.warn) - Number(b.m.warn) || (b.m.pct ?? -1) - (a.m.pct ?? -1) || b.w.n - a.w.n);
}
/** The fit bands (as lib/audio-match.ts): Strong fit 75+, Worth a look 55-74. */
export const laptopFit = (pct: number | null) => pct === null ? "thin" as const : pct >= 75 ? "good" as const : pct >= 55 ? "maybe" as const : "no" as const;
/** The words for a strong part in a reason line. */
export const PART_WORDS: Record<LaptopPart, string> = { performance: "performance", thermals: "cool, quiet running", battery: "battery life", display: "screen",
  keyboard: "keyboard", build: "build", portability: "portability", value: "value" };
