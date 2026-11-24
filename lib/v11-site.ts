// Product page v11 per site (owner 2026-11-17, design_handoff_product_page_v11): padel first, then pickleball and disc golf on
// the same page (app/rackets/[slug]/racket-fit.tsx). Each site keeps its own words: the three "How it plays" bands, what an
// other card gives up, the fit check's headlines and the build cards. Padel's entry is the page as it was, word for word.
// Copy rules: expert voice, no em dashes, lines ≤ 105 characters, never claim we tested anything.
import { buildCards, type BuildCard } from "./build-cards";
import { flightOf } from "./discgolf-profile";
import { discTypeOf, stabilityOf, speedBandOf } from "./niche/discgolf-guide";
import { driveOf, brakeOf } from "./niche/simracing-guide";
import { SIMRACING_FIT } from "./simracing-fit";
import { torqueOf, platformsOf } from "./attr-profile-simracing";
import { tennisPtsHL } from "./fit-config";
import { COFFEE_FIT } from "./coffee-fit";
import { coffeeSpec, TIER_WORDS } from "./coffee-specs";

/** A build card: padel's four (shape, core, balance, face) and the other sites' own. `at` places a gauge's dot (0 … 1);
 *  `shape` names the outline; `nums` are disc golf's four flight numbers. */
export type V11Build = Omit<BuildCard, "key"> & { key: BuildCard["key"] | "gauge" | "flight" | "disc"; nums?: number[]; low?: string; high?: string };
type Spec = { shape?: string | null; core?: string | null; balance?: string | null; surface?: string | null; weight?: string | null;
  /** The product row's slug and name (CoffeeRecs reads its spec facts by them). */ slug?: string | null; name?: string | null };

export type V11Site = {
  /** "How it plays": three bands, [trait key, label]; or per product type (SimRacingRecs: each type's own bars). */ bands: [string, string][] | ((shape: string | null) => [string, string][]);
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

/** SimRacingRecs (owner 2026-11-18: sim racing on the shared v11c page): what the specs mean, per product type, in the gear
 *  guide's words (lib/niche/simracing-guide.ts). The platforms chip carries the edition note; Notes otherwise stay off chips. */
function simBuilds(spec: Spec): V11Build[] {
  const out: V11Build[] = [], shape = spec.shape ?? "", type = spec.balance ?? "", notes = spec.surface ?? "";
  if (shape === "Wheelbase") {
    const d = driveOf(type);
    const DRIVE: Record<string, string> = { direct: "The motor sits on the wheel shaft: sharp detail, strong force, no cogging.",
      belt: "Smoother and quieter than gear, with a little softness in the feel.", hybrid: "Belt plus gears: smoother than gear alone, still notchier than belt.",
      gear: "Cheapest and loudest, with notchy force feedback." };
    if (d) out.push({ key: "disc", title: cap(clean(type)), line: DRIVE[d] });
    else if (/no force feedback/i.test(type)) out.push({ key: "disc", title: "No force feedback", line: "A spring or bungee centres the wheel; you feel no road or grip." });
    const nm = torqueOf(spec.weight);
    if (nm !== null) out.push({ key: "gauge", title: `${nm} Nm`, low: "light", high: "strong", at: Math.max(0, Math.min(1, nm / 25)),
      line: nm < 6 ? "Light torque: fine on a desk or stand, outgrown once you want weight." : nm < 12 ? "Mid torque: plenty for most cars; wants a solid desk or a rig." : "High torque: real weight in heavy cars; needs a rigid cockpit." });
  } else if (shape === "Pedals") {
    const b = brakeOf(type);
    const BRAKE: Record<string, string> = { loadcell: "You brake by pressure, like a real car: the biggest step for consistent braking.",
      hydraulic: "The most car-like feel, for the most money and some upkeep.", active: "A motor shapes the pedal feel, even ABS; it needs a solid rig.",
      pot: "Measures how far the pedal moves; fine to start, hard to repeat lap after lap." };
    if (b) out.push({ key: "disc", title: cap(clean(type)), line: BRAKE[b] });
    const kg = /(\d+(?:\.\d+)?)\s*kg/i.exec(spec.weight ?? "");
    if (kg) out.push({ key: "gauge", title: `${kg[1]} kg`, low: "light", high: "firm", at: Math.max(0, Math.min(1, +kg[1] / 200)),
      line: +kg[1] > 100 ? "A firm brake: it wants an aluminium-profile rig, not a desk or a light cockpit." : "A brake most cockpits and stands can take." });
  } else if (shape === "Cockpit") {
    const FRAME: Record<string, string> = { "aluminium profile": "Bolt-together profile: the stiffest frame, and easy to adjust or add to.",
      "steel tube": "A welded tube frame: solid for most bases, less adjustable than profile.", "steel frame": "A one-piece frame with the seat built in.",
      "aluminium tube": "Light tube frame: fine for mid-torque bases.", foldable: "Folds away after racing; some flex with strong bases.",
      "wheel stand": "A stand, not a full rig: use your own chair.", "kart-style": "A kart-style frame with the seat built in." };
    const f = clean(type).toLowerCase();
    if (FRAME[f]) out.push({ key: "disc", title: cap(clean(type)), line: FRAME[f] });
    const seat = /seat included/i.test(notes) ? "Seat included." : /seat not included/i.test(notes) ? "Seat sold separately." : null;
    const rated = /wheelbases up to (\d+(?:\.\d+)?) ?Nm/i.exec(notes);
    if (seat || rated) out.push({ key: "disc", title: rated ? `Up to ${rated[1]} Nm` : seat!.replace(/\.$/, "").toLowerCase().replace(/^./, c => c.toUpperCase()), line: [rated ? `The maker rates it for bases up to ${rated[1]} Nm.` : null, seat].filter(Boolean).join(" ") });
  } else if (type && shape) out.push({ key: "disc", title: cap(clean(type)), line: shape === "Wheel" ? "Pick the rim shape for what you race: GT, formula, rally or round." : "How it shifts or brakes; check it fits your base." });
  // Platforms, with the edition note when it is sold per console (PR B, owner OK 2026-11-18).
  const pl = shape === "Cockpit" ? null : platformsOf(spec.core);
  if (pl) out.push({ key: "disc", title: pl.join(" · "), line: /separate PlayStation and Xbox editions/i.test(notes) ? "Sold as separate PlayStation and Xbox editions: buy the one for your console."
    : pl.length === 1 ? `${pl[0]} only.` : /with|via|depends/i.test(spec.core ?? "") ? "On console it needs a compatible base or wheel; check the pairing." : `Works on ${pl.join(", ").replace(/, ([^,]*)$/, " and $1")}.` });
  return out;
}
const SIM_LABEL = Object.fromEntries(SIMRACING_FIT.traits.map(t => [t.key, t.label]));
/** Tennis: head size, string pattern, weight with balance, and stiffness, from the catalog's specs (shape = head size,
 *  core = pattern, surface = RA). No card says a racket is kind to the arm unless its Arm bar is 4+. */
function racketBuilds(spec: Spec, armDots?: number): V11Build[] {
  const out: V11Build[] = [], kind = (armDots ?? 0) >= 4;
  const head = num(/sq/i.test(spec.shape ?? "") ? spec.shape : null);
  if (head) out.push({ key: "shape", title: `${head} sq in head`, line: head >= 104 ? "Oversize: the biggest sweet spot and easy depth; less precise on full swings."
    : head >= 100 ? "Midplus: a forgiving sweet spot with easy depth; the most common size."
    : head >= 98 ? "A 98: more precision and feel; the sweet spot is a little smaller than a 100."
    : "Small head: precise and solid for clean strikers; mishits are punished more." });
  const pats = [...new Set((spec.core ?? "").replace(/\s/g, "").toLowerCase().match(/\d{2}x\d{2}/g) ?? [])];
  if (pats.length > 1) out.push({ key: "core", title: `${pats.join(" or ")} pattern`, line: "Comes in two patterns: the open one gives more spin, the dense one more control." });
  else if (pats.length === 1) { const p = pats[0], open = p === "16x18" || p === "16x17" || p === "14x18";
    out.push({ key: "core", title: `${p} pattern`, line: p.startsWith("18x") ? "Dense pattern: a flatter, lower, more controlled ball; spin needs a fast swing."
      : open ? "Very open pattern: the most spin and launch, the least control on flat drives."
      : p === "16x20" ? "A touch denser than 16x19: a bit more control, still good spin."
      : "Open 16x19: easy spin and launch; strings move and wear a little faster." }); }
  const w = (spec.weight ?? "").match(/(\d{3})\s*g/), strung = /\bstrung\b/i.test(spec.weight ?? "") && !/unstrung/i.test(spec.weight ?? "");
  if (w) { const g = +w[1] - (strung ? 15 : 0), hl = tennisPtsHL(spec.balance ?? "");
    const bal = Number.isFinite(hl) ? (hl >= 6 ? " head-light, so it whips through" : hl <= 0 ? " with weight in the head for plow-through" : "") : "";
    out.push({ key: "weight", title: `${w[1]} g${strung ? " strung" : ""}`, line: cap(g <= 285 ? `light${bal}: easy to swing and quick at net; less stable against heavy balls.`
      : g >= 310 ? `heavy${bal}: solid against pace; it needs a full, fast swing.` : `mid weight${bal}: easy to swing with enough stability for most rallies.`) }); }
  const ra = num(/RA/i.test(spec.surface ?? "") ? spec.surface : null);
  if (ra) out.push({ key: "face", title: `${ra} RA`, line: ra >= 68 ? (kind ? "Stiff: crisp, direct and powerful." : "Stiff: crisp and powerful; harder on a sore arm.")
    : ra <= 62 ? (kind ? "Flexible: more dwell and comfort, a little less free power." : "Flexible: more dwell, a little less free power.")
    : "Medium stiffness: a balance of power and feel." });
  return out.filter(c => c.line.length <= 105);
}

/** CoffeeRecs (PM 2026-11-18): what the specs mean, per product type, from db/specs/coffee.json (Grok's maker check) in the
 *  coffee guide's words (lib/niche/coffee-guide.ts). A status card first when it's discontinued or not shipping yet. */
function coffeeBuilds(spec: Spec): V11Build[] {
  const s = coffeeSpec(spec), out: V11Build[] = [];
  if (!s) return out;
  const card = (title: string, line: string) => out.push({ key: "disc", title, line });
  if (s.preRelease) card("Not shipping yet", `${s.preRelease} Impressions so far are pre-release.`);
  else if (s.gone) card("Discontinued", `${cap(s.gone.replace(/\s*\(.*$/, ""))}; reviews stay for owners of this one.`);
  if (s.cat === "espresso") {
    const HEAT: Record<string, string> = {
      Thermoblock: "Heats on demand: ready in seconds; steam needs a pause between milk drinks.",
      Thermocoil: "Heats on demand: ready fast; steam needs a pause between milk drinks.",
      "Single boiler": "One boiler brews and steams, so you wait while it switches between the two.",
      "Heat exchanger": s.pid ? "Brews and steams at once; the PID keeps the brew water steady." : "Brews and steams at once; a short cooling flush keeps the first shot from running hot.",
      "Dual boiler": "A boiler for brew and one for steam: milk drinks back to back without waiting.",
      "Manual lever": "You make the pressure by hand: full control of the shot, no steam, kettle water.",
      "Manual pump": "Hand-pumped and portable: no steam, and it needs a fine, even grind.",
    };
    if (s.type && HEAT[s.type]) card(s.type, HEAT[s.type]);
    if (s.flowControl || s.profiling) card(s.flowControl ? "Flow control" : "Pressure profiling", "Shapes the shot as it runs; it pays off with practice, and with light roasts.");
    else if (s.pid && s.type !== "Heat exchanger") card("PID", "Holds the brew temperature you set: what light roasts need most.");
    else if (s.pid === false && s.type && !/^Manual/.test(s.type)) card("No PID", "Brew temperature swings a little: fine for medium and dark roasts.");
    if (s.builtInGrinder) card("Built-in grinder", "One box to start with; the grinder can't be upgraded later.");
    if (s.group) card(`${s.group} mm portafilter`, s.group === 58 ? "The common standard: the widest choice of baskets and tools." : "A smaller basket than 58 mm, with fewer aftermarket parts.");
  } else if (s.cat === "grinder") {
    if (s.power === "hand") card("Hand grinder", "The best grind for the money; espresso fineness takes some effort.");
    else if (s.burr) card(`${s.burrMm ? `${s.burrMm} mm ` : ""}${s.burr} burrs`, s.burr === "flat" ? "Flat burrs: the shorthand is more clarity; design and alignment matter as much."
      : "Conical burrs: the shorthand is more body; usually quieter for the money.");
    if (s.espresso === false) card("Filter only", "Built for filter: it can't grind fine enough for espresso.");
    else if (s.espresso === "limited") card("Espresso, just", "Reaches espresso, but its steps are coarse for dialling in a shot.");
    if (s.adjust === "stepless") card("Stepless", "Any tiny change, so a shot dials in exactly; mark your settings to go back.");
    else if (s.espresso === true) card("Fine steps", "Steps small enough to dial in espresso, and easy to return to.");
    if (s.power !== "hand" && s.singleDose) card("Single dose", "Weigh the beans and grind them all: good for switching beans often.");
  } else if (s.cat === "brewer") {
    const M: Record<string, [string, string]> = {
      "pour-over": ["Pour-over", "A paper-filtered pour: a clean, bright cup that rewards a steady hand."],
      immersion: ["Immersion", "Coffee steeps, then you press: forgiving and easy to repeat."],
      hybrid: ["Immersion and pour-over", "Steep, then drain: immersion's ease with a paper-filtered cup."],
      "french press": ["French press", "A metal filter: a full, heavy cup with some sediment."],
      drip: ["Drip machine", s.sca ? "SCA certified: it heats water properly and wets the coffee evenly." : "Press a button and walk away."],
    };
    if (s.method) card(...M[s.method]);
    if (s.cups?.includes("pot")) card("A full pot", "Brews enough for a household or guests.");
    else if (s.cups?.length === 1 && s.cups[0] === "one") card("One mug", "Built around a single cup at a time.");
  } else if (s.cat === "kettle") {
    card(s.gooseneck ? "Gooseneck" : "Standard spout", s.gooseneck ? "A thin, steady stream: what pour-over needs." : "Fine for French press, AeroPress and tea; not for pour-over.");
    if (s.power === "stovetop") card("Stovetop", "Heats on the stove: no set temperatures without a thermometer.");
    else card(s.hold ? "Set and hold" : s.temp ? "Set temperature" : "Boil only", s.hold ? "Set a temperature and keep it: handy for light roasts and tea."
      : s.temp ? "Set the temperature you brew at." : "No set temperatures: fine for darker roasts and French press.");
  } else if (s.cat === "scale") {
    if (s.espressoFit !== null && s.espressoFit !== undefined) card(s.espressoFit ? "Fits a drip tray" : "Pour-over size", s.espressoFit ? "Small enough to sit under the portafilter for espresso." : "Too big for most drip trays: room for a carafe instead.");
    if (s.res === 0.01) card("Reads 0.01 g", "Finer than most recipes need; handy for small espresso doses.");
    if (s.autoStart || s.flow) card(s.flow ? "Flow rate" : "Auto-start timer", s.flow ? "Shows how fast you pour or how fast the shot runs." : "The timer starts when the coffee does.");
    if (s.app) card("App", "Logs shots and brews on your phone; plenty never use it.");
  }
  if (s.tier) card(s.tier, `About ${TIER_WORDS[s.tier]} street price${s.tierEst ? " (estimate)" : ""}.`);
  return out.filter(c => c.line.length <= 105).slice(0, 5);
}
const COFFEE_LABEL = Object.fromEntries(COFFEE_FIT.traits.map(t => [t.key, t.label]));

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
  simracing: {
    // Each type's own bars (fit-config appliesTo), in the profile's order.
    bands: shape => SIMRACING_FIT.traits.filter(t => !t.hidden && (!t.appliesTo || (!!shape && t.appliesTo.includes(shape)))).map(t => [t.key, SIM_LABEL[t.key]] as [string, string]),
    giveUp: { ffb_detail: "less force feedback detail", ffb_strength: "weaker force feedback", brake_feel: "a vaguer brake", rigidity: "more flex",
      build: "more build complaints", quiet: "noisier", setup: "fiddlier to set up", software: "clunkier software", ergonomics: "less comfortable", value: "worse value" },
    builds: simBuilds, buildHead: s => `What the ${s}'s specs mean for you`,
  },
  coffee: {
    // Each type's own bars (fit-config appliesTo), in the profile's order.
    bands: shape => COFFEE_FIT.traits.filter(t => !t.hidden && (!t.appliesTo || (!!shape && t.appliesTo.includes(shape)))).map(t => [t.key, COFFEE_LABEL[t.key]] as [string, string]),
    giveUp: { quality: "less in the cup", consistency: "less consistent", steam: "weaker steam", retention: "more retention", quiet: "louder", heat: "slower to heat",
      ease: "more of a learning curve", clean: "messier", build: "more durability complaints", value: "worse value" },
    builds: coffeeBuilds, buildHead: s => `What the ${s}'s specs mean for you`,
  },
  tennis: {
    bands: [["power", "Power"], ["control", "Control"], ["spin", "Spin"]],
    giveUp: { power: "less free power", control: "less control", spin: "less spin", arm: "harder on the arm", maneuverability: "slower to swing",
      stability: "less stable against pace", forgiveness: "a smaller sweet spot" },
    builds: racketBuilds, buildHead: s => `What the ${s}'s build means for you`,
  },
};
