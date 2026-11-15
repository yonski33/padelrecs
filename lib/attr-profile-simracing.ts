// SimRacingRecs's attribute profile (ENGINE-PLAN.md §2C; lib/attr-profile.ts kinds). Kept in its own file and NOT registered in
// attrProfileFor: the skin pages read "has an attribute profile" as "use the skin layout", and sim racing's design switch waits
// for the final padel template. The evidence scripts and the scorer read it directly.
import type { AttrProfile } from "./attr-profile";

// SimRacingRecs (owner OK 2026-11-15 via the PM session): attributes per category (niche shapes). Platform and price are hard
// filters (facts), not scores; FFB detail and strength are two qualities, not one axis (a product can be high on both).
const SR = { WB: "Wheelbase", W: "Wheel", P: "Pedals", C: "Cockpit", S: "Shifter / handbrake" } as const;
export const SIMRACING: AttrProfile = {
  groups: [{ key: "new", label: "New to sim racing", display: "drivers new to sim racing" }, { key: "upgrade", label: "Upgrading", display: "drivers upgrading" }],
  concerns: [],
  minGroup: 3, minAxis: 3,
  // Placeholder: the shared lib/engine module (ENGINE-ALGO.md) sets match weights; sim racing doesn't tune them.
  weights: { group: 0.3, concerns: 0, feel: 0.6, score: 0.1 },
  attrs: [
    { key: "suits_new", label: "New to sim racing", kind: "suits", prior: { attr: "setup", sign: 1 } },
    { key: "suits_upgrade", label: "Upgrading", kind: "suits", appliesTo: [SR.WB, SR.P, SR.C] },
    { key: "ffb_detail", label: "FFB detail", kind: "quality", appliesTo: [SR.WB], plus: [["detailed force feedback", 1]],
      words: ["superb detail", "detailed", "decent detail", "light on detail", "numb"] },
    { key: "ffb_strength", label: "FFB strength", kind: "quality", appliesTo: [SR.WB], plus: [["strong force feedback", 1]],
      words: ["very strong", "strong", "enough for most", "on the weak side", "weak"] },
    { key: "brake_feel", label: "Brake feel", kind: "quality", appliesTo: [SR.P], plus: [["great brake feel", 1]],
      words: ["superb brake feel", "great brake feel", "decent brake feel", "so-so brake feel", "poor brake feel"] },
    { key: "rigidity", label: "Rigidity", kind: "quality", complaint: true, appliesTo: [SR.C, SR.P, SR.S], plus: [["rigid", 1]], minus: [["flex", 1]],
      words: ["rock solid", "rigid", "mostly solid", "some flex", "flexes"] },
    { key: "build", label: "Build quality", kind: "quality", complaint: true, plus: [["solid build", 1]], minus: [["quality control issues", 1], ["durability issues", 1]],
      words: ["excellent build", "well built", "fine", "some quality issues", "frequent quality issues"] },
    { key: "quiet", label: "Quiet", kind: "quality", complaint: true, appliesTo: [SR.WB, SR.P, SR.S], minus: [["noisy", 1]],
      words: ["very quiet", "quiet", "usual noise", "can be noisy", "noisy"] },
    { key: "setup", label: "Ease of setup", kind: "quality", plus: [["easy setup", 1]],
      words: ["very easy setup", "easy setup", "usual setup", "fiddly setup", "hard to set up"] },
    { key: "software", label: "Software", kind: "quality", complaint: true, appliesTo: [SR.WB, SR.W, SR.P], plus: [["good software", 1]], minus: [["bad software", 1]],
      words: ["excellent software", "good software", "fine", "software gripes", "poor software"] },
    { key: "ergonomics", label: "Ergonomics", kind: "quality", appliesTo: [SR.W, SR.C, SR.S], plus: [["great ergonomics", 1]],
      words: ["superb ergonomics", "comfortable", "fine", "awkward for some", "awkward"] },
    { key: "value", label: "Value", kind: "quality", plus: [["great value", 1]], minus: [["overpriced", 1]],
      words: ["great value", "good value", "fair", "pricey for what it is", "overpriced"] },
    { key: "platform", label: "Platform", kind: "fact", appliesTo: [SR.WB, SR.W, SR.P, SR.S] },
    { key: "torque_nm", label: "Torque (Nm)", kind: "fact", appliesTo: [SR.WB] },
    { key: "drive_type", label: "Type", kind: "fact" },
    { key: "price", label: "Price", kind: "fact" },
  ],
};

/** Platforms a product works on, from the catalog's Platforms column ("PC; PlayStation with a licensed base" → PC,
 *  PlayStation). Conditional support ("with a compatible base") still counts: the product page shows the column's words. */
export function platformsOf(s: string | null | undefined): string[] | null {
  const x = (s ?? "").toLowerCase(); if (!x) return null;
  const out = [/\bpc\b/.test(x) && "PC", /playstation|\bps[345]\b/.test(x) && "PlayStation", /xbox/.test(x) && "Xbox"].filter((v): v is string => !!v);
  return out.length ? out : null;
}
/** Peak torque in Nm from the Torque / brake force column ("12 Nm"); null for load cells and blanks. */
export function torqueOf(s: string | null | undefined): number | null {
  const m = (s ?? "").match(/(\d+(?:\.\d+)?)\s*Nm\b/i); return m ? Number(m[1]) : null;
}
