// AudioRecs' attribute profile (ENGINE-PLAN.md §2C kinds, lib/attr-profile.ts) for its Thread pages (owner design handoff
// 2026-11-21). Kept in its own file and NOT registered in attrProfileFor: the skin pages read "has an attribute profile" as
// "use the skin layout". AudioRecs has no evidence store yet (drizzle/0023 isn't on its schema and no reader pass has run),
// so the scores come from the quick tags its reviews already carry: one tag is one voice for that attribute (tagEvidence).
// Pure, so tests feed plain objects.
import type { AttrProfile } from "./attr-profile";
import type { EvidenceRow } from "./evidence";

export const AUDIO: AttrProfile = {
  groups: [], concerns: [], minGroup: 3, minAxis: 3,
  // Unused (lib/audio-match.ts has its own weights); kept for the AttrProfile shape.
  weights: { group: 0, concerns: 0, feel: 0, score: 0 },
  attrs: [
    { key: "bass", label: "Bass", kind: "quality", plus: [["great bass", 1]], minus: [["muddy", 0.5]],
      words: ["huge bass", "strong bass", "some bass", "light bass", "thin bass"] },
    { key: "detail", label: "Detail", kind: "quality", complaint: true, plus: [["detailed", 1], ["wide soundstage", 0.5]], minus: [["muddy", 1]],
      words: ["very detailed", "detailed", "fairly clear", "a bit veiled", "muddy"] },
    // Warm (low) to bright (high): where listeners put the tuning. Balanced = near the middle.
    { key: "tuning", label: "Tuning", kind: "axis", ends: ["warm", "bright"], plus: [["bright", 1], ["harsh treble", 0.5]], minus: [["warm", 1]] },
    // Only complaints (harsh treble, muddy): no praise tag, so it never reaches the top bands; it marks the ones that grate.
    { key: "smooth", label: "Smooth", kind: "quality", complaint: true, minus: [["harsh treble", 1], ["muddy", 1]] },
    { key: "comfort", label: "Comfort", kind: "quality", complaint: true, plus: [["comfortable", 1]], minus: [["uncomfortable", 1]],
      words: ["comfortable all day", "comfortable", "fine for most", "can get uncomfortable", "often uncomfortable"] },
    { key: "anc", label: "Noise cancelling", kind: "quality", plus: [["great noise cancelling", 1]] },
    { key: "battery", label: "Battery", kind: "quality", plus: [["long battery life", 1]] },
    { key: "mic", label: "Mic", kind: "quality", plus: [["great mic", 1]] },
    { key: "build", label: "Build", kind: "quality", complaint: true, minus: [["build quality issues", 1]] },
    { key: "connection", label: "Connection", kind: "quality", complaint: true, minus: [["connection issues", 1]] },
    { key: "value", label: "Value", kind: "quality", complaint: true, plus: [["great value", 1]], minus: [["overpriced", 1]] },
  ],
};

/** One review's tags as evidence rows for AUDIO's attributes: +1 for a plus tag, −1 for a minus tag, at the tag's weight. */
export function tagEvidence(r: { productId: string; ref: string; kind: EvidenceRow["sourceKind"]; at: string | null; tags: readonly string[] | null | undefined }): EvidenceRow[] {
  const tags = new Set(r.tags ?? []);
  if (!tags.size) return [];
  const out: EvidenceRow[] = [];
  for (const a of AUDIO.attrs) for (const [list, sign] of [[a.plus ?? [], 1], [a.minus ?? [], -1]] as const)
    for (const [tag, strength] of list) if (tags.has(tag))
      out.push({ productId: r.productId, sourceKind: r.kind, sourceRef: r.ref, authorKey: null, attribute: a.key, value: sign, valueText: null, strength, quote: null, saidAt: r.at, extractedBy: "quick-tags" });
  return out;
}

/** What kind of headphone it is, as the design's pills and chips name them. */
export type AudioKind = "Over-ear" | "On-ear" | "Open-back" | "IEM" | "Earbuds";
export function audioKind(p: { shape: string | null; balance: string | null }): AudioKind | null {
  const form = (p.balance ?? "").toLowerCase();
  if (p.shape === "Earbuds") return "Earbuds";
  if (p.shape === "IEMs") return "IEM";
  if (p.shape !== "Headphones") return null;
  if (/\bopen(-back)?\b|semi-open/.test(form) && !/open-ear/.test(form)) return "Open-back";
  if (/^on-ear/.test(form)) return "On-ear";
  return "Over-ear";
}
const ANC_SPEC = /\b(ANC|active noise[- ]cancel\w*|noise[- ]cancel\w*)\b/i;
const ANC_NAME = /\b(NC|ANC|BTNC|QuietComfort|\d{4}XM\d|PX[78]( S2)?)\b|\bMomentum (4|True Wireless [234])\b|\bAirPods Pro\b/i;
const NO_ANC = /\b(no|without|lacks?)\s+(ANC|active noise|noise[- ]cancel)/i;
/** Active noise cancelling, as far as the specs, the name and listeners say: no catalogue column holds it, so it's read from
 *  the notes and description, the model name (WH-1000XM5, QuietComfort, PX8, "NC"), or 3+ reviews praising it. Wired and
 *  open designs never count. */
export function hasAnc(p: { name: string; shape: string | null; weight: string | null; balance: string | null; surface: string | null; description: string | null }, ancPraise = 0): boolean {
  const wireless = p.weight === "Wireless" || p.shape === "Earbuds";
  if (!wireless || /\bopen\b/i.test(`${p.name} ${p.balance ?? ""}`)) return false;
  const text = `${p.surface ?? ""} ${p.description ?? ""}`;
  if (NO_ANC.test(text)) return false;
  return ANC_SPEC.test(text) || ANC_NAME.test(p.name) || ancPraise >= 3;
}
