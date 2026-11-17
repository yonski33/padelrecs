// SimRacingRecs on the shared v2 shell (PM / owner 2026-11-16: "a sim racing profile plus adapter, as disc golf did";
// lib/engine untouched). The sim racing profile in the racket format (lib/fit-config.ts), the adapter that turns sim racing's
// own evidence rows (scripts/simracing-evidence.mts, simracing-*-v1) into the rows the shared engine reads, and the catalogue
// facts the home's hard filters read:
//   type     the type picker (wheelbase, wheel, pedals, cockpit, shifter / handbrake): a hard filter, never a score.
//   level    new / serious / all-in on the shared level suits (PM 2026-11-16): new = drivers new to sim racing (writers who
//            say so; the expert's "first sim rig" value), serious = drivers upgrading (writers who moved up to it; the expert's
//            "upgrade" value), all-in = the upgrade suits plus the type's top price third ($$$).
//   console  "I race on console": a hard filter on the platforms (the owner's sheet over the catalogue column), not a score.
//   fine-tune drive type (wheelbases), budget (the owner's per-type price thirds), and the rim type for wheels only.
//   style    none: sim racing has no control / power axis, so the engine's style part stays at "any".
// The ten qualities are trait bars, each on the product types it applies to (appliesTo); the old attribute profile
// (lib/attr-profile-simracing.ts) keeps the same keys.
import type { FitConfig, TraitDef } from "./fit-config";
import type { EvidenceRow } from "./evidence";
import { platformsOf, torqueOf } from "./attr-profile-simracing";

const clamp = (o: Record<string, number>) => { for (const k of Object.keys(o)) o[k] = Math.max(-1, Math.min(1, o[k])); return o; };
const WB = "Wheelbase", W = "Wheel", P = "Pedals", C = "Cockpit", S = "Shifter / handbrake";

/** The product types the home's type picker offers, as the catalogue's shape values (the URL key first). */
export const SIM_TYPES: [string, string, string][] = [["wheelbase", WB, "wheelbases"], ["wheel", W, "wheels"], ["pedals", P, "pedals"], ["cockpit", C, "cockpits"], ["shifter", S, "shifters & handbrakes"]];

const t = (key: string, label: string, appliesTo: string[] | undefined, plus: [string, number][], minus: [string, number][], noun: string, ev: TraitDef["ev"]): TraitDef =>
  ({ key, label, plus, minus, noun, ev, ...(appliesTo ? { appliesTo } : {}) });

/** The compare tabs' words per quality (lib/fit-config.ts TraitDef diff / need): where another product is ahead, and the need. */
const COMPARE: Record<string, [string, string]> = {
  ffb_detail: ["more detailed", "want to feel the road and the grip"], ffb_strength: ["stronger", "drive heavy cars or want real weight"],
  brake_feel: ["better under braking", "want consistent, real braking"], rigidity: ["more rigid", "run a strong base or brake hard"],
  build: ["better built", "want it to last"], quiet: ["quieter", "race late or share the room"], setup: ["easier to set up", "want it running tonight"],
  software: ["easier to tune", "like to tune and tweak"], ergonomics: ["more comfortable", "race long stints"], value: ["better value", "watch the budget"],
};
/** The "How it drives" notes per quality (Grok audit 2026-11-17 #27: not "Strong quiet: a real strength"). */
const SAY: Record<string, NonNullable<TraitDef["say"]>> = {
  ffb_detail: { hi: "Detailed force feedback: you feel the road and the grip.", mid: "Average force feedback detail.", lo: "Vague force feedback; little road texture.", split: ["detailed", "numb"] },
  ffb_strength: { hi: "Strong force feedback with real weight.", mid: "Moderate force feedback strength.", lo: "Weak force feedback; heavy cars feel light.", split: ["strong", "weak"] },
  brake_feel: { hi: "Great brake feel; easy to brake the same way every lap.", mid: "Decent brake feel.", lo: "Vague brake feel; hard to brake consistently.", split: ["consistent", "vague"] },
  rigidity: { hi: "Rigid: it stays put under load.", mid: "Some flex under hard use.", lo: "Flexes under load.", split: ["rigid", "flexy"] },
  build: { hi: "Well built; it holds up.", mid: "Average build quality.", lo: "Build or quality-control complaints.", split: ["solid", "faulty"] },
  quiet: { hi: "Quiet: a real strength.", mid: "Average noise.", lo: "Noisy in use.", split: ["quiet", "noisy"] },
  setup: { hi: "Easy to set up.", mid: "Average setup.", lo: "Fiddly to set up.", split: ["easy to set up", "fiddly"] },
  software: { hi: "Good software, easy to tune.", mid: "Average software.", lo: "Clunky software; tuning is a chore.", split: ["easy to tune", "clunky"] },
  ergonomics: { hi: "Comfortable over long races.", mid: "Average comfort.", lo: "Awkward over long races.", split: ["comfortable", "awkward"] },
  value: { hi: "Good value for what it does.", mid: "Fair value.", lo: "Overpriced for what it does.", split: ["good value", "overpriced"] },
};
/** The specs line's labels per product type (Grok audit 2026-11-17 #9: not disc golf's "flight", "rim", "plastics"). */
const SPEC_LABELS: Record<string, Partial<Record<"weight" | "balance" | "core" | "surface", string>>> = {
  [WB]: { weight: "Torque", balance: "Drive", core: "Platforms", surface: "Notes" },
  [P]: { weight: "Brake force", balance: "Sensor", core: "Platforms", surface: "Notes" },
  [W]: { weight: "Spec", balance: "Rim type", core: "Platforms", surface: "Notes" },
  [C]: { weight: "Spec", balance: "Frame", core: "Platforms", surface: "Seat & notes" },
  [S]: { weight: "Force", balance: "Type", core: "Platforms", surface: "Notes" },
};
export const SIMRACING_FIT: FitConfig = {
  traits: ([
    // The engine's two style slots carry the level picks (PM 2026-11-16): never shown as bars (appliesTo: none).
    { ...t("control", "New to sim racing", undefined, [], [], "how it suits drivers new to sim racing", [["", ""], ["", ""]]), hidden: true },
    { ...t("power", "Upgrading", undefined, [], [], "how it suits drivers upgrading", [["", ""], ["", ""]]), hidden: true },
    t("ffb_detail", "FFB detail", [WB], [["detailed force feedback", 1]], [], "the force feedback detail", [["praise the detail", "praises the detail"], ["find it numb", "finds it numb"]]),
    t("ffb_strength", "FFB strength", [WB], [["strong force feedback", 1]], [], "the force feedback strength", [["call it strong", "calls it strong"], ["find it weak", "finds it weak"]]),
    t("brake_feel", "Brake feel", [P], [["great brake feel", 1]], [], "the brake feel", [["praise the brake feel", "praises the brake feel"], ["fault the brake feel", "faults the brake feel"]]),
    t("rigidity", "Rigidity", [C, P, S], [["rigid", 1]], [["flex", 1]], "how rigid it is", [["call it rigid", "calls it rigid"], ["report flex", "reports flex"]]),
    t("build", "Build quality", undefined, [["solid build", 1]], [["quality control issues", 1], ["durability issues", 1]], "the build", [["praise the build", "praises the build"], ["report faults", "reports faults"]]),
    t("quiet", "Quiet", [WB, P, S], [], [["noisy", 1]], "the noise", [["call it quiet", "calls it quiet"], ["find it noisy", "finds it noisy"]]),
    t("setup", "Ease of setup", undefined, [["easy setup", 1]], [], "the setup", [["call setup easy", "calls setup easy"], ["found setup hard", "found setup hard"]]),
    t("software", "Software", [WB, W, P], [["good software", 1]], [["bad software", 1]], "the software", [["praise the software", "praises the software"], ["fault the software", "faults the software"]]),
    t("ergonomics", "Ergonomics", [W, C, S], [["great ergonomics", 1]], [], "the ergonomics", [["praise the ergonomics", "praises the ergonomics"], ["find it awkward", "finds it awkward"]]),
    t("value", "Value", undefined, [["great value", 1]], [["overpriced", 1]], "the value", [["call it good value", "calls it good value"], ["call it overpriced", "calls it overpriced"]]),
  ] as TraitDef[]).map(d => COMPARE[d.key] ? { ...d, diff: COMPARE[d.key][0], ifYou: COMPARE[d.key][1], say: SAY[d.key] } : d),
  complaint: ["build", "rigidity", "quiet", "software"],
  // No style axis on sim racing (the picks never set one); the engine reads these two traits for its axis, which stays neutral.
  axis: { control: { trait: "control", tags: [] }, power: { trait: "power", tags: [] } },
  styleLabels: { control: "New", balance: "Balanced", power: "Upgrade" },
  // No style picks (no control / power axis on sim racing gear): the level picks take the engine's two slots (quick.levelStyle).
  styles: [],
  levelLabels: { beginner: "new", intermediate: "serious", advanced: "all-in" },
  levelPeople: { beginner: "new racers", intermediate: "serious racers", advanced: "all-in racers" },
  words: { person: "driver", game: "setup", tryFirst: "try one first", howIt: "drives", catalogPromo: "Filter by type, level, drive, torque and console.",
    guidePromo: "Gear, belt or direct drive, explained in two minutes.", added: "added to the site this week",
    armShort: "console", hardArm: "PC only: it won't work on PlayStation or Xbox.", hardArmShort: "PC only" },
  levelWords: { beginner: ["first wheel", "first rig", "first sim", "new to sim racing", "just getting into sim racing", "beginner"],
    intermediate: ["upgraded from", "coming from", "moved up from"], advanced: ["league", "esports", "endgame"] },
  weights: { style: 0.4, level: 0.3, arm: 0.2, score: 0.1 },
  // The arm slot is "I race on console" here, a hard filter (quick.armFilter), so its trait is never scored as one.
  arm: { trait: "setup", plus: "easy setup" },
  forgiving: { plus: "easy setup", minus: [], beginner: [] },
  // Torque (the Torque / brake force column, "12 Nm") as a small lean on FFB strength, within ±1.
  specLean: s => { const nm = torqueOf(s.weight); return clamp({ ffb_strength: nm === null ? 0 : (nm - 10) / 15 }); },
  lines: {},
  sourceWords: { forum: "sim racing forum", blog: "sim racing blog" },
  word: "product",
  sport: "sim racing",
  emoji: "🏁",
  dotsWords: "force feedback detail and strength, brake feel, rigidity, build, noise, setup, software, ergonomics or value",
  specWords: s => [s.weight, s.balance],
  reviewerSources: ["YouTube", "Blog"],
  scale: { rank: "net", top4: 0.4, top5: 0.09 },
  quick: {
    types: SIM_TYPES.map(([key, shape, many]) => ({ key, shape, many })), want: "I need", arm: "I race on console", armChip: "console ok",
    stabilityLabel: "Style",
    armFilter: { key: "con", value: "yes" },
    levelFilter: { advanced: { key: "budget", values: ["$$$"] } },
    levelStyle: { beginner: "control", intermediate: "power", advanced: "power" },
    catalogLead: ["gear", "rig", "drive"], catalogOneOf: ["gear", "rig"], useWord: "feels", specLabels: shape => SPEC_LABELS[shape ?? ""] ?? {},
    filters: [
      { key: "drive", label: "Drive type", kinds: ["wheelbase"], options: [["direct", "direct"], ["belt", "belt"], ["hybrid", "hybrid"], ["gear", "gear"]] },
      { key: "budget", label: "Budget", options: [["$", "$ budget"], ["$$", "$$ mid"], ["$$$", "$$$ high-end"]] },
      { key: "rim", label: "I mostly race", kinds: ["wheel"], options: [["gt", "GT"], ["formula", "formula"], ["rally", "rally"], ["round", "road / drift (round)"]] },
    ],
    factValues: simracingFacts,
  },
  evidenceAdapter: simracingEvidence,
  expertAlias: { control: "suits_beginner", power: "suits_intermediate" },
};

/** The facts a product's hard filters read: the owner's sheet (owner evidence rows) wins over the catalogue columns. */
export function simracingFacts(r: { shape: string | null; balance: string | null; core: string | null; surface?: string | null; name: string }, owner: Record<string, string | number | null>): Record<string, string[]> {
  const o: Record<string, string[]> = {};
  const plat = platformsOf(typeof owner.platform === "string" ? owner.platform : r.core);
  // A cockpit or stand holds any console's gear (Grok audit 2026-11-17 #6: "console" emptied the cockpits).
  if (plat?.some(p => p !== "PC") || r.shape === C) o.con = ["yes"];
  // A product the maker no longer sells (Notes "Discontinued: …"): out of the match, lists and "works with" (audit #8).
  if (/^Discontinued\b/i.test(r.surface ?? "")) o.gone = ["yes"];
  const ty = (r.balance ?? "").toLowerCase(), nm = r.name.toLowerCase();
  if (r.shape === WB) { const d = /direct/.test(ty) ? "direct" : /hybrid/.test(ty) ? "hybrid" : /belt/.test(ty) || /belt/.test(nm) ? "belt" : /gear/.test(ty) ? "gear" : null; if (d) o.drive = [d]; }
  if (r.shape === W) { const k = /formula/.test(ty) ? "formula" : /rally/.test(ty) ? "rally" : /round/.test(ty) ? "round" : /\bgt\b/.test(ty) ? "gt" : null; if (k) o.rim = [k]; }
  if (typeof owner.price === "string" && /^\${1,3}$/.test(owner.price)) o.budget = [owner.price];
  return o;
}

/** Sim racing's evidence rows (simracing-*-v1) as the rows the shared engine reads. Pure. Quality rows keep their attribute;
 *  a writer new to sim racing is a beginner's level row, a writer who upgraded to it an intermediate one (their own verdict
 *  is the report's, as the shared level reader takes it). Maker and owner rows are facts, read by simracingFacts. */
export function simracingEvidence(rows: EvidenceRow[]): EvidenceRow[] {
  const out: EvidenceRow[] = [];
  const BY: Record<string, string> = { "simracing-tags-v1": "tags-v1", "simracing-reader-v1": "reader-v1" };
  const QUALITY = new Set(SIMRACING_FIT.traits.map(x => x.key).filter(k => k !== "control" && k !== "power"));
  for (const r of rows) {
    const by = BY[r.extractedBy]; if (!by || r.value === null) continue;
    if (QUALITY.has(r.attribute)) out.push({ ...r, value: Math.sign(r.value), extractedBy: by });
    else if ((r.attribute === "suits_new" || r.attribute === "suits_upgrade") && r.value !== 0) {
      out.push({ ...r, attribute: "level", value: r.attribute === "suits_new" ? 0 : 1, sourceRef: r.sourceRef.replace(/#.*$/, ""), extractedBy: "level-v1" });
      // The same writer's verdict in the level's style slot: liked it (+1) or not (−1), smoothed like any trait.
      out.push({ ...r, attribute: r.attribute === "suits_new" ? "control" : "power", value: Math.sign(r.value), extractedBy: by });
    }
  }
  return out;
}
