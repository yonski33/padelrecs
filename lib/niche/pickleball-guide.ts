// PickleballRecs paddle guide (/guide), owner 2026-11-16: the owner's Claude Design mock ("copy the exact same"), on the same
// template as padel's (lib/niche/GUIDE.md). Copy only: every count and "most-liked" paddle is worked out from the catalogue
// (lib/guide.ts). Surface (grit) and budget have no catalogue data behind them (makers rarely spec grit, and we hold no reliable
// prices), so they are text-only and say so. Balance is read from the swing-weight spec, which few makers publish.
import { swingBalanceOf, paddleFace2Of, type GuideConfig } from "../guide";

export const pickleballGuide: GuideConfig = {
  title: "Pickleball paddle guide: shape, feel, weight & face explained",
  description: "What shape, feel, balance, weight, surface and face mean for your pickleball game, in plain words, with how many paddles of each we track and the one players like most.",
  crumb: "paddle guide",
  h1: ["Pickleball paddles,", "decoded"],
  intro: "Seven things decide how a paddle feels and what you pay. Here's what each one means for your game, in plain words.",
  tldr: [
    { label: "Beginner", desc: "standard, 16mm core, mid weight", picks: { level: "beginner" } },
    { label: "Sore elbow", desc: "16mm core, soft face, mid weight", picks: { arm: true } },
    { label: "Improving", desc: "hybrid, 16mm, gritty face", picks: { level: "intermediate" } },
    { label: "Advanced attacker", desc: "elongated, 14mm, head-heavy", picks: { level: "advanced", style: "power" } },
  ],
  sections: [
    { id: "shape", title: "Shape", sub: "where the sweet spot sits", layout: "cards", filter: "shape", liked: "standard", options: [
      { value: "standard", icon: "pb-standard", label: "Standard", text: "Widest sweet spot and quickest hands at the kitchen.", best: "beginners, kitchen players" },
      { value: "elongated", icon: "pb-elongated", label: "Elongated", text: "More reach and power on drives and serves.", best: "singles, bangers" },
      { value: "hybrid", icon: "pb-hybrid", label: "Hybrid", text: "Between standard and elongated: a little reach, still forgiving.", best: "most intermediates" },
      { value: "widebody", icon: "pb-widebody", label: "Widebody", text: "Extra-wide face, maximum forgiveness, least reach.", best: "beginners, doubles" },
    ] },
    { id: "feel", title: "Feel", sub: "how soft the core is", layout: "scale", filter: "feel", liked: "soft",
      rule: "Sore arm or still learning? Go soft. Want precise volleys and you hit hard? Go hard.", options: [
      { value: "soft", label: "Soft", text: "Comfy and bouncy; easy power at slow speeds, kind to the arm." },
      { value: "medium", label: "Medium", text: "A bit of both; forgiving but still precise." },
      { value: "firm", label: "Hard / dry", text: "Direct and precise; little bounce, you supply the power.", liked: "hard" },
    ] },
    { id: "balance", title: "Balance", sub: "where the weight sits", layout: "toggles", liked: "even-balance",
      spec: { key: "balance", label: "Balance", column: "balance", classify: swingBalanceOf }, options: [
      { value: "low", label: "Low", kicker: "Live at the net?", text: "Quick hands, easy to control." },
      { value: "medium", label: "Medium", kicker: "Not sure?", text: "Balanced feel, the safe choice for most players.", accent: true, liked: "even-balance" },
      { value: "high", label: "High", kicker: "Live for the drive?", text: "Heavier drives, but slower hands and more tiring." },
    ] },
    { id: "weight", title: "Weight", sub: "how heavy in the hand", layout: "numbers", filter: "weight", liked: "medium",
      rule: "Most players are happiest between 7.8 and 8.2 oz. Lead tape lets you fine-tune.", options: [
      { value: "light", label: "Light", big: "<7.6oz", text: "Quick and kinder to the arm." },
      { value: "medium", label: "Medium", big: "7.6–8.2oz", text: "The sweet spot for most players.", accent: true, liked: "mid-weight" },
      { value: "heavy", label: "Heavy", big: "8.2oz+", text: "Stable and powerful, but tiring over long matches." },
    ] },
    { id: "surface", title: "Surface", sub: "smooth or textured", layout: "split",
      textOnlyNote: "no counts here yet: makers rarely say how gritty a face is, and grit wears with play", options: [
      { label: "Smooth", text: "Flatter, faster shots with less grip on the ball. Fine if you mostly block and reset." },
      { label: "Gritty", text: "Textured face that grips the ball for extra spin on rolls, drops and serves.", accent: true },
    ] },
    { id: "face", title: "Face", sub: "what it's made of", layout: "dark-split", liked: "carbon",
      spec: { key: "face", label: "Face", column: "surface", classify: paddleFace2Of }, options: [
      // One story with the product pages' face cards (Grok audit 2026-11-17, #22): carbon = control and spin, fiberglass = pop.
      { value: "fiberglass", label: "Fiberglass", text: "Softer and poppier, more forgiving, cheaper." },
      { value: "carbon", label: "Carbon", note: "T700", text: "Crisper, with more control and spin; more demanding.", accent: true },
    ] },
    { id: "budget", title: "Budget", sub: "what you get for your money", layout: "numbers", liked: false,
      textOnlyNote: "no counts here yet: we don't have reliable prices for most paddles", options: [
      { label: "Entry", big: "<$80", text: "Fiberglass faces, beginner-friendly." },
      { label: "Sweet spot", big: "$80–180", text: "Where most intermediates land. Carbon faces.", accent: true },
      { label: "Pro lines", big: "$180+", text: "Firmer and more demanding; only worth it if you hit clean." },
    ] },
  ],
  buys: { section: "shape", kicker: "// what players actually buy", tail: { unlessTop: "elongated", text: "Elongated is for players who already hit clean." } },
  // The home's tiles keep the home mock's own words and paddle icons (three shapes, no widebody).
  home: { section: "shape", title: "Which shape is for you?", link: "Core, face & weight explained → paddle guide", tiles: {
    standard: { icon: "standard", text: "Widest sweet spot and quickest hands. The safe pick for most players." },
    elongated: { icon: "elongated", text: "More reach and power on drives and serves. Smaller sweet spot." },
    hybrid: { icon: "hybrid-paddle", text: "A little extra reach without losing much forgiveness." } } },
  cta: { title: "Skip the theory. Get matched.", text: "Pick your level and style to see every paddle ranked for you.", button: "Find your paddle →" },
};
