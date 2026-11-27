// CoffeeRecs' quick match on the v3 pages (its creators home, catalogue and "Is it right for me?"): what you make, what matters
// most and quiet, matched on what owners and reviewers say about each product (its tags and the reviewers' words per part,
// lib/coffee-wire.ts), its category and what the maker says it can do (db/specs/coffee.json: espresso-capable grinders,
// steam wands). Pure and small, so the lists re-rank in the browser on every tap (instant filters) and tests feed plain
// objects. Shaped like LaptopRecs' (lib/laptop-match.ts, 2026-11-28); the weights wait for the owner's yardstick check.
//   - how loved it is is the base (0.4); what you make (0.3) and what you want (0.3) count only when picked and backed;
//   - a part counts only with 2+ voices behind it (a tag or a reviewer's word each);
//   - a hard mismatch (a filter-only grinder or a pour-over dripper for espresso, a machine with no steam wand for milk
//     drinks, an espresso machine for filter) holds the % under "Worth a look" and sorts the row after the rest; a softer one
//     (a grinder its maker calls limited for espresso, Quiet ticked on an electric grinder nobody calls quiet) under "Strong fit".

export type CoffeeDrink = "espresso" | "milk" | "filter";
export type CoffeeWant = "taste" | "easy" | "value";
export type CoffeePicks = { make: CoffeeDrink | null; want: CoffeeWant | null; quiet: boolean };
export const NO_COFFEE_PICKS: CoffeePicks = { make: null, want: null, quiet: false };
export const coffeePickedAny = (p: CoffeePicks) => !!(p.make || p.want || p.quiet);
/** The parts a product is judged on, as the creator reviews name them (lib/thread/creators.ts COFFEE_ATTRS). */
export type CoffeePart = "taste" | "consistency" | "ease" | "steam" | "build" | "noise" | "value";
/** What the maker says it can do (db/specs/coffee.json), null where unknown: a filter never drops a product on an unknown. */
export type CoffeeCan = { espresso: boolean | "limited" | null; filter: boolean | null; steam: boolean | null; hand: boolean };
/** One product's match inputs, as the page sends them to the browser: part → [score 0-100, voices]; `loved` 0-100 or null. */
export type CoffeeWire = { id: string; category: string | null; can: CoffeeCan; loved: number | null; n: number; s: Partial<Record<CoffeePart, [number, number]>> };

export const DRINKS: [CoffeeDrink, string][] = [["espresso", "Espresso"], ["milk", "Milk drinks"], ["filter", "Filter coffee"]];
export const WANTS: [CoffeeWant, string][] = [["taste", "Best taste"], ["easy", "Easy to use"], ["value", "Good value"]];
const PARTS: Record<CoffeeDrink, [CoffeePart, number][]> = {
  espresso: [["taste", 3], ["consistency", 2.5], ["ease", 1], ["build", 1]],
  milk: [["steam", 3], ["taste", 2], ["ease", 1.5], ["build", 1]],
  filter: [["taste", 3], ["consistency", 2], ["ease", 1.5]],
};
const WANT_PART: Record<CoffeeWant, CoffeePart> = { taste: "taste", easy: "ease", value: "value" };
const W_LOVED = 0.4, W_MAKE = 0.3, W_WANT = 0.3, HARD_CAP = 54, WARN_CAP = 74, MIN_VOICES = 2;
/** With nothing said about the parts a drink needs: the category alone (built for it or not). */
const NO_PARTS_FIT = 65, NO_PARTS_MISFIT = 40;

const part = (w: CoffeeWire, k: CoffeePart) => { const s = w.s[k]; return s && s[1] >= MIN_VOICES ? s[0] : null; };
/** Whether the product is built for the drink at all: true, false, or null (works with any drink: kettles, scales). */
function builtFor(w: CoffeeWire, d: CoffeeDrink): boolean | null {
  const c = w.category ?? "";
  if (c === "Kettle" || c === "Scale") return null;
  if (c === "Espresso machine") return d !== "filter";
  if (c === "Brewer") return d === "filter";
  if (c === "Grinder") return d === "filter" ? w.can.filter !== false : w.can.espresso !== false;
  return null;
}
function makeScore(w: CoffeeWire, d: CoffeeDrink): number | null {
  let sum = 0, wt = 0;
  for (const [k, x] of PARTS[d]) { const s = part(w, k); if (s != null) { sum += s * x; wt += x; } }
  const fits = builtFor(w, d);
  if (!wt) return fits === false ? NO_PARTS_MISFIT : fits ? NO_PARTS_FIT : null;
  return sum / wt;
}

/** Why a product can't be a strong fit for these picks: [hard reasons, softer warnings]. */
export function catches(w: CoffeeWire, p: CoffeePicks): [string[], string[]] {
  const hard: string[] = [], warn: string[] = [];
  const c = w.category ?? "", noise = part(w, "noise");
  if (p.make === "filter" && c === "Espresso machine") hard.push("an espresso machine doesn't make filter coffee");
  if ((p.make === "espresso" || p.make === "milk") && c === "Brewer") hard.push("a brewer doesn't make espresso");
  if ((p.make === "espresso" || p.make === "milk") && c === "Grinder" && w.can.espresso === false) hard.push("its maker says it doesn't grind fine enough for espresso");
  else if ((p.make === "espresso" || p.make === "milk") && c === "Grinder" && w.can.espresso === "limited") warn.push("its maker calls it limited for espresso");
  if (p.make === "filter" && c === "Grinder" && w.can.filter === false) hard.push("its maker says it isn't made for filter coffee");
  if (p.make === "milk" && c === "Espresso machine" && w.can.steam === false) hard.push("it has no steam wand for milk");
  if (p.quiet && noise != null && noise < 40) hard.push("owners and reviewers call it loud");
  else if (p.quiet && noise == null && c === "Grinder" && !w.can.hand) warn.push("electric grinders are loud while they grind");
  return [hard, warn];
}
export type CoffeeMatch = { pct: number | null; hard: boolean; warn: boolean; reasons: string[]; strong: CoffeePart[] };
export function coffeeMatch(w: CoffeeWire, p: CoffeePicks): CoffeeMatch {
  const [hard, warn] = catches(w, p);
  if (w.loved == null) return { pct: null, hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong: [] };
  let sum = w.loved * W_LOVED, wt = W_LOVED;
  const u = p.make ? makeScore(w, p.make) : null, x = p.want ? part(w, WANT_PART[p.want]) : null, q = p.quiet ? part(w, "noise") : null;
  if (u != null) { sum += u * W_MAKE; wt += W_MAKE; }
  if (x != null) { sum += x * W_WANT; wt += W_WANT; }
  if (q != null) { sum += q * W_WANT; wt += W_WANT; }
  let pct = Math.round(sum / wt);
  if (hard.length) pct = Math.min(pct, HARD_CAP); else if (warn.length) pct = Math.min(pct, WARN_CAP);
  // What people praise most among the picked parts (65+).
  const keys = [...(p.make ? PARTS[p.make].map(([k]) => k) : []), ...(p.want ? [WANT_PART[p.want]] : []), ...(p.quiet ? ["noise" as const] : [])];
  const strong = [...new Set(keys)].filter(k => (part(w, k) ?? 0) >= 65).sort((a, b) => part(w, b)! - part(w, a)!).slice(0, 2);
  return { pct: Math.max(0, Math.min(99, pct)), hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong };
}
/** Ranked for the picks: hard mismatches last, then softer ones, then by match % and by how much backs it. */
export function rankCoffee(wire: CoffeeWire[], p: CoffeePicks, keep: (w: CoffeeWire) => boolean = () => true) {
  return wire.filter(keep).map(w => ({ w, m: coffeeMatch(w, p) })).sort((a, b) =>
    Number(a.m.hard) - Number(b.m.hard) || Number(a.m.warn) - Number(b.m.warn) || (b.m.pct ?? -1) - (a.m.pct ?? -1) || b.w.n - a.w.n);
}
/** The fit bands (as lib/laptop-match.ts): Strong fit 75+, Worth a look 55-74. */
export const coffeeFit = (pct: number | null) => pct === null ? "thin" as const : pct >= 75 ? "good" as const : pct >= 55 ? "maybe" as const : "no" as const;
/** The words for a strong part in a reason line. */
export const PART_WORDS: Record<CoffeePart, string> = { taste: "taste in the cup", consistency: "consistency", ease: "ease of use", steam: "milk steaming",
  build: "build", noise: "quiet running", value: "value" };
