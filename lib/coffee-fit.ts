// CoffeeRecs on the shared match engine (PM / owner 2026-11-18, Grok's coffeerecs-match-profile.md). The profile in the racket
// format (lib/fit-config.ts), as SimRacingRecs did; lib/engine untouched. Coffee has no evidence table yet, so the engine reads
// the quick tags as its evidence (tagEvidence, app/match-context.ts), one report one voice.
//   type     the type picker (espresso machine, grinder, brewer, kettle, scale): a hard filter, never a score.
//   drink    "I make espresso / milk drinks / filter coffee": the main row, a hard filter on what the product can do (profile
//            G1 / G3: a filter-only grinder never shows for espresso; a machine with no steam never for milk drinks; a scale
//            too big for a drip tray never for espresso; kettles suit every drink, K2).
//   level    new / comfortable / enthusiast (Q2 "how hands-on"): the level tiers in db/specs/coffee.json (most products in the
//            middle tier), with the hard and soft level rules in lib/coffee-hard.ts (E6, E9, E10).
//   fine-tune  budget (the price tiers) and each type's own questions: back-to-back milk drinks, built-in grinder and PID
//            (espresso); hand / hopper / single dose (grinders); effort and cups (brewers); set temperature and stovetop or
//            electric (kettles); smart features (scales).
//   style    none: coffee gear has no control / power axis, so the engine's style part stays at "any".
// Six qualities per type (profile section 4), each shown on the types it applies to; they come from the quick tags we have.
// Traits the tags can't measure (pour control, response speed, battery) are left out rather than guessed.
import type { FitConfig, TraitDef } from "./fit-config";
import { coffeeSpec, backToBack, CAT_OF_SHAPE } from "./coffee-specs";

const E = "Espresso machine", G = "Grinder", B = "Brewer", K = "Kettle", S = "Scale";

/** The product types the home's type picker offers, as the catalogue's shape values (the URL key first). */
export const COFFEE_TYPES: [string, string, string][] = [["espresso", E, "espresso machines"], ["grinder", G, "grinders"], ["brewer", B, "brewers"],
  ["kettle", K, "kettles"], ["scale", S, "scales"]];

const t = (key: string, label: string, appliesTo: string[] | undefined, plus: [string, number][], minus: [string, number][], noun: string, ev: TraitDef["ev"]): TraitDef =>
  ({ key, label, plus, minus, noun, ev, ...(appliesTo ? { appliesTo } : {}) });

/** The compare tabs' words per quality: where another product is ahead, and the need it answers. */
const COMPARE: Record<string, [string, string]> = {
  quality: ["better in the cup", "want the best-tasting coffee"], consistency: ["more consistent", "want the same result every day"],
  steam: ["stronger on steam", "make milk drinks most days"], ease: ["easier to live with", "want a simple daily routine"],
  retention: ["lower retention", "switch beans or single dose"], quiet: ["quieter", "grind early or share the flat"],
  heat: ["quicker to heat", "want coffee fast in the morning"], clean: ["tidier to use", "hate cleaning up"],
  build: ["better built", "want it to last"], value: ["better value", "watch the budget"],
};
/** The "How it performs" notes per quality (expert voice, no counts). */
const SAY: Record<string, NonNullable<TraitDef["say"]>> = {
  quality: { hi: "Excellent in the cup once dialled in.", mid: "Good coffee; not the last word in flavour.", lo: "Flavour complaints are common.", split: ["great in the cup", "flat"] },
  consistency: { hi: "Consistent: the same result day after day.", mid: "Mostly consistent, with the odd off day.", lo: "Inconsistent results are a common complaint.", split: ["consistent", "inconsistent"] },
  steam: { hi: "Strong steam: silky milk without a long wait.", mid: "Steam is fine for one or two milk drinks.", lo: "Weak steam; milk drinks take a while.", split: ["strong", "weak"] },
  ease: { hi: "Easy to use day to day.", mid: "Easy enough once you learn it.", lo: "A learning curve, and fiddly day to day.", split: ["easy", "fiddly"] },
  retention: { hi: "Low retention: what goes in comes out.", mid: "Some coffee stays in the chute.", lo: "Retention and static are common complaints.", split: ["low retention", "messy"] },
  quiet: { hi: "Quiet enough for early mornings.", mid: "Average noise for a grinder.", lo: "Loud; it can wake the house.", split: ["quiet", "loud"] },
  heat: { hi: "Heats up fast.", mid: "Average heat-up time.", lo: "Slow to heat.", split: ["fast", "slow"] },
  clean: { hi: "Tidy to use and to clean.", mid: "Some mess, easy to clean.", lo: "Messy to use or to clean.", split: ["tidy", "messy"] },
  build: { hi: "Well built; it holds up.", mid: "Average build quality.", lo: "Durability complaints come up.", split: ["solid", "fails early"] },
  value: { hi: "Good value for what it does.", mid: "Fair value.", lo: "Pricey for what it does.", split: ["good value", "overpriced"] },
};
/** The specs line's labels per product type (the catalogue's columns). */
const SPEC_LABELS: Record<string, Partial<Record<"weight" | "balance" | "core" | "surface", string>>> = {
  [E]: { balance: "Heater", surface: "Key specs", core: "Material", weight: "Weight" },
  [G]: { balance: "Type", surface: "Burrs", core: "Material", weight: "Weight" },
  [B]: { balance: "Method", surface: "Capacity", core: "Material", weight: "Weight" },
  [K]: { balance: "Type", surface: "Capacity", core: "Material", weight: "Weight" },
  [S]: { balance: "Type", surface: "Range", core: "Material", weight: "Weight" },
};
const ALL_BUT_SCALE = [E, G, B, K];
export const COFFEE_FIT: FitConfig = {
  traits: ([
    // The engine's two style slots carry the level picks (as SimRacingRecs, quick.levelStyle), never shown as bars: "new" ranks by
    // how simple people find it to live with, "comfortable" and "enthusiast" by what it puts in the cup. The level tier
    // (db/specs/coffee.json) leans each, within ±1 dot (specLean below), so a beginner-tier machine leads for newcomers.
    { ...t("control", "Simple", undefined, [["easy to use", 1], ["fast heat-up", 0.5]], [["learning curve", 1], ["messy", 0.5]], "how simple it is", [["", ""], ["", ""]]), hidden: true },
    { ...t("power", "In the cup", undefined, [["great espresso", 1], ["great taste", 1], ["consistent", 0.5]], [["inconsistent", 0.5]], "what it puts in the cup", [["", ""], ["", ""]]), hidden: true },
    t("quality", "Coffee quality", [E, G, B], [["great espresso", 1], ["great taste", 1]], [], "the coffee it makes", [["praise the coffee", "praises the coffee"], ["fault the flavour", "faults the flavour"]]),
    t("consistency", "Consistency", undefined, [["consistent", 1]], [["inconsistent", 1]], "how consistent it is", [["call it consistent", "calls it consistent"], ["find it inconsistent", "finds it inconsistent"]]),
    t("steam", "Steam", [E], [["great steam", 1]], [], "the steam", [["praise the steam", "praises the steam"], ["find it weak", "finds it weak"]]),
    t("retention", "Low retention", [G], [["low retention", 1]], [["static", 0.5]], "the retention", [["call it low retention", "calls it low retention"], ["report retention or static", "reports retention or static"]]),
    t("quiet", "Quiet", [G], [["quiet", 1]], [["loud", 1]], "the noise", [["call it quiet", "calls it quiet"], ["find it loud", "finds it loud"]]),
    t("heat", "Heat-up", [K], [["fast heat-up", 1]], [], "how fast it heats", [["call it fast", "calls it fast"], ["find it slow", "finds it slow"]]),
    t("ease", "Ease of use", undefined, [["easy to use", 1], ["fast heat-up", 0.5]], [["learning curve", 0.5]], "the workflow", [["call it easy", "calls it easy"], ["report a learning curve", "reports a learning curve"]]),
    t("clean", "Tidy workflow", [B], [], [["messy", 1]], "the mess", [["call it tidy", "calls it tidy"], ["find it messy", "finds it messy"]]),
    t("build", "Build quality", [E, B, K, S], [["well built", 1]], [["durability issues", 1]], "the build", [["praise the build", "praises the build"], ["report failures", "reports failures"]]),
    t("value", "Value", undefined, [["great value", 1]], [["overpriced", 1]], "the value", [["call it good value", "calls it good value"], ["call it overpriced", "calls it overpriced"]]),
  ] as TraitDef[]).map(d => COMPARE[d.key] ? { ...d, diff: COMPARE[d.key][0], ifYou: COMPARE[d.key][1], say: SAY[d.key] } : d),
  complaint: ["consistency", "build", "quiet", "retention", "clean"],
  axis: { control: { trait: "control", tags: [] }, power: { trait: "power", tags: [] } },
  styleLabels: { control: "Simple", balance: "Balanced", power: "Hands-on" },
  styles: [],
  levelLabels: { beginner: "new", intermediate: "comfortable", advanced: "enthusiast" },
  levelPeople: { beginner: "new home baristas", intermediate: "comfortable home baristas", advanced: "enthusiasts" },
  levelOne: { beginner: "a new home barista", intermediate: "a comfortable home barista", advanced: "an enthusiast" },
  words: { person: "home barista", game: "setup", tryFirst: "try one first", howIt: "performs", catalogPromo: "Filter by type, level, budget and what you make.",
    guidePromo: "Boilers, burrs and goosenecks, explained in two minutes.", added: "added to the site this week",
    armShort: "milk drinks", hardArm: "No steam: it can't make milk drinks.", hardArmShort: "No steam" },
  levelWords: { beginner: ["first espresso machine", "first machine", "first grinder", "new to espresso", "just getting into coffee", "beginner"],
    intermediate: ["upgraded from", "coming from", "moved up from"], advanced: ["endgame", "dialled in", "light roast"] },
  weights: { style: 0.4, level: 0.3, arm: 0.2, score: 0.1 },
  arm: { trait: "ease", plus: "easy to use" },
  forgiving: { plus: "easy to use", minus: ["learning curve"], beginner: [] },
  // The level tier as a lean on the two level slots: a beginner-tier product is simpler, an enthusiast-tier one rewards practice.
  specLean: sp => { const lv = coffeeSpec({ slug: sp.slug })?.level; return lv === "beginner" ? { control: 0.7, power: -0.4 } : lv === "enthusiast" ? { control: -0.7, power: 0.6 } : { control: 0, power: 0 }; },
  lines: {},
  sourceWords: { forum: "coffee forum", blog: "coffee blog" },
  word: "product",
  sport: "coffee",
  emoji: "☕",
  dotsWords: "coffee quality, consistency, steam, retention, noise, heat-up, ease of use, mess, build or value",
  specWords: s => [s.balance],
  reviewerSources: ["YouTube", "Blog"],
  scale: { rank: "net", top4: 0.4, top5: 0.09 },
  quick: {
    types: COFFEE_TYPES.map(([key, shape, many]) => ({ key, shape, many })), want: "I need", arm: "milk drinks", armChip: "steams milk",
    stabilityLabel: "Style",
    levelStyle: { beginner: "control", intermediate: "power", advanced: "power" },
    catalogLead: ["kind"], useWord: "performs", specLabels: shape => SPEC_LABELS[shape ?? ""] ?? {},
    filters: [
      { key: "drink", label: "I make", main: true, options: [["espresso", "espresso"], ["milk", "milk drinks"], ["filter", "filter coffee"]] },
      { key: "budget", label: "Budget", options: [["$", "under $150"], ["$$", "$150–500"], ["$$$", "$500–1,500"], ["$$$$", "over $1,500"]] },
      { key: "steam", label: "Milk drinks", kinds: ["espresso"], options: [["b2b", "several in a row"]] },
      { key: "grinder", label: "Grinder", kinds: ["espresso"], options: [["built", "built in"], ["separate", "I have one"]] },
      { key: "pid", label: "Temperature", kinds: ["espresso"], options: [["yes", "PID control"]] },
      { key: "form", label: "Kind", kinds: ["grinder"], options: [["hand", "hand"], ["hopper", "electric, hopper"], ["single", "electric, single dose"]] },
      { key: "effort", label: "Effort", kinds: ["brewer"], options: [["button", "press a button"], ["simple", "a few simple steps"], ["pour", "a manual pour"]] },
      { key: "cups", label: "Cups at a time", kinds: ["brewer"], options: [["one", "one mug"], ["few", "2–3 cups"], ["pot", "a full pot"]] },
      { key: "ktemp", label: "Temperature", kinds: ["kettle"], options: [["set", "set it"], ["hold", "set and hold"]] },
      { key: "kheat", label: "Heats on", kinds: ["kettle"], options: [["electric", "its own base"], ["stove", "the stove"]] },
      { key: "smart", label: "Extras", kinds: ["scale"], options: [["basic", "weight and timer"], ["auto", "auto-timer and flow"], ["app", "an app"]] },
    ],
    factValues: coffeeFacts,
    missWhy: coffeeMiss,
  },
  tagEvidence: true,
  noLeanChip: true,
};

type Row = { shape: string | null; balance: string | null; core: string | null; surface?: string | null; name: string; slug?: string | null };

/** The facts a product's hard filters read, from db/specs/coffee.json (lib/coffee-specs.ts). An unknown never drops a product
 *  from a drink (a scale whose drip-tray fit is unknown stays in for espresso); an unknown price drops it from a budget pick. */
export function coffeeFacts(r: Row): Record<string, string[]> {
  const s = coffeeSpec(r), o: Record<string, string[]> = {};
  if (!s) return o;
  const drink: string[] = [];
  if (s.cat === "espresso") drink.push("espresso", ...(s.steam !== "none" ? ["milk"] : []));
  else if (s.cat === "grinder") drink.push(...(s.espresso === true ? ["espresso", "milk"] : []), "filter");
  else if (s.cat === "brewer") drink.push("filter");
  else if (s.cat === "kettle") drink.push("espresso", "milk", "filter");
  else drink.push(...(s.espressoFit === false ? [] : ["espresso", "milk"]), "filter");
  o.drink = drink;
  if (s.tier) o.budget = [s.tier];
  if (s.cat === "espresso") {
    if (backToBack(s)) o.steam = ["b2b"];
    o.grinder = [s.builtInGrinder ? "built" : "separate"];
    if (s.pid) o.pid = ["yes"];
  }
  if (s.cat === "grinder") o.form = s.power === "hand" ? ["hand"] : s.singleDose ? (/hopper/i.test(r.surface ?? "") ? ["hopper", "single"] : ["single"]) : ["hopper"];
  if (s.cat === "brewer") {
    o.effort = s.method === "drip" ? ["button"] : s.method === "pour-over" ? ["pour"] : s.method === "hybrid" ? ["simple", "pour"] : ["simple"];
    o.cups = [...(s.cups ?? [])];
  }
  if (s.cat === "kettle") { o.ktemp = s.hold ? ["set", "hold"] : s.temp ? ["set"] : []; o.kheat = [s.power === "stovetop" ? "stove" : "electric"]; }
  if (s.cat === "scale") o.smart = [...(s.timer ? ["basic"] : []), ...(s.autoStart || s.flow ? ["auto"] : []), ...(s.app ? ["app"] : [])];
  // Out of the match and lists: no longer made (Profitec GO, Weber EG-1 Mk.3), or not shipping yet (Decent Bengle).
  if (s.gone || s.preRelease) o.gone = ["yes"];
  if (s.preRelease) o.soon = ["yes"];
  return o;
}

/** Why a product isn't for the main pick (the fit check's reason, "Not for espresso: …"), per type. */
export function coffeeMiss(r: Row, key: string, value: string): { short: string; reason: string } | null {
  if (key !== "drink") return null;
  const s = coffeeSpec(r), cat = CAT_OF_SHAPE[r.shape ?? ""] ?? s?.cat;
  const word = value === "filter" ? "filter coffee" : value === "milk" ? "milk drinks" : "espresso";
  const why = cat === "espresso" ? (value === "filter" ? "An espresso machine, not a filter brewer." : "No steam wand, so no milk drinks without a separate frother.")
    : cat === "grinder" ? (s?.espresso === "limited" ? "It reaches espresso, but its steps are too coarse to dial in a shot." : "Built for filter, so it can't grind fine enough for espresso.")
    : cat === "brewer" ? "A filter brewer, not an espresso maker."
    : cat === "scale" ? "Too big to sit on an espresso machine's drip tray." : null;
  return why ? { short: `Not for ${word}`, reason: `Not for ${word}: ${why[0].toLowerCase()}${why.slice(1)}` } : null;
}
