// "More X than the Y" lines on the product page's other-racket cards (owner 2026-11-18, a credibility rule): a comparison is
// said only when our own trait data shows a clear gap from enough reports AND the two products' specs don't contradict it.
// Owner's example: the Viper Soft Lebrón 3.0 (diamond) read "more forgiving than the" Nox AT10 Lite (teardrop); a diamond is
// never more forgiving than a round or a teardrop, whatever its dots say next to another racket's.
//   - gap: at least one full dot, and each racket's dots for that trait rest on 3+ player voices (or were set by hand);
//   - shape: a less forgiving outline (padel diamond < teardrop / hybrid < round; pickleball elongated < hybrid < widebody) is
//     never "more forgiving", and a more forgiving one never has "a smaller sweet spot";
//   - feel: a clearly firmer core or face (one step or more) is never "more forgiving" or "easier on the arm", and a clearly
//     softer one never the opposite;
//   - handling: heavier (5 g+ on padel, 0.3 oz+ on pickleball) or more head-heavy is never "quicker", and lighter or less
//     head-heavy never "slower".
// The same rule runs on the server (the first two cards) and in the browser (the cards after a pick). Pure: no site config.

export type ClaimSpec = { shape?: string | null; core?: string | null; surface?: string | null; balance?: string | null; weight?: string | null;
  /** Disc golf: the maker's flight numbers [speed, glide, turn, fade]. */ flight?: number[] | null };

// Disc golf (owner 2026-11-18): the maker's flight numbers count as evidence for the traits they measure, on a 1+ point gap.
// Speed for distance and for the arm it needs, glide for glide, turn + fade (stability) for wind. A clear gap the right way
// allows the line with the numbers beside it ("more glide (glide 5 vs 4)"); a clear gap the other way blocks it; within a
// point, the player-voice rule decides.
const FLIGHT: Record<string, { at: (f: number[]) => number; label: string; sign: 1 | -1 }> = {
  distance: { at: f => f[0], label: "speed", sign: 1 },
  arm: { at: f => f[0], label: "speed", sign: -1 }, // easier for a slower arm = lower speed
  glide: { at: f => f[1], label: "glide", sign: 1 },
  wind: { at: f => f[2] + f[3], label: "turn + fade", sign: 1 },
};
/** Two traits read off the same flight number (distance and arm both from speed): a card never pairs them as its gain and give-up,
 *  which would say one fact twice ("longer (speed 11 vs 9)" and "needs more arm (speed 11 vs 9)"). */
export const sameFlightFact = (site: string, a: string, b: string) => site === "discgolf" && !!FLIGHT[a] && !!FLIGHT[b] && FLIGHT[a].label === FLIGHT[b].label;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace("-", "−");
/** The flight gap behind "other is more `key`" in that trait's own direction (positive = other has more of the trait), and the
 *  note for the line; null when the trait isn't a flight trait or either disc has no numbers. */
export function flightFact(site: string, key: string, other?: number[] | null, me?: number[] | null): { gap: number; note: (dir: 1 | -1) => string } | null {
  const f = site === "discgolf" ? FLIGHT[key] : undefined;
  if (!f || !other || !me) return null;
  const o = f.at(other), m = f.at(me);
  return { gap: (o - m) * f.sign, note: () => `${f.label} ${fmt(o)} vs ${fmt(m)}` };
}
/** A trait's dots and the player voices behind them (lib/trait-score.ts TraitScore). */
export type TraitEvidence = { dots: number; plus: number; minus: number; set?: boolean } | null | undefined;
export const MIN_TRAIT_VOICES = 3;

const low = (s?: string | null) => (s ?? "").toLowerCase();

/** How forgiving the outline is, higher = more forgiving; null when unknown or the site has no shape rule. */
export function shapeRank(site: string, shape?: string | null): number | null {
  const s = low(shape);
  if (site === "padel") return /round/.test(s) ? 3 : /tear|hybrid/.test(s) ? 2 : /diamond/.test(s) ? 1 : null;
  if (site === "pickleball") return /wide|standard/.test(s) ? 3 : /hybrid/.test(s) ? 2 : /elongat/.test(s) ? 1 : null;
  return null;
}

/** Firmness of core + face, higher = firmer; null when neither is known. */
export function firmness(site: string, spec: ClaimSpec): number | null {
  const c = low(spec.core), f = low(spec.surface);
  let core: number | null = null, face: number | null = null;
  if (site === "padel") {
    // Same words as the build cards (lib/build-cards.ts): hard foams and high-memory rubber firm, soft / comfort foams soft.
    if (c) { const hard = /hard|power foam|high memory|\bhr\b|pro eva/.test(c), soft = !hard && /soft|comfort|control foam|^foam$|light foam/.test(c); core = hard ? 2 : soft ? 0 : 1; }
    if (f) { const glass = /glass|fibrix/.test(f), carbon = /carbon|\d+\s?k\b/.test(f); face = glass && !carbon ? 0 : glass ? 0.5 : /\b(18|24)\s?k\b/.test(f) ? 1.5 : /soft carbon/.test(f) ? 0.75 : carbon ? 1 : null; }
  } else if (site === "pickleball") {
    // A thinner core plays firmer; fiberglass faces play softer than carbon.
    const mm = [...c.matchAll(/(\d{2}(?:\.\d)?)\s?mm/g), ...low(spec.weight).matchAll(/(\d{2}(?:\.\d)?)\s?mm/g)].map(m => +m[1]).filter(n => n >= 10 && n <= 20);
    if (mm.length) { const t = Math.min(...mm); core = t <= 13 ? 1 : t < 16 ? 0.5 : 0; }
    if (f) face = /glass|composite/.test(f) && !/carbon/.test(f) ? 0 : /carbon|kevlar|aramid/.test(f) ? 1 : null;
  } else return null;
  return core === null && face === null ? null : (core ?? 1) + (face ?? 1);
}

/** Weight midpoint (grams on padel, ounces on pickleball); null when unknown. */
export function weightMid(site: string, spec: ClaimSpec): number | null {
  const w = low(spec.weight);
  const nums = site === "padel" ? [...w.matchAll(/(\d{3})(?:\.\d+)?/g)].map(m => +m[1]).filter(n => n >= 300 && n <= 420)
    : site === "pickleball" && /oz/.test(w) ? [...w.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => +m[1]).filter(n => n >= 6 && n <= 10) : [];
  return nums.length ? (Math.min(...nums) + Math.max(...nums)) / 2 : null;
}
const WEIGHT_STEP: Record<string, number> = { padel: 5, pickleball: 0.3 };

/** Head-heaviness: low 1, medium 2, high 3 (a "medium-high" 2.5); null when unknown. */
export function balanceRank(spec: ClaimSpec): number | null {
  const b = low(spec.balance), r = [/low/.test(b) && 1, /medium|mid|even/.test(b) && 2, /high|head/.test(b) && 3].filter((x): x is number => !!x);
  return r.length ? r.reduce((a, x) => a + x, 0) / r.length : null;
}

const voiced = (t: TraitEvidence) => !!t && t.dots > 0 && (!!t.set || t.plus + t.minus >= MIN_TRAIT_VOICES);

/** Why "other is more `key` than me" (dir 1) or "less `key`" (dir -1) can't be said, or null when it holds. */
// Spec facts (owner 2026-11-18: "every product usable as a suggestion"): like the disc golf flight numbers, a clear gap in the
// stored specs is evidence on its own for the trait it decides, and the line says the fact ("quicker than the Nox (lighter, 355
// vs 370 g)"). A clear gap the other way blocks the line. Player dots that clearly disagree (voiced, a dot or more the other
// way) still win over a spec.
type Fact = { gap: number; note: () => string };
const num = (re: RegExp, t?: string | null) => { const m = re.exec(t ?? ""); return m ? +m[1] : null; };
const fact = (o: number | null, m: number | null, step: number, sign: 1 | -1, note: () => string): Fact | null =>
  o === null || m === null ? null : { gap: ((o - m) / step) * sign, note };
const either = (a: Fact | null, b: Fact | null): Fact | null => {
  // The first spec that shows a clear gap decides; two that point opposite ways decide nothing.
  const clear = [a, b].filter((f): f is Fact => !!f && Math.abs(f.gap) >= 1);
  if (clear.length === 2 && Math.sign(clear[0].gap) !== Math.sign(clear[1].gap)) return null;
  return clear[0] ?? a ?? b;
};
const g = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
export function specFact(site: string, key: string, o: ClaimSpec, m: ClaimSpec): Fact | null {
  if (site === "padel" || site === "pickleball") {
    if (key === "speed") {
      const step = WEIGHT_STEP[site], wo = weightMid(site, o), wm = weightMid(site, m), u = site === "padel" ? "g" : "oz";
      const w = fact(wo, wm, step, -1, () => `${wo! < wm! ? "lighter" : "heavier"}, ${g(wo!)} vs ${g(wm!)} ${u}`);
      const b = site === "padel" ? fact(balanceRank(o), balanceRank(m), 0.5, -1, () => `${low(o.balance)} vs ${low(m.balance)} balance`)
        : fact(num(/(\d{2,3})/, o.balance), num(/(\d{2,3})/, m.balance), 4, -1, () => `swing weight ${num(/(\d{2,3})/, o.balance)} vs ${num(/(\d{2,3})/, m.balance)}`);
      return either(w, b);
    }
    if (key === "forgiveness") return fact(shapeRank(site, o.shape), shapeRank(site, m.shape), 1, 1, () => `${low(o.shape)} vs ${low(m.shape)} shape`);
    if (key === "arm") { const fo = firmness(site, o), fm = firmness(site, m); return fact(fo, fm, 1, -1, () => `${fo! < fm! ? "softer" : "firmer"} core and face`); }
  }
  if (site === "tennis") {
    const gr = (x: ClaimSpec) => num(/(\d{3})\s*g\b/, x.weight), hl = (x: ClaimSpec) => { const v = num(/(\d+(?:\.\d+)?)\s*pts?\s*HL/i, x.balance); return v ?? (num(/(\d+(?:\.\d+)?)\s*pts?\s*HH/i, x.balance) !== null ? -num(/(\d+(?:\.\d+)?)\s*pts?\s*HH/i, x.balance)! : null); };
    if (key === "maneuverability") return either(fact(gr(o), gr(m), 8, -1, () => `${gr(o)! < gr(m)! ? "lighter" : "heavier"}, ${gr(o)} vs ${gr(m)} g`),
      fact(hl(o), hl(m), 2, 1, () => `${g(hl(o)!)} vs ${g(hl(m)!)} pts head-light`));
    const hs = (x: ClaimSpec) => num(/(\d{2,3})\s*sq/i, x.shape), ra = (x: ClaimSpec) => num(/(\d{2})\s*RA/i, x.surface);
    if (key === "forgiveness") return fact(hs(o), hs(m), 3, 1, () => `${hs(o)} vs ${hs(m)} sq in head`);
    if (key === "arm") return fact(ra(o), ra(m), 3, -1, () => `${ra(o)} vs ${ra(m)} RA stiffness`);
  }
  if (site === "simracing" && key === "ffb_strength") {
    const nm = (x: ClaimSpec) => num(/(\d+(?:\.\d+)?)\s*Nm\b/i, x.weight);
    return fact(nm(o), nm(m), 1, 1, () => `${g(nm(o)!)} vs ${g(nm(m)!)} Nm`);
  }
  return null;
}
/** The evidence behind a line beyond the player dots: flight numbers (disc golf) or a clear spec gap; null when there is none. */
export function factFor(site: string, key: string, o: ClaimSpec, m: ClaimSpec): Fact | null {
  const f = flightFact(site, key, o.flight, m.flight);
  if (f) return { gap: f.gap, note: () => f.note(1) };
  return specFact(site, key, o, m);
}

export function claimBlock(site: string, key: string, dir: 1 | -1, other: { spec: ClaimSpec; tr: TraitEvidence }, me: { spec: ClaimSpec; tr: TraitEvidence },
  /** Off only for audits that compare with the rule before spec facts. */ useSpecs = true): string | null {
  const ff = flightFact(site, key, other.spec.flight, me.spec.flight);
  if (ff && ff.gap * dir >= 1) return null;
  if (ff && ff.gap * dir <= -1) return "flight numbers";
  const more = (a: number | null, b: number | null, step = 1) => a !== null && b !== null && a - b >= step;
  const sf = ff || !useSpecs ? null : specFact(site, key, other.spec, me.spec);
  const dotsAgainst = !!other.tr && !!me.tr && voiced(other.tr) && voiced(me.tr) && (other.tr.dots - me.tr.dots) * dir <= -1;
  const bySpec = !!sf && sf.gap * dir >= 1 && !dotsAgainst;
  if (!bySpec) {
    if (!other.tr || !me.tr || (other.tr.dots - me.tr.dots) * dir < 1) return "no dot gap";
    if (!voiced(other.tr) || !voiced(me.tr)) return "too few reports";
  }
  if (key === "forgiveness") {
    const so = shapeRank(site, other.spec.shape), sm = shapeRank(site, me.spec.shape);
    if (dir > 0 ? more(sm, so) : more(so, sm)) return `shape (${low(other.spec.shape)} vs ${low(me.spec.shape)})`;
  }
  if (key === "forgiveness" || key === "arm") {
    const fo = firmness(site, other.spec), fm = firmness(site, me.spec);
    if (dir > 0 ? more(fo, fm) : more(fm, fo)) return `${dir > 0 ? "firmer" : "softer"} core/face`;
  }
  if (key === "speed" || key === "maneuverability") {
    const step = WEIGHT_STEP[site] ?? Infinity, wo = weightMid(site, other.spec), wm = weightMid(site, me.spec);
    if (dir > 0 ? more(wo, wm, step) : more(wm, wo, step)) return dir > 0 ? "heavier" : "lighter";
    const bo = balanceRank(other.spec), bm = balanceRank(me.spec);
    if (dir > 0 ? more(bo, bm, 0.5) : more(bm, bo, 0.5)) return dir > 0 ? "more head-heavy" : "less head-heavy";
  }
  // SimRacingRecs: a wheelbase with clearly less torque (1 Nm+) is never "stronger", and one with more never "weaker".
  if (site === "simracing" && key === "ffb_strength") {
    const nm = (x: ClaimSpec) => { const m = /(\d+(?:\.\d+)?)\s*Nm\b/i.exec(x.weight ?? ""); return m ? +m[1] : null; };
    const no = nm(other.spec), nmMe = nm(me.spec);
    if (dir > 0 ? more(nmMe, no) : more(no, nmMe)) return dir > 0 ? "less torque" : "more torque";
  }
  if (sf && sf.gap * dir <= -1) return `specs (${sf.note()})`;
  return null;
}
