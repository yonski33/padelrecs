// SimRacingRecs gear guide (/guide), owner mock AgaVcamisXwobUR5sY9CDn (2026-11-16): drive type, torque, brake, platform, rig
// and budget, in plain words. The config shape is in lib/niche/GUIDE.md. Copy only: every count and "most-liked" product is
// worked out from the catalogue (lib/guide.ts). Platform and budget have no single spec column behind them here, so they stay
// text-only and say so. Expert voice, no testing claims (PM 2026-11-16).
import type { GuideConfig } from "../guide";
import { torqueOf } from "../attr-profile-simracing";

/** The gear type from the Category column (wheelbase, wheel, pedals). */
export const gearOf = (s: string | null | undefined) => ({ Wheelbase: "wheelbase", Wheel: "wheel", Pedals: "pedals" } as Record<string, string>)[s ?? ""] ?? null;
/** Cockpits and shifters / handbrakes, the guide's second gear section ("Rig & extras"). */
export const rigOf = (s: string | null | undefined) => ({ Cockpit: "cockpit", "Shifter / handbrake": "shifter" } as Record<string, string>)[s ?? ""] ?? null;
/** Wheelbase drive from the Type column ("Direct drive" → direct). */
export const driveOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /direct/.test(x) ? "direct" : /hybrid/.test(x) ? "hybrid" : /belt/.test(x) ? "belt" : /gear/.test(x) ? "gear" : null; };
/** Torque band from the Torque / brake force column ("12 Nm"): up to 8, 8 to 15, over 15. */
export const torqueBandOf = (s: string | null | undefined) => { const nm = torqueOf(s); return nm === null ? null : nm <= 8 ? "low" : nm <= 15 ? "mid" : "high"; };
/** Brake type from the Type column: load cell, hydraulic or active (motorised); a potentiometer is anything else stated. */
export const brakeOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return !x ? null : /hydraulic/.test(x) ? "hydraulic" : /active/.test(x) ? "active" : /load cell/.test(x) ? "loadcell" : /hall|pot/.test(x) ? "pot" : null; };

export const simracingGuide: GuideConfig = {
  title: "Sim racing gear guide: drive types, torque, load cells & rigs explained",
  description: "Direct drive vs belt, how much torque you need, load cell vs hydraulic brakes, console support, rigs and budget, with how many products of each we track.",
  crumb: "sim racing guide",
  h1: ["Sim racing gear,", "decoded"],
  intro: "A wheelbase, pedals and something solid to bolt them to. Here's what the specs mean, and which ones matter for how you race.",
  tldr: [
    { label: "Beginner", desc: "entry direct drive, load cell pedals later", picks: { level: "beginner" } },
    { label: "Console racer", desc: "a licensed base; check the platform first", picks: { arm: true } },
    { label: "Improving", desc: "load cell pedals and a rigid rig", picks: { level: "intermediate" } },
    { label: "All-in", desc: "15 Nm+, hydraulic brake, profile cockpit", picks: { level: "advanced" } },
  ],
  sections: [
    { id: "gear", title: "The gear", sub: "what each piece does", layout: "cards", liked: "pedals",
      spec: { key: "gear", label: "Category", column: "shape", classify: gearOf }, options: [
      { value: "wheelbase", label: "Wheelbase", text: "The motor that makes force feedback. Most of the feel, and most of the money.", best: "start here" },
      { value: "wheel", label: "Wheel", text: "The rim and buttons you hold. Pick the shape for what you race: round, GT or formula.", best: "your car type" },
      { value: "pedals", label: "Pedals", text: "Where lap time comes from. A load cell brake helps consistency more than torque does.", best: "the first upgrade" },
    ] },
    { id: "rig", title: "Rig & extras", sub: "what holds it, what you add", layout: "cards", liked: "cockpit",
      spec: { key: "rig", label: "Rig & extras", column: "shape", classify: rigOf }, options: [
      { value: "cockpit", label: "Cockpit", text: "Holds everything still. Past about 8 Nm, a desk or stand starts to flex.", best: "8 Nm and up" },
      { value: "shifter", label: "Shifter & handbrake", text: "H-pattern, sequential or a handbrake for rally and drift. Nice to have, not first.", best: "rally, drift, classics" },
    ] },
    { id: "drive", title: "Drive type", sub: "how the motor turns the wheel", layout: "cards", liked: "direct",
      spec: { key: "drive", label: "Drive", column: "balance", classify: driveOf }, options: [
      { value: "gear", label: "Gear", text: "Cheapest and loudest, with notchy force feedback. Fine for finding out if you like sim racing.", best: "a first try" },
      { value: "hybrid", label: "Hybrid", text: "Thrustmaster's belt plus gears: smoother than gear alone, still notchier than belt.", best: "entry console wheels" },
      { value: "belt", label: "Belt", text: "Smoother and quieter than gear. The classic budget pick, now under pressure from entry direct drive.", best: "tight budgets" },
      { value: "direct", label: "Direct drive", text: "The motor sits on the wheel shaft: sharp detail, strong force, no cogging. The upgrade most racers make.", best: "most racers today" },
    ] },
    { id: "torque", title: "Torque", sub: "how much force you need", layout: "scale", liked: "mid",
      spec: { key: "torque", label: "Torque", column: "weight", classify: torqueBandOf },
      rule: "More torque isn't more detail. Past about 8 Nm, the rig matters as much as the base.", options: [
      { value: "low", label: "Up to 8 Nm", text: "Plenty of detail for most cars, and a desk or wheel stand can still hold it." },
      { value: "mid", label: "8 to 15 Nm", text: "The sweet spot for serious racers. Wants a rigid cockpit." },
      { value: "high", label: "15 Nm +", text: "Realistic weight in heavy cars. Needs a profile rig and some care with settings." },
    ] },
    { id: "brake", title: "Brake pedal", sub: "travel or pressure", layout: "numbers", liked: "loadcell",
      spec: { key: "brake", label: "Brake", column: "balance", classify: brakeOf },
      rule: "A load cell is the single biggest step for consistent braking: you brake by pressure, like a real car.", options: [
      { value: "pot", label: "Travel sensor", big: "pot / hall", text: "Measures how far the pedal moves. Fine to start, hard to repeat lap after lap." },
      { value: "loadcell", label: "Load cell", big: "load cell", text: "Measures how hard you press. The upgrade racers mention most.", accent: true },
      { value: "hydraulic", label: "Hydraulic", big: "hydraulic", text: "The most car-like feel, for the most money and maintenance." },
      { value: "active", label: "Active", big: "motorised", text: "A motor shapes the pedal's feel, even ABS. Top end, and it needs a solid rig." },
    ] },
    { id: "platform", title: "Platform", sub: "PC, PlayStation or Xbox", layout: "split", liked: false,
      textOnlyNote: "no counts here: console support often depends on the wheel and base together (see each product's page)", options: [
      { label: "PC", text: "Everything works on PC, with the widest choice of sims and software." },
      { label: "Console", text: "Needs a base or wheel licensed for that console. Check the pairing before you buy.", accent: true },
    ] },
    { id: "budget", title: "Budget", sub: "where the money goes", layout: "split", liked: false,
      textOnlyNote: "no counts here: price bands are set per product type (see the gear list's budget filter)", options: [
      { label: "Entry", text: "Entry direct drive or belt and basic pedals. Spend on pedals before torque." },
      { label: "Sweet spot", text: "Direct drive, load cell pedals and a rig that doesn't flex.", accent: true },
      { label: "High-end", text: "High torque, hydraulics and motion. Real gains, but smaller each step." },
    ] },
  ],
  buys: { section: "drive", kicker: "// what racers actually run" },
  home: { section: "drive", title: "Which wheelbase drive is for you?", link: "Torque, load cells & rigs explained → sim racing guide" },
  cta: { title: "Skip the theory. Get matched.", text: "Tell us what you need and how you race; we'll rank the gear for you.", button: "Find your gear →" },
};
