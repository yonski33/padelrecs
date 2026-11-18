// CoffeeRecs gear guide (/guide), from Grok's "Coffee gear, decoded" draft (coffeerecs-match-profile.md section 5, PM
// 2026-11-18). The config shape is in lib/niche/GUIDE.md. Copy only: every count and "most-liked" product is worked out from the
// catalogue (lib/guide.ts). PID, steps, single dosing and scales have no single spec column behind them, so they stay text-only
// and say so. Where experienced home baristas disagree (burr shape, profiling), both sides are said plainly. Expert voice, no
// testing claims, no em dashes.
import type { GuideConfig } from "../guide";

/** The espresso machine's heater from the Type column; levers and hand pumps have none to count here. */
export const heaterOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase();
  return /dual boiler/.test(x) ? "dual" : /heat exchanger/.test(x) ? "hx" : /single boiler/.test(x) ? "single" : /thermo(block|coil|jet)/.test(x) ? "thermo" : null; };
/** An electric grinder's burr shape from the Type column (hand grinders are left out: the column doesn't say). */
export const burrOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /^flat burr/.test(x) ? "flat" : /^conical burr/.test(x) ? "conical" : null; };
/** A brewer's method from the Type column. */
export const methodOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase();
  return /drip coffee maker/.test(x) ? "drip" : /^pour-over/.test(x) ? "pour" : /immersion|french press/.test(x) ? "immersion" : null; };
/** A kettle's spout from the Type column. */
export const spoutOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /gooseneck/.test(x) ? "gooseneck" : /kettle/.test(x) ? "standard" : null; };

export const coffeeGuide: GuideConfig = {
  title: "Coffee gear guide: boilers, PID, burrs, pour-over and scales explained",
  description: "Single boiler vs heat exchanger vs dual boiler, what a PID does, flat vs conical burrs, stepless grinders, single dosing, pour-over vs immersion, gooseneck kettles and scales, with how many products of each we track.",
  crumb: "coffee gear guide",
  h1: ["Coffee gear,", "decoded"],
  intro: "A machine or a brewer, a grinder, and something to weigh with. Here's what the specs mean, and which ones matter for how you make coffee.",
  tldr: [
    { label: "New to it", desc: "forgiving gear, few settings, quick to heat", picks: { level: "beginner" } },
    { label: "Comfortable", desc: "happy to dial in; room to grow", picks: { level: "intermediate" } },
    { label: "Enthusiast", desc: "PID, profiling and big burrs that reward practice", picks: { level: "advanced" } },
  ],
  sections: [
    { id: "heater", title: "Espresso machine types", sub: "how it heats brew and steam water", layout: "cards", liked: "dual",
      spec: { key: "heater", label: "Heater", column: "balance", classify: heaterOf },
      rule: "Match the machine to how many milk drinks you make. Levers use your arm for pressure and have no steam.", options: [
      { value: "thermo", label: "Thermoblock", text: "Heats on demand: ready in seconds, weaker steam that needs a pause between pitchers.", best: "espresso, the odd latte" },
      { value: "single", label: "Single boiler", text: "One boiler brews and steams, so you wait while it switches between the two.", best: "mostly espresso" },
      { value: "hx", label: "Heat exchanger", text: "Brew water flashes through the steam boiler: brew and steam together, often after a cooling flush.", best: "milk drinks" },
      { value: "dual", label: "Dual boiler", text: "A boiler for each job: steady brew temperature and steam on tap, at the most money.", best: "milk drinks back to back" },
    ] },
    { id: "pid", title: "PID and profiling", sub: "holding the temperature, shaping the shot", layout: "split", liked: false,
      textOnlyNote: "no counts here: PID and profiling sit in each machine's specs, not in one column (see the espresso filters)", options: [
      { label: "PID", text: "Holds brew water at the temperature you set instead of letting a thermostat swing. It matters most for light roasts, which like hotter water.", accent: true },
      { label: "Pressure or flow profiling", text: "Changes pressure during the shot, such as a gentle start then a ramp. Powerful, but it takes practice, and experienced home baristas disagree on how much it matters at home." },
    ] },
    { id: "burr", title: "Conical vs flat burrs", sub: "two ways to cut a bean", layout: "split", liked: "flat",
      spec: { key: "burr", label: "Burrs", column: "balance", classify: burrOf },
      rule: "Choose on grind quality and workflow, not burr shape. A well-made grinder of either kind beats a poor one of the other.", options: [
      { value: "conical", label: "Conical", text: "The common shorthand: more body. Usually smaller and quieter for the money." },
      { value: "flat", label: "Flat", text: "The common shorthand: more clarity. In practice burr design, alignment and speed matter as much as shape, and experts still argue the rule.", accent: true },
    ] },
    { id: "steps", title: "Stepped vs stepless", sub: "how fine you can adjust", layout: "toggles", liked: false,
      textOnlyNote: "no counts here: the adjustment is in each grinder's specs (see the grinder filters)", options: [
      { kicker: "Easy to go back?", label: "Stepped", text: "Clicks between fixed settings, so returning to a setting is easy. Fine for filter; for espresso the steps must be small." },
      { kicker: "Tiny changes?", label: "Stepless", text: "Turns smoothly, so any change is possible. Needs a reference mark to find your way back.", accent: true },
    ] },
    { id: "dose", title: "Single dosing and retention", sub: "what stays in the grinder", layout: "split", liked: false,
      textOnlyNote: "no counts here: makers rarely publish retention (see the grinder filters for single-dose models)", options: [
      { label: "Hopper", text: "Beans sit on top and you grind what you need. The next dose pushes out some stale coffee left inside." },
      { label: "Single dose", text: "Weigh beans for one brew and grind it all. Best if you switch beans or brew methods often.", accent: true },
    ] },
    { id: "method", title: "Pour-over vs immersion vs drip", sub: "how water meets coffee", layout: "cards", liked: "pour",
      spec: { key: "method", label: "Brew method", column: "balance", classify: methodOf },
      rule: "Pick by effort: immersion is easiest, pour-over the most hands-on.", options: [
      { value: "immersion", label: "Immersion", text: "Coffee steeps in water, as in a French press or AeroPress. The most forgiving way to start.", best: "an easy, full cup" },
      { value: "pour", label: "Pour-over", text: "Water passes through coffee in a paper filter: a clean cup that rewards a steady pour.", best: "a clean, bright cup" },
      { value: "drip", label: "Drip machine", text: "Automates pour-over. Good ones heat water properly and wet the coffee evenly; cheap ones often don't.", best: "a full pot" },
    ] },
    { id: "spout", title: "Gooseneck kettles", sub: "a thin, steady stream", layout: "split", liked: "gooseneck",
      spec: { key: "spout", label: "Spout", column: "balance", classify: spoutOf },
      rule: "Buy a gooseneck only if you brew pour-over. Set temperatures help with light and dark roasts, and with tea.", options: [
      { value: "gooseneck", label: "Gooseneck", text: "You control where and how fast water hits the coffee. That matters for pour-over.", accent: true },
      { value: "standard", label: "Standard spout", text: "Fine for French press, AeroPress, tea and espresso setups." },
    ] },
    { id: "scale", title: "Why scales matter", sub: "recipes are ratios", layout: "numbers", liked: false,
      textOnlyNote: "no counts here: drip-tray fit and smart features are in each scale's specs (see the scale filters)", options: [
      { big: "0.1 g", label: "Reads tenths", text: "Scoops vary with roast and bean size; a 0.1 g scale lets you repeat a good cup." },
      { big: "timer", label: "Built-in timer", text: "Change one thing at a time and see what it did.", accent: true },
      { big: "fits", label: "Fits the drip tray", text: "For espresso it must sit under the portafilter and react fast." },
    ] },
  ],
  home: { section: "heater", title: "Which espresso machine type is for you?", link: "Boilers, burrs & goosenecks explained → coffee gear guide" },
  cta: { title: "Skip the theory. Get matched.", text: "Tell us what you need and how you make coffee; we'll rank the gear for you.", button: "Find your gear →" },
};
