// The fit template's per-site rules (owner 2026-11-15: "PickleballRecs gets the same template"): which traits a product has
// and which review tags count for and against each, the spec prior, which traits can drop to 2 dots, the control / power
// axis quick match and the fit check use, the arm tags, and the words under each bar. lib/trait-score.ts, fit-verdict,
// quick-match, match-context and the racket fit page read it; a site without one keeps its old pages.
import type { Niche } from "./niche/types";

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
  /** Neutral names for where a quote comes from. */ sourceWords: { forum: string; blog: string };
  /** The product word: "racket" / "paddle". */ word: string;
  /** The footer's sign-off emoji. */ emoji: string;
  /** Which specs to name when they lean a bar ("round, low balance"). */ specWords: (s: Specs) => (string | null | undefined)[];
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
  emoji: "🎾",
  specWords: s => [s.shape?.toLowerCase(), s.balance ? `${s.balance.toLowerCase()} balance` : null],
};

// PickleballRecs (owner 2026-11-15): seven traits from the paddle tag bank. Spec columns are shared with padel: core holds core
// thickness, balance holds swing weight, surface the face material.
const PICKLEBALL: FitConfig = {
  traits: [
    { key: "power", label: "Power", plus: [["easy power", 1]], minus: [], noun: "the power" },
    { key: "pop", label: "Pop", plus: [["great pop", 1]], minus: [], noun: "the pop" },
    { key: "control", label: "Control", plus: [["good control", 1], ["great for dinks", 1]], minus: [["hard to control", 1]], noun: "the control at the kitchen" },
    { key: "spin", label: "Spin", plus: [["lots of spin", 1]], minus: [["low spin", 1]], noun: "the spin" },
    { key: "forgiveness", label: "Forgiveness", plus: [["forgiving", 1]], minus: [["small sweet spot", 1], ["dead spots", 1]], noun: "the sweet spot" },
    { key: "speed", label: "Hand speed", plus: [["fast hands", 1]], minus: [], noun: "the hand speed" },
    { key: "arm", label: "Arm comfort", plus: [["arm-friendly", 1]], minus: [], noun: "how it treats the arm" },
  ],
  complaint: ["forgiveness", "control", "spin"],
  axis: { control: { trait: "control", tags: ["good control", "great for dinks"] }, power: { trait: "power", tags: ["easy power", "great pop"] } },
  styleLabels: { control: "Control", balance: "A bit of everything", power: "Power" },
  arm: { trait: "arm", plus: "arm-friendly" },
  forgiving: { plus: "forgiving", minus: ["hard to control"], beginner: ["small sweet spot"] },
  specLean: s => {
    const o: Record<string, number> = { power: 0, pop: 0, control: 0, spin: 0, forgiveness: 0, speed: 0, arm: 0 };
    const shape = (s.shape ?? "").toLowerCase(), core = (s.core ?? "").toLowerCase(), surface = (s.surface ?? "").toLowerCase();
    const mm = Number(core.match(/(\d{2})(\.\d)?\s*mm/)?.[1] ?? NaN);
    if (mm >= 16) { o.control += 0.5; o.forgiveness += 0.4; o.arm += 0.2; } else if (mm >= 13 && mm <= 14) { o.power += 0.4; o.pop += 0.5; o.control -= 0.2; }
    if (shape.includes("elongated")) { o.power += 0.3; o.speed -= 0.2; o.forgiveness -= 0.2; }
    if (shape.includes("standard") || shape.includes("wide")) { o.forgiveness += 0.3; o.speed += 0.3; }
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
  word: "paddle",
  emoji: "🏓",
  specWords: s => [s.shape?.toLowerCase(), s.core ? `${s.core.toLowerCase()} core` : null],
};

const CONFIGS: Record<string, FitConfig> = { padel: PADEL, pickleball: PICKLEBALL };
/** The site's fit rules, or undefined for sites that keep the old pages. */
export const fitConfigFor = (n: Pick<Niche, "id">): FitConfig | undefined => CONFIGS[n.id];
/** The site's trait rows (padel's for a site without its own rules), for the admin area and the stored hand edits. */
export const traitDefsFor = (n: Pick<Niche, "id">): TraitDef[] => (CONFIGS[n.id] ?? PADEL).traits;
