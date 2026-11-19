// PadelRecs racket guide (/guide), owner 2026-11-16, Claude Design mock Mc3i2eFFXPUgzLDQvfQTT8; the config shape is in
// lib/niche/GUIDE.md. Copy only: every count and "most-liked" racket on the page is worked out from the catalogue (lib/guide.ts). Surface (smooth vs rough) and Budget have
// no catalogue data behind them (no texture spec, prices for too few rackets), so they stay text-only and say so.
import { balanceOf, faceOf, type GuideConfig } from "../guide";

export const padelGuide: GuideConfig = {
  title: "Padel racket guide: shape, feel, balance & weight explained",
  description: "What shape, feel, balance, weight and face mean for your padel game, in plain words, with how many rackets of each we track and the one players like most.",
  crumb: "racket guide",
  h1: ["Padel rackets,", "decoded"],
  intro: "Seven things decide how a racket feels and what you pay. Here's what each one means for your game, in plain words.",
  tldr: [
    { label: "Beginner", desc: "round, soft, low balance", picks: { level: "beginner" } },
    { label: "Sore elbow", desc: "soft core, light, low balance", picks: { arm: true } },
    { label: "Improving", desc: "teardrop, medium feel", picks: { level: "intermediate" } },
    { label: "Advanced attacker", desc: "diamond, hard, high balance", picks: { level: "advanced", style: "power" } },
  ],
  sections: [
    { id: "shape", title: "Shape", sub: "where the sweet spot sits", layout: "cards", filter: "shape", liked: "round", options: [
      { value: "round", icon: "round", label: "Round", text: "Biggest sweet spot: control and forgiveness on every hit.", best: "beginners, defenders" },
      { value: "teardrop", icon: "teardrop", label: "Teardrop", text: "The all-rounder. A bit of power, a bit of control.", best: "most intermediates" },
      { value: "hybrid", icon: "hybrid", label: "Hybrid", text: "Between round and teardrop, with a forgiving feel.", best: "improvers stepping up" },
      { value: "diamond", icon: "diamond", label: "Diamond", text: "Most power, smallest sweet spot. Rewards clean technique.", best: "advanced attackers" },
    ] },
    { id: "feel", title: "Feel", sub: "how soft the core is", layout: "scale", filter: "feel", liked: "soft",
      rule: "Sore arm or still learning? Go soft. Want precise volleys and you hit hard? Go hard.", options: [
      { value: "soft", label: "Soft", text: "Comfy and bouncy; easy power at slow speeds, kind to the arm." },
      { value: "medium", label: "Medium", text: "A bit of both; forgiving but still precise." },
      { value: "firm", label: "Hard / dry", text: "Direct and precise; little bounce, you supply the power.", liked: "hard" },
    ] },
    { id: "balance", title: "Balance", sub: "where the weight sits", layout: "toggles", liked: "medium",
      spec: { key: "balance", label: "Balance", column: "balance", classify: balanceOf }, options: [
      { value: "low", label: "Low", kicker: "Live at the net?", text: "Quick hands, easy to control." },
      { value: "medium", label: "Medium", kicker: "Not sure?", text: "Balanced feel, the safe choice for most players.", accent: true, liked: "medium-balance" },
      { value: "high", label: "High", kicker: "Live for the smash?", text: "Heavier smashes, but slower and more tiring." },
    ] },
    { id: "weight", title: "Weight", sub: "how heavy in the hand", layout: "numbers", filter: "weight", liked: "medium",
      rule: "Most players are happiest between 355 and 370 g. Removable weights let you fine-tune.", options: [
      { value: "light", label: "Light", big: "<355g", text: "Quick and kinder to the arm." },
      { value: "medium", label: "Medium", big: "355–370g", text: "The sweet spot for most players.", accent: true, liked: "medium-weight" },
      { value: "heavy", label: "Heavy", big: "370g+", text: "Stable and powerful, but tiring over long matches." },
    ] },
    { id: "surface", title: "Surface", sub: "smooth or textured", layout: "split",
      textOnlyNote: "no counts here yet: maker specs rarely say how rough a face is", options: [
      { label: "Smooth", text: "Flatter, faster shots with less grip on the ball. Fine if you rarely add spin." },
      { label: "Rough", text: "Textured face that bites the ball for extra spin on slices, víboras and kick smashes.", accent: true },
    ] },
    { id: "face", title: "Face", sub: "what it's made of", layout: "dark-split", liked: "carbon",
      spec: { key: "face", label: "Face", column: "surface", classify: faceOf }, options: [
      { value: "fibreglass", label: "Fibreglass", text: "Softer, more forgiving, cheaper." },
      { value: "mixed", label: "Fibreglass + carbon", text: "A blend: some of the comfort, some of the crispness.", liked: "fibreglass-carbon" },
      { value: "carbon", label: "Carbon", note: "3K–18K", text: "Crisper, more power, more demanding.", accent: true },
    ] },
    { id: "budget", title: "Budget", sub: "what you get for your money", layout: "numbers", liked: false,
      textOnlyNote: "no counts here yet: we don't have reliable prices for most rackets", options: [
      { label: "Entry", big: "<€100", text: "Fibreglass faces, beginner-friendly." },
      { label: "Sweet spot", big: "€100–200", text: "Where most intermediates land. Carbon faces.", accent: true },
      { label: "Pro lines", big: "€200+", text: "Firmer and more demanding; only worth it if you hit clean." },
    ] },
  ],
  buys: { section: "shape", kicker: "// what players actually buy", tail: { unlessTop: "diamond", text: "Diamonds are for people who already hit clean." } },
  overheard: {
    kicker: "// overheard at the club",
    reportId: "research-8f6bf039-2c49-45c2-9b4a-9c836bde986f",
    words: "I was dumb and just bought whatever the top player uses",
    who: "a player on a padel forum",
    similar: ["research-2ad8c5bd-1ec3-4279-a0f2-44356f78e1c1", "9af7b316-1f17-4b27-94be-6cc98dca4c52"],
    lesson: "Buy for your game, not theirs.",
  },
  home: { section: "shape", title: "Browse by shape", link: "Feel, balance & weight explained → racket guide" },
  cta: { title: "Skip the theory. Get matched.", text: "Pick your level and style to see every racket ranked for you.", button: "Find your racket →" },
};
