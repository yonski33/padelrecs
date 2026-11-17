// Product page v11 per site (owner 2026-11-17, design_handoff_product_page_v11): padel first, then pickleball and disc golf on
// the same page (app/rackets/[slug]/racket-fit.tsx). Each site keeps its own words: the three "How it plays" bands, what an
// other card gives up, the fit check's headlines and the build cards. Padel's entry is the page as it was, word for word.
// Copy rules: expert voice, no em dashes, lines ≤ 105 characters, never claim we tested anything.
import { buildCards, type BuildCard } from "./build-cards";
import { flightOf } from "./discgolf-profile";
import { discTypeOf, stabilityOf, speedBandOf } from "./niche/discgolf-guide";

/** A build card: padel's four (shape, core, balance, face) and the other sites' own. `at` places a gauge's dot (0 … 1);
 *  `shape` names the outline; `nums` are disc golf's four flight numbers. */
export type V11Build = Omit<BuildCard, "key"> & { key: BuildCard["key"] | "gauge" | "flight" | "disc"; nums?: number[]; low?: string; high?: string };
type Spec = { shape?: string | null; core?: string | null; balance?: string | null; surface?: string | null; weight?: string | null };

export type V11Site = {
  /** "How it plays": three bands, [trait key, label]. */ bands: [string, string][];
  /** What an other card gives up, per trait it is behind on; else "less <label>". */ giveUp: Record<string, string>;
  /** The build cards from the catalog's specs; `armDots` is the Arm comfort bar, `bars` the product's other bars. */ builds: (spec: Spec, armDots?: number, bars?: Partial<Record<string, number>>) => V11Build[];
  /** The build section's heading. */ buildHead: (short: string) => string;
};

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
const num = (s: string | null | undefined) => { const m = /(\d+(?:\.\d+)?)/.exec(s ?? ""); return m ? +m[1] : null; };

/** Pickleball: shape, core thickness, weight and face, in the paddle guide's words (lib/niche/pickleball-guide.ts). */
function paddleBuilds(spec: Spec, armDots?: number, bars: Partial<Record<string, number>> = {}): V11Build[] {
  const out: V11Build[] = [], kind = (armDots ?? 0) >= 4; // 4+ on the Arm bar: no card says it is hard on the arm
  // A lively paddle (Pop or Power 4+) never reads "a little less pop" (Grok audit 2026-11-17, #19: the Diadem Hush).
  const lively = Math.max(bars.pop ?? 0, bars.power ?? 0) >= 4;
  const shape = clean(spec.shape).toLowerCase(), sk = ["standard", "elongated", "hybrid", "widebody"].find(k => shape.startsWith(k));
  const SHAPE: Record<string, string> = {
    standard: "Widest sweet spot and quickest hands at the kitchen.",
    elongated: "More reach and power on drives and serves; the sweet spot is narrower.",
    hybrid: "Between standard and elongated: a little reach, still forgiving.",
    widebody: "Extra-wide face for the most forgiveness, with the least reach.",
  };
  if (sk) out.push({ key: "shape", title: `${cap(sk)} shape`, line: SHAPE[sk], shape: `pb-${sk}` });
  // Core thickness: "16 mm", "14 or 16 mm" (two versions: no single gauge, the line says so).
  const core = clean(spec.core), mm = /mm/i.test(core) ? [...new Set([...core.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => +m[1]).filter(n => n >= 10 && n <= 20))] : [];
  if (mm.length === 1) {
    const t = mm[0];
    out.push({ key: "gauge", title: `${t} mm core`, low: "thin", high: "thick", at: Math.max(0, Math.min(1, (t - 11) / 6)),
      line: t >= 16 ? `Thick core: softer and more controlled${kind ? ", kinder to the arm" : ""}${lively ? "." : "; a little less pop."}`
        : t >= 14 ? "Mid-thick core: more pop and faster hands, a firmer feel." : "Thin core: the most pop and speed, the least forgiving." });
  } else if (mm.length > 1) out.push({ key: "gauge", title: `${mm.length > 2 ? `${mm.slice(0, -1).join(", ")} or ${mm[mm.length - 1]}` : mm.join(" or ")} mm core`, low: "thin", high: "thick", at: 0.6,
    // As many thicknesses as the spec lists (#25: "12.7, 14 or 16 mm" read "two").
    line: `Comes in ${["", "one", "two", "three", "four"][mm.length] ?? mm.length} thicknesses: thicker is softer and calmer, thinner pops more.` });
  // Weight: the first ounce figure (a range's low end).
  const oz = /(\d+(?:\.\d+)?)\s*(?:[-–]\s*\d+(?:\.\d+)?\s*)?oz/i.exec(spec.weight ?? "");
  if (oz) {
    const w = +oz[1];
    // The chip is the catalog's figure ("7.8–8.2 oz", owner 2026-11-17); light < 7.6 oz, mid 7.6–8.2, heavy > 8.2.
    const fig = clean(spec.weight).match(/\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*oz/i)?.[0].replace(/\s*[-–]\s*/, "–").replace(/\s*oz/i, " oz") ?? `${w} oz`;
    out.push({ key: "gauge", title: fig, low: "light", high: "heavy", at: Math.max(0, Math.min(1, (w - 7) / 1.6)),
      line: w < 7.6 ? (kind ? "Light: quick in hand battles and easy on the arm; less stable against hard drives." : "Light: quick in hand battles; less stable against hard drives.")
        : w > 8.2 ? (kind ? "Heavy: stable and powerful on drives; it can tire over long matches." : "Heavy: stable and powerful on drives; it can tire the arm over long matches.")
        : "Mid-weight: stable enough on drives, still quick at the kitchen." });
  }
  const face = clean(spec.surface), f = face.toLowerCase();
  // A foam face (eTPU, #19: the Diadem Hush read "Carbon face") and a bare "composite" (no material named: no claim).
  const foam = /\b(e?tpu|foam)\b/.test(f) && !/carbon|fib(er|re)glass/.test(f), unnamed = /composite/.test(f) && !/carbon|fib(er|re)glass|kevlar|aramid|glass/.test(f);
  const FOAM = "a lively, springy feel with easy pop; less crisp than carbon on touch shots.";
  if (face && foam) out.push({ key: "face", title: "Foam face", line: `${cap(face)}: ${FOAM}`.length <= 105 ? `${cap(face)}: ${FOAM}` : cap(FOAM) });
  else if (face && !unnamed) {
    const glass = /fib(er|re)glass/.test(f) && !/carbon/.test(f), mix = /carbon/.test(f) && /fib(er|re)glass|kevlar|aramid/.test(f);
    // The tap line names the face material first (owner 2026-11-17).
    const feel = glass ? "softer with more pop, a little less precise on touch shots." : mix ? "carbon with a softer layer, some pop and some control."
      // Comfort only where the Arm bar backs it (#13: "Kevlar adds comfort" beside the Ruby's "Can hurt sore arms").
      : /kevlar|aramid/.test(f) ? (kind ? "more dwell and comfort, the ball sits on the face a touch longer." : "more dwell, the ball sits on the face a touch longer.") : "control and spin with a crisp, firm feel.";
    const line = `${cap(face)}: ${feel}`;
    out.push({ key: "face", title: glass ? "Fiberglass face" : mix ? "Hybrid face" : /kevlar|aramid/.test(f) ? "Kevlar face" : "Carbon face", line: line.length <= 105 ? line : cap(feel) });
  }
  return out;
}

/** Disc golf: the flight numbers in place of shape and core, then stability, speed for your arm and type, in the disc guide's
 *  words (lib/niche/discgolf-guide.ts). */
function discBuilds(spec: Spec): V11Build[] {
  const out: V11Build[] = [], f = flightOf(spec.weight);
  if (f) {
    const turn = f.turn <= -2 ? "turns right a lot early" : f.turn < 0 ? "drifts right a little" : "holds its line early";
    const fade = f.fade >= 3 ? "a hard hook left at the end" : f.fade >= 1.5 ? "a steady fade" : "a soft finish";
    out.push({ key: "flight", title: "Flight numbers", nums: [f.speed, f.glide, f.turn, f.fade], line: cap(`${turn}, then ${fade} (right-hand backhand).`) });
    const st = stabilityOf(spec.weight);
    if (st) out.push({ key: "gauge", title: cap(st), low: "under", high: "over", at: st === "understable" ? 0.18 : st === "overstable" ? 0.85 : 0.5,
      // Speed 9+ needs a smooth 250 ft throw whatever its stability (audit #20, the Beast): never "a slower arm still gets it".
      line: st === "understable" ? (f.speed >= 9 ? "Turns over easily: a smooth throw of 250 ft or more holds a long, straight line."
        : "Turns over easily, so a slower arm still gets it straight and far.")
        : st === "overstable" ? "Fights the wind and finishes left; reliable for big arms and forehands."
        // Written from the same numbers as the flight line (audit 2026-11-17 #2): fade 3+ is a firm finish, never "gentle".
        : f.fade >= 3 ? "Straight through the middle, then a firm fade at the end: dependable, but it needs the arm."
        : "Flies straight with a gentle finish: the safe pick for most shots." });
    const sp = speedBandOf(spec.weight);
    // The scale runs to 15 (audit #31: Tantrum, Delirium and Excite are 14.5, the Raketen 15).
    if (sp) out.push({ key: "gauge", title: `Speed ${f.speed}`, low: "1", high: "15", at: Math.max(0, Math.min(1, (f.speed - 1) / 14)),
      line: sp === "slow" ? "Flies as rated for nearly any arm." : sp === "mid" ? "Needs a smooth throw of about 250 to 325 ft to fly as rated."
        : "Needs a 325 ft arm or more; without it, it just fades early." });
  }
  const t = discTypeOf(spec.shape);
  const TYPE: Record<string, string> = { putter: "Slow and straight, for putts and short approaches.", midrange: "Straight and predictable; the most forgiving disc to learn on.",
    fairway: "Control off the tee; easier than a distance driver at most speeds.", distance: "Max distance, but only with the arm speed to match." };
  if (t) out.push({ key: "disc", title: cap(clean(spec.shape)), line: TYPE[t] });
  // Max weight (the catalog's "Max weight" column, owner 2026-11-17): most drivers top out near 175 g.
  const g = num(clean(spec.surface));
  if (g && /g\b/.test(spec.surface ?? "") && g >= 140 && g <= 200) out.push({ key: "gauge", title: `up to ${Math.round(g)} g`, low: "light", high: "heavy", at: Math.max(0, Math.min(1, (g - 150) / 30)),
    line: g >= 175 ? "Comes heavy: heavier holds its line in wind, lighter flies further for slower arms."
      : g >= 170 ? "Mid max weight: heavier holds its line in wind, lighter flies further for slower arms."
      : "Light max weight: easy to throw far, but wind moves it more." });
  return out;
}

export const V11_SITES: Record<string, V11Site> = {
  padel: {
    bands: [["power", "Attack"], ["control", "Control"], ["forgiveness", "Sweet spot"]],
    giveUp: { forgiveness: "a smaller sweet spot", power: "less power on smashes", control: "less control", defence: "weaker in defence", arm: "harder on the arm", speed: "slower at the net" },
    builds: buildCards, buildHead: s => `What the ${s}'s build means for you`,
  },
  pickleball: {
    bands: [["power", "Power"], ["control", "Control"], ["spin", "Spin"]],
    giveUp: { forgiveness: "a smaller sweet spot", power: "less power on drives", pop: "less pop", control: "less control at the kitchen", spin: "less spin",
      speed: "slower in hand battles", arm: "harder on the arm" },
    builds: paddleBuilds, buildHead: s => `What the ${s}'s build means for you`,
  },
  discgolf: {
    bands: [["arm", "Easy to throw"], ["distance", "Distance"], ["accuracy", "Accuracy"]],
    giveUp: { arm: "needs more arm", distance: "less distance", accuracy: "harder to keep on line", glide: "less glide", wind: "pushed around more in wind",
      durability: "beats in faster" },
    builds: discBuilds, buildHead: s => `What the ${s}'s flight means for you`,
  },
};
