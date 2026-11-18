// DiscGolfRecs disc guide (/guide), owner mock S8ZGdwXLf1VdGPcYrpeoQ1 (2026-11-16): flight numbers explained first (the home's
// flight boxes link here), then type, stability, speed for your arm and plastic. The config shape is in lib/niche/GUIDE.md. Copy
// only: every count and "most-liked" disc is worked out from the catalogue (lib/guide.ts). Flight numbers and plastic have no
// catalogue filter behind them, so they stay text-only and say so.
import type { GuideConfig } from "../guide";
import { flightOf } from "../discgolf-profile";

/** Disc type from the shape spec ("Fairway driver" → fairway). */
export const discTypeOf = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /putter/.test(x) ? "putter" : /mid/.test(x) ? "midrange" : /fairway/.test(x) ? "fairway" : /distance/.test(x) ? "distance" : null; };
/** Stability from the flight numbers (turn + fade): 0 or less understable, 1–2 stable, 3+ overstable. */
/** A disc's one stability (audit 2026-11-17: the top tag, the flight box, the catalogue filter, the match and the other-disc cards
 *  all read this): overstable at turn + fade ≥ 3; understable with a real turn (≤ −2) or turn + fade ≤ −1; else stable. So the
 *  Scorch (−2 / 2) is understable and the MD1 (0 / 0) stable, as their makers say. */
export const stabilityOfFlight = (f: { turn: number; fade: number } | null) => !f ? null : f.turn + f.fade >= 3 ? "overstable" as const
  : f.turn <= -2 || f.turn + f.fade <= -1 ? "understable" as const : "stable" as const;
export const stabilityOf = (s: string | null | undefined) => stabilityOfFlight(flightOf(s));
/** Speed band for an arm: up to 7 for any arm, 8–10 for a 250–325 ft arm, 11+ needs 325 ft or more to fly as rated. */
export const speedBandOf = (s: string | null | undefined) => { const f = flightOf(s); if (!f) return null; return f.speed <= 7 ? "slow" : f.speed <= 10 ? "mid" : "fast"; };

export const discgolfGuide: GuideConfig = {
  title: "Disc golf disc guide: flight numbers, stability & speed explained",
  description: "What speed, glide, turn and fade mean, which disc type and stability suit your arm, and how plastic changes a disc, with how many discs of each we track.",
  crumb: "disc guide",
  h1: ["Disc golf discs,", "decoded"],
  intro: "Four numbers, four disc types and one question about your arm decide how a disc flies for you. Here's what each means, in plain words.",
  tldr: [
    { label: "Beginner", desc: "putter, midrange, understable fairway", picks: { level: "beginner", arm: true } },
    { label: "Slower arm", desc: "speed 7 or less, or an understable 8–9", picks: { arm: true } },
    { label: "Improving", desc: "stable fairways and mids", picks: { level: "intermediate" } },
    { label: "Big arm", desc: "overstable distance drivers", picks: { level: "advanced", style: "power" } },
  ],
  sections: [
    { id: "flight", title: "Flight numbers", sub: "speed · glide · turn · fade", layout: "numbers", liked: false,
      textOnlyNote: "no counts here: every disc has all four, from its maker",
      rule: "The numbers assume a big, clean arm. With a slower arm, a disc flies more overstable than its turn and fade say.", options: [
      { label: "Speed", big: "1–15", text: "How fast it must be thrown to fly as rated. Higher needs more arm." },
      { label: "Glide", big: "1–7", text: "How long it stays in the air. More glide, easier distance." },
      { label: "Turn", big: "+1 to −5", text: "How far it drifts right early (right-hand backhand). More negative, more turn." },
      { label: "Fade", big: "0–5", text: "How hard it hooks left at the end. Higher, harder finish." },
    ] },
    { id: "type", title: "Disc type", sub: "what each one is for", layout: "cards", liked: "midrange",
      spec: { key: "disc", label: "Disc type", column: "shape", classify: discTypeOf }, options: [
      { value: "putter", label: "Putter", text: "Slow and straight, for putts and short approaches.", best: "every bag, every level" },
      { value: "midrange", label: "Midrange", text: "Straight and predictable; the most forgiving disc to learn on.", best: "beginners, upshots" },
      { value: "fairway", label: "Fairway driver", text: "Control off the tee; easier than a distance driver at most speeds.", best: "most players' drives" },
      { value: "distance", label: "Distance driver", text: "Max distance, but only with the arm speed to match.", best: "325 ft arms and up" },
    ] },
    { id: "stability", title: "Stability", sub: "turn plus fade", layout: "scale", liked: "stable",
      spec: { key: "stab", label: "Stability", column: "weight", classify: stabilityOf },
      rule: "Slower arm? Go understable. Windy course or forehand? Go overstable.", options: [
      { value: "understable", label: "Understable", text: "Drifts right and turns over easily. Helps slower arms fly straight and far." },
      { value: "stable", label: "Stable", text: "Flies straight with a gentle finish. The safe pick for most shots." },
      { value: "overstable", label: "Overstable", text: "Fights the wind and hooks left at the end. Reliable for big arms and forehands." },
    ] },
    { id: "speed", title: "Speed for your arm", sub: "match the disc to your throw", layout: "numbers", liked: "slow",
      spec: { key: "spd", label: "Speed", column: "weight", classify: speedBandOf },
      rule: "Most players gain more distance from a slower disc thrown cleanly than from a faster one they can't power.", options: [
      { value: "slow", label: "Any arm", big: "1–7", text: "Putters, mids and slow fairways. Fly as rated for nearly everyone.", accent: true, liked: "slow-speed" },
      { value: "mid", label: "250–325 ft", big: "8–10", text: "Fairway drivers. Need a smooth, moderate throw." },
      { value: "fast", label: "325 ft +", big: "11–15", text: "Distance drivers. Without the arm they just fade early." },
    ] },
    { id: "plastic", title: "Plastic", sub: "base or premium", layout: "split", liked: false,
      textOnlyNote: "no counts here: most molds come in several plastics (see each disc's page)", options: [
      { label: "Base", text: "Grippier and cheaper, but beats in faster and turns more over time. Often best for putters." },
      { label: "Premium", text: "Lasts longer and holds its flight, a little more overstable when new.", accent: true },
    ] },
  ],
  buys: { section: "type", kicker: "// what players actually bag" },
  home: { section: "stability", title: "Browse by stability", link: "Flight numbers, stability & plastic explained → disc guide" },
  cta: { title: "Skip the theory. Get matched.", text: "Pick your level and arm to see every disc ranked for you.", button: "Find your disc →" },
};
