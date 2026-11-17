// One story per racket page (owner 2026-11-17): a content line that contradicts the racket's own trait bars loses. A line that
// calls the sweet spot "generous" on a racket whose Sweet spot band says average is hidden; the trait data wins.
// Claims are read from plain words; padel's traits.

export type Claim = { trait: "forgiveness" | "power" | "control" | "arm"; dir: 1 | -1 };
const SPOT = "(?:sweet ?spot|hitting zone|hitting area)";
const RULES: [Claim, RegExp][] = [
  [{ trait: "forgiveness", dir: 1 }, new RegExp(`\\b(huge|big|biggest|large|larger|generous|roomy|wide|easy[- ]to[- ]find)\\b[^.;]{0,30}${SPOT}|${SPOT}[^.;]{0,20}\\b(covers|huge|big|large|generous)\\b|\\b(very |really )?forgiving\\b(?! than)|\\bforgives\\b`, "i")],
  [{ trait: "forgiveness", dir: -1 }, new RegExp(`\\b(small|smaller|tiny|narrow|unforgiving|demanding)\\b[^.;]{0,20}${SPOT}|${SPOT}[^.;]{0,20}\\b(small|tiny)\\b|\\bunforgiving\\b|\\bpunish(es|ing)? (off-centre |off-center )?(mishits|hits)\\b`, "i")],
  [{ trait: "power", dir: 1 }, /\b(easy|free|big|huge|lots of|plenty of|explosive) power\b|\bpowerful\b|\bbig smash(es)?\b/i],
  [{ trait: "power", dir: -1 }, /\b(lacks?|short on|little|not much|limited) (pop|power|punch)\b|\bsmashes (need|lack)\b|\bunderpowered\b/i],
  [{ trait: "control", dir: 1 }, /\b(precise|precision|pinpoint|great control|lots of control|easy control)\b/i],
  [{ trait: "control", dir: -1 }, /\b(hard|tricky|difficult) to control\b|\b(less|little|poor) control\b/i],
  [{ trait: "arm", dir: 1 }, /\b(arm-friendly|kind to (the )?(arm|elbow)s?|easy on the (arm|elbow)|spares the arm)\b/i],
  [{ trait: "arm", dir: -1 }, /\b(hard on the (arm|elbow)|passes on vibration|vibrates)\b/i],
];

/** The trait claims a line makes ("generous sweet spot" → forgiveness +). */
export function claims(text: string): Claim[] {
  // Clause by clause: a "+" word in a clause that negates or qualifies it ("no free power", "less forgiving", "forgiving for a
  // diamond", "not huge") isn't a claim; a "−" word stays one.
  const NEG = /\b(no|not|little|less|without|lacks?|isn'?t|doesn'?t|don'?t|never|hardly|only|than|loses?|lags?|trails?|split|splits)\b/i, REL = /\bfor an? (diamond|power|hard)\b/i;
  const out: Claim[] = [];
  for (const clause of text.replace(/==/g, "").split(/[.;:]\s*|,\s*(?:but|though|while)\s+/)) {
    for (const [c, re] of RULES) { if (!re.test(clause)) continue; if (c.dir > 0 && (NEG.test(clause) || REL.test(clause))) continue;
      if (!out.some(o => o.trait === c.trait)) out.push(c); }
  }
  return out;
}
/** How many dot steps a claim sits from the racket's dots: a "+" claim means 4+, a "−" claim 3 or less (a 4-dot trait can
 *  still have a real catch, "smashes need help" on a 4/5 attack); 0 when it agrees. */
export const gap = (c: Claim, dots: number) => c.dir > 0 ? Math.max(0, 4 - dots) : Math.max(0, dots - 3);
/** The page rule: hide a line its trait band contradicts. A "+" claim already at 1 step ("generous" beside an average 3), a
 *  "−" claim at 2 (a catch on a 5/5 trait). `steps` raises both (the test uses 2). */
export function contradicts(text: string, dots: Partial<Record<string, number>>, steps = 1): Claim | null {
  // Forgiveness and arm comfort claims are concrete ("generous sweet spot"): 1 step loses. Power and control words are looser
  // ("precise" on a split 3/5 control), and any "−" claim: 2 steps.
  for (const c of claims(text)) { const d = dots[c.trait], need = c.dir > 0 && (c.trait === "forgiveness" || c.trait === "arm") ? steps : Math.max(steps, 2);
    if (d && gap(c, d) >= need) return c; }
  return null;
}
/** Padel's own word for the sweet spot (owner 2026-11-17: never "hitting zone"). */
export const padelWords = (t: string) => t.replace(/\bhitting (zone|area)\b/gi, "sweet spot");
