// DiscGolfRecs on the shared v2 shell (PM / owner 2026-11-16, option A: "other sites supply only a profile plus a yardstick";
// lib/engine untouched). The disc golf profile in the racket format (lib/fit-config.ts) plus the adapter that turns disc golf's
// own evidence rows (scripts/discgolf-evidence.mts, dg-*-v1) into the rows the shared engine reads:
//   stability  the engine's style axis: understable = its "control" end, overstable = its "power" end. Starts from the flight
//              numbers (turn + fade, the spec lean), moved by player and reviewer evidence and the expert's value.
//   slower arm the engine's arm slot: discs that suit a slower arm (reader / writer rows, the speed rating as the prior). A
//              speed-12 disc reads as more overstable for a slower arm, so with "slower arm" picked those rank lower.
//   level      the shared level suits (lib/level-suits.ts): reader "suits" statements and writers' stated levels.
//   type       a hard filter on the disc type (putter / midrange / fairway / distance), never a score.
import type { FitConfig } from "./fit-config";
import type { EvidenceRow } from "./evidence";
import { flightOf } from "./discgolf-profile";
import { stabilityOfFlight } from "./niche/discgolf-guide";

const clamp = (o: Record<string, number>) => { for (const k of Object.keys(o)) o[k] = Math.max(-1, Math.min(1, o[k])); return o; };
/** The catalogue's median turn + fade (discgolfrecs, 2026-11-15: 1): a typical disc's stability. */
const MID_TF = 1;

/** The disc types the home's type picker offers, as the catalogue's shape values (the URL key first). */
export const DISC_TYPES: [string, string, string][] = [["putter", "Putter", "putters"], ["midrange", "Midrange", "midranges"], ["fairway", "Fairway driver", "fairway drivers"], ["distance", "Distance driver", "distance drivers"]];

export const DISCGOLF_FIT: FitConfig = {
  traits: [
    { key: "control", hidden: true, diff: "more understable", ifYou: "need it to turn over easily", label: "Understable", plus: [["understable", 1], ["too flippy", 1]], minus: [], noun: "how easily it turns",
      ev: [["call it understable", "calls it understable"], ["", ""]] },
    { key: "power", hidden: true, diff: "more overstable", ifYou: "want a reliable fade in wind", label: "Overstable", plus: [["overstable", 1], ["too overstable", 1]], minus: [], noun: "how hard it fades",
      ev: [["call it overstable", "calls it overstable"], ["", ""]] },
    { key: "arm", say: { hi: "Easy to throw; it flies right even for slower arms.", mid: "Needs some arm speed to fly as rated.", lo: "Needs a big arm to fly as rated.", split: ["easy to throw", "demanding"] }, diff: "easier for a slower arm", ifYou: "have a slower arm", label: "Easy to throw", plus: [["beginner-friendly", 0.5]], minus: [], noun: "how easy it is to throw",
      ev: [["call it easy to throw", "calls it easy to throw"], ["say it needs a big arm", "says it needs a big arm"]] },
    { key: "distance", say: { hi: "Big distance.", mid: "Moderate distance.", lo: "Short on distance; it is built for other shots.", split: ["long", "short"] }, diff: "longer", ifYou: "want more distance", label: "Distance", plus: [["long", 1]], minus: [], noun: "the distance",
      ev: [["call it long", "calls it long"], ["find it short", "finds it short"]] },
    { key: "accuracy", say: { hi: "Holds its line; it flies true.", mid: "Fairly accurate.", lo: "Hard to keep on line.", split: ["accurate", "inconsistent"] }, diff: "more accurate", ifYou: "want it to hold your line", label: "Accuracy", plus: [["accurate", 1], ["holds lines", 1]], minus: [["inconsistent between runs", 1]], noun: "how true it flies",
      ev: [["call it accurate", "calls it accurate"], ["find it inconsistent", "finds it inconsistent"]] },
    { key: "glide", say: { hi: "Lots of glide; it carries.", mid: "Average glide.", lo: "Little glide; it drops out of the air.", split: ["glidey", "low on glide"] }, diff: "more glide", ifYou: "want easy distance", label: "Glide", plus: [["lots of glide", 1]], minus: [], noun: "the glide",
      ev: [["praise the glide", "praises the glide"], ["find little glide", "finds little glide"]] },
    { key: "wind", say: { hi: "Steady in the wind.", mid: "Fine in light wind.", lo: "Gets pushed around in the wind.", split: ["steady in wind", "pushed around by wind"] }, diff: "better in wind", ifYou: "play windy courses", label: "Wind", plus: [["good in wind", 1]], minus: [], noun: "how it handles wind",
      ev: [["say it handles wind", "says it handles wind"], ["say wind pushes it around", "says wind pushes it around"]] },
    { key: "forehand", hidden: true, diff: "better on forehand", ifYou: "throw a lot of forehands", label: "Forehand", plus: [["good for forehands", 1]], minus: [], noun: "how it throws forehand",
      ev: [["like it for forehands", "likes it for forehands"], ["say it turns on forehands", "says it turns on forehands"]] },
    { key: "grip", hidden: true, diff: "grippier", ifYou: "want a sure grip", label: "Grip", plus: [["great grip", 1]], minus: [["slippery", 1]], noun: "the grip",
      ev: [["praise the grip", "praises the grip"], ["find it slippery", "finds it slippery"]] },
    { key: "durability", say: { hi: "Holds its flight as it beats in.", mid: "Beats in at a normal rate.", lo: "Beats in fast; the flight changes.", split: ["durable", "quick to beat in"] }, diff: "lasts longer", ifYou: "want it to hold its flight", label: "Durability", plus: [], minus: [["beats in fast", 1]], noun: "how long it holds its flight",
      ev: [["say it holds its flight", "says it holds its flight"], ["say it beats in fast", "says it beats in fast"]] },
  ],
  complaint: ["accuracy", "grip"],
  axis: { control: { trait: "control", tags: ["understable", "too flippy"] }, power: { trait: "power", tags: ["overstable", "too overstable"] } },
  styleLabels: { control: "Understable", balance: "Stable", power: "Overstable" },
  levelWords: { beginner: ["first disc", "first driver", "new to disc golf", "just started", "noodle arm"], intermediate: ["league", "casual rounds", "throw 300"], advanced: ["tournament", "rated 930", "throw 400", "big arm"],
    rating: { name: "PDGA rating", beginnerBelow: 850, advancedFrom: 930 } },
  weights: { style: 0.4, level: 0.3, arm: 0.2, score: 0.1 },
  arm: { trait: "arm", plus: "beginner-friendly" },
  forgiving: { plus: "beginner-friendly", minus: ["too overstable"], beginner: ["too overstable"] },
  // The flight numbers (stored in the weight column) as the starting lean, each within ±1.
  specLean: s => {
    const o: Record<string, number> = { control: 0, power: 0, arm: 0, glide: 0 };
    const f = flightOf(s.weight);
    if (!f) return o;
    const tf = f.turn + f.fade - MID_TF;
    o.power += 0.3 * tf; o.control -= 0.3 * tf;
    // A slower arm: low speed and some turn help; a fast, beefy driver needs power to fly as rated.
    o.arm += f.speed <= 5 ? 0.6 : f.speed <= 9 ? (f.turn <= -1 ? 0.5 : 0.1) : f.speed <= 11 ? (f.turn <= -2 ? 0 : -0.4) : (f.turn <= -2 ? -0.3 : -0.8);
    o.glide += 0.3 * (f.glide - 5);
    return clamp(o);
  },
  lines: {},
  sourceWords: { forum: "disc golf forum", blog: "disc golf blog" },
  word: "disc",
  sport: "disc golf",
  emoji: "🥏",
  dotsWords: "understable, overstable, good for slower arms, glidey, accurate, good in wind, good for forehands or grippy",
  specWords: s => [s.weight ? `flight ${s.weight}` : null],
  reviewerSources: ["YouTube", "Blog"],
  scale: { rank: "net", top4: 0.4, top5: 0.09 },
  quick: { types: DISC_TYPES.map(([key, shape, many]) => ({ key, shape, many })), want: "I need a", arm: "slower arm speed", armChip: "slow-arm friendly",
    stabilityLabel: "Stability", flightLabel: "speed · glide · turn · fade",
    // "Slow-arm friendly" only where the flight numbers agree: speed 9 or less and turn + fade 2 or less (match audit 2026-11-16:
    // Firebird 9/3/0/4 and Resistor had the chip); a page that tells slow arms to skip it also drops it (app/home-payload.ts).
    leanFor: { control: "turnovers and hyzer flips", balance: "straight lines", power: "forehands, wind and a reliable fade" },
    // The guide's slow-arm rule (site audit 2026-11-17 #22: one rule for the guide, the chip and the best-for lines): speed 7 or
    // less with turn + fade ≤ 2, or an understable 8–9.
    armSpecOk: s => { const f = flightOf(s.weight); return !!f && ((f.speed <= 7 && f.turn + f.fade <= 2) || (f.speed <= 9 && stabilityOfFlight(f) === "understable")); },
    beginnerShapeNote: "A distance driver: few of them fly well for beginners." },
  evidenceAdapter: discgolfEvidence,
};

/** Disc golf's evidence rows (dg-*-v1, scripts/discgolf-evidence.mts) as the rows the shared engine reads. Pure. */
export function discgolfEvidence(rows: EvidenceRow[]): EvidenceRow[] {
  const out: EvidenceRow[] = [];
  const LV: Record<string, number> = { suits_beginner: 0, suits_intermediate: 1, suits_advanced: 2 };
  for (const r of rows) {
    if (r.sourceKind === "maker" || r.sourceKind === "owner" || r.value === null) continue;
    const tags = r.extractedBy === "dg-tags-v1" || r.extractedBy === "dg-form-v1";
    const by = tags ? "tags-v1" : r.extractedBy === "dg-reader-v1" ? "reader-v1" : null;
    if (!by) continue;
    // A writer's own group carried that writer's verdict: the report itself, so the shared level reader takes liked from it.
    const writer = /writer:/.test(r.sourceRef) || r.extractedBy === "dg-form-v1";
    const ref = r.sourceRef.replace(/writer:.*$/, "").replace(/#form$|form$/, "");
    const row = (attribute: string, value: number, extractedBy = by): EvidenceRow => ({ ...r, attribute, value, sourceRef: ref + (r.sourceRef.includes("#") ? r.sourceRef.slice(r.sourceRef.indexOf("#")) : ""), extractedBy });
    if (r.attribute === "stability") out.push(r.value > 0 ? row("power", 1) : row("control", 1));
    else if (r.attribute === "suits_arm_slow") out.push(row("arm", Math.sign(r.value)));
    else if (r.attribute in LV) {
      if (writer) { if (r.value !== 0) out.push({ ...row("level", LV[r.attribute], "level-v1"), sourceRef: ref }); }
      else if (r.value > 0) out.push(row("level", LV[r.attribute], "reader-v1"));
      // "Not for beginners": it suits players past that level.
      else if (r.attribute === "suits_beginner") out.push(row("level", 2, "reader-v1"));
      else if (r.attribute === "suits_advanced") out.push(row("level", 0, "reader-v1"));
    } else if (["glide", "accuracy", "wind", "forehand", "grip", "distance"].includes(r.attribute)) out.push(row(r.attribute, Math.sign(r.value)));
    // Beat-in +1 is "seasons fast": a durability complaint.
    else if (r.attribute === "beat_in") out.push(row("durability", -Math.sign(r.value)));
  }
  return out;
}
