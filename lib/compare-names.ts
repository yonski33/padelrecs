// How a compare line names the other product (owner 2026-11-17): the shortest name that still tells it apart from the rest
// on the page. A brand nobody else here shares → the brand ("More forgiving than the Nox"); the same brand → the shortest
// model word no other model of that brand here has ("Harder than the 18K", "than the CTRL"); else the model without
// the lead words its same-brand siblings share (no brand, no year). Headlines and cards keep full names. Pure, for tests.

export type Named = { brand: string; model: string };
const words = (s: string) => s.split(/\s+/).filter(Boolean);

/** The shortest distinct name for product i among all shown. */
export function refName(i: number, all: Named[], /** Never the brand alone (DiscGolfRecs, audit 2026-11-17: "than the Discraft" names hundreds of molds). */ byModel = false): string {
  const me = all[i], brand = me.brand.trim().toLowerCase();
  const sameBrand = all.filter((x, j) => j !== i && x.brand.trim().toLowerCase() === brand);
  // A brand nobody else here shares stands for the product, unless it reads like a product itself (owner 2026-11-17): a
  // two-word brand ("Vatic Pro", "Six Zero": "than the Vatic Pro" sounds like a model) or one another name here starts with.
  // Then the model words ("than the Prism Flash").
  const b = me.brand.trim(), looksLikeModel = words(b).length > 1
    || all.some((x, j) => j !== i && x.brand.trim().toLowerCase() !== brand && `${x.brand} ${x.model}`.trim().toLowerCase().startsWith(`${brand} `));
  if (b && !sameBrand.length) return byModel || looksLikeModel ? me.model : b;
  const taken = new Set(sameBrand.flatMap(x => words(x.model.toLowerCase())));
  const mw = words(me.model), own = mw.filter(t => t.length >= 2 && !taken.has(t.toLowerCase()));
  // A name that shares no word with its siblings is its own name: "the Double Black Diamond Control", not "the Black".
  if (own.length === mw.length) return me.model;
  // Only the year tells it apart (a 2026 beside its 2027): the whole model with its year, never "the 2026".
  if (own.length && own.every(t => /^(19|20)\d\d$/.test(t))) return me.model;
  if (!own.length) { // every word is in a sibling's model (the plain one beside a "Lite"): drop the lead words they all share
    const mine = mw, lower = sameBrand.map(x => words(x.model.toLowerCase()));
    let k = 0; while (k < mine.length - 1 && lower.every(w => w[k] === mine[k].toLowerCase())) k++;
    return mine.slice(k).join(" ");
  }
  return own.reduce((a, b) => b.length < a.length ? b : a);
}

/** Word stems per trait key: a product's own "why yes" line that hits one of these repeats that trait's comparison line. */
const STEMS: Record<string, string[]> = {
  speed: ["quick", "fast", "speed", "handl", "manoeuv", "maneuv", "nimble", "whippy"], maneuverability: ["quick", "fast", "handl", "manoeuv", "maneuv", "nimble"],
  power: ["power", "punch", "smash", "drive", "put-away"], pop: ["pop", "springy", "power"], control: ["control", "placement", "precis"],
  forgiveness: ["forgiv", "sweet spot", "mishit", "off-cent"], arm: ["arm", "elbow", "comfort", "vibration"], defence: ["defen", "block", "reset"],
  spin: ["spin", "grit", "bite"], stability: ["stabl", "stabil", "solid", "twist"], distance: ["distance", "far ", "long"], glide: ["glide", "float"],
  wind: ["wind"], accuracy: ["accura", "holds its line", "straight"], grip: ["grip"], durability: ["durab", "lasts", "wear"], forehand: ["forehand", "sidearm"],
};
/** Does this line make the same point as one of these traits' comparison lines? */
export function repeatsTrait(line: string, traitKeys: string[], labels: Record<string, string> = {}): boolean {
  const l = ` ${line.toLowerCase()} `;
  return traitKeys.some(k => (STEMS[k] ?? [(labels[k] ?? k).toLowerCase().slice(0, 5)]).some(s => l.includes(s)));
}

/** One style for spec values in the compare table: ranges as "360–375 g" (en dash, no spaces), a space before the unit. */
export function specValue(v: string): string {
  return v.trim().replace(/(\d)\s*[-–—]\s*(\d)/g, "$1–$2").replace(/(\d)\s*(g|kg|mm|cm|oz|in)\b/g, "$1 $2");
}
