// The site profile (site-jobs/ENGINE-PLAN.md section C, owner 2026-11-15): one settings file per site, one format for all.
// The fit template's per-site rules (owner 2026-11-15: "PickleballRecs gets the same template"): which traits a product has
// and which review tags count for and against each, the spec prior, which traits can drop to 2 dots, the control / power
// axis quick match and the fit check use, the arm tags, and the words under each bar. lib/trait-score.ts, fit-verdict,
// quick-match, match-context and the racket fit page read it; a site without one keeps its old pages.
import type { Niche } from "./niche/types";
import { DISCGOLF_FIT } from "./discgolf-fit";

export type TraitDef = { key: string; label: string; plus: [string, number][]; minus: [string, number][]; noun: string;
  /** The quick-take row that writes this trait's line (padel's blocks), by row label, or "court.defence". */ qtRow?: string;
  /** The line under a bar from the evidence store: [praise (many, one), fault (many, one)]. */ ev?: [[string, string], [string, string]] };
export type Specs = { shape?: string | null; balance?: string | null; weight?: string | null; core?: string | null; surface?: string | null };
/** Counts for the line under a bar: tag mentions, people with the verb, and the bar's own counts (with words read from text). */
export type LineKit = { tc: (tag: string) => number; ppl: (n: number, verb: string) => string; plus: number | null; minus: number | null };
export type FitConfig = {
  traits: TraitDef[];
  /** Traits players fault directly; only these can drop to 2 dots. */ complaint: string[];
  /** Quick match's control / power axis: the traits and the tags that praise each (the "lean"), and the trait that follows
   *  control at half strength (padel: defence). */
  axis: { control: { trait: string; tags: string[] }; power: { trait: string; tags: string[] }; follows?: string };
  /** The finder's style option labels for quick match's three styles. */ styleLabels: { control: string; balance: string; power: string };
  /** Sore arm: the tag that praises arm comfort and the one that faults it (if the site has one). */ arm: { trait: string; plus: string; minus?: string };
  /** The fit check's fallback level signal: forgiving against demanding tags (plus more for beginners). */ forgiving: { plus: string; minus: string[]; beginner: string[] };
  /** The specs' lean per trait in dots (each within ±1). */ specLean: (s: Specs) => Record<string, number>;
  /** The line under each bar from the counts (no zeros: "no one …"). */ lines: Record<string, (k: LineKit) => string | null>;
  /** Level words: what in a report or video states a level (guidance for the level reader, and levelCue below). */
  levelWords: { beginner: string[]; intermediate: string[]; advanced: string[]; /** Rating numbers (DUPR, "a 3.5 player"): upper bounds for beginner and intermediate. */ rating?: { name: string; beginnerBelow: number; advancedFrom: number } };
  /** The visitor's picks on quick match: how much each part of the match % weighs (lib/match-score.ts). */
  weights: { style: number; level: number; arm: number; score: number };
  /** Neutral names for where a quote comes from. */ sourceWords: { forum: string; blog: string };
  /** Heads-up notes counted from reports (a tag, or words in the report text): shown when 2+ reports say it. */
  headsUp?: { title: string; tags?: string[]; text?: RegExp; /** The words are the problem: skip the negation check. */ plain?: boolean }[];
  /** The product word: "racket" / "paddle". */ word: string;
  /** The sport, lower case. */ sport: string;
  /** The footer's sign-off emoji. */ emoji: string;
  /** How it plays dots, in words, for the how-we-make-these page. */ dotsWords: string;
  /** Which specs to name when they lean a bar ("round, low balance"). */ specWords: (s: Specs, trait: string) => (string | null | undefined)[];
  /** Lab measurements (evidence rows `lab:<metric>`, ENGINE-PLAN step 2): which trait each metric feeds (sign −1: lower is
   *  more, e.g. swing weight → hand speed), how much the lab percentile and the specs' lean weigh against the praise rate
   *  in the ranking the 4–5 bands are cut from, and the lab percentile that earns 4–5 with no praise yet. */
  lab?: { metrics: Record<string, { trait: string; sign: 1 | -1 }>; weight: number; specWeight?: number; alone?: number;
    /** A spec column that stands in for a metric where no lab row has it (pickleball: the maker's swing weight). */ specMetric?: Record<string, "balance"> };
  /** Quick match's "Not sure yet? fine-tune" (shape / weight / feel, lib/fine-tune.ts): padel's shapes and weights only. */ fineTune?: boolean;
  /** Source platforms whose voices count as reviewers, not players, in the line under a bar (default YouTube). */ reviewerSources?: string[];
  /** Scorer v2's band cut-offs, where the site differs from padel's (lib/trait-score.ts). */
  scale?: Partial<{ top4: number; top5: number; worst: number; minComplaints: number; /** Rank on the net share of praise against complaints instead of the praise rate. */ rank: "net" | "rate" }>;
  /** Quick match words and a type picker for sites whose main pick is the product type (DiscGolfRecs, PM 2026-11-16 option A).
   *  With `types`, the home's first row picks a type (a hard filter on the catalogue shape, ?kind=) and the style picks move
   *  under fine-tune as `stabilityLabel`. Unset: padel's row, unchanged. */
  quick?: { types: { key: string; shape: string; many: string }[]; want: string; arm: string; armChip: string; stabilityLabel: string;
    /** The flight-number boxes' legend, shown once over the list (rows show the numbers from the weight column). */ flightLabel?: string;
    /** The arm chip ("slow-arm friendly") needs the specs to agree too (disc golf: speed 9 or less), not only the arm score. */ armSpecOk?: (s: Specs) => boolean };
  /** A site whose evidence rows use its own attribute names (DiscGolfRecs' dg-*-v1): turns them into the rows the shared
   *  engine reads (app/match-context.ts), so lib/engine stays one for all sites. */
  evidenceAdapter?: (rows: import("./evidence").EvidenceRow[]) => import("./evidence").EvidenceRow[];
};

const clamp = (o: Record<string, number>) => { for (const k of Object.keys(o)) o[k] = Math.max(-1, Math.min(1, o[k])); return o; };

const PADEL: FitConfig = {
  traits: [
    { key: "forgiveness", label: "Forgiveness", plus: [["forgiving", 1]], minus: [["small sweet spot", 1], ["demanding", 1]], noun: "the sweet spot", qtRow: "Sweet spot" },
    { key: "power", label: "Power", plus: [["easy power", 1], ["great on smashes", 1]], minus: [], noun: "the power", qtRow: "Power" },
    { key: "control", label: "Control", plus: [["good control", 1]], minus: [["head-heavy", 0.5]], noun: "the control", qtRow: "Control" },
    { key: "defence", label: "Defence", plus: [["great in defence", 1], ["good control", 0.5]], minus: [], noun: "its defence", qtRow: "court.defence" },
    { key: "arm", label: "Arm comfort", plus: [["arm-friendly", 1]], minus: [["vibrates on mishits", 1]], noun: "how it treats the arm", qtRow: "Comfort" },
    { key: "speed", label: "Speed", plus: [["fast at the net", 1]], minus: [["head-heavy", 1], ["tiring in long matches", 1]], noun: "how quick it is", qtRow: "Handling" },
  ],
  complaint: ["arm", "forgiveness"],
  axis: { control: { trait: "control", tags: ["good control", "great in defence"] }, power: { trait: "power", tags: ["easy power", "great on smashes"] }, follows: "defence" },
  styleLabels: { control: "Control", balance: "A balance of both", power: "Power" },
  levelWords: { beginner: ["first racket", "just started", "new to padel", "beginner"], intermediate: ["intermediate", "playing a couple of years", "regular matches"], advanced: ["advanced", "tournaments", "competitive", "pro level"] },
  weights: { style: 0.4, level: 0.3, arm: 0.35, score: 0.1 },
  fineTune: true,
  arm: { trait: "arm", plus: "arm-friendly", minus: "vibrates on mishits" },
  forgiving: { plus: "forgiving", minus: ["demanding"], beginner: ["small sweet spot"] },
  specLean: s => {
    const o: Record<string, number> = { forgiveness: 0, power: 0, control: 0, defence: 0, arm: 0, speed: 0 };
    const shape = (s.shape ?? "").toLowerCase(), bal = (s.balance ?? "").toLowerCase(), core = (s.core ?? "").toLowerCase();
    if (shape.includes("round")) { o.control += 0.5; o.defence += 0.5; o.forgiveness += 0.3; }
    if (shape.includes("diamond")) { o.power += 0.6; o.speed -= 0.3; o.forgiveness -= 0.5; o.control -= 0.3; }
    const low = /low/.test(bal) ? (/medium|mid/.test(bal) ? 0.5 : 1) : 0, high = /high/.test(bal) ? (/medium|mid/.test(bal) ? 0.5 : 1) : 0;
    o.control += 0.3 * low; o.defence += 0.3 * low; o.speed += 0.3 * low;
    o.power += 0.5 * high; o.speed -= 0.3 * high; o.forgiveness -= 0.2 * high;
    const grams = (s.weight ?? "").match(/\d{3}/g)?.map(Number) ?? [];
    if (grams.length) { const g = grams.reduce((a, b) => a + b, 0) / grams.length; if (g <= 355) o.speed += 0.4; else if (g >= 370) { o.speed -= 0.4; o.power += 0.2; } }
    if (/soft/.test(core)) o.arm += 0.3; else if (/hard/.test(core)) o.arm -= 0.3;
    return clamp(o);
  },
  lines: {
    forgiveness: ({ tc, ppl }) => { const p = tc("forgiving"), m = tc("small sweet spot") + tc("demanding"); return p || m ? [p ? ppl(p, "call it forgiving") : "No one calls it forgiving", m ? ppl(m, "find the sweet spot small or call it demanding") : "no one calls it demanding"].join(", ") + "." : null; },
    power: ({ tc, ppl }) => { const p = tc("easy power"), s = tc("great on smashes"); return p || s ? `${p ? ppl(p, "mention easy power") : "No one mentions easy power"}${s ? `, ${ppl(s, "say it's great on smashes")}` : ""}.` : null; },
    control: ({ tc, ppl }) => { const p = tc("good control"), m = tc("head-heavy"); return p || m ? `${p ? ppl(p, "praise the control") : "No one praises the control"}${m ? `, ${ppl(m, "find it head-heavy")}` : ""}.` : null; },
    defence: ({ tc, ppl }) => { const p = tc("great in defence"); return p ? `${ppl(p, "say it's great in defence")}.` : null; },
    arm: ({ tc, ppl, plus, minus }) => { const p = plus ?? tc("arm-friendly"), m = minus ?? tc("vibrates on mishits"); return p || m ? `${p ? ppl(p, "find it kind to the arm") : "No one calls it kind to the arm"}, ${m ? ppl(m, "say it's hard on the arm") : "no one says it's hard on the arm"}.` : null; },
    speed: ({ tc, ppl }) => { const p = tc("fast at the net"), m = tc("head-heavy") + tc("tiring in long matches"); return p || m ? `${p ? ppl(p, "call it fast at the net") : "No one calls it fast at the net"}${m ? `, ${ppl(m, "find it head-heavy or tiring")}` : ""}.` : null; },
  },
  sourceWords: { forum: "padel forum", blog: "padel blog" },
  word: "racket",
  sport: "padel",
  emoji: "🎾",
  dotsWords: "forgiving, powerful, controlled, good in defence, kind to the arm or fast",
  specWords: s => [s.shape?.toLowerCase(), s.balance ? `${s.balance.toLowerCase()} balance` : null],
};

// PickleballRecs (owner 2026-11-15): seven traits from the paddle tag bank. Spec columns are shared with padel: core holds core
// thickness, balance holds swing weight, surface the face material.
const PICKLEBALL: FitConfig = {
  traits: [
    { key: "power", label: "Power", plus: [["easy power", 1]], minus: [], noun: "the power" },
    { key: "pop", label: "Pop", plus: [["great pop", 1]], minus: [], noun: "the pop", ev: [["praise the pop", "praises the pop"], ["find it low on pop", "finds it low on pop"]] },
    { key: "control", label: "Control", plus: [["good control", 1], ["great for dinks", 1]], minus: [["hard to control", 1]], noun: "the control at the kitchen" },
    { key: "spin", label: "Spin", plus: [["lots of spin", 1]], minus: [["low spin", 1]], noun: "the spin", ev: [["praise the spin", "praises the spin"], ["want more spin", "wants more spin"]] },
    { key: "forgiveness", label: "Forgiveness", plus: [["forgiving", 1]], minus: [["small sweet spot", 1], ["dead spots", 1]], noun: "the sweet spot" },
    { key: "speed", label: "Hand speed", plus: [["fast hands", 1]], minus: [], noun: "the hand speed" },
    { key: "arm", label: "Arm comfort", plus: [["arm-friendly", 1]], minus: [], noun: "how it treats the arm" },
  ],
  // Only faults of the paddle itself drop to 2 (owner's floor rules); "hard to control" on a paddle usually means it is
  // poppy, not a fault.
  complaint: ["forgiveness", "arm"],
  axis: { control: { trait: "control", tags: ["good control", "great for dinks"] }, power: { trait: "power", tags: ["easy power", "great pop"] } },
  styleLabels: { control: "Control", balance: "A bit of everything", power: "Power" },
  levelWords: { beginner: ["first paddle", "just started", "new to pickleball", "beginner"], intermediate: ["intermediate", "rec player", "3.0", "3.5"], advanced: ["advanced", "tournaments", "4.0+", "4.5", "5.0", "pro"],
    rating: { name: "DUPR", beginnerBelow: 3.0, advancedFrom: 4.0 } },
  weights: { style: 0.4, level: 0.3, arm: 0.35, score: 0.1 },
  arm: { trait: "arm", plus: "arm-friendly" },
  forgiving: { plus: "forgiving", minus: ["hard to control"], beginner: ["small sweet spot"] },
  specLean: s => {
    const o: Record<string, number> = { power: 0, pop: 0, control: 0, spin: 0, forgiveness: 0, speed: 0, arm: 0 };
    const shape = (s.shape ?? "").toLowerCase(), core = (s.core ?? "").toLowerCase(), surface = (s.surface ?? "").toLowerCase();
    // Sold in several cores or shapes ("14 or 16 mm", "Hybrid, Widebody, or Elongated"): no lean from that spec.
    const mms = [...new Set(core.match(/\d{2}(\.\d)?/g) ?? [])], mm = mms.length === 1 ? Number(mms[0]) : NaN;
    const oneShape = !/,|\bor\b|\//.test(shape);
    if (mm >= 16) { o.control += 0.5; o.forgiveness += 0.4; o.arm += 0.2; } else if (mm >= 13 && mm <= 14) { o.power += 0.4; o.pop += 0.5; o.control -= 0.2; }
    if (oneShape && shape.includes("elongated")) { o.power += 0.3; o.speed -= 0.2; o.forgiveness -= 0.2; }
    if (oneShape && (shape.includes("standard") || shape.includes("wide"))) { o.forgiveness += 0.3; o.speed += 0.3; }
    if (/raw/.test(surface) && /carbon/.test(surface)) o.spin += 0.5;
    const sw = Number((s.balance ?? "").match(/\d{3}/)?.[0] ?? NaN);
    if (sw <= 110) o.speed += 0.4; else if (sw >= 118) { o.speed -= 0.3; o.power += 0.2; }
    return clamp(o);
  },
  lines: {
    power: ({ tc, ppl }) => { const p = tc("easy power"); return p ? `${ppl(p, "mention easy power")}.` : null; },
    pop: ({ tc, ppl }) => { const p = tc("great pop"); return p ? `${ppl(p, "praise the pop")}.` : null; },
    control: ({ tc, ppl }) => { const p = tc("good control") + tc("great for dinks"), m = tc("hard to control"); return p || m ? `${p ? ppl(p, "praise the control or the dinks") : "No one praises the control"}${m ? `, ${ppl(m, "find it hard to control")}` : ""}.` : null; },
    spin: ({ tc, ppl }) => { const p = tc("lots of spin"), m = tc("low spin"); return p || m ? `${p ? ppl(p, "praise the spin") : "No one praises the spin"}${m ? `, ${ppl(m, "find the spin low")}` : ""}.` : null; },
    forgiveness: ({ tc, ppl }) => { const p = tc("forgiving"), m = tc("small sweet spot") + tc("dead spots"); return p || m ? [p ? ppl(p, "call it forgiving") : "No one calls it forgiving", m ? ppl(m, "mention a small sweet spot or dead spots") : "no one mentions dead spots"].join(", ") + "." : null; },
    speed: ({ tc, ppl }) => { const p = tc("fast hands"); return p ? `${ppl(p, "say it's fast in hand battles")}.` : null; },
    arm: ({ tc, ppl, plus, minus }) => { const p = plus ?? tc("arm-friendly"), m = minus ?? 0; return p || m ? `${p ? ppl(p, "find it kind to the arm") : "No one calls it kind to the arm"}, ${m ? ppl(m, "say it's hard on the arm") : "no one says it's hard on the arm"}.` : null; },
  },
  sourceWords: { forum: "pickleball forum", blog: "pickleball blog" },
  // Owner 2026-11-15: delamination, dead spots, core crush and USAP approval issues, each with the 2+ source rule.
  headsUp: [
    { title: "Delamination reported", tags: ["delamination"], text: /\bdelaminat/i },
    { title: "Dead spots reported", tags: ["dead spots"], text: /\bdead ?spots?\b/i },
    { title: "Core crush reported", text: /\bcore (crush|crushed|crushing|broke|broken|went soft)|\bcrushed core\b/i },
    // The problem is the wording itself ("not USAP approved", "disqualified …"), so no negation check here.
    { title: "USAP approval questions", plain: true, text: /\bnot (yet )?(usap|usa ?pickleball)[ -]?(tournament[ -])?approved|\b(missing|lacks?|no|without) (the )?(usap|usa ?pickleball) approval|\bdisqualified\b[^.]{0,80}\b(usap|usa ?pickleball)|\b(usap|usa ?pickleball)\b[^.]{0,40}\b(banned|delisted|revoked|pulled|removed from)\b/i },
  ],
  word: "paddle",
  sport: "pickleball",
  emoji: "🏓",
  dotsWords: "powerful, poppy, controlled at the kitchen, spinny, forgiving, fast in hand battles or kind to the arm",
  // Only the specs that lean that bar: core and shape for most, the face for spin, swing weight for hand speed.
  specWords: (s, t) => t === "spin" ? [s.surface ? `${s.surface.toLowerCase()} face` : null]
    : t === "speed" ? [s.balance ? `swing weight ${s.balance}` : null, s.shape?.toLowerCase()]
    : [s.shape?.toLowerCase(), s.core ? `${s.core.toLowerCase()} core` : null],
  // Lab numbers from independent review sites (ENGINE-PLAN step 2, owner 2026-11-15): swing weight → hand speed (lower is
  // quicker), twist weight → forgiveness, RPM → spin, measured power and pop; plus the sites' own lab-based % scores.
  // Review sites write as reviewers, not players.
  reviewerSources: ["YouTube", "Blog"],
  // Tuned against the expert's 25 paddles (db/known-dots/pickleball.json, scripts/check-expert-ratings.mts).
  scale: { rank: "net", top4: 0.4, top5: 0.09 },
  lab: {
    metrics: {
      swing_weight: { trait: "speed", sign: -1 }, maneuverability_pct: { trait: "speed", sign: 1 },
      twist_weight: { trait: "forgiveness", sign: 1 }, forgiveness_pct: { trait: "forgiveness", sign: 1 },
      spin_rpm: { trait: "spin", sign: 1 }, spin_pct: { trait: "spin", sign: 1 },
      power_mph: { trait: "power", sign: 1 }, power_pct: { trait: "power", sign: 1 }, power_pctile: { trait: "power", sign: 1 },
      pop_mph: { trait: "pop", sign: 1 }, pop_pct: { trait: "pop", sign: 1 }, pop_pctile: { trait: "pop", sign: 1 },
      control_pct: { trait: "control", sign: 1 },
    },
    weight: 0.5, specWeight: 0.5, alone: 0.7,
    specMetric: { swing_weight: "balance" },
  },
};

// TennisRecs (owner 2026-11-15, data and profile only; the design switch waits for the final padel template): seven traits
// from the racket tag bank. Spec columns are shared with padel: shape holds head size, core the string pattern, surface the
// stiffness (RA). Feel (crisp ↔ soft) and swing (compact ↔ full) are kept as reader evidence until the engine scores axes.
const sqIn = (s: string) => Number(s.match(/(\d{2,3})\s*sq/)?.[1] ?? NaN);
/** Unstrung grams ("326 g strung" ≈ 311 g unstrung). */
const unstrung = (s: string) => { const g = Number(s.match(/(\d{3})\s*g/)?.[1] ?? NaN); return /strung/.test(s) && !/unstrung/.test(s) ? g - 15 : g; };
/** Points head-light (negative = head-heavy), from "7 pts HL", "1 pts HH" or a balance point in mm / cm for a 27" frame. */
export function tennisPtsHL(s: string): number {
  const pts = s.match(/(\d+(?:\.\d+)?)\s*pts?\s*(HL|HH|EB)/i);
  if (pts) return pts[2].toUpperCase() === "HH" ? -Number(pts[1]) : pts[2].toUpperCase() === "EB" ? 0 : Number(pts[1]);
  if (/\beven\b/i.test(s)) return 0;
  const mm = s.match(/(\d{3}(?:\.\d+)?)\s*mm/)?.[1], cm = s.match(/(\d{2}(?:\.\d+)?)\s*cm/)?.[1];
  const at = mm ? Number(mm) : cm ? Number(cm) * 10 : NaN;
  return Number.isFinite(at) ? Math.round((342.9 - at) / 3.175) : NaN;
}
const TENNIS: FitConfig = {
  traits: [
    { key: "power", label: "Power", plus: [["easy power", 1], ["great on serve", 0.5]], minus: [["underpowered", 1]], noun: "the power",
      ev: [["praise the power", "praises the power"], ["find it underpowered", "finds it underpowered"]] },
    { key: "control", label: "Control", plus: [["good control", 1]], minus: [], noun: "the control",
      ev: [["praise the control", "praises the control"], ["find it hard to control", "finds it hard to control"]] },
    { key: "spin", label: "Spin", plus: [["great spin", 1]], minus: [], noun: "the spin",
      ev: [["praise the spin", "praises the spin"], ["want more spin", "wants more spin"]] },
    { key: "arm", label: "Arm comfort", plus: [["arm-friendly", 1], ["soft", 0.5]], minus: [["harsh on the arm", 1]], noun: "how it treats the arm" },
    { key: "maneuverability", label: "Maneuverability", plus: [["maneuverable", 1]], minus: [["hard to swing", 1]], noun: "how quick it swings",
      ev: [["call it quick to swing", "calls it quick to swing"], ["find it hard to swing", "finds it hard to swing"]] },
    { key: "stability", label: "Stability", plus: [["stable", 1]], minus: [["unstable vs heavy balls", 1]], noun: "the stability",
      ev: [["call it stable", "calls it stable"], ["find it unstable vs heavy balls", "finds it unstable vs heavy balls"]] },
    { key: "forgiveness", label: "Forgiveness", plus: [["forgiving", 1]], minus: [["small sweet spot", 1]], noun: "the sweet spot",
      ev: [["call it forgiving", "calls it forgiving"], ["find the sweet spot small", "finds the sweet spot small"]] },
  ],
  complaint: ["arm", "forgiveness"],
  axis: { control: { trait: "control", tags: ["good control"] }, power: { trait: "power", tags: ["easy power", "great on serve"] } },
  styleLabels: { control: "Control", balance: "A bit of both", power: "Power" },
  levelWords: { beginner: ["first racket", "just started", "new to tennis", "beginner"], intermediate: ["intermediate", "club player", "3.0", "3.5"], advanced: ["advanced", "tournaments", "college", "4.0+", "4.5", "5.0"],
    rating: { name: "NTRP", beginnerBelow: 3.0, advancedFrom: 4.0 } },
  weights: { style: 0.4, level: 0.3, arm: 0.2, score: 0.1 },
  arm: { trait: "arm", plus: "arm-friendly", minus: "harsh on the arm" },
  forgiving: { plus: "forgiving", minus: ["hard to swing"], beginner: ["small sweet spot"] },
  specLean: s => {
    const o: Record<string, number> = { power: 0, control: 0, spin: 0, arm: 0, maneuverability: 0, stability: 0, forgiveness: 0 };
    const head = sqIn(s.shape ?? ""), g = unstrung(s.weight ?? ""), hl = tennisPtsHL(s.balance ?? ""), pattern = (s.core ?? "").replace(/\s/g, "").toLowerCase();
    const ra = Number((s.surface ?? "").match(/(\d{2})\s*RA/i)?.[1] ?? NaN);
    if (head >= 104) { o.power += 0.4; o.forgiveness += 0.5; o.control -= 0.3; } else if (head >= 100) { o.power += 0.2; o.forgiveness += 0.2; }
    else if (head <= 97) { o.control += 0.4; o.forgiveness -= 0.4; o.power -= 0.2; }
    // Sold in several patterns ("16x19 or 18x20"): no lean from the pattern.
    const pats = [...new Set(pattern.match(/\d{2}x\d{2}/g) ?? [])];
    if (pats.length === 1) { const p = pats[0]; if (p.startsWith("18x")) { o.control += 0.4; o.spin -= 0.3; } else if (p === "16x18" || p === "16x17" || p === "14x18") o.spin += 0.5; else if (p === "16x19") o.spin += 0.2; }
    if (ra >= 68) { o.arm -= 0.5; o.power += 0.2; } else if (ra >= 66) o.arm -= 0.2; else if (ra <= 62) o.arm += 0.4;
    if (g <= 285) { o.maneuverability += 0.5; o.stability -= 0.4; } else if (g >= 315) { o.stability += 0.5; o.maneuverability -= 0.4; }
    if (hl >= 6) o.maneuverability += 0.3; else if (hl <= 0) { o.maneuverability -= 0.3; o.power += 0.2; }
    return clamp(o);
  },
  lines: {
    power: ({ tc, ppl }) => { const p = tc("easy power"), s = tc("great on serve"), m = tc("underpowered"); return p || s || m ? `${p ? ppl(p, "mention easy power") : "No one mentions easy power"}${s ? `, ${ppl(s, "say it's great on serve")}` : ""}${m ? `, ${ppl(m, "find it underpowered")}` : ""}.` : null; },
    control: ({ tc, ppl }) => { const p = tc("good control"); return p ? `${ppl(p, "praise the control")}.` : null; },
    spin: ({ tc, ppl }) => { const p = tc("great spin"); return p ? `${ppl(p, "praise the spin")}.` : null; },
    arm: ({ tc, ppl, plus, minus }) => { const p = plus ?? tc("arm-friendly"), m = minus ?? tc("harsh on the arm"); return p || m ? `${p ? ppl(p, "find it kind to the arm") : "No one calls it kind to the arm"}, ${m ? ppl(m, "say it's harsh on the arm") : "no one says it's harsh on the arm"}.` : null; },
    maneuverability: ({ tc, ppl }) => { const p = tc("maneuverable"), m = tc("hard to swing"); return p || m ? `${p ? ppl(p, "call it quick to swing") : "No one calls it quick to swing"}${m ? `, ${ppl(m, "find it hard to swing")}` : ""}.` : null; },
    stability: ({ tc, ppl }) => { const p = tc("stable"), m = tc("unstable vs heavy balls"); return p || m ? `${p ? ppl(p, "call it stable") : "No one calls it stable"}${m ? `, ${ppl(m, "find it unstable against heavy balls")}` : ""}.` : null; },
    forgiveness: ({ tc, ppl }) => { const p = tc("forgiving"), m = tc("small sweet spot"); return p || m ? [p ? ppl(p, "call it forgiving") : "No one calls it forgiving", m ? ppl(m, "find the sweet spot small") : "no one finds the sweet spot small"].join(", ") + "." : null; },
  },
  sourceWords: { forum: "tennis forum", blog: "tennis blog" },
  headsUp: [
    { title: "Durability problems reported", tags: ["durability issues"], text: /\b(frame|throat|hoop|racket|racquet) (cracked|snapped|broke)\b|\bcracked (the |its |my )?(frame|throat|hoop)\b|\bgrommets? (broke|cracked|wore through)\b/i },
  ],
  word: "racket",
  sport: "tennis",
  emoji: "🎾",
  dotsWords: "powerful, controlled, spinny, kind to the arm, quick to swing, stable or forgiving",
  specWords: (s, t) => t === "arm" ? [s.surface ? `${s.surface} stiffness` : null]
    : t === "spin" ? [s.core ? `${s.core} pattern` : null]
    : t === "maneuverability" || t === "stability" ? [s.weight, s.balance]
    : t === "control" ? [s.shape, s.core ? `${s.core} pattern` : null]
    : [s.shape, s.surface ? `${s.surface} stiffness` : null],
  // Tennis shops' playtests and blogs write as reviewers, like YouTube.
  reviewerSources: ["YouTube", "Blog", "Tennis shop"],
  // Pickleball's band cut-offs to start with; tennis has no expert set yet to tune against.
  scale: { rank: "net", top4: 0.4, top5: 0.09 },
  // Swingweights quoted in playtests and reviews (lower is quicker to swing).
  lab: { metrics: { swing_weight: { trait: "maneuverability", sign: -1 } }, weight: 0.5, specWeight: 0.5, alone: 0.7 },
};

const CONFIGS: Record<string, FitConfig> = { padel: PADEL, pickleball: PICKLEBALL, tennis: TENNIS, discgolf: DISCGOLF_FIT };
/** The site's fit rules, or undefined for sites that keep the old pages. */
export const fitConfigFor = (n: Pick<Niche, "id">): FitConfig | undefined => CONFIGS[n.id];
/** The site's trait rows (padel's for a site without its own rules), for the admin area and the stored hand edits. */
export const traitDefsFor = (n: Pick<Niche, "id">): TraitDef[] => (CONFIGS[n.id] ?? PADEL).traits;
/** Whether a report backs a heads-up: its tag, or its words without a negation just before ("no core crush", "hasn't core
 *  crushed", "without it core crushing", "sidesteps core crush worries"). */
export function reportSays(h: NonNullable<FitConfig["headsUp"]>[number], x: { tags: string[]; text?: string | null }): boolean {
  if (h.tags?.some(t => x.tags.includes(t))) return true;
  if (!h.text || !x.text) return false;
  for (const m of x.text.matchAll(new RegExp(h.text.source, h.text.flags.includes("g") ? h.text.flags : h.text.flags + "g"))) {
    const before = x.text.slice(Math.max(0, m.index! - 40), m.index!);
    const after = x.text.slice(m.index! + m[0].length, m.index! + m[0].length + 25);
    if (h.plain) return true;
    if (/\b(no|not|non|never|without|sidesteps?|avoids?|free of|zero)\b|n['’]t\b/i.test(before) || /^\w*\s*(concerns?|worries|fears?)\b/i.test(after)) continue;
    return true;
  }
  return false;
}
/** A level stated as a rating number ("a 3.5 player", "DUPR 4.2", "I'm a 4.0"), or null. Words like "beginner" are left to the
 *  reader, which keeps the exact quote. */
export function levelCue(p: FitConfig, text: string): "beginner" | "intermediate" | "advanced" | null {
  const r = p.levelWords.rating;
  if (!r) return null;
  const m = text.match(new RegExp(`\\b(?:${r.name}\\s*(?:of|rating|is|:)?\\s*|(?:i'?m|i am|as|a|an)\\s+(?:solid\\s+)?)([2-6]\\.\\d{1,2})(?!\\s*(?:oz|mm|in|"|\\$))(?:\\+)?(?:\\s*(?:player|level|rated|dupr))?`, "i"));
  if (!m) return null;
  const v = Number(m[1]);
  return v < r.beginnerBelow ? "beginner" : v >= r.advancedFrom ? "advanced" : "intermediate";
}
