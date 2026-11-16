// PickleballRecs paddle guide (/guide), owner 2026-11-16 ("Yes, start pickleball": shape, core thickness, weight, surface and
// grit); the same template as padel's (lib/niche/GUIDE.md). Copy only: every count and "most-liked" paddle is worked out from
// the catalogue (lib/guide.ts). Grit has no catalogue data behind it (makers rarely spec it, and it wears), so it is text-only
// and says so.
import { coreOf, paddleFaceOf, type GuideConfig } from "../guide";

export const pickleballGuide: GuideConfig = {
  title: "Pickleball paddle guide: shape, core, weight & surface explained",
  description: "What shape, core thickness, weight, feel and face mean for your pickleball game, in plain words, with how many paddles of each we track and the one players like most.",
  crumb: "paddle guide",
  h1: ["Pickleball paddles,", "decoded"],
  intro: "Six things decide how a paddle plays at the kitchen and on drives. Here's what each one means for your game, in plain words.",
  tldr: [
    { label: "New to the game", desc: "standard shape, 16 mm core, soft", picks: { level: "beginner" } },
    { label: "Sore elbow", desc: "16 mm core, soft, mid weight", picks: { arm: true } },
    { label: "Soft-game player", desc: "standard or hybrid, 16 mm, raw carbon", picks: { level: "intermediate", style: "control" } },
    { label: "Banger or singles", desc: "elongated, thinner core, heavier", picks: { level: "advanced", style: "power" } },
  ],
  sections: [
    { id: "shape", title: "Shape", sub: "length against sweet spot", layout: "cards", filter: "shape", liked: "standard", options: [
      { value: "elongated", icon: "elongated", label: "Elongated", text: "More reach and swing speed for drives and serves; a smaller sweet spot.", best: "bangers, singles players" },
      { value: "standard", icon: "standard", label: "Standard / hybrid", text: "The all-court middle: some reach, a forgiving face, quick at the kitchen.", best: "most doubles players" },
      { value: "wide", icon: "wide", label: "Wide", text: "The biggest sweet spot and the quickest hands; less reach.", best: "beginners, hand battles" },
    ] },
    { id: "core", title: "Core thickness", sub: "how thick the honeycomb is", layout: "split", liked: "thick",
      spec: { key: "core", label: "Core thickness", column: "core", classify: coreOf }, options: [
      { value: "thin", label: "14 mm and under", text: "Livelier and poppier, with more power on drives; less forgiving on resets." },
      { value: "thick", label: "16 mm", text: "Softer and more stable: easier dinks and resets, and kinder to the arm.", accent: true, liked: "16 mm" },
    ] },
    { id: "weight", title: "Weight", sub: "how heavy in the hand", layout: "numbers", filter: "weight", liked: "medium",
      rule: "Most players are happiest around 7.8 to 8.2 oz. Lead tape lets you add weight later.", options: [
      { value: "light", label: "Light", big: "<7.8oz", text: "Quick hands at the kitchen; less plow-through on drives." },
      { value: "medium", label: "Medium", big: "7.8–8.2oz", text: "The balance most players settle on.", accent: true, liked: "medium-weight" },
      { value: "heavy", label: "Heavy", big: "8.2oz+", text: "Stable and powerful, but slower in fast exchanges." },
    ] },
    { id: "feel", title: "Feel", sub: "soft or firm off the face", layout: "scale", filter: "feel", liked: "soft",
      rule: "Sore arm or a soft game? Go soft. Want crisp feedback and you swing fast? Go firm.", options: [
      { value: "soft", label: "Soft", text: "Plush and muted; the ball stays on the face for touch shots." },
      { value: "medium", label: "Medium", text: "A bit of both; forgiving but still lively." },
      { value: "firm", label: "Firm / crisp", text: "Direct feedback and more pop; you feel every mishit.", liked: "firm" },
    ] },
    { id: "face", title: "Surface", sub: "what the face is made of", layout: "dark-split", liked: "raw-carbon",
      spec: { key: "face", label: "Surface", column: "surface", classify: paddleFaceOf }, options: [
      { value: "fiberglass", label: "Fiberglass", text: "Springier and poppier, often cheaper; less bite on the ball." },
      { value: "carbon", label: "Carbon", text: "Crisp and controlled, a stiffer face with a consistent feel." },
      { value: "raw-carbon", label: "Raw carbon", text: "A textured carbon face that grips the ball for spin.", accent: true, liked: "raw carbon" },
    ] },
    { id: "grit", title: "Grit", sub: "how the face grips the ball", layout: "split",
      textOnlyNote: "no counts here yet: makers rarely say how gritty a face is, and grit wears with play", options: [
      { label: "Textured face", text: "Grip woven into the carbon itself; it wears slowly and evenly." },
      { label: "Sprayed grit", text: "A coating on top for extra bite when new; players often report it going smooth within months.", accent: true },
    ] },
  ],
  buys: { section: "shape", kicker: "// what players actually buy" },
  home: { section: "shape", title: "Browse by shape", link: "Core, weight & surface explained → paddle guide" },
  cta: { title: "Skip the theory. Get matched.", text: "Tell us your level and what you want more of; we'll rank every paddle for you.", button: "Find your paddle →" },
};
